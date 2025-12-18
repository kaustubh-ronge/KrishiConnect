"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// Get tracking history for an order
export async function getOrderTracking(orderId) {
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
}

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
          select: { id: true, name: true }
        }
      }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if user is the seller
    const isSeller = order.items.some(item => {
      if (item.product.sellerType === 'farmer' && item.product.farmer) {
        return item.product.farmer.userId === user.id;
      }
      if (item.product.sellerType === 'agent' && item.product.agent) {
        return item.product.agent.userId === user.id;
      }
      return false;
    });

    if (!isSeller) {
      return { success: false, error: "Unauthorized" };
    }

    // Create tracking entry
    await db.orderTracking.create({
      data: {
        orderId,
        status,
        notes,
        transportProvider,
        vehicleNumber,
        driverName,
        driverPhone,
        currentLocation,
        estimatedDelivery,
        updatedBy: user.id
      }
    });

    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: { orderStatus: status }
    });

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

    return { success: true, message: "Order status updated successfully" };
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

// Get seller's orders that need action
export async function getSellerOrders() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return { success: false, error: "User not found" };

    let whereClause = {};

    if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
      whereClause = { product: { farmerId: dbUser.farmerProfile.id } };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      whereClause = { product: { agentId: dbUser.agentProfile.id } };
    } else {
      return { success: false, data: [] };
    }

    // Get all orders containing seller's products
    const orderItems = await db.orderItem.findMany({
      where: whereClause,
      include: {
        product: true,
        order: {
          include: {
            buyerUser: {
              select: {
                email: true,
                name: true,
                farmerProfile: { select: { name: true, phone: true } },
                agentProfile: { select: { name: true, phone: true } }
              }
            },
            tracking: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { order: { createdAt: 'desc' } }
    });

    // Group by order
    const ordersMap = new Map();
    orderItems.forEach(item => {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, {
          ...item.order,
          items: []
        });
      }
      ordersMap.get(item.orderId).items.push(item);
    });

    const orders = Array.from(ordersMap.values());

    return { success: true, data: orders };
  } catch (error) {
    console.error("Get Seller Orders Error:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

