
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getSellerSales = cache(async () => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return { success: false, error: "User not found" };

    let whereClause = {};

    // Determine if user is Farmer or Agent to filter their products
    if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
      whereClause = {
        product: { farmerId: dbUser.farmerProfile.id },
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'COD', paymentStatus: 'PENDING' }
        ]
      };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      whereClause = {
        product: { agentId: dbUser.agentProfile.id },
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'COD', paymentStatus: 'PENDING' }
        ]
      };
    } else {
      return { success: false, data: [] };
    }

    // Find all OrderItems linked to this seller's products
    const sales = await db.orderItem.findMany({
      where: whereClause,
      include: {
        product: true,
        order: {
          include: {
            buyerUser: {
              select: {
                email: true,
                farmerProfile: { select: { name: true } },
                agentProfile: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { order: { createdAt: 'desc' } }
    });

    return { success: true, data: sales };

  } catch (err) {
    console.error("Get Sales Error:", err);
    return { success: false, error: "Failed to fetch sales data" };
  }
});

export const getBuyerOrders = cache(async () => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orders = await db.order.findMany({
      where: {
        buyerId: user.id,
        OR: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'COD', paymentStatus: 'PENDING' }
        ]
      },
      include: {
        buyerUser: {
          include: {
            farmerProfile: { select: { name: true, phone: true, address: true } },
            agentProfile: { select: { name: true, phone: true, companyName: true } }
          }
        },
        items: {
          include: {
            product: {
              include: {
                farmer: { select: { name: true, phone: true, address: true, lat: true, lng: true } },
                agent: { select: { name: true, phone: true, companyName: true, lat: true, lng: true } }
              }
            }
          }
        },
        deliveryJobs: {
          include: {
            deliveryBoy: {
              select: {
                id: true,
                name: true,
                phone: true,
                vehicleType: true,
                isOnline: true,
                lat: true,
                lng: true
              }
            }
          }
        },
        tracking: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: orders };

  } catch (err) {
    console.error("Get Orders Error:", err);
    return { success: false, error: "Failed to fetch orders" };
  }
});

export const getUserPendingOrders = async () => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orders = await db.order.findMany({
      where: {
        buyerId: user.id,
        paymentStatus: 'PENDING'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(orders)) };
  } catch (err) {
    console.error("Fetch Pending Orders Error:", err);
    return { success: false, error: "Failed to fetch pending orders" };
  }
};

export const cancelPendingOrder = async (orderId) => {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    return await db.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!ord || ord.buyerId !== user.id) {
        throw new Error("Order not found or unauthorized");
      }

      if (ord.paymentStatus === 'PAID') {
        throw new Error("Cannot cancel a paid order");
      }

      // RESTORE STOCK
      for (const item of ord.items) {
        await tx.productListing.update({
          where: { id: item.productId },
          data: {
            availableStock: { increment: item.quantity }
          }
        });
      }

      // DELETE ORDER
      await tx.orderItem.deleteMany({ where: { orderId: orderId } });
      await tx.order.delete({ where: { id: orderId } });

      return { success: true, message: "Pending order cancelled and stock restored." };
    });
  } catch (err) {
    console.error("Cancel Pending Order Error:", err);
    return { success: false, error: err.message || "Failed to cancel order" };
  }
};


import { validateAction, mutationRateLimit } from "@/lib/arcjet";

