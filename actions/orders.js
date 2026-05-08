
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
        paymentStatus: 'PENDING',
        paymentMethod: 'ONLINE'
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


export async function initiateCheckout(params) {
  console.log("[Checkout] RAW PARAMS RECEIVED:", JSON.stringify(params, null, 2));
  const { addressData, selectedItemIds = [], forceFresh = false, forceResumeId = null } = params || {};

  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  console.log(`[Checkout] Initiating for user ${user.id}. ForceResumeId: ${forceResumeId}`);

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

    console.log(`[Checkout] Generated IdempotencyId: ${idempotencyId}`);



    // STOCK VALIDATION & CALCULATION
    const productSubtotal = checkoutItems.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    const deliveryTotal = checkoutItems.reduce((sum, it) => {
      if (it.product.deliveryChargeType === 'per_unit') {
        return sum + (it.quantity * (it.product.deliveryCharge || 0));
      }
      return sum + (it.product.deliveryCharge || 0);
    }, 0);

    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    const platformFee = Math.round(checkoutItems.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));
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
      
      if (forceResumeId === existing.id) {
          console.log(`[Checkout] Verified resumption of existing order: ${existing.id}`);
          // Fall through to the Razorpay flow below
      } else {
          console.log(`[Checkout] Collision detected. Existing ID: ${existing.id}, ForceResumeId: ${forceResumeId}`);
          return { success: true, data: { ...existing, isCollision: true } };
      }
    }

    const created = existing || await db.$transaction(async (tx) => {
      // Re-verify inside if needed, but existing is stable due to idempotencyId
      const newOrder = await tx.order.create({
        data: {
          id: idempotencyId,
          buyerId: user.id,
          totalAmount: total,
          platformFee: platformFee,
          deliveryFee: deliveryTotal,
          sellerAmount: Math.max(0, productSubtotal - platformFee),
          paymentStatus: addressData.paymentMethod === 'COD' ? 'PENDING' : "PENDING",
          orderStatus: "PROCESSING",
          paymentMethod: addressData.paymentMethod || "ONLINE",
          shippingAddress: addressData.address,
          lat: addressData.lat,
          lng: addressData.lng,
          buyerPhone: addressData.phone,
          buyerName: addressData.name,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000)
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
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });

      let invNum = created.invoiceNumber;
      if (!invNum) {
        try {
          const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
          const generated = await generateInvoiceNumber(created.id);
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
          invNum = `INV-${created.id.slice(-6).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        }

        await db.order.update({
          where: { id: created.id },
          data: { invoiceNumber: invNum }
        });
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
        console.log("[Checkout] Creating new Razorpay Order...");
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
        console.log(`[Checkout] Reusing existing Razorpay Order: ${finalRazorpayOrderId}`);
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

    return { success: true };

  } catch (err) {
    if (err.code === 'P2002') {
      const checkOrd = await db.order.findUnique({ where: { id: orderId } });
      if (checkOrd?.paymentStatus === 'PAID') {
        console.log(`Webhook beat us to it. Order ${orderId} already paid.`);
        return { success: true };
      }
      return { success: false, error: 'Database busy. Payment received, but status update pending. Refresh page.' };
    }

    console.error('confirmOrderPayment Error:', err);
    return { success: false, error: err.message || 'Payment confirmation failed' };
  }
}