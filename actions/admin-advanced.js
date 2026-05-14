"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

async function ensureAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("Not logged in");

  const u = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (!u || u.role !== "admin") {
    throw new Error("Unauthorized: admin only");
  }
  return u;
}

/**
 * Get detailed counts and summaries for the Command Center
 */
export async function getAdvancedAdminStats() {
  try {
    await ensureAdmin();

    const [
      farmerCount,
      agentCount,
      adminCount,
      deliveryPartnerCount,
      totalProducts,
      farmerProducts,
      agentProducts,
      deliveredOrders,
      inTransitOrders,
      cancelledOrders,
      processingOrders,
      financeData,
      disputedOrders,
      disabledCount
    ] = await Promise.all([
      db.farmerProfile.count({ where: { sellingStatus: 'APPROVED' } }),
      db.agentProfile.count({ where: { sellingStatus: 'APPROVED' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.deliveryProfile.count({ where: { approvalStatus: 'APPROVED' } }),
      db.productListing.count(),
      db.productListing.count({ where: { sellerType: 'farmer' } }),
      db.productListing.count({ where: { sellerType: 'agent' } }),
      db.order.count({ where: { orderStatus: 'DELIVERED', paymentStatus: 'PAID' } }),
      db.order.count({ where: { orderStatus: { in: ['SHIPPED', 'IN_TRANSIT'] }, paymentStatus: 'PAID' } }),
      db.order.count({ where: { orderStatus: 'CANCELLED' } }),
      db.order.count({ where: { orderStatus: { in: ['PROCESSING', 'PACKED'] }, paymentStatus: 'PAID' } }),
      db.order.aggregate({
        _sum: { totalAmount: true, platformFee: true, sellerAmount: true },
        where: { paymentStatus: 'PAID' }
      }),
      db.order.findMany({
        where: { disputeStatus: 'OPEN' },
        select: { totalAmount: true }
      }),
      db.user.count({ where: { isDisabled: true } })
    ]);

    // Settlement Stats
    const settledData = await db.order.aggregate({
      _sum: { sellerAmount: true },
      where: { payoutStatus: 'SETTLED', paymentStatus: 'PAID' }
    });

    const totalGMV = financeData._sum.totalAmount || 0;
    const totalPlatformRevenue = financeData._sum.platformFee || 0;
    const totalSellerEarnings = financeData._sum.sellerAmount || 0;
    const settledPayouts = settledData._sum.sellerAmount || 0;
    const pendingPayouts = (financeData._sum.sellerAmount || 0) - settledPayouts;
    const fundsInDispute = disputedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const openDisputes = disputedOrders.length;

    const aov = deliveredOrders > 0 ? (totalGMV / deliveredOrders).toFixed(0) : 0;

    // Security Audit: Check how many have uploaded ID proofs
    const [verifiedFarmers, verifiedAgents, verifiedDelivery] = await Promise.all([
      db.farmerProfile.count({ where: { aadharFront: { not: null }, sellingStatus: 'APPROVED' } }),
      db.agentProfile.count({ where: { aadharFront: { not: null }, sellingStatus: 'APPROVED' } }),
      db.deliveryProfile.count({ where: { aadharFront: { not: null }, approvalStatus: 'APPROVED' } })
    ]);

    const totalVerified = verifiedFarmers + verifiedAgents + verifiedDelivery;
    const totalUsers = farmerCount + agentCount + deliveryPartnerCount;
    const profileCompleteness = totalUsers > 0 ? Math.round((totalVerified / totalUsers) * 100) : 0;

    // Role-based Revenue
    const farmerRevenue = (await db.order.aggregate({
      _sum: { platformFee: true },
      where: { paymentStatus: 'PAID', items: { some: { sellerType: 'farmer' } } }
    }))._sum.platformFee || 0;

    const agentRevenue = (await db.order.aggregate({
      _sum: { platformFee: true },
      where: { paymentStatus: 'PAID', items: { some: { sellerType: 'agent' } } }
    }))._sum.platformFee || 0;

    const profitPercentage = totalGMV > 0 ? ((totalPlatformRevenue / totalGMV) * 100).toFixed(1) : 0;
    const orderSuccessRate = (deliveredOrders + cancelledOrders) > 0
      ? ((deliveredOrders / (deliveredOrders + cancelledOrders)) * 100).toFixed(1)
      : 0;

    return {
      success: true,
      data: {
        users: { farmerCount, agentCount, adminCount, deliveryPartnerCount, profileCompleteness, disabledCount },
        products: { totalProducts, farmerProducts, agentProducts },
        orders: {
          totalDelivered: deliveredOrders,
          totalInTransit: inTransitOrders,
          totalProcessing: processingOrders,
          cancelledOrders,
          orderSuccessRate,
          aov
        },
        finance: {
          totalGMV,
          totalPlatformRevenue,
          totalSellerEarnings,
          settledPayouts,
          pendingPayouts,
          profitPercentage,
          revenueFromFarmers: farmerRevenue,
          revenueFromAgents: agentRevenue,
          fundsInDispute
        },
        openDisputes
      }
    };

  } catch (error) {
    console.error("[AdminAdvanced] Stats error:", error.message);
    return { success: false, error: error.message };
  }
}

import { buildUserFilters } from "@/lib/adminUtils";

export async function getExportableUsers(roleType, { 
  filters = {}, 
  sort = { key: 'createdAt', direction: 'desc' },
  page = 1,
  limit = 10 
} = {}) {
  try {
    await ensureAdmin();
    
    const where = buildUserFilters(filters, roleType);
    const skip = (page - 1) * limit;

    let data = [];
    let total = 0;
    if (roleType === 'farmer') {
      const [farmers, farmerCount] = await Promise.all([
        db.farmerProfile.findMany({
          where,
          orderBy: { [sort.key === 'createdAt' ? 'createdAt' : 'id']: sort.direction },
          skip,
          take: limit,
          include: {
            user: { select: { email: true, createdAt: true, isDisabled: true } },
            listings: {
              include: { orderItems: { select: { quantity: true } } }
            }
          }
        }),
        db.farmerProfile.count({ where })
      ]);
      total = farmerCount;

      data = await Promise.all(farmers.map(async (p) => {
        const purchasedCount = await db.order.count({ where: { buyerId: p.userId } });
        const unitsSold = p.listings.reduce((sum, l) => sum + l.orderItems.reduce((s, it) => s + it.quantity, 0), 0);
        return {
          ...p,
          listingsCount: p.listings.length,
          unitsSold,
          purchasedCount,
          listings: undefined // Clean up
        };
      }));

    } else if (roleType === 'agent') {
      const [agents, agentCount] = await Promise.all([
        db.agentProfile.findMany({
          where,
          orderBy: { [sort.key === 'createdAt' ? 'createdAt' : 'id']: sort.direction },
          skip,
          take: limit,
          include: {
            user: { select: { email: true, createdAt: true, isDisabled: true } },
            listings: {
              include: { orderItems: { select: { quantity: true } } }
            }
          }
        }),
        db.agentProfile.count({ where })
      ]);
      total = agentCount;

      data = await Promise.all(agents.map(async (p) => {
        const purchasedCount = await db.order.count({ where: { buyerId: p.userId } });
        const unitsSold = p.listings.reduce((sum, l) => sum + l.orderItems.reduce((s, it) => s + it.quantity, 0), 0);
        return {
          ...p,
          listingsCount: p.listings.length,
          unitsSold,
          purchasedCount,
          listings: undefined // Clean up
        };
      }));

    } else if (roleType === 'delivery') {
      const [partners, deliveryCount] = await Promise.all([
        db.deliveryProfile.findMany({
          where,
          orderBy: { [sort.key === 'createdAt' ? 'createdAt' : 'id']: sort.direction },
          skip,
          take: limit,
          include: {
            user: { select: { email: true, createdAt: true, isDisabled: true } },
            jobs: { select: { status: true } }
          }
        }),
        db.deliveryProfile.count({ where })
      ]);
      total = deliveryCount;

      data = partners.map(p => ({
        ...p,
        totalDeliveries: p.jobs.filter(j => j.status === 'DELIVERED').length,
        activeJobs: p.jobs.filter(j => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(j.status)).length,
        jobs: undefined
      }));

    } else if (roleType === 'admin') {
      data = await db.user.findMany({
        where: { role: 'admin' }
      });
    }

    return { 
      success: true, 
      data: {
        users: JSON.parse(JSON.stringify(data)),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error("[ExportUsers] Error:", error.message);
    return { success: false, error: error.message };
  }
}

import { buildProductFilters } from "@/lib/adminUtils";

export async function getExportableProducts({ 
  filters = {}, 
  sort = { key: 'createdAt', direction: 'desc' },
  page = 1,
  limit = 10 
} = {}) {
  try {
    await ensureAdmin();
    
    const where = buildProductFilters(filters);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.productListing.findMany({
        where,
        orderBy: { [sort.key]: sort.direction },
        skip,
        take: limit,
        include: {
          farmer: { select: { name: true } },
          agent: { select: { name: true, companyName: true } },
          orderItems: { select: { quantity: true } }
        }
      }),
      db.productListing.count({ where })
    ]);

    const mapped = products.map(p => ({
      ...p,
      sellerName: p.farmer?.name || p.agent?.companyName || p.agent?.name || 'N/A',
      unitsSold: p.orderItems.reduce((sum, it) => sum + it.quantity, 0),
      orderItems: undefined
    }));

    return { 
      success: true, 
      data: {
        products: JSON.parse(JSON.stringify(mapped)),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggle a user's disabled status for security/banning
 */
export async function toggleUserStatus(userId) {
  try {
    await ensureAdmin();
    const user = await db.user.findUnique({ where: { id: userId }, select: { isDisabled: true } });
    if (!user) throw new Error("User not found");

    const newStatus = !user.isDisabled;
    await db.user.update({
      where: { id: userId },
      data: { isDisabled: newStatus }
    });

    // 🚀 SYNC WITH CLERK FOR GLOBAL OVERLAY PERFORMANCE
    try {
      const { createClerkClient } = await import('@clerk/nextjs/server');
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          isDisabled: newStatus
        }
      });
    } catch (clerkErr) {
      console.error("[toggleUserStatus] Clerk sync failed (non-blocking):", clerkErr.message);
    }

    return { success: true, message: `User ${newStatus ? 'Disabled' : 'Enabled'} successfully.` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