export async function initiateCheckout(params) {
  await validateAction(mutationRateLimit);
  const { addressData, selectedItemIds = [], forceFresh = false, forceResumeId = null } = params || {};

  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  if (!addressData || !addressData.address || !addressData.phone || !addressData.name) {
    return { success: false, error: "Shipping details are mandatory" };
  }

  try {
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });


    // --- SELECTIVE CHECKOUT LOGIC ---
    let checkoutItems = cart.items;
    if (selectedItemIds && selectedItemIds.length > 0) {
      checkoutItems = cart.items.filter(it => selectedItemIds.includes(it.id));
    }

    if (checkoutItems.length === 0) {
      return { success: false, error: "No items selected for checkout" };
    }

    for (const it of checkoutItems) {
      const p = it.product;
      if (dbUser.farmerProfile && p.farmerId === dbUser.farmerProfile.id) {
        return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
      }
      if (dbUser.agentProfile && p.agentId === dbUser.agentProfile.id) {
        return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
      }

      const minQty = p.minOrderQuantity || 1;
      if (it.quantity < minQty) {
        return { success: false, error: `Error: ${p.productName} requires a minimum order of ${minQty} ${p.unit}.` };
      }
    }


    // ─── THE ULTIMATE IDEMPOTENCY GUARD (REFINED) ───
    const cartVersion = cart.updatedAt.getTime();
    const cartFingerprint = checkoutItems.map(it => `${it.productId}:${it.quantity}`).sort().join("|");
    const hash = Buffer.from(cartFingerprint).toString('base64').slice(0, 8);
    const salt = forceFresh ? `_${Date.now().toString().slice(-4)}` : "";
    const idempotencyId = `ord_${user.id.slice(-4)}_${cartVersion}_${hash}${salt}`;



    // STOCK VALIDATION & CALCULATION
    const productSubtotal = checkoutItems.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    // --- DYNAMIC DISTANCE-BASED DELIVERY CALCULATION ---
    // Instead of flat fees per product, we calculate based on Road Distance * Seller's rate
    // This protects the seller from "forced losses" when hiring dynamic partners.

    // Group items by seller to handle multi-seller carts
    const sellerMap = new Map();
    for (const it of checkoutItems) {
      const sellerId = it.product.farmerId || it.product.agentId;
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          id: sellerId,
          type: it.product.sellerType,
          items: []
        });
      }
      sellerMap.get(sellerId).items.push(it);
    }

    let deliveryTotal = 0;
    const { getOSRMDistance } = await import('@/lib/utils');
    const { getAvailableDeliveryBoys } = await import('./delivery-job');
    const { getUserSpecialDeliveryRequests } = await import('./special-delivery');

    // Fetch approved requests for this user once
    const { data: allRequests } = await getUserSpecialDeliveryRequests();
    const approvedRequests = allRequests?.filter(r => r.status === 'APPROVED') || [];

    for (const seller of sellerMap.values()) {
      let sellerProfile;
      if (seller.type === 'farmer') {
        sellerProfile = await db.farmerProfile.findUnique({ where: { id: seller.id } });
      } else {
        sellerProfile = await db.agentProfile.findUnique({ where: { id: seller.id } });
      }

      if (sellerProfile && sellerProfile.lat && sellerProfile.lng && addressData.lat && addressData.lng) {
        const dist = await getOSRMDistance(sellerProfile.lat, sellerProfile.lng, addressData.lat, addressData.lng);

        // 1. CHECK FOR APPROVED SPECIAL DELIVERY REQUESTS
        const sellerItems = seller.items;
        let sellerNegotiatedTotal = 0;
        let allOutOfRangeItemsApproved = true;
        let hasOutOfRangeItems = false;

        for (const it of sellerItems) {
            const productRange = it.product.maxDeliveryRange;
            const effectiveMaxRange = Number(productRange ?? sellerProfile.maxDeliveryRange ?? 100);
            
            if (dist > effectiveMaxRange) {
                hasOutOfRangeItems = true;
                const approvedReq = approvedRequests.find(r => r.productId === it.productId);
                
                if (!approvedReq || approvedReq.negotiatedFee === null) {
                    allOutOfRangeItemsApproved = false;
                } else if (it.quantity > approvedReq.quantity) {
                    // QUANTITY CAP ENFORCEMENT
                    return { 
                        success: false, 
                        error: `Approved quantity for ${it.product.productName} is limited to ${approvedReq.quantity} ${approvedReq.unit || it.product.unit}. Please update your cart or submit a new special delivery request for the extra amount.` 
                    };
                } else {
                    // FEE IS NOW PER UNIT
                    sellerNegotiatedTotal += ((approvedReq.negotiatedFee || 0) * it.quantity);
                }
            }
        }

        if (hasOutOfRangeItems && allOutOfRangeItemsApproved) {
            deliveryTotal += sellerNegotiatedTotal;
            continue; // Bypasses standard distance checks as all OOR items are mediated
        }

        // 2. ENFORCE SERVICEABILITY LIMITS
        for (const it of sellerItems) {
          const productRange = it.product.maxDeliveryRange;
          const profileRange = sellerProfile.maxDeliveryRange;
          const effectiveMaxRange = Number(productRange ?? profileRange ?? 100);

          if (dist > effectiveMaxRange) {
            return {
              success: false,
              error: `UNSERVICEABLE: Product "${it.product.productName}" is beyond delivery range (${dist.toFixed(1)}km > ${effectiveMaxRange}km). Please request special delivery approval first.`
            };
          }
        }

        // 3. STANDARD CALCULATION (Only if in range)
        const partnersRes = await getAvailableDeliveryBoys(sellerProfile.lat, sellerProfile.lng);
        let marketRate = sellerProfile.deliveryPricePerKm || 10;

        if (partnersRes.success && partnersRes.data.length > 0) {
          const localPartners = partnersRes.data.filter(p => p.isOnline && p.distance <= 100);
          if (localPartners.length > 0) {
            const nearestPartner = localPartners[0];
            marketRate = Math.max(marketRate, nearestPartner.pricePerKm);
          }
        }

        deliveryTotal += Math.round(dist * marketRate);
      } else {
        // --- CRITICAL: If seller has a range limit, we MUST have a location to verify ---
        if (sellerProfile.maxDeliveryRange) {
          return {
            success: false,
            error: `Location Required: ${sellerProfile.name || sellerProfile.companyName} has a delivery range limit. Please pin your location on the cart page to proceed.`
          };
        }

        // Fallback to product-defined flat fees if location is missing and no range limit
        deliveryTotal += seller.items.reduce((sum, it) => {
          if (it.product.deliveryChargeType === 'per_unit') {
            return sum + (it.quantity * (it.product.deliveryCharge || 0));
          }
          return sum + (it.product.deliveryCharge || 0);
        }, 0);
      }
    }

    // --- REFINED PLATFORM FEE LOGIC ---
    // 1. Online: 3% (2% Razorpay + 1% Platform)
    // 2. COD: 1.5% (Slightly less as requested)
    // Applied only if product subtotal exceeds Rs 100
    const isOnline = addressData.paymentMethod !== 'COD';
    let platformFee = 0;
    if (productSubtotal > 100) {
      const rate = isOnline ? 0.03 : 0.015;
      platformFee = Math.round(productSubtotal * rate);
    }

    const total = productSubtotal + deliveryTotal + platformFee;


    if (!Number.isFinite(total) || total > 100000000) {
      return { success: false, error: "Order total exceeds system limits." };
    }

    // --- COLLISION CHECK (OUTSIDE TRANSACTION FOR SPEED) ---
    const existing = await db.order.findUnique({
      where: { id: idempotencyId }
    });

    if (existing) {
      if (existing.paymentStatus === 'PAID') {
        throw new Error("You've already purchased these items recently. Please check your orders or refresh your cart.");
      }

      // CRITICAL FIX: If the user switched payment methods (e.g. Online -> COD), 
      // we MUST update the existing order record to reflect the NEW choice.
      // Also clear stale Razorpay metadata if switching to COD.
      if (existing.paymentMethod !== addressData.paymentMethod) {
        await db.order.update({
          where: { id: existing.id },
          data: {
            paymentMethod: addressData.paymentMethod,
            // Clear any stale Razorpay metadata if switching to COD
            ...(addressData.paymentMethod === 'COD' ? { 
                razorpayOrderId: null,
                razorpayPaymentId: null 
            } : {})
          }
        });
      }

      if (forceResumeId === existing.id) {
        // Fall through to the Razorpay flow below
      } else {
        return { success: true, data: { ...existing, isCollision: true, paymentMethod: addressData.paymentMethod } };
      }
    }

    const created = existing || await db.$transaction(async (tx) => {
      // Generate invoice number inside transaction for COD
      let invNum = null;
      if (addressData.paymentMethod === 'COD') {
        try {
          const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
          const generated = await generateInvoiceNumber(idempotencyId);
          if (generated && typeof generated === 'string') {
            const crypto = await import('crypto');
            const entropy = crypto.randomBytes(2).toString('hex').toUpperCase();
            invNum = `${generated}-${entropy}`;
          }
        } catch (e) {
          console.error("Generator error:", e);
        }

        if (!invNum) {
          const crypto = await import('crypto');
          invNum = `INV-${idempotencyId.slice(-6).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        }
      }

      // Re-verify inside if needed, but existing is stable due to idempotencyId
      const newOrder = await tx.order.create({
        data: {
          id: idempotencyId,
          buyerId: user.id,
          totalAmount: total,
          platformFee: platformFee,
          deliveryFee: deliveryTotal,
          sellerAmount: productSubtotal + deliveryTotal,
          paymentStatus: addressData.paymentMethod === 'COD' ? 'PENDING' : "PENDING",
          orderStatus: "PROCESSING",
          paymentMethod: addressData.paymentMethod || "ONLINE",
          shippingAddress: addressData.address,
          lat: addressData.lat,
          lng: addressData.lng,
          buyerPhone: addressData.phone,
          buyerName: addressData.name,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          razorpayOrderId: null,
          razorpayPaymentId: null,
          ...(invNum && { invoiceNumber: invNum }),
        }
      });

      for (const it of checkoutItems) {
        let sellerId = it.product.farmerId || it.product.agentId;
        let sellerType = it.product.sellerType;
        let sellerName = "Seller";

        if (sellerType === 'farmer') {
          const f = await tx.farmerProfile.findUnique({ where: { id: it.product.farmerId }, select: { name: true } });
          if (f) sellerName = f.name;
        } else {
          const a = await tx.agentProfile.findUnique({ where: { id: it.product.agentId }, select: { name: true, companyName: true } });
          if (a) sellerName = a.companyName || a.name;
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: it.productId,
            quantity: it.quantity,
            priceAtPurchase: it.product.pricePerUnit,
            deliveryChargeAtPurchase: it.product.deliveryCharge || 0,
            deliveryChargeTypeAtPurchase: it.product.deliveryChargeType || 'per_unit',
            sellerId,
            sellerType,
            sellerName
          }
        });

        const updateResult = await tx.productListing.updateMany({
          where: {
            id: it.productId,
            availableStock: { gte: it.quantity }
          },
          data: {
            availableStock: { decrement: it.quantity }
          }
        });

        if (updateResult.count === 0) {
          throw new Error(`Insufficient stock for ${it.product.productName}`);
        }
      }
      return newOrder;

    }, {
      timeout: 30000 // Increased to 30s
    });

    // Handle COD Success Flow
    if (addressData.paymentMethod === 'COD') {
      // CRITICAL FIX: Re-enable cart deletion for COD orders.
      // We only delete the items that were actually checked out.
      try {
        const itemIdsToDelete = checkoutItems.map(it => it.id);
        await db.cartItem.deleteMany({
          where: {
            id: { in: itemIdsToDelete }
          }
        });
        // revalidatePath("/cart") or update client store via return
      } catch (cartErr) {
        console.error("Failed to clear cart for COD order:", cartErr);
        // We don't fail the whole order if cart deletion fails, but we log it.
      }

      const { createNotification } = await import('./notifications');
      const orderWithItems = await db.order.findUnique({
        where: { id: created.id },
        include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
      });

      const notifiedSellers = new Set();
      for (const item of orderWithItems.items) {
        let sellerUserId = null;
        if (item.product.sellerType === 'farmer' && item.product.farmer) sellerUserId = item.product.farmer.userId;
        else if (item.product.sellerType === 'agent' && item.product.agent) sellerUserId = item.product.agent.userId;

        if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
          notifiedSellers.add(sellerUserId);
          await createNotification({
            userId: sellerUserId,
            type: 'ORDER_RECEIVED',
            title: 'New COD Order Received!',
            message: `You have a new order #${created.id.slice(-8)}. Please process it.`,
            linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
          });
        }
      }

      return { success: true, data: { orderId: created.id, isCod: true, resumed: !!created.isResumed, isCollision: !!created.isCollision } };


    }

    // Online Payment Flow
    // Use the actual order total from the database if we are resuming, 
    // otherwise use the freshly calculated total.
    const finalTotal = created.totalAmount ? Number(created.totalAmount) : total;
    const amountInPaise = Math.round(finalTotal * 100);

    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      return { success: false, error: "Razorpay keys not configured" };
    }

    // Check if we already have a razorpayOrderId for this order
    let finalRazorpayOrderId = created.razorpayOrderId;

    if (!finalRazorpayOrderId) {
      const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: created.id,
          payment_capture: 1,
        })
      });

      const razorpayData = await response.json();

      if (!response.ok) {
        console.error("Razorpay Order Creation Failed:", razorpayData);
        return {
          success: false,
          error: `Razorpay Error: ${razorpayData.error?.description || "Failed to create order"}`
        };
      }
      finalRazorpayOrderId = razorpayData.id;

      await db.order.update({
        where: { id: created.id },
        data: { razorpayOrderId: finalRazorpayOrderId }
      });
    } else {
    }

    return {
      success: true,
      data: {
        id: created.id,
        orderId: created.id,
        razorpayOrderId: finalRazorpayOrderId,
        amount: amountInPaise,
        resumed: !!created.isResumed,
        isCollision: !!created.isCollision
      }
    };


  } catch (err) {
    console.error("initiateCheckout CRITICAL error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Checkout initiation failed. Please try again."
    };
  }
}

