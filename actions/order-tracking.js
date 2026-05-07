"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { cache } from "react";
import { getOSRMDistance, generateOTP, sanitizeContent } from "@/lib/utils";
import { isSellerOfOrder, apiResponse } from "@/lib/permissions";

// Get tracking history for an order
export const getOrderTracking = cache(async (orderId) => {
  try {
    const tracking = await db.orderTracking.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, data: tracking };
  } catch (error) {
    console.error("Get Order Tracking Error:", error);
    return { success: false, error: "Failed to fetch tracking" };
  }
});



// Update order status (for sellers)
export async function updateOrderStatus(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orderId = formData.get('orderId');
    const status = formData.get('status');
    const notes = formData.get('notes') || null;
    const transportProvider = formData.get('transportProvider') || null;
    const vehicleNumber = formData.get('vehicleNumber') || null;
    const driverName = formData.get('driverName') || null;
    const driverPhone = formData.get('driverPhone') || null;
    const currentLocation = formData.get('currentLocation') || null;
    const estimatedDelivery = formData.get('estimatedDelivery') ? new Date(formData.get('estimatedDelivery')) : null;
    
    // Captured GPS coordinates from frontend
    const lat = formData.get('lat') ? parseFloat(formData.get('lat')) : null;
    const lng = formData.get('lng') ? parseFloat(formData.get('lng')) : null;

    // Verify the user is the seller of this order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { 
          include: { 
            product: {
              include: {
                farmer: true,
                agent: true
              }
            }
          } 
        },
        buyerUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!order) {
      return apiResponse.error("Order not found", 404);
    }

    // Check if order is already final
    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      return apiResponse.error("Cannot update status of a completed or cancelled order.");
    }

    // Identify the seller profile
    const firstItem = order.items[0];
    const sellerProfile = firstItem.product.farmer || firstItem.product.agent;
    const isFarmer = !!firstItem.product.farmer;
    
    const isSeller = await isSellerOfOrder(user.id, orderId);
    if (!isSeller) {
      return apiResponse.error("Unauthorized", 403);
    }

    // ─── ATOMIC TRANSACTION START ───
    await db.$transaction(async (tx) => {
      // 1. Re-fetch inside TX to get the freshest state
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId }
      });
      if (!currentOrder) throw new Error("Order not found");

      // 2. Status Transition State Machine Guard
      const validTransitions = {
        "PROCESSING": ["PACKED", "SHIPPED", "CANCELLED"],
        "PACKED": ["SHIPPED", "CANCELLED"],
        "SHIPPED": ["IN_TRANSIT", "DELIVERED", "CANCELLED"],
        "IN_TRANSIT": ["DELIVERED", "CANCELLED"],
      };

      if (status !== currentOrder.orderStatus && status !== "CANCELLED") {
         if (!validTransitions[currentOrder.orderStatus]?.includes(status)) {
           throw new Error(`Invalid transition from ${currentOrder.orderStatus} to ${status}`);
         }
      }

      // 3. Block updates for UNPAID online orders
      if (currentOrder.paymentMethod === 'ONLINE' && currentOrder.paymentStatus !== 'PAID' && status !== 'CANCELLED') {
          throw new Error("Cannot process shipping for an unpaid online order.");
      }

      // 4. Create tracking entry
      await tx.orderTracking.create({
        data: {
          orderId,
          status,
          notes: sanitizeContent(notes),
          transportProvider,
          vehicleNumber,
          driverName,
          driverPhone,
          currentLocation,
          estimatedDelivery,
          updatedBy: user.id
        }
      });

      const updateData = { orderStatus: status };
      
      if (status === 'SHIPPED' && lat && lng) {
        updateData.selfDeliveryStartLat = lat;
        updateData.selfDeliveryStartLng = lng;
      } else if (status === 'DELIVERED' && lat && lng) {
        updateData.selfDeliveryEndLat = lat;
        updateData.selfDeliveryEndLng = lng;
        
        if (currentOrder.selfDeliveryStartLat && currentOrder.selfDeliveryStartLng) {
          const roadDist = await getOSRMDistance(
            currentOrder.selfDeliveryStartLat, 
            currentOrder.selfDeliveryStartLng, 
            lat, 
            lng
          );
          updateData.selfDeliveryDistance = roadDist;
          const rate = sellerProfile?.deliveryPricePerKm || (isFarmer ? 10 : 12);
          updateData.selfDeliveryCost = roadDist * rate;
        }
      }

      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }

      // 5. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: updateData
      });
    });
    // ─── ATOMIC TRANSACTION END ───

    // NEW: Sync with Delivery Jobs if applicable
    const activeDeliveryJob = await db.deliveryJob.findFirst({
      where: { orderId, status: { in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] } }
    });

    if (status === 'CANCELLED') {
      await db.deliveryJob.updateMany({
        where: { orderId, status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] } },
        data: { status: 'CANCELLED', notes: 'Order was cancelled by the seller.' }
      });
    } else if (status === 'DELIVERED') {
      // 1. If an active delivery job exists, seller CANNOT mark as delivered manually
      if (activeDeliveryJob) {
        throw new Error("This order is being handled by a delivery partner. Only they can mark it as delivered via OTP.");
      }

      // 2. If self-delivery, verify the selfDeliveryOtp
      const otp = formData.get("otp");
      if (!order.selfDeliveryOtp) {
         throw new Error("Self-delivery verification code not found. Please mark as Shipped first to generate OTP.");
      }
      if (order.selfDeliveryOtp !== otp) {
        throw new Error("Invalid verification code. Please check with the buyer.");
      }

      await db.deliveryJob.updateMany({
        where: { orderId, status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] } },
        data: { status: 'DELIVERED', notes: 'Order marked as delivered by the seller.' }
      });
    } else if (status === 'SHIPPED') {
      // Generate OTP for self-delivery if no partner is active
      if (!activeDeliveryJob) {
        const selfOtp = generateOTP();
        await db.order.update({
          where: { id: orderId },
          data: { selfDeliveryOtp: selfOtp }
        });
        
        // Send OTP email to buyer
        if (order.buyerUser?.email) {
          const { sendDeliveryOTPEmail } = await import("@/lib/email");
          await sendDeliveryOTPEmail(order.buyerUser.email, orderId, selfOtp);
        }
      }

      await db.deliveryJob.updateMany({
        where: { orderId, status: { in: ['REQUESTED', 'ACCEPTED'] } },
        data: { status: 'PICKED_UP', notes: 'Order marked as shipped by the seller.' }
      });
    } else if (status === 'IN_TRANSIT') {
      await db.deliveryJob.updateMany({
        where: { orderId, status: { in: ['REQUESTED', 'ACCEPTED', 'PICKED_UP'] } },
        data: { status: 'IN_TRANSIT', notes: 'Order marked as in transit by the seller.' }
      });
    } else if (status === 'PACKED') {
      // Just add a note to the job if it exists
      await db.deliveryJob.updateMany({
        where: { orderId, status: 'ACCEPTED' },
        data: { notes: 'Seller has packed the order. Ready for pickup.' }
      });
    }

    // Create notification for buyer
    const statusMessages = {
      'PROCESSING': 'Your order is being prepared',
      'PACKED': 'Your order has been packed and ready for shipment',
      'SHIPPED': 'Your order has been shipped',
      'IN_TRANSIT': 'Your order is on the way',
      'DELIVERED': 'Your order has been delivered'
    };

    await createNotification({
      userId: order.buyerId,
      type: 'ORDER_STATUS_UPDATE',
      title: `Order ${status}`,
      message: statusMessages[status] || `Order status updated to ${status}`,
      linkUrl: `/my-orders`
    });

    revalidatePath('/farmer-dashboard/sales');
    revalidatePath('/agent-dashboard/sales');
    revalidatePath('/my-orders');
    revalidatePath('/delivery-dashboard');
    revalidatePath('/farmer-dashboard/manage-orders');

    return apiResponse.success(null, "Order status updated successfully");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

