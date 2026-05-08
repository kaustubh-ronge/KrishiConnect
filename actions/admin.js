"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { after } from "next/server";
import { sendProfileApprovalEmail, sendProfileRejectionEmail, sendDeliveryProfileApprovalEmail } from "@/lib/email";
import { sanitizeContent } from "@/lib/utils";

export async function ensureAdmin(userId) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u || u.role !== "admin") {
    throw new Error("Unauthorized: admin only");
  }
  return true;
}

export async function getAdminStats() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    // 1. Efficient Aggregation for GMV and Revenue
    const financeStats = await db.order.aggregate({
      _sum: {
        totalAmount: true,
        platformFee: true
      },
      where: { paymentStatus: "PAID" }
    });

    const totalGMV = financeStats._sum.totalAmount || 0;
    const totalPlatformRevenue = financeStats._sum.platformFee || 0;
    
    // 2. Efficient Aggregation for Payouts
    const payoutStats = await db.orderItem.aggregate({
      _sum: {
        priceAtPurchase: true,
        quantity: true
      },
      where: { 
        order: { paymentStatus: "PAID" },
        payoutStatus: "PENDING"
      }
    });

    // Note: This is an approximation if multiple items. For exact, better to sum (price*qty) in DB.
    // However, priceAtPurchase * quantity in aggregate requires a raw query or computed column.
    // For now, let's keep the pending/settled logic but optimize the FETCH.
    
    // Correct way for Pending Payouts (Still using findMany but with SELECT to minimize payload)
    const pendingItems = await db.orderItem.findMany({
      where: { order: { paymentStatus: "PAID" }, payoutStatus: "PENDING" },
      select: { quantity: true, priceAtPurchase: true }
    });
    const pendingPayouts = pendingItems.reduce((s, it) => s + (it.quantity * it.priceAtPurchase), 0);

    const settledItems = await db.orderItem.findMany({
      where: { order: { paymentStatus: "PAID" }, payoutStatus: "SETTLED" },
      select: { quantity: true, priceAtPurchase: true }
    });
    const settledPayouts = settledItems.reduce((s, it) => s + (it.quantity * it.priceAtPurchase), 0);

    // Count open disputes
    const openDisputes = await db.order.count({
      where: { disputeStatus: 'OPEN' }
    });

    return {
      success: true,
      data: {
        totalGMV,
        totalPlatformRevenue,
        pendingPayouts,
        settledPayouts,
        openDisputes
      }
    };
  } catch (err) {
    console.error("Admin Stats Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getAllOrders({ onlyPendingPayouts = false } = {}) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyerUser: { include: { farmerProfile: true, agentProfile: true } },
        items: { include: { product: { include: { farmer: true, agent: true } } } },
        deliveryJobs: { include: { deliveryBoy: true } }
      }
    });

    const mapped = orders.map(o => {
      // Calculate Partner Payout
      const partnerPayout = o.deliveryJobs.reduce((sum, job) => sum + (job.totalPrice || 0), 0);
      const isPartnerVerified = o.deliveryJobs.every(job => job.partnerPaymentReceived);

      return {
        id: o.id,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        platformFee: o.platformFee,
        deliveryFee: o.deliveryFee || 0,
        sellerAmount: o.sellerAmount,
        partnerPayout,
        isPartnerVerified,
        paymentStatus: o.paymentStatus === 'PAID' ? 'Money Received' : 'Waiting for Payment',
        orderStatus: o.orderStatus, // Will be mapped in UI
        payoutStatus: o.payoutStatus === 'SETTLED' ? 'Paid to Seller' : 'Not Paid to Seller',
        paymentMethod: o.paymentMethod,
        shippingAddress: o.shippingAddress,
        buyerPhone: o.buyerPhone,
        buyerName: o.buyerName,
        buyerEmail: o.buyerUser?.email || 'N/A',
        items: o.items.map(it => {
          const p = it.product;
          const seller = p.farmer || p.agent;
          return {
            id: it.id,
            productName: p.productName,
            quantity: it.quantity,
            unit: p.unit,
            priceAtPurchase: it.priceAtPurchase,
            image: p.images?.[0],
            seller: seller ? { 
              type: p.farmer ? 'Farmer' : 'Agent', 
              name: seller.name || seller.companyName,
              sellerProfile: {
                upiId: seller.upiId,
                bankName: seller.bankName,
                accountNumber: seller.accountNumber,
                ifscCode: seller.ifscCode,
                name: seller.name || seller.companyName
              }
            } : null
          };
        }),
        deliveryPartners: o.deliveryJobs.map(job => ({
          jobId: job.id,
          partnerName: job.deliveryBoy.name,
          totalPrice: job.totalPrice,
          partnerPaymentReceived: job.partnerPaymentReceived,
          bankDetails: {
            upiId: job.deliveryBoy.upiId,
            bankName: job.deliveryBoy.bankName,
            accountNumber: job.deliveryBoy.accountNumber,
            ifscCode: job.deliveryBoy.ifscCode
          }
        }))
      };
    });

    return { success: true, data: JSON.parse(JSON.stringify(mapped)) };

  } catch (err) {
    console.error("Get Orders Error:", err);
    return { success: false, error: err.message };
  }
}