export async function confirmOrderPayment({ orderId, razorpayPaymentId, razorpayOrderId, signature }) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    if (!signature || !razorpayPaymentId || !razorpayOrderId) {
      return { success: false, error: "Missing payment verification details" };
    }

    const crypto = await import('crypto');
    const key = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');

    if (expected !== signature) {
      return { success: false, error: 'Invalid payment signature' };
    }

    const result = await db.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
      });

      if (!ord) throw new Error("Order not found");

      if (ord.buyerId !== user.id) {
        throw new Error("Unauthorized: You do not own this order.");
      }

      if (ord.paymentStatus === 'PAID') {
        return { status: "ALREADY_PAID" };
      }

      if (ord.expiresAt && new Date() > ord.expiresAt) {
        throw new Error("Order session has expired. Please start a new checkout.");
      }

      let invoiceNumber = ord.invoiceNumber;

      if (!invoiceNumber) {
        try {
          const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
          const generated = await generateInvoiceNumber(orderId);
          if (generated && typeof generated === 'string') {
            const entropy = crypto.randomBytes(2).toString('hex').toUpperCase();
            invoiceNumber = `${generated}-${entropy}`;
          }
        } catch (e) {
          console.error("Custom generator error:", e);
        }

        if (!invoiceNumber) {
          invoiceNumber = `INV-${orderId.slice(-6).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          invoiceNumber,
          razorpayOrderId,
          razorpayPaymentId,
          expiresAt: null
        }
      });

      const cart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        // FORCE UPDATE CART TIMESTAMP to reset idempotency for next purchase
        await tx.cart.update({
          where: { id: cart.id },
          data: { updatedAt: new Date() }
        });
      }


      return { status: "SUCCESS" };
    }, {
      timeout: 15000
    });

    if (result.status === "ALREADY_PAID") return { success: true };

    const { createNotification } = await import('./notifications');
    const orderWithSellers = await db.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
    });

    const notifiedSellers = new Set();
    for (const item of orderWithSellers.items) {
      const sellerUserId = item.product.farmer?.userId || item.product.agent?.userId;
      if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
        notifiedSellers.add(sellerUserId);
        await createNotification({
          userId: sellerUserId,
          type: 'ORDER_RECEIVED',
          title: 'New Order Received!',
          message: `Order #${orderId.slice(-8)} is paid. Please process shipping.`,
          linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
        });
      }
    }

    revalidatePath('/cart');
    revalidatePath('/my-orders');
    revalidatePath('/farmer-dashboard/sales');
    revalidatePath('/agent-dashboard/sales');
    revalidatePath('/farmer-dashboard/manage-orders');
    revalidatePath('/agent-dashboard/manage-orders');

    // ─── CONSUME SPECIAL DELIVERY REQUESTS ───
    // Once order is paid, approved mediation requests are consumed
    const productIds = orderWithSellers.items.map(it => it.productId);
    await db.specialDeliveryRequest.updateMany({
      where: {
        userId: orderWithSellers.buyerId,
        productId: { in: productIds },
        status: 'APPROVED',
        isConsumed: false
      },
      data: {
        isConsumed: true
      }
    });

    return { success: true };

  } catch (err) {
    if (err.code === 'P2002') {
      const checkOrd = await db.order.findUnique({ where: { id: orderId } });
      if (checkOrd?.paymentStatus === 'PAID') {
        return { success: true };
      }
      return { success: false, error: 'Database busy. Payment received, but status update pending. Refresh page.' };
    }

    console.error('confirmOrderPayment Error:', err);
    return { success: false, error: err.message || 'Payment confirmation failed' };
  }
}

