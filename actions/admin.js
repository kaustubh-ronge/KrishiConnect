"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

async function ensureAdmin(userId) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u || (u.role !== "admin" && u.role !== "super_admin")) {
    throw new Error("Unauthorized: admin only");
  }
  return true;
}

export async function getAdminStats() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    // Only consider paid orders for GMV and platform revenue
    const paidOrders = await db.order.findMany({ where: { paymentStatus: "PAID" } });

    const totalGMV = paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalPlatformRevenue = paidOrders.reduce((s, o) => s + (o.platformFee || 0), 0);
    const pendingPayouts = paidOrders
      .filter(o => o.payoutStatus === "PENDING")
      .reduce((s, o) => s + (o.sellerAmount || 0), 0);
    const settledPayouts = paidOrders
      .filter(o => o.payoutStatus === "SETTLED")
      .reduce((s, o) => s + (o.sellerAmount || 0), 0);

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

    const where = onlyPendingPayouts ? { paymentStatus: "PAID", payoutStatus: "PENDING" } : {};

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        buyerUser: { include: { farmerProfile: true, agentProfile: true } },
        items: { include: { product: { include: { farmer: true, agent: true } } } }
      }
    });

    // Map into a simpler structure for UI consumption
    const mapped = orders.map(o => ({
      id: o.id,
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      platformFee: o.platformFee,
      sellerAmount: o.sellerAmount,
      paymentStatus: o.paymentStatus,
      payoutStatus: o.payoutStatus,
      payoutSettledAt: o.payoutSettledAt,
      buyer: {
        id: o.buyerUser.id,
        email: o.buyerUser.email,
        name: o.buyerUser.farmerProfile?.name || o.buyerUser.agentProfile?.name || null,
        phone: o.buyerUser.farmerProfile?.phone || o.buyerUser.agentProfile?.phone || null
      },
      items: o.items.map(it => ({
        id: it.id,
        productName: it.product.productName,
        quantity: it.quantity,
        unit: it.product.unit,
        priceAtPurchase: it.priceAtPurchase,
        deliveryChargeAtPurchase: it.deliveryChargeAtPurchase,
        deliveryChargeTypeAtPurchase: it.deliveryChargeTypeAtPurchase,
        seller: it.product.farmer ? { type: 'farmer', profile: it.product.farmer } : (it.product.agent ? { type: 'agent', profile: it.product.agent } : null)
      }))
    }));

    return { success: true, data: mapped };
  } catch (err) {
    console.error("Get Orders Error:", err);
    return { success: false, error: err.message };
  }
}

export async function markOrderPayoutSettled(orderId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await ensureAdmin(user.id);

    const order = await db.order.update({
      where: { id: orderId },
      data: {
        payoutStatus: "SETTLED",
        payoutSettledAt: new Date(),
        payoutSettledBy: user.id
      }
    });

    return { success: true, data: order };
  } catch (err) {
    console.error("Settle Payout Error:", err);
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

    // Aggregate sellers' bank details per item seller
    const sellers = order.items.map(it => {
      const p = it.product;
      const seller = p.farmer || p.agent;
      return {
        productId: p.id,
        productName: p.productName,
        sellerType: p.farmer ? 'farmer' : 'agent',
        sellerProfile: seller ? {
          upiId: seller.upiId,
          bankName: seller.bankName,
          accountNumber: seller.accountNumber,
          ifscCode: seller.ifscCode,
          name: seller.name
        } : null
      };
    });

    return { success: true, data: sellers };
  } catch (err) {
    console.error("Get Seller Bank Details Error:", err);
    return { success: false, error: err.message };
  }
}
