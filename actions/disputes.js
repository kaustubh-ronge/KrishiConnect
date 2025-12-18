"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// Create a dispute (buyers can flag orders within 48 hours of delivery)
export async function createDispute(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orderId = formData.get('orderId');
    const reason = formData.get('reason');

    // Verify order
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
        tracking: {
          where: { status: 'DELIVERED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.buyerId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (order.orderStatus !== 'DELIVERED') {
      return { success: false, error: "You can only dispute delivered orders" };
    }

    // Check if already disputed
    if (order.disputeStatus === 'OPEN') {
      return { success: false, error: "A dispute is already open for this order" };
    }

    // Check 48-hour window
    const deliveredTracking = order.tracking[0];
    if (deliveredTracking) {
      const hoursSinceDelivery = (Date.now() - new Date(deliveredTracking.createdAt)) / (1000 * 60 * 60);
      if (hoursSinceDelivery > 48) {
        return { success: false, error: "Dispute window has closed (48 hours after delivery)" };
      }
    }

    // Create dispute
    await db.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: 'OPEN',
        disputeReason: reason,
        disputeCreatedAt: new Date(),
        payoutStatus: 'FROZEN' // Freeze payout
      }
    });

    // Notify all sellers in the order
    const sellers = new Set();
    order.items.forEach(item => {
      if (item.product.sellerType === 'farmer' && item.product.farmer) {
        sellers.add({
          userId: item.product.farmer.userId,
          type: 'farmer'
        });
      } else if (item.product.sellerType === 'agent' && item.product.agent) {
        sellers.add({
          userId: item.product.agent.userId,
          type: 'agent'
        });
      }
    });

    for (const seller of sellers) {
      await createNotification({
        userId: seller.userId,
        type: 'DISPUTE_OPENED',
        title: 'Dispute Opened',
        message: `A buyer has opened a dispute on order #${order.id.slice(-8)}`,
        linkUrl: seller.type === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
      });
    }

    // Notify admin (if admin users exist)
    const admins = await db.user.findMany({
      where: { role: 'admin' }
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DISPUTE_OPENED',
        title: 'New Dispute Requires Attention',
        message: `Order #${order.id.slice(-8)} has a dispute: ${reason}`,
        linkUrl: '/admin'
      });
    }

    revalidatePath('/my-orders');
    revalidatePath('/admin');

    return { success: true, message: "Dispute created successfully. An admin will review it shortly." };
  } catch (error) {
    console.error("Create Dispute Error:", error);
    return { success: false, error: "Failed to create dispute" };
  }
}

// Admin: Resolve dispute
export async function resolveDispute(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    // Verify admin
    const dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (dbUser.role !== 'admin') {
      return { success: false, error: "Unauthorized" };
    }

    const orderId = formData.get('orderId');
    const resolution = formData.get('resolution'); // 'RESOLVED' or 'REJECTED'
    const adminNotes = formData.get('adminNotes') || '';

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
        }
      }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Update dispute
    await db.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: resolution,
        disputeResolvedAt: new Date(),
        payoutStatus: resolution === 'REJECTED' ? 'PENDING' : 'CANCELLED' // Unfreeze if rejected, cancel if resolved in buyer's favor
      }
    });

    // Notify buyer
    await createNotification({
      userId: order.buyerId,
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved',
      message: resolution === 'RESOLVED' 
        ? 'Your dispute has been resolved in your favor' 
        : 'Your dispute has been reviewed and rejected',
      linkUrl: '/my-orders'
    });

    // Notify sellers
    const sellers = new Set();
    order.items.forEach(item => {
      if (item.product.sellerType === 'farmer' && item.product.farmer) {
        sellers.add({
          userId: item.product.farmer.userId,
          type: 'farmer'
        });
      } else if (item.product.sellerType === 'agent' && item.product.agent) {
        sellers.add({
          userId: item.product.agent.userId,
          type: 'agent'
        });
      }
    });

    for (const seller of sellers) {
      await createNotification({
        userId: seller.userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute Resolved',
        message: `Dispute on order #${order.id.slice(-8)} has been ${resolution.toLowerCase()}`,
        linkUrl: seller.type === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
      });
    }

    revalidatePath('/admin');
    revalidatePath('/my-orders');

    return { success: true, message: "Dispute resolved successfully" };
  } catch (error) {
    console.error("Resolve Dispute Error:", error);
    return { success: false, error: "Failed to resolve dispute" };
  }
}

// Get all disputes (admin only)
export async function getAllDisputes() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (dbUser.role !== 'admin') {
      return { success: false, error: "Unauthorized" };
    }

    const disputes = await db.order.findMany({
      where: {
        disputeStatus: {
          in: ['OPEN', 'RESOLVED', 'REJECTED']
        }
      },
      include: {
        buyerUser: {
          select: {
            name: true,
            email: true,
            farmerProfile: { select: { name: true } },
            agentProfile: { select: { name: true } }
          }
        },
        items: {
          include: {
            product: {
              include: {
                farmer: { select: { name: true, phone: true } },
                agent: { select: { name: true, phone: true } }
              }
            }
          }
        }
      },
      orderBy: { disputeCreatedAt: 'desc' }
    });

    return { success: true, data: disputes };
  } catch (error) {
    console.error("Get All Disputes Error:", error);
    return { success: false, error: "Failed to fetch disputes" };
  }
}