/**
 * Dynamic delivery fee calculation for frontend preview
 */
export async function calculateDynamicDeliveryFee(cartItemIds = [], targetLat, targetLng, productId = null) {
  try {
    if (!targetLat || !targetLng) return { success: true, fee: 0 };

    let items = [];
    if (productId) {
      // Single product preview (Product Detail Page)
      const product = await db.productListing.findUnique({
        where: { id: productId }
      });
      if (product) items = [{ product }];
    } else if (cartItemIds.length > 0) {
      // Standard Cart calculation
      items = await db.cartItem.findMany({
        where: { id: { in: cartItemIds } },
        include: { product: true }
      });
    }

    if (items.length === 0) return { success: true, fee: 0 };

    // Group by seller
    const unserviceableIds = [];
    const sellerMap = new Map();
    for (const it of items) {
      const sellerId = it.product.farmerId || it.product.agentId;
      if (!sellerId) continue;
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          id: sellerId,
          type: it.product.farmerId ? 'farmer' : 'agent'
        });
      }
    }

    const user = await currentUser();
    const approvedRequests = user ? await db.specialDeliveryRequest.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED',
        isConsumed: false, // EXCLUDE CONSUMED REQUESTS
        productId: productId ? productId : { in: items.map(it => it.product.id) }
      },
      orderBy: { updatedAt: 'desc' }
    }) : [];

    let totalFee = 0;
    let isLongDistance = false;
    const { getOSRMDistance } = await import('@/lib/utils');
    const { getAvailableDeliveryBoys } = await import('./delivery-job');

    for (const seller of sellerMap.values()) {
      const sellerItems = items.filter(it => (it.product.farmerId || it.product.agentId) === seller.id);
      
      let sellerNegotiatedTotal = 0;
      let allOutOfRangeItemsApproved = true;
      let hasOutOfRangeItems = false;

      // 1. Fetch Profile ONCE
      let profile;
      if (seller.type === 'farmer') {
        profile = await db.farmerProfile.findUnique({ where: { id: seller.id } });
      } else {
        profile = await db.agentProfile.findUnique({ where: { id: seller.id } });
      }

      if (profile?.lat && profile?.lng && targetLat && targetLng) {
        const dist = await getOSRMDistance(profile.lat, profile.lng, targetLat, targetLng);
        
        // 2. Specialized Check (Quantity-capped reusable mediation)
        for (const it of sellerItems) {
          const productRange = it.product.maxDeliveryRange;
          const effectiveMaxRange = Number(productRange ?? profile.maxDeliveryRange ?? 100);
          
          if (dist > effectiveMaxRange) {
            hasOutOfRangeItems = true;
            const pId = it.productId || it.product.id;
            const approvedReq = approvedRequests.find(r => r.productId === pId);
            
            if (!approvedReq || approvedReq.negotiatedFee === null || (it.quantity && it.quantity > approvedReq.quantity)) {
              allOutOfRangeItemsApproved = false;
            } else {
              // FEE IS NOW PER UNIT
              sellerNegotiatedTotal += ((approvedReq.negotiatedFee || 0) * (it.quantity || 1));
            }
          }
        }

        if (hasOutOfRangeItems && allOutOfRangeItemsApproved) {
          totalFee += sellerNegotiatedTotal;
          continue; 
        }

        // 3. Standard Fallback (If not all OOR items are approved or in-range check)
        // --- SERVICEABILITY CHECK (Per-Product Override) ---
        let isSellerOutOfRange = false;

        for (const it of sellerItems) {
          const productRange = it.product.maxDeliveryRange;
          const profileRange = profile.maxDeliveryRange;
          const effectiveMaxRange = Number(productRange ?? profileRange ?? 100);

          if (dist > effectiveMaxRange) {
            isSellerOutOfRange = true;
            break;
          }
        }

        if (isSellerOutOfRange) {
          unserviceableIds.push(...sellerItems.map(it => it.id || it.product.id));
          isLongDistance = true; 
        } else {
          if (dist > 100) isLongDistance = true;

          const partnersRes = await getAvailableDeliveryBoys(profile.lat, profile.lng);
          let marketRate = profile.deliveryPricePerKm || 10;

          if (partnersRes.success && partnersRes.data.length > 0) {
            const localPartners = partnersRes.data.filter(p => p.isOnline && p.distance <= 100);
            if (localPartners.length > 0) {
              const nearestPartner = localPartners[0];
              marketRate = Math.max(marketRate, nearestPartner.pricePerKm);
            }
          }
          totalFee += Math.round(dist * marketRate);
        }
      }
    }

    return {
      success: true,
      fee: totalFee,
      isLongDistance,
      isOutOfRange: unserviceableIds.length > 0,
      unserviceableIds
    };
  } catch (err) {
    console.error("Calculate Fee Error:", err);
    return { success: false, error: err.message };
  }
}