// Get seller's orders that need action (with Pagination)
export const getSellerOrders = cache(async (page = 1, limit = 10) => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return apiResponse.error("User not found", 404);

    let itemWhereClause = {};

    if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
      itemWhereClause = { 
        product: { farmerId: dbUser.farmerProfile.id },
        order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
      };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      itemWhereClause = { 
        product: { agentId: dbUser.agentProfile.id },
        order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
      };
    } else {
      return apiResponse.success([], "No orders found");
    }

    // 1. Find unique Order IDs for this seller
    const distinctOrderItems = await db.orderItem.groupBy({
      by: ['orderId'],
      where: itemWhereClause,
    });
    
    const totalOrders = distinctOrderItems.length;

    // 2. Fetch the paginated orders
    // We fetch orders that HAVE items belonging to this seller
    const orders = await db.order.findMany({
      where: {
        id: { in: distinctOrderItems.map(item => item.orderId) },
        items: {
          some: itemWhereClause
        }
      },
      include: {
        items: {
          where: itemWhereClause,
          include: { product: true }
        },
        buyerUser: {
          select: {
            email: true,
            name: true,
            farmerProfile: { select: { name: true, phone: true } },
            agentProfile: { select: { name: true, phone: true } }
          }
        },
        tracking: {
          orderBy: { createdAt: 'desc' }
        },
        deliveryJobs: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return apiResponse.success({ 
      data: orders,
      total: totalOrders,
      hasMore: (page * limit) < totalOrders
    });
  } catch (error) {
    return apiResponse.error("Failed to fetch orders");
  }
});

/**
 * Resend the self-delivery OTP to the buyer (Seller Recovery Action).
 */
export async function resendSelfDeliveryOtp(orderId) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { 
            include: { 
                product: { include: { farmer: true, agent: true } } 
            } 
        },
        buyerUser: true
      }
    });

    if (!order) throw new Error("Order not found");

    // Verify Ownership
    const isSeller = await isSellerOfOrder(user.id, orderId);
    if (!isSeller) throw new Error("Unauthorized: Only the seller can resend OTP.");

    if (!order.selfDeliveryOtp) {
        throw new Error("No active self-delivery OTP found. Ensure order is marked as SHIPPED.");
    }
    if (order.orderStatus === 'DELIVERED') {
        throw new Error("Order is already delivered.");
    }

    if (order.buyerUser?.email) {
      const { sendDeliveryOTPEmail } = await import("@/lib/email");
      await sendDeliveryOTPEmail(order.buyerUser.email, orderId, order.selfDeliveryOtp);
      return apiResponse.success(null, "Self-delivery code resent successfully.");
    }

    return apiResponse.error("Buyer email not found.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}