export async function markOrderItemSettled(orderItemId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const item = await db.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item) throw new Error("Order item not found");
    
    if (item.payoutStatus !== "PENDING") {
      throw new Error(`Item already settled.`);
    }

    const now = new Date();

    const result = await db.$transaction(async (tx) => {
        // 1. Lock the parent Order record to prevent concurrent settlement races
        await tx.order.update({
          where: { id: item.orderId },
          data: { updatedAt: new Date() } 
        });

        const updatedItem = await tx.orderItem.update({
          where: { id: orderItemId },
          data: {
            payoutStatus: "SETTLED",
            payoutSettledAt: now,
            payoutSettledBy: user.id
          }
        });

        // 2. Now we can safely check if all items are settled because we hold the order lock
        const pendingItemsCount = await tx.orderItem.count({
          where: { orderId: item.orderId, payoutStatus: "PENDING" }
        });

        if (pendingItemsCount === 0) {
          await tx.order.update({
            where: { id: item.orderId },
            data: { payoutStatus: "SETTLED" }
          });
        }

      // Also settle delivery jobs for this order if not already done
      await tx.deliveryJob.updateMany({
        where: { orderId: item.orderId, status: "DELIVERED", payoutStatus: "PENDING" },
        data: {
          payoutStatus: "SETTLED",
          payoutSettledAt: now,
          payoutSettledBy: user.id
        }
      });

      return updatedItem;
    });

    return { success: true, data: result };
  } catch (err) {
    console.error("Settle Item Payout Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getSellerBankDetailsForOrder(orderId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
    });

    if (!order) return { success: false, error: "Order not found" };

    // Aggregate sellers' bank details and calculate their specific share
    const sellerMap = new Map();

    order.items.forEach(it => {
      const p = it.product;
      const seller = p.farmer || p.agent;
      if (!seller) return;

      const sellerId = seller.id;
      const itemTotal = it.quantity * it.priceAtPurchase;
      
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          sellerId,
          sellerType: p.farmer ? 'farmer' : 'agent',
          name: seller.name || seller.companyName,
          phone: seller.phone,
          bankDetails: {
            upiId: seller.upiId,
            bankName: seller.bankName,
            accountNumber: seller.accountNumber,
            ifscCode: seller.ifscCode,
          },
          totalEarned: 0,
          items: []
        });
      }

      const s = sellerMap.get(sellerId);
      s.totalEarned += itemTotal;
      s.items.push({
        productName: p.productName,
        quantity: it.quantity,
        unit: p.unit,
        total: itemTotal
      });
    });

    const sellers = Array.from(sellerMap.values());

    // Get delivery jobs for this order to find the delivery boy
    const deliveryJobs = await db.deliveryJob.findMany({
      where: { orderId: orderId },
      include: { deliveryBoy: true }
    });

    const deliveryPartners = deliveryJobs.map(job => {
      const boy = job.deliveryBoy;
      return {
        jobId: job.id,
        partnerName: boy.name,
        partnerPaymentReceived: job.partnerPaymentReceived,
        bankDetails: {
          upiId: boy.upiId,
          bankName: boy.bankName,
          accountNumber: boy.accountNumber,
          ifscCode: boy.ifscCode,
        },
        totalPrice: job.totalPrice
      };
    });

    return { success: true, data: { sellers, deliveryPartners } };
  } catch (err) {
    console.error("Get Seller Bank Details Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getPendingProfiles() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    // Fetch EVERYTHING for deep verification
    const pendingFarmers = await db.farmerProfile.findMany({
      where: { sellingStatus: "PENDING" },
      include: { user: { select: { email: true, name: true, createdAt: true } } }
    });

    const pendingAgents = await db.agentProfile.findMany({
      where: { sellingStatus: "PENDING" },
      include: { user: { select: { email: true, name: true, createdAt: true } } }
    });

    const pendingDelivery = await db.deliveryProfile.findMany({
      where: { approvalStatus: "PENDING" },
      include: { user: { select: { email: true, name: true, createdAt: true } } }
    });

    const profiles = [
      ...pendingFarmers.map(p => ({ ...p, role: 'farmer', displayName: p.name || p.user?.name })),
      ...pendingAgents.map(p => ({ ...p, role: 'agent', displayName: p.companyName || p.user?.name })),
      ...pendingDelivery.map(p => ({ ...p, role: 'delivery', displayName: p.name || p.user?.name }))
    ];

    profiles.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return { success: true, data: JSON.parse(JSON.stringify(profiles)) };
  } catch (err) {
    console.error("Get Pending Profiles Error:", err);
    return { success: false, error: err.message };
  }
}



