"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSellerSales() {
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
      whereClause = { product: { farmerId: dbUser.farmerProfile.id } };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      whereClause = { product: { agentId: dbUser.agentProfile.id } };
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
}

export async function getBuyerOrders() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orders = await db.order.findMany({
      where: { buyerId: user.id },
      include: {
        buyerUser: {
          include: {
            farmerProfile: {
              select: { name: true, phone: true, address: true }
            },
            agentProfile: {
              select: { name: true, phone: true, companyName: true }
            }
          }
        },
        items: {
          include: {
            product: {
              include: {
                 farmer: { select: { name: true, phone: true, address: true } },
                 agent: { select: { name: true, phone: true, companyName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: orders };

  } catch (err) {
    console.error("Get Orders Error:", err);
    return { success: false, error: "Failed to fetch orders" };
  }
}

// --- NEW: Initiate Checkout / Create Order & Razorpay Order ---
export async function initiateCheckout() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    // Fetch cart with product info
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Compute totals: separate product subtotal and delivery total
    const productSubtotal = cart.items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    const deliveryTotal = cart.items.reduce((sum, it) => {
      if (it.product.deliveryChargeType === 'per_unit') {
        return sum + (it.quantity * (it.product.deliveryCharge || 0));
      }
      // flat: add once per listing
      return sum + (it.product.deliveryCharge || 0);
    }, 0);

    // Platform fee rate depends on product price (1% for cheap items, 2% for others)
    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    const platformFee = Math.round(cart.items.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));

    const total = productSubtotal + deliveryTotal + platformFee;

    // Transaction: create order + order items
    const created = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          buyerId: user.id,
          totalAmount: total,
          platformFee: platformFee,
          sellerAmount: Math.max(0, productSubtotal - platformFee),
          paymentStatus: "PENDING",
          orderStatus: "PROCESSING"
        }
      });

      // Create items with seller info
      for (const it of cart.items) {
        // Fetch seller details
        let sellerId = null;
        let sellerType = null;
        let sellerName = null;

        if (it.product.sellerType === 'farmer' && it.product.farmerId) {
          const farmer = await tx.farmerProfile.findUnique({
            where: { id: it.product.farmerId },
            select: { id: true, name: true }
          });
          if (farmer) {
            sellerId = farmer.id;
            sellerType = 'farmer';
            sellerName = farmer.name;
          }
        } else if (it.product.sellerType === 'agent' && it.product.agentId) {
          const agent = await tx.agentProfile.findUnique({
            where: { id: it.product.agentId },
            select: { id: true, name: true, companyName: true }
          });
          if (agent) {
            sellerId = agent.id;
            sellerType = 'agent';
            sellerName = agent.companyName || agent.name;
          }
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
      }

      return newOrder;
    });

    // Create Razorpay order server-side. Use the environment variables
    const amountInPaise = Math.round(total * 100);

    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      return { success: false, error: "Razorpay keys not configured" };
    }

    // Build basic auth header
    const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: created.id,
        payment_capture: 1,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Razorpay order creation failed:", errText);
      return { success: false, error: "Failed to create Razorpay order" };
    }

    const razorpayOrder = await response.json();

    // Update our order with razorpay order id
    await db.order.update({
      where: { id: created.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    return {
      success: true,
      data: { orderId: created.id, razorpayOrderId: razorpayOrder.id, amount: amountInPaise }
    };

  } catch (err) {
    console.error("initiateCheckout error:", err);
    return { success: false, error: "Checkout initiation failed" };
  }
}

// --- NEW: Confirm Order Payment ---
export async function confirmOrderPayment({ orderId, razorpayPaymentId, razorpayOrderId, signature }) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const ord = await db.order.findUnique({ where: { id: orderId } });
    if (!ord) return { success: false, error: "Order not found" };
    if (ord.buyerId !== user.id) return { success: false, error: "Unauthorized" };

    // Optionally verify signature if provided
    if (signature) {
      const crypto = await import('crypto');
      const key = process.env.RAZORPAY_KEY_SECRET || '';
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');
      if (expected !== signature) {
        console.error('Razorpay signature mismatch', { expected, signature });
        return { success: false, error: 'Invalid payment signature' };
      }
    }

    // Generate invoice number
    const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
    const invoiceNumber = generateInvoiceNumber(orderId);

    // Mark order PAID and PROCESSING (not completed - needs fulfillment)
    await db.order.update({ 
      where: { id: orderId }, 
      data: { 
        paymentStatus: 'PAID', 
        orderStatus: 'PROCESSING',
        invoiceNumber,
        razorpayOrderId 
      } 
    });

    // Clear cart for the buyer
    const cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (cart) {
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Send notifications to sellers
    const { createNotification } = await import('./notifications');
    const orderWithItems = await db.order.findUnique({
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

    // Notify all unique sellers
    const notifiedSellers = new Set();
    for (const item of orderWithItems.items) {
      let sellerUserId = null;
      let dashboardUrl = '';

      if (item.product.sellerType === 'farmer' && item.product.farmer) {
        sellerUserId = item.product.farmer.userId;
        dashboardUrl = '/farmer-dashboard/sales';
      } else if (item.product.sellerType === 'agent' && item.product.agent) {
        sellerUserId = item.product.agent.userId;
        dashboardUrl = '/agent-dashboard/sales';
      }

      if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
        notifiedSellers.add(sellerUserId);
        await createNotification({
          userId: sellerUserId,
          type: 'ORDER_RECEIVED',
          title: 'New Order Received!',
          message: `You have a new order #${orderId.slice(-8)}. Please process it.`,
          linkUrl: dashboardUrl
        });
      }
    }

    // Revalidate cart and orders pages
    try {
      revalidatePath('/cart');
      revalidatePath('/my-orders');
      // Revalidate seller dashboards so sellers see the sale
      revalidatePath('/farmer-dashboard/sales');
      revalidatePath('/agent-dashboard/sales');
    } catch (err) {
      // Non-blocking
    }

    // Optionally revalidate
    // revalidatePath('/cart'); // cannot import next/cache here in server action easily; caller can refresh

    return { success: true };
  } catch (err) {
    console.error('confirmOrderPayment Error:', err);
    return { success: false, error: 'Failed to confirm order' };
  }
}