export async function approveProfile(userId, role, notes = "") {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    // 1. Check if already approved to prevent duplicate emails/actions
    const currentProfile = await (
      role === 'farmer' ? db.farmerProfile.findUnique({ where: { userId } }) :
      role === 'agent' ? db.agentProfile.findUnique({ where: { userId } }) :
      db.deliveryProfile.findUnique({ where: { userId } })
    );

    if (!currentProfile) return { success: false, error: "Profile not found" };
    
    const currentStatus = role === 'delivery' ? currentProfile.approvalStatus : currentProfile.sellingStatus;
    if (currentStatus === "APPROVED") {
        return { success: true, message: "Already approved" };
    }

    let targetEmail;

    const updatedProfile = await db.$transaction(async (tx) => {
      // 1. Update internal notes & ROLE on the User record
      const userData = { adminNotes: sanitizeContent(notes) };
      if (role === 'farmer' || role === 'agent') userData.role = role;
      if (role === 'delivery') userData.role = 'delivery'; // Mapping for delivery boys

      await tx.user.update({
        where: { id: userId },
        data: userData
      });

      // 2. Update Profile status
      if (role === 'farmer') {
        const p = await tx.farmerProfile.update({
          where: { userId },
          data: { sellingStatus: "APPROVED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else if (role === 'agent') {
        const p = await tx.agentProfile.update({
          where: { userId },
          data: { sellingStatus: "APPROVED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else if (role === 'delivery') {
        const p = await tx.deliveryProfile.update({
          where: { userId },
          data: { approvalStatus: "APPROVED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else {
        throw new Error("Invalid role");
      }
    });

    if (targetEmail) {
      after(async () => {
        if (role === 'delivery') {
          await sendDeliveryProfileApprovalEmail(targetEmail);
        } else {
          await sendProfileApprovalEmail(targetEmail, role);
        }
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Approve Profile Error:", err);
    return { success: false, error: err.message };
  }
}

export async function rejectProfile(userId, role, notes = "") {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    let targetEmail;

    const updatedProfile = await db.$transaction(async (tx) => {
      // 1. Update internal notes on the User record
      if (notes) {
        const sanitizedNotes = sanitizeContent(notes);
        await tx.user.update({
          where: { id: userId },
          data: { adminNotes: sanitizedNotes }
        });
      }

      // 2. Update Profile status
      if (role === 'farmer') {
        const p = await tx.farmerProfile.update({
          where: { userId },
          data: { sellingStatus: "REJECTED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else if (role === 'agent') {
        const p = await tx.agentProfile.update({
          where: { userId },
          data: { sellingStatus: "REJECTED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else if (role === 'delivery') {
        const p = await tx.deliveryProfile.update({
          where: { userId },
          data: { approvalStatus: "REJECTED" },
          include: { user: { select: { email: true } } }
        });
        targetEmail = p.user.email;
        return p;
      } else {
        throw new Error("Invalid role");
      }
    });

    if (targetEmail) {
      after(async () => {
        await sendProfileRejectionEmail(targetEmail, role);
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Reject Profile Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Perform bulk approvals for multiple profiles
 */
export async function bulkApproveProfiles(profileIds) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const farmerUserIds = profileIds.filter(p => p.role === 'farmer').map(p => p.userId);
    const agentUserIds = profileIds.filter(p => p.role === 'agent').map(p => p.userId);
    const deliveryUserIds = profileIds.filter(p => p.role === 'delivery').map(p => p.userId);

    // 1. Fetch only those that are currently PENDING to ensure atomicity and prevent duplicate emails
    const [pendingFarmers, pendingAgents, pendingDelivery] = await Promise.all([
      db.farmerProfile.findMany({ where: { userId: { in: farmerUserIds }, sellingStatus: 'PENDING' }, select: { userId: true, user: { select: { email: true } } } }),
      db.agentProfile.findMany({ where: { userId: { in: agentUserIds }, sellingStatus: 'PENDING' }, select: { userId: true, user: { select: { email: true } } } }),
      db.deliveryProfile.findMany({ where: { userId: { in: deliveryUserIds }, approvalStatus: 'PENDING' }, select: { userId: true, user: { select: { email: true } } } })
    ]);

    const actualFarmerIds = pendingFarmers.map(p => p.userId);
    const actualAgentIds = pendingAgents.map(p => p.userId);
    const actualDeliveryIds = pendingDelivery.map(p => p.userId);

    if (actualFarmerIds.length === 0 && actualAgentIds.length === 0 && actualDeliveryIds.length === 0) {
      return { success: true, message: "No pending profiles found in selection." };
    }

    await db.$transaction([
      db.user.updateMany({ where: { id: { in: actualFarmerIds } }, data: { role: 'farmer' } }),
      db.user.updateMany({ where: { id: { in: actualAgentIds } }, data: { role: 'agent' } }),
      db.user.updateMany({ where: { id: { in: actualDeliveryIds } }, data: { role: 'delivery' } }),
      db.farmerProfile.updateMany({ where: { userId: { in: actualFarmerIds }, sellingStatus: 'PENDING' }, data: { sellingStatus: 'APPROVED' } }),
      db.agentProfile.updateMany({ where: { userId: { in: actualAgentIds }, sellingStatus: 'PENDING' }, data: { sellingStatus: 'APPROVED' } }),
      db.deliveryProfile.updateMany({ where: { userId: { in: actualDeliveryIds }, approvalStatus: 'PENDING' }, data: { approvalStatus: 'APPROVED' } })
    ]);

    // Send emails (Truly in Background using after)
    after(async () => {
      await Promise.all([
        ...pendingFarmers.map(p => sendProfileApprovalEmail(p.user.email, 'farmer')),
        ...pendingAgents.map(p => sendProfileApprovalEmail(p.user.email, 'agent')),
        ...pendingDelivery.map(p => sendDeliveryProfileApprovalEmail(p.user.email))
      ]);
    });

    return { success: true, message: `Successfully approved ${actualFarmerIds.length + actualAgentIds.length + actualDeliveryIds.length} members.` };
  } catch (err) {
    console.error("Bulk Approve Error:", err);
    return { success: false, error: err.message };
  }
}

export async function adminDeleteOrder(orderId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    return await db.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!ord) throw new Error("Order not found");

      // RESTORE STOCK if it was pending or processing (safe guard)
      if (ord.paymentStatus !== 'PAID') {
        for (const item of ord.items) {
          await tx.productListing.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity }
            }
          });
        }
      }

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });

      return { success: true, message: "Order deleted successfully" };
    });
  } catch (err) {
    console.error("Admin Delete Order Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getAdminDeliveryJobs() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const jobs = await db.deliveryJob.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deliveryBoy: true,
        order: {
          select: {
            id: true,
            buyerName: true,
            shippingAddress: true,
            totalAmount: true
          }
        }
      }
    });

    return { success: true, data: JSON.parse(JSON.stringify(jobs)) };
  } catch (err) {
    console.error("Get Admin Delivery Jobs Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getAdminReviews() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        product: { 
          select: { 
            productName: true,
            farmer: { select: { name: true } },
            agent: { select: { name: true, companyName: true } }
          } 
        }
      }
    });

    return { success: true, data: JSON.parse(JSON.stringify(reviews)) };
  } catch (err) {
    console.error("Get Admin Reviews Error:", err);
    return { success: false, error: err.message };
  }
}
export async function clearStaleOrders() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    // Stale orders: PENDING for more than 24 hours
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleOrders = await db.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: { lt: threshold }
      },
      select: { id: true }
    });

    if (staleOrders.length === 0) {
      return { success: true, message: "No stale orders found." };
    }

    const count = await db.$transaction(async (tx) => {
      let deletedCount = 0;
      for (const order of staleOrders) {
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        await tx.order.delete({ where: { id: order.id } });
        deletedCount++;
      }
      return deletedCount;
    });

    return { success: true, message: `Successfully cleared ${count} stale orders.` };
  } catch (err) {
    console.error("Clear Stale Orders Error:", err);
    return { success: false, error: err.message };
  }
}
