// // "use server";

// // import { currentUser } from "@clerk/nextjs/server";
// // import { db } from "@/lib/prisma";
// // import { revalidatePath } from "next/cache";
// // import { cache } from "react";

// // export const getSellerSales = cache(async () => {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     const dbUser = await db.user.findUnique({
// //       where: { id: user.id },
// //       include: { farmerProfile: true, agentProfile: true }
// //     });

// //     if (!dbUser) return { success: false, error: "User not found" };

// //     let whereClause = {};

// //     // Determine if user is Farmer or Agent to filter their products
// //     if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
// //       whereClause = { 
// //         product: { farmerId: dbUser.farmerProfile.id },
// //         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
// //       };
// //     } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
// //       whereClause = { 
// //         product: { agentId: dbUser.agentProfile.id },
// //         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
// //       };
// //     } else {
// //       return { success: false, data: [] };
// //     }

// //     // Find all OrderItems linked to this seller's products
// //     const sales = await db.orderItem.findMany({
// //       where: whereClause,
// //       include: {
// //         product: true,
// //         order: {
// //           include: {
// //             buyerUser: {
// //               select: {
// //                 email: true,
// //                 farmerProfile: { select: { name: true } },
// //                 agentProfile: { select: { name: true } }
// //               }
// //             }
// //           }
// //         }
// //       },
// //       orderBy: { order: { createdAt: 'desc' } }
// //     });

// //     return { success: true, data: sales };

// //   } catch (err) {
// //     console.error("Get Sales Error:", err);
// //     return { success: false, error: "Failed to fetch sales data" };
// //   }
// // });

// // export const getBuyerOrders = cache(async () => {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     const orders = await db.order.findMany({
// //       where: { 
// //         buyerId: user.id,
// //         // Show both PAID and PENDING so users don't see an empty screen if confirmation lags
// //         paymentStatus: { in: ['PAID', 'PENDING'] }
// //       },
// //       include: {
// //         buyerUser: {
// //           include: {
// //             farmerProfile: {
// //               select: { name: true, phone: true, address: true }
// //             },
// //             agentProfile: {
// //               select: { name: true, phone: true, companyName: true }
// //             }
// //           }
// //         },
// //         items: {
// //           include: {
// //             product: {
// //               include: {
// //                  farmer: { select: { name: true, phone: true, address: true, lat: true, lng: true } },
// //                  agent: { select: { name: true, phone: true, companyName: true, lat: true, lng: true } }
// //               }
// //             }
// //           }
// //         },
// //         deliveryJobs: {
// //           include: {
// //             deliveryBoy: {
// //               select: {
// //                 id: true,
// //                 name: true,
// //                 phone: true,
// //                 vehicleType: true,
// //                 averageRating: true,
// //                 isOnline: true,
// //                 lat: true,
// //                 lng: true
// //               }
// //             }
// //           }
// //         },
// //         tracking: {
// //           orderBy: { createdAt: 'desc' }
// //         }
// //       },
// //       orderBy: { createdAt: 'desc' }
// //     });

// //     return { success: true, data: orders };

// //   } catch (err) {
// //     console.error("Get Orders Error:", err);
// //     return { success: false, error: "Failed to fetch orders" };
// //   }
// // });

// // // --- NEW: Initiate Checkout / Create Order & Razorpay Order ---
// // export async function initiateCheckout(addressData) {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   if (!addressData || !addressData.address || !addressData.phone || !addressData.name) {
// //     return { success: false, error: "Shipping details are mandatory" };
// //   }

// //   try {
// //     console.log(`[Checkout] Starting for user ${user.id}`);
// //     // 1. Fetch cart and perform PRE-CHECK for stock
// //     const cart = await db.cart.findUnique({
// //       where: { userId: user.id },
// //       include: {
// //         items: {
// //           include: { product: true }
// //         }
// //       }
// //     });

// //     if (!cart || cart.items.length === 0) {
// //       console.log(`[Checkout] Cart empty for user ${user.id}`);
// //       return { success: false, error: "Cart is empty" };
// //     }

// //     // ─── FINAL SECURITY CHECK: NO SELF-PURCHASE ───
// //     const dbUser = await db.user.findUnique({
// //       where: { id: user.id },
// //       include: { farmerProfile: true, agentProfile: true }
// //     });

// //     for (const it of cart.items) {
// //       const p = it.product;

// //       // 1. Self-Purchase Check
// //       if (dbUser.farmerProfile && p.farmerId === dbUser.farmerProfile.id) {
// //         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
// //       }
// //       if (dbUser.agentProfile && p.agentId === dbUser.agentProfile.id) {
// //         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
// //       }

// //       // 2. Minimum Quantity Check
// //       const minQty = p.minOrderQuantity || 1;
// //       if (it.quantity < minQty) {
// //         return { success: false, error: `Error: ${p.productName} requires a minimum order of ${minQty} ${p.unit}.` };
// //       }
// //     }

// //     // ─── THE ULTIMATE IDEMPOTENCY GUARD ───
// //     // We generate a deterministic ID based on the user and current cart content
// //     // This allows the DB to naturally block duplicates via Primary Key constraint.
// //     const cartFingerprint = cart.items.map(it => `${it.productId}:${it.quantity}`).sort().join("|");
// //     const idempotencyId = `ord_${user.id.slice(-8)}_${Buffer.from(cartFingerprint).toString('base64').slice(0, 16)}`;

// //     // 3. STOCK VALIDATION (Pre-check)

// //     const productSubtotal = cart.items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
// //     const deliveryTotal = cart.items.reduce((sum, it) => {
// //       if (it.product.deliveryChargeType === 'per_unit') {
// //         return sum + (it.quantity * (it.product.deliveryCharge || 0));
// //       }
// //       return sum + (it.product.deliveryCharge || 0);
// //     }, 0);

// //     const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
// //     const platformFee = Math.round(cart.items.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));
// //     const total = productSubtotal + deliveryTotal + platformFee;

// //     if (!Number.isFinite(total) || total > 100000000) {
// //         return { success: false, error: "Order total exceeds system limits." };
// //     }

// //     console.log(`[Checkout] Validation passed. Idempotency ID: ${idempotencyId}`);

// //     // 3. Transaction: create order + order items
// //     // INCREASE TIMEOUT to 15s to prevent P2028
// //     const created = await db.$transaction(async (tx) => {
// //       console.log("[Checkout] Transaction Started...");
// //       // Check if this EXACT order was already created in the last few minutes
// //       const existing = await tx.order.findUnique({
// //         where: { id: idempotencyId }
// //       });
// //       if (existing) {
// //         console.log("[Checkout] Order exists. Checking payment status for resumption...");
// //         // If it's already PAID, we definitely block.
// //         if (existing.paymentStatus === 'PAID') {
// //           throw new Error("Order already exists and is paid. Please check your orders page.");
// //         }
// //         // If it's PENDING and COD, it's also already done.
// //         if (existing.paymentMethod === 'COD') {
// //            return existing; 
// //         }
// //         // If it's PENDING and has no razorpayOrderId, it means the previous attempt failed 
// //         // after DB commit but before Razorpay call. We allow resumption.
// //         // Update timestamp and expiration to "refresh" the session
// //         const updated = await tx.order.update({
// //           where: { id: existing.id },
// //           data: { 
// //             createdAt: new Date(),
// //             expiresAt: new Date(Date.now() + 30 * 60 * 1000) 
// //           }
// //         });
// //         console.log("[Checkout] Resumed and refreshed existing pending order.");
// //         return updated;
// //       }

// //       console.log("[Checkout] Creating Order Record...");
// //       const newOrder = await tx.order.create({
// //         data: {
// //           id: idempotencyId, // DETERMINISTIC ID
// //           buyerId: user.id,
// //           totalAmount: total,
// //           platformFee: platformFee,
// //           deliveryFee: deliveryTotal,
// //           sellerAmount: Math.max(0, productSubtotal - platformFee),
// //           paymentStatus: addressData.paymentMethod === 'COD' ? 'PENDING' : "PENDING", // Both start as PENDING
// //           orderStatus: "PROCESSING",
// //           paymentMethod: addressData.paymentMethod || "ONLINE",
// //           shippingAddress: addressData.address,
// //           lat: addressData.lat,
// //           lng: addressData.lng,
// //           buyerPhone: addressData.phone,
// //           buyerName: addressData.name,
// //           expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min TTL
// //         }
// //       });

// //       for (const it of cart.items) {
// //         console.log(`[Checkout] Processing Item: ${it.productId}`);
// //         let sellerId = it.product.farmerId || it.product.agentId;
// //         let sellerType = it.product.sellerType;
// //         let sellerName = "Seller"; 

// //         if (sellerType === 'farmer') {
// //            const f = await tx.farmerProfile.findUnique({ where: { id: it.product.farmerId }, select: { name: true } });
// //            if (f) sellerName = f.name;
// //         } else {
// //            const a = await tx.agentProfile.findUnique({ where: { id: it.product.agentId }, select: { name: true, companyName: true } });
// //            if (a) sellerName = a.companyName || a.name;
// //         }

// //         await tx.orderItem.create({
// //           data: {
// //             orderId: newOrder.id,
// //             productId: it.productId,
// //             quantity: it.quantity,
// //             priceAtPurchase: it.product.pricePerUnit,
// //             deliveryChargeAtPurchase: it.product.deliveryCharge || 0,
// //             deliveryChargeTypeAtPurchase: it.product.deliveryChargeType || 'per_unit',
// //             sellerId,
// //             sellerType,
// //             sellerName
// //           }
// //         });

// //         console.log(`[Checkout] Decrementing Stock for: ${it.productId}`);
// //         // ─── Atomic Decrement with Constraint ───
// //         const updateResult = await tx.productListing.updateMany({
// //           where: { 
// //             id: it.productId,
// //             availableStock: { gte: it.quantity } 
// //           },
// //           data: { 
// //             availableStock: { decrement: it.quantity }
// //           }
// //         });

// //         if (updateResult.count === 0) {
// //           console.log(`[Checkout] Stock failure for: ${it.productId}`);
// //           throw new Error(`Insufficient stock for ${it.product.productName}`);
// //         }
// //       }
// //       console.log("[Checkout] Transaction Success!");
// //       return newOrder;
// //     }, {
// //       timeout: 15000 // 15 seconds
// //     });

// //     // 4. Handle COD Success Flow
// //     if (addressData.paymentMethod === 'COD') {
// //       await db.cartItem.deleteMany({ where: { cartId: cart.id } });

// //       const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
// //       const invNum = generateInvoiceNumber(created.id);
// //       await db.order.update({
// //           where: { id: created.id },
// //           data: { invoiceNumber: invNum }
// //       });

// //       const { createNotification } = await import('./notifications');
// //       const orderWithItems = await db.order.findUnique({
// //           where: { id: created.id },
// //           include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
// //       });

// //       const notifiedSellers = new Set();
// //       for (const item of orderWithItems.items) {
// //           let sellerUserId = null;
// //           if (item.product.sellerType === 'farmer' && item.product.farmer) sellerUserId = item.product.farmer.userId;
// //           else if (item.product.sellerType === 'agent' && item.product.agent) sellerUserId = item.product.agent.userId;

// //           if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
// //               notifiedSellers.add(sellerUserId);
// //               await createNotification({
// //                   userId: sellerUserId,
// //                   type: 'ORDER_RECEIVED',
// //                   title: 'New COD Order Received!',
// //                   message: `You have a new order #${created.id.slice(-8)}. Please process it.`,
// //                   linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
// //               });
// //           }
// //       }

// //       return { success: true, data: { orderId: created.id, isCod: true } };
// //     }

// //     // 5. Razorpay Online Flow
// //     const amountInPaise = Math.round(total * 100);
// //     const razorpayKey = process.env.RAZORPAY_KEY_ID;
// //     const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

// //     if (!razorpayKey || !razorpaySecret) {
// //       return { success: false, error: "Razorpay keys not configured" };
// //     }

// //     const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
// //     const response = await fetch("https://api.razorpay.com/v1/orders", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
// //       body: JSON.stringify({
// //         amount: amountInPaise,
// //         currency: "INR",
// //         receipt: created.id,
// //         payment_capture: 1,
// //       })
// //     });

// //     if (!response.ok) {
// //       return { success: false, error: "Failed to create Razorpay order" };
// //     }

// //     const razorpayOrder = await response.json();
// //     await db.order.update({
// //       where: { id: created.id },
// //       data: { razorpayOrderId: razorpayOrder.id }
// //     });

// //     return {
// //       success: true,
// //       data: { orderId: created.id, razorpayOrderId: razorpayOrder.id, amount: amountInPaise }
// //     };

// //   } catch (err) {
// //     console.error("initiateCheckout CRITICAL error:", err);
// //     // Return the actual error message to help debugging
// //     return { 
// //       success: false, 
// //       error: err instanceof Error ? err.message : "Checkout initiation failed. Please try again." 
// //     };
// //   }
// // }

// // // --- NEW: Confirm Order Payment ---
// // export async function confirmOrderPayment({ orderId, razorpayPaymentId, razorpayOrderId, signature }) {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     // 1. Verify Payment Signature (MANDATORY)
// //     if (!signature || !razorpayPaymentId || !razorpayOrderId) {
// //       return { success: false, error: "Missing payment verification details" };
// //     }

// //     const crypto = await import('crypto');
// //     const key = process.env.RAZORPAY_KEY_SECRET || '';
// //     const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
// //     const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');

// //     if (expected !== signature) {
// //       return { success: false, error: 'Invalid payment signature' };
// //     }

// //     // 2. Atomic Transaction: Update Order + Decrement Stock + Clear Cart
// //     const result = await db.$transaction(async (tx) => {
// //       const ord = await tx.order.findUnique({
// //         where: { id: orderId },
// //         include: { items: { include: { product: true } } }
// //       });

// //       if (!ord) throw new Error("Order not found");

// //       // CRITICAL: Ownership Check
// //       if (ord.buyerId !== user.id) {
// //           throw new Error("Unauthorized: You do not own this order.");
// //       }

// //       if (ord.paymentStatus === 'PAID') return { success: true, message: "Already paid" };

// //       // EXPIRED GUARD: Prevent processing if order session has timed out
// //       if (ord.expiresAt && new Date() > ord.expiresAt) {
// //           throw new Error("Order session has expired and reserved stock may have been released. Please start a new checkout.");
// //       }

// //       // (Stock was already decremented during initiateCheckout to reserve it)

// //       const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
// //       const invoiceNumber = generateInvoiceNumber(orderId);

// //       const updatedOrder = await tx.order.update({
// //         where: { id: orderId },
// //         data: {
// //           paymentStatus: 'PAID',
// //           orderStatus: 'PROCESSING',
// //           invoiceNumber,
// //           razorpayOrderId,
// //           razorpayPaymentId,
// //           expiresAt: null // Payment received, clear expiration
// //         }
// //       });

// //       // Clear cart
// //       const cart = await tx.cart.findUnique({ where: { userId: user.id } });
// //       if (cart) {
// //         await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
// //       }

// //       return updatedOrder;
// //     }, {
// //       timeout: 15000 // 15 seconds
// //     });

// //     // 3. Notifications (Async)
// //     const { createNotification } = await import('./notifications');
// //     const orderWithSellers = await db.order.findUnique({
// //       where: { id: orderId },
// //       include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
// //     });

// //     const notifiedSellers = new Set();
// //     for (const item of orderWithSellers.items) {
// //       const sellerUserId = item.product.farmer?.userId || item.product.agent?.userId;
// //       if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
// //         notifiedSellers.add(sellerUserId);
// //         await createNotification({
// //           userId: sellerUserId,
// //           type: 'ORDER_RECEIVED',
// //           title: 'New Order Received!',
// //           message: `Order #${orderId.slice(-8)} is paid. Please process shipping.`,
// //           linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
// //         });
// //       }
// //     }

// //     revalidatePath('/cart');
// //     revalidatePath('/my-orders');
// //     revalidatePath('/farmer-dashboard/sales');
// //     revalidatePath('/agent-dashboard/sales');

// //     return { success: true };

// //   } catch (err) {
// //     console.error('confirmOrderPayment Error:', err);
// //     return { success: false, error: err.message || 'Payment confirmation failed' };
// //   }
// // }


// // "use server";

// // import { currentUser } from "@clerk/nextjs/server";
// // import { db } from "@/lib/prisma";
// // import { revalidatePath } from "next/cache";
// // import { cache } from "react";

// // export const getSellerSales = cache(async () => {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     const dbUser = await db.user.findUnique({
// //       where: { id: user.id },
// //       include: { farmerProfile: true, agentProfile: true }
// //     });

// //     if (!dbUser) return { success: false, error: "User not found" };

// //     let whereClause = {};

// //     // Determine if user is Farmer or Agent to filter their products
// //     if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
// //       whereClause = {
// //         product: { farmerId: dbUser.farmerProfile.id },
// //         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
// //       };
// //     } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
// //       whereClause = {
// //         product: { agentId: dbUser.agentProfile.id },
// //         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
// //       };
// //     } else {
// //       return { success: false, data: [] };
// //     }

// //     // Find all OrderItems linked to this seller's products
// //     const sales = await db.orderItem.findMany({
// //       where: whereClause,
// //       include: {
// //         product: true,
// //         order: {
// //           include: {
// //             buyerUser: {
// //               select: {
// //                 email: true,
// //                 farmerProfile: { select: { name: true } },
// //                 agentProfile: { select: { name: true } }
// //               }
// //             }
// //           }
// //         }
// //       },
// //       orderBy: { order: { createdAt: 'desc' } }
// //     });

// //     return { success: true, data: sales };

// //   } catch (err) {
// //     console.error("Get Sales Error:", err);
// //     return { success: false, error: "Failed to fetch sales data" };
// //   }
// // });

// // export const getBuyerOrders = cache(async () => {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     const orders = await db.order.findMany({
// //       where: {
// //         buyerId: user.id,
// //         // Show both PAID and PENDING so users don't see an empty screen if confirmation lags
// //         paymentStatus: { in: ['PAID', 'PENDING'] }
// //       },
// //       include: {
// //         buyerUser: {
// //           include: {
// //             farmerProfile: { select: { name: true, phone: true, address: true } },
// //             agentProfile: { select: { name: true, phone: true, companyName: true } }
// //           }
// //         },
// //         items: {
// //           include: {
// //             product: {
// //               include: {
// //                 farmer: { select: { name: true, phone: true, address: true, lat: true, lng: true } },
// //                 agent: { select: { name: true, phone: true, companyName: true, lat: true, lng: true } }
// //               }
// //             }
// //           }
// //         },
// //         deliveryJobs: {
// //           include: {
// //             deliveryBoy: {
// //               select: {
// //                 id: true,
// //                 name: true,
// //                 phone: true,
// //                 vehicleType: true,
// //                 averageRating: true,
// //                 isOnline: true,
// //                 lat: true,
// //                 lng: true
// //               }
// //             }
// //           }
// //         },
// //         tracking: {
// //           orderBy: { createdAt: 'desc' }
// //         }
// //       },
// //       orderBy: { createdAt: 'desc' }
// //     });

// //     return { success: true, data: orders };

// //   } catch (err) {
// //     console.error("Get Orders Error:", err);
// //     return { success: false, error: "Failed to fetch orders" };
// //   }
// // });

// // export async function initiateCheckout(addressData) {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   if (!addressData || !addressData.address || !addressData.phone || !addressData.name) {
// //     return { success: false, error: "Shipping details are mandatory" };
// //   }

// //   try {
// //     const cart = await db.cart.findUnique({
// //       where: { userId: user.id },
// //       include: { items: { include: { product: true } } }
// //     });

// //     if (!cart || cart.items.length === 0) {
// //       return { success: false, error: "Cart is empty" };
// //     }

// //     const dbUser = await db.user.findUnique({
// //       where: { id: user.id },
// //       include: { farmerProfile: true, agentProfile: true }
// //     });

// //     for (const it of cart.items) {
// //       const p = it.product;

// //       if (dbUser.farmerProfile && p.farmerId === dbUser.farmerProfile.id) {
// //         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
// //       }
// //       if (dbUser.agentProfile && p.agentId === dbUser.agentProfile.id) {
// //         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
// //       }

// //       const minQty = p.minOrderQuantity || 1;
// //       if (it.quantity < minQty) {
// //         return { success: false, error: `Error: ${p.productName} requires a minimum order of ${minQty} ${p.unit}.` };
// //       }
// //     }

// //     const cartFingerprint = cart.items.map(it => `${it.productId}:${it.quantity}`).sort().join("|");
// //     const idempotencyId = `ord_${user.id.slice(-8)}_${Buffer.from(cartFingerprint).toString('base64').slice(0, 16)}`;

// //     const productSubtotal = cart.items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
// //     const deliveryTotal = cart.items.reduce((sum, it) => {
// //       if (it.product.deliveryChargeType === 'per_unit') {
// //         return sum + (it.quantity * (it.product.deliveryCharge || 0));
// //       }
// //       return sum + (it.product.deliveryCharge || 0);
// //     }, 0);

// //     const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
// //     const platformFee = Math.round(cart.items.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));
// //     const total = productSubtotal + deliveryTotal + platformFee;

// //     if (!Number.isFinite(total) || total > 100000000) {
// //       return { success: false, error: "Order total exceeds system limits." };
// //     }

// //     const created = await db.$transaction(async (tx) => {
// //       const existing = await tx.order.findUnique({
// //         where: { id: idempotencyId }
// //       });

// //       // Resumption Logic (Network Drops / Retries)
// //       if (existing) {
// //         if (existing.paymentStatus === 'PAID') {
// //           throw new Error("Order already exists and is paid. Please check your orders page.");
// //         }
// //         if (existing.paymentMethod === 'COD') {
// //           return existing;
// //         }
// //         // Safely update timestamps to resume
// //         const updated = await tx.order.update({
// //           where: { id: existing.id },
// //           data: {
// //             createdAt: new Date(),
// //             expiresAt: new Date(Date.now() + 30 * 60 * 1000)
// //           }
// //         });
// //         return updated;
// //       }

// //       const newOrder = await tx.order.create({
// //         data: {
// //           id: idempotencyId,
// //           buyerId: user.id,
// //           totalAmount: total,
// //           platformFee: platformFee,
// //           deliveryFee: deliveryTotal,
// //           sellerAmount: Math.max(0, productSubtotal - platformFee),
// //           paymentStatus: "PENDING",
// //           orderStatus: "PROCESSING",
// //           paymentMethod: addressData.paymentMethod || "ONLINE",
// //           shippingAddress: addressData.address,
// //           lat: addressData.lat,
// //           lng: addressData.lng,
// //           buyerPhone: addressData.phone,
// //           buyerName: addressData.name,
// //           expiresAt: new Date(Date.now() + 30 * 60 * 1000)
// //         }
// //       });

// //       for (const it of cart.items) {
// //         let sellerId = it.product.farmerId || it.product.agentId;
// //         let sellerType = it.product.sellerType;
// //         let sellerName = "Seller";

// //         if (sellerType === 'farmer') {
// //           const f = await tx.farmerProfile.findUnique({ where: { id: it.product.farmerId }, select: { name: true } });
// //           if (f) sellerName = f.name;
// //         } else {
// //           const a = await tx.agentProfile.findUnique({ where: { id: it.product.agentId }, select: { name: true, companyName: true } });
// //           if (a) sellerName = a.companyName || a.name;
// //         }

// //         await tx.orderItem.create({
// //           data: {
// //             orderId: newOrder.id,
// //             productId: it.productId,
// //             quantity: it.quantity,
// //             priceAtPurchase: it.product.pricePerUnit,
// //             deliveryChargeAtPurchase: it.product.deliveryCharge || 0,
// //             deliveryChargeTypeAtPurchase: it.product.deliveryChargeType || 'per_unit',
// //             sellerId,
// //             sellerType,
// //             sellerName
// //           }
// //         });

// //         const updateResult = await tx.productListing.updateMany({
// //           where: {
// //             id: it.productId,
// //             availableStock: { gte: it.quantity }
// //           },
// //           data: {
// //             availableStock: { decrement: it.quantity }
// //           }
// //         });

// //         if (updateResult.count === 0) {
// //           throw new Error(`Insufficient stock for ${it.product.productName}`);
// //         }
// //       }
// //       return newOrder;
// //     }, {
// //       timeout: 15000
// //     });

// //     // Handle COD Success Flow
// //     if (addressData.paymentMethod === 'COD') {
// //       await db.cartItem.deleteMany({ where: { cartId: cart.id } });

// //       let invNum = created.invoiceNumber;
// //       if (!invNum) {
// //         try {
// //           const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
// //           // Awaiting ensures we don't accidentally save "[object Promise]"
// //           const generated = await generateInvoiceNumber(created.id);
// //           if (generated && typeof generated === 'string') invNum = generated;
// //         } catch (e) {
// //           console.error("Custom generator error:", e);
// //         }

// //         // Absolute Uniqueness Fallback to prevent P2002
// //         if (!invNum) {
// //           const crypto = await import('crypto');
// //           invNum = `INV-${created.id.slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
// //         }

// //         await db.order.update({
// //           where: { id: created.id },
// //           data: { invoiceNumber: invNum }
// //         });
// //       }

// //       const { createNotification } = await import('./notifications');
// //       const orderWithItems = await db.order.findUnique({
// //         where: { id: created.id },
// //         include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
// //       });

// //       const notifiedSellers = new Set();
// //       for (const item of orderWithItems.items) {
// //         let sellerUserId = null;
// //         if (item.product.sellerType === 'farmer' && item.product.farmer) sellerUserId = item.product.farmer.userId;
// //         else if (item.product.sellerType === 'agent' && item.product.agent) sellerUserId = item.product.agent.userId;

// //         if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
// //           notifiedSellers.add(sellerUserId);
// //           await createNotification({
// //             userId: sellerUserId,
// //             type: 'ORDER_RECEIVED',
// //             title: 'New COD Order Received!',
// //             message: `You have a new order #${created.id.slice(-8)}. Please process it.`,
// //             linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
// //           });
// //         }
// //       }

// //       return { success: true, data: { orderId: created.id, isCod: true } };
// //     }

// //     // Razorpay Online Flow
// //     const amountInPaise = Math.round(total * 100);
// //     const razorpayKey = process.env.RAZORPAY_KEY_ID;
// //     const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

// //     if (!razorpayKey || !razorpaySecret) {
// //       return { success: false, error: "Razorpay keys not configured" };
// //     }

// //     const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
// //     const response = await fetch("https://api.razorpay.com/v1/orders", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
// //       body: JSON.stringify({
// //         amount: amountInPaise,
// //         currency: "INR",
// //         receipt: created.id,
// //         payment_capture: 1,
// //       })
// //     });

// //     if (!response.ok) {
// //       return { success: false, error: "Failed to create Razorpay order" };
// //     }

// //     const razorpayOrder = await response.json();
// //     await db.order.update({
// //       where: { id: created.id },
// //       data: { razorpayOrderId: razorpayOrder.id }
// //     });

// //     return {
// //       success: true,
// //       data: { orderId: created.id, razorpayOrderId: razorpayOrder.id, amount: amountInPaise }
// //     };

// //   } catch (err) {
// //     console.error("initiateCheckout CRITICAL error:", err);
// //     return {
// //       success: false,
// //       error: err instanceof Error ? err.message : "Checkout initiation failed. Please try again."
// //     };
// //   }
// // }

// // export async function confirmOrderPayment({ orderId, razorpayPaymentId, razorpayOrderId, signature }) {
// //   const user = await currentUser();
// //   if (!user) return { success: false, error: "Not logged in" };

// //   try {
// //     if (!signature || !razorpayPaymentId || !razorpayOrderId) {
// //       return { success: false, error: "Missing payment verification details" };
// //     }

// //     const crypto = await import('crypto');
// //     const key = process.env.RAZORPAY_KEY_SECRET || '';
// //     const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
// //     const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');

// //     if (expected !== signature) {
// //       return { success: false, error: 'Invalid payment signature' };
// //     }

// //     // Atomic Transaction: Read -> Generate -> Update
// //     const result = await db.$transaction(async (tx) => {
// //       const ord = await tx.order.findUnique({
// //         where: { id: orderId },
// //         include: { items: { include: { product: true } } }
// //       });

// //       if (!ord) throw new Error("Order not found");

// //       if (ord.buyerId !== user.id) {
// //         throw new Error("Unauthorized: You do not own this order.");
// //       }

// //       // Safe Webhook Interceptor: If already paid, safely exit returning success
// //       if (ord.paymentStatus === 'PAID') {
// //         return { status: "ALREADY_PAID" };
// //       }

// //       if (ord.expiresAt && new Date() > ord.expiresAt) {
// //         throw new Error("Order session has expired. Please start a new checkout.");
// //       }

// //       // Safe, P2002-proof Invoice Generation
// //       let invoiceNumber = ord.invoiceNumber;

// //       if (!invoiceNumber) {
// //         try {
// //           const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
// //           const generated = await generateInvoiceNumber(orderId);
// //           if (generated && typeof generated === 'string') invoiceNumber = generated;
// //         } catch (e) {
// //           console.error("Custom generator error:", e);
// //         }

// //         // Absolute Uniqueness Fallback
// //         if (!invoiceNumber) {
// //           invoiceNumber = `INV-${orderId.slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
// //         }
// //       }

// //       // Standard update() ensures NO state inconsistency
// //       await tx.order.update({
// //         where: { id: orderId },
// //         data: {
// //           paymentStatus: 'PAID',
// //           orderStatus: 'PROCESSING',
// //           invoiceNumber,
// //           razorpayOrderId,
// //           razorpayPaymentId,
// //           expiresAt: null
// //         }
// //       });

// //       const cart = await tx.cart.findUnique({ where: { userId: user.id } });
// //       if (cart) {
// //         await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
// //       }

// //       return { status: "SUCCESS" };
// //     }, {
// //       timeout: 15000
// //     });

// //     if (result.status === "ALREADY_PAID") return { success: true };

// //     // Notifications (Async)
// //     const { createNotification } = await import('./notifications');
// //     const orderWithSellers = await db.order.findUnique({
// //       where: { id: orderId },
// //       include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
// //     });

// //     const notifiedSellers = new Set();
// //     for (const item of orderWithSellers.items) {
// //       const sellerUserId = item.product.farmer?.userId || item.product.agent?.userId;
// //       if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
// //         notifiedSellers.add(sellerUserId);
// //         await createNotification({
// //           userId: sellerUserId,
// //           type: 'ORDER_RECEIVED',
// //           title: 'New Order Received!',
// //           message: `Order #${orderId.slice(-8)} is paid. Please process shipping.`,
// //           linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
// //         });
// //       }
// //     }

// //     revalidatePath('/cart');
// //     revalidatePath('/my-orders');
// //     revalidatePath('/farmer-dashboard/sales');
// //     revalidatePath('/agent-dashboard/sales');

// //     return { success: true };

// //   } catch (err) {
// //     // Ultimate Safety Net: If a duplicate webhook manages to throw a P2002 despite all protections, 
// //     // it means the order is already fully processed. We catch it and return success gracefully.
// //     if (err.code === 'P2002') {
// //       console.warn(`Concurrent request intercepted for Order ${orderId}. Safely resolving.`);
// //       return { success: true };
// //     }

// //     console.error('confirmOrderPayment Error:', err);
// //     return { success: false, error: err.message || 'Payment confirmation failed' };
// //   }
// // }



// "use server";

// import { currentUser } from "@clerk/nextjs/server";
// import { db } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { cache } from "react";

// export const getSellerSales = cache(async () => {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     const dbUser = await db.user.findUnique({
//       where: { id: user.id },
//       include: { farmerProfile: true, agentProfile: true }
//     });

//     if (!dbUser) return { success: false, error: "User not found" };

//     let whereClause = {};

//     // Determine if user is Farmer or Agent to filter their products
//     if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
//       whereClause = {
//         product: { farmerId: dbUser.farmerProfile.id },
//         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
//       };
//     } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
//       whereClause = {
//         product: { agentId: dbUser.agentProfile.id },
//         order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
//       };
//     } else {
//       return { success: false, data: [] };
//     }

//     // Find all OrderItems linked to this seller's products
//     const sales = await db.orderItem.findMany({
//       where: whereClause,
//       include: {
//         product: true,
//         order: {
//           include: {
//             buyerUser: {
//               select: {
//                 email: true,
//                 farmerProfile: { select: { name: true } },
//                 agentProfile: { select: { name: true } }
//               }
//             }
//           }
//         }
//       },
//       orderBy: { order: { createdAt: 'desc' } }
//     });

//     return { success: true, data: sales };

//   } catch (err) {
//     console.error("Get Sales Error:", err);
//     return { success: false, error: "Failed to fetch sales data" };
//   }
// });

// export const getBuyerOrders = cache(async () => {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     const orders = await db.order.findMany({
//       where: {
//         buyerId: user.id,
//         // Show both PAID and PENDING so users don't see an empty screen if confirmation lags
//         paymentStatus: { in: ['PAID', 'PENDING'] }
//       },
//       include: {
//         buyerUser: {
//           include: {
//             farmerProfile: { select: { name: true, phone: true, address: true } },
//             agentProfile: { select: { name: true, phone: true, companyName: true } }
//           }
//         },
//         items: {
//           include: {
//             product: {
//               include: {
//                 farmer: { select: { name: true, phone: true, address: true, lat: true, lng: true } },
//                 agent: { select: { name: true, phone: true, companyName: true, lat: true, lng: true } }
//               }
//             }
//           }
//         },
//         deliveryJobs: {
//           include: {
//             deliveryBoy: {
//               select: {
//                 id: true,
//                 name: true,
//                 phone: true,
//                 vehicleType: true,
//                 // averageRating removed to fix the Prisma validation error
//                 isOnline: true,
//                 lat: true,
//                 lng: true
//               }
//             }
//           }
//         },
//         tracking: {
//           orderBy: { createdAt: 'desc' }
//         }
//       },
//       orderBy: { createdAt: 'desc' }
//     });

//     return { success: true, data: orders };

//   } catch (err) {
//     console.error("Get Orders Error:", err);
//     return { success: false, error: "Failed to fetch orders" };
//   }
// });

// export async function initiateCheckout(addressData) {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   if (!addressData || !addressData.address || !addressData.phone || !addressData.name) {
//     return { success: false, error: "Shipping details are mandatory" };
//   }

//   try {
//     console.log(`[Checkout] Starting for user ${user.id}`);

//     // 1. Fetch cart and perform PRE-CHECK for stock
//     const cart = await db.cart.findUnique({
//       where: { userId: user.id },
//       include: { items: { include: { product: true } } }
//     });

//     if (!cart || cart.items.length === 0) {
//       console.log(`[Checkout] Cart empty for user ${user.id}`);
//       return { success: false, error: "Cart is empty" };
//     }

//     // ─── FINAL SECURITY CHECK: NO SELF-PURCHASE ───
//     const dbUser = await db.user.findUnique({
//       where: { id: user.id },
//       include: { farmerProfile: true, agentProfile: true }
//     });

//     for (const it of cart.items) {
//       const p = it.product;

//       if (dbUser.farmerProfile && p.farmerId === dbUser.farmerProfile.id) {
//         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
//       }
//       if (dbUser.agentProfile && p.agentId === dbUser.agentProfile.id) {
//         return { success: false, error: `Critical: ${p.productName} is your own product. You cannot purchase it.` };
//       }

//       const minQty = p.minOrderQuantity || 1;
//       if (it.quantity < minQty) {
//         return { success: false, error: `Error: ${p.productName} requires a minimum order of ${minQty} ${p.unit}.` };
//       }
//     }

//     // ─── THE ULTIMATE IDEMPOTENCY GUARD ───
//     const cartFingerprint = cart.items.map(it => `${it.productId}:${it.quantity}`).sort().join("|");
//     const idempotencyId = `ord_${user.id.slice(-8)}_${Buffer.from(cartFingerprint).toString('base64').slice(0, 16)}`;

//     // 3. STOCK VALIDATION (Pre-check)
//     const productSubtotal = cart.items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
//     const deliveryTotal = cart.items.reduce((sum, it) => {
//       if (it.product.deliveryChargeType === 'per_unit') {
//         return sum + (it.quantity * (it.product.deliveryCharge || 0));
//       }
//       return sum + (it.product.deliveryCharge || 0);
//     }, 0);

//     const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
//     const platformFee = Math.round(cart.items.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));
//     const total = productSubtotal + deliveryTotal + platformFee;

//     if (!Number.isFinite(total) || total > 100000000) {
//       return { success: false, error: "Order total exceeds system limits." };
//     }

//     console.log(`[Checkout] Validation passed. Idempotency ID: ${idempotencyId}`);

//     // 3. Transaction: create order + order items
//     const created = await db.$transaction(async (tx) => {
//       console.log("[Checkout] Transaction Started...");
//       const existing = await tx.order.findUnique({
//         where: { id: idempotencyId }
//       });

//       // Resumption Logic (Network Drops / Retries)
//       if (existing) {
//         console.log("[Checkout] Order exists. Checking payment status for resumption...");
//         if (existing.paymentStatus === 'PAID') {
//           throw new Error("Order already exists and is paid. Please check your orders page.");
//         }
//         if (existing.paymentMethod === 'COD') {
//           return existing;
//         }
//         // Safely update timestamps to resume
//         const updated = await tx.order.update({
//           where: { id: existing.id },
//           data: {
//             createdAt: new Date(),
//             expiresAt: new Date(Date.now() + 30 * 60 * 1000)
//           }
//         });
//         console.log("[Checkout] Resumed and refreshed existing pending order.");
//         return updated;
//       }

//       console.log("[Checkout] Creating Order Record...");
//       const newOrder = await tx.order.create({
//         data: {
//           id: idempotencyId,
//           buyerId: user.id,
//           totalAmount: total,
//           platformFee: platformFee,
//           deliveryFee: deliveryTotal,
//           sellerAmount: Math.max(0, productSubtotal - platformFee),
//           paymentStatus: addressData.paymentMethod === 'COD' ? 'PENDING' : "PENDING",
//           orderStatus: "PROCESSING",
//           paymentMethod: addressData.paymentMethod || "ONLINE",
//           shippingAddress: addressData.address,
//           lat: addressData.lat,
//           lng: addressData.lng,
//           buyerPhone: addressData.phone,
//           buyerName: addressData.name,
//           expiresAt: new Date(Date.now() + 30 * 60 * 1000)
//         }
//       });

//       for (const it of cart.items) {
//         console.log(`[Checkout] Processing Item: ${it.productId}`);
//         let sellerId = it.product.farmerId || it.product.agentId;
//         let sellerType = it.product.sellerType;
//         let sellerName = "Seller";

//         if (sellerType === 'farmer') {
//           const f = await tx.farmerProfile.findUnique({ where: { id: it.product.farmerId }, select: { name: true } });
//           if (f) sellerName = f.name;
//         } else {
//           const a = await tx.agentProfile.findUnique({ where: { id: it.product.agentId }, select: { name: true, companyName: true } });
//           if (a) sellerName = a.companyName || a.name;
//         }

//         await tx.orderItem.create({
//           data: {
//             orderId: newOrder.id,
//             productId: it.productId,
//             quantity: it.quantity,
//             priceAtPurchase: it.product.pricePerUnit,
//             deliveryChargeAtPurchase: it.product.deliveryCharge || 0,
//             deliveryChargeTypeAtPurchase: it.product.deliveryChargeType || 'per_unit',
//             sellerId,
//             sellerType,
//             sellerName
//           }
//         });

//         console.log(`[Checkout] Decrementing Stock for: ${it.productId}`);
//         const updateResult = await tx.productListing.updateMany({
//           where: {
//             id: it.productId,
//             availableStock: { gte: it.quantity }
//           },
//           data: {
//             availableStock: { decrement: it.quantity }
//           }
//         });

//         if (updateResult.count === 0) {
//           console.log(`[Checkout] Stock failure for: ${it.productId}`);
//           throw new Error(`Insufficient stock for ${it.product.productName}`);
//         }
//       }
//       console.log("[Checkout] Transaction Success!");
//       return newOrder;
//     }, {
//       timeout: 15000
//     });

//     // 4. Handle COD Success Flow
//     if (addressData.paymentMethod === 'COD') {
//       await db.cartItem.deleteMany({ where: { cartId: cart.id } });

//       let invNum = created.invoiceNumber;
//       if (!invNum) {
//         try {
//           const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
//           // Awaiting ensures we don't accidentally save "[object Promise]"
//           const generated = await generateInvoiceNumber(created.id);
//           if (generated && typeof generated === 'string') invNum = generated;
//         } catch (e) {
//           console.error("Custom generator error:", e);
//         }

//         // Absolute Uniqueness Fallback to prevent P2002
//         if (!invNum) {
//           const crypto = await import('crypto');
//           invNum = `INV-${created.id.slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
//         }

//         await db.order.update({
//           where: { id: created.id },
//           data: { invoiceNumber: invNum }
//         });
//       }

//       const { createNotification } = await import('./notifications');
//       const orderWithItems = await db.order.findUnique({
//         where: { id: created.id },
//         include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
//       });

//       const notifiedSellers = new Set();
//       for (const item of orderWithItems.items) {
//         let sellerUserId = null;
//         if (item.product.sellerType === 'farmer' && item.product.farmer) sellerUserId = item.product.farmer.userId;
//         else if (item.product.sellerType === 'agent' && item.product.agent) sellerUserId = item.product.agent.userId;

//         if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
//           notifiedSellers.add(sellerUserId);
//           await createNotification({
//             userId: sellerUserId,
//             type: 'ORDER_RECEIVED',
//             title: 'New COD Order Received!',
//             message: `You have a new order #${created.id.slice(-8)}. Please process it.`,
//             linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
//           });
//         }
//       }

//       return { success: true, data: { orderId: created.id, isCod: true } };
//     }

//     // 5. Razorpay Online Flow
//     const amountInPaise = Math.round(total * 100);
//     const razorpayKey = process.env.RAZORPAY_KEY_ID;
//     const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

//     if (!razorpayKey || !razorpaySecret) {
//       return { success: false, error: "Razorpay keys not configured" };
//     }

//     const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString("base64");
//     const response = await fetch("https://api.razorpay.com/v1/orders", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
//       body: JSON.stringify({
//         amount: amountInPaise,
//         currency: "INR",
//         receipt: created.id,
//         payment_capture: 1,
//       })
//     });

//     if (!response.ok) {
//       return { success: false, error: "Failed to create Razorpay order" };
//     }

//     const razorpayOrder = await response.json();
//     await db.order.update({
//       where: { id: created.id },
//       data: { razorpayOrderId: razorpayOrder.id }
//     });

//     return {
//       success: true,
//       data: { orderId: created.id, razorpayOrderId: razorpayOrder.id, amount: amountInPaise }
//     };

//   } catch (err) {
//     console.error("initiateCheckout CRITICAL error:", err);
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : "Checkout initiation failed. Please try again."
//     };
//   }
// }

// export async function confirmOrderPayment({ orderId, razorpayPaymentId, razorpayOrderId, signature }) {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     if (!signature || !razorpayPaymentId || !razorpayOrderId) {
//       return { success: false, error: "Missing payment verification details" };
//     }

//     const crypto = await import('crypto');
//     const key = process.env.RAZORPAY_KEY_SECRET || '';
//     const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
//     const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');

//     if (expected !== signature) {
//       return { success: false, error: 'Invalid payment signature' };
//     }

//     // Atomic Transaction: Read -> Generate -> Update
//     const result = await db.$transaction(async (tx) => {
//       const ord = await tx.order.findUnique({
//         where: { id: orderId },
//         include: { items: { include: { product: true } } }
//       });

//       if (!ord) throw new Error("Order not found");

//       if (ord.buyerId !== user.id) {
//         throw new Error("Unauthorized: You do not own this order.");
//       }

//       // Safe Webhook Interceptor: If already paid, safely exit returning success
//       if (ord.paymentStatus === 'PAID') {
//         return { status: "ALREADY_PAID" };
//       }

//       if (ord.expiresAt && new Date() > ord.expiresAt) {
//         throw new Error("Order session has expired. Please start a new checkout.");
//       }

//       // Safe, P2002-proof Invoice Generation
//       let invoiceNumber = ord.invoiceNumber;

//       if (!invoiceNumber) {
//         try {
//           const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
//           const generated = await generateInvoiceNumber(orderId);
//           if (generated && typeof generated === 'string') invoiceNumber = generated;
//         } catch (e) {
//           console.error("Custom generator error:", e);
//         }

//         // Absolute Uniqueness Fallback
//         if (!invoiceNumber) {
//           invoiceNumber = `INV-${orderId.slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
//         }
//       }

//       // Standard update() ensures NO state inconsistency
//       await tx.order.update({
//         where: { id: orderId },
//         data: {
//           paymentStatus: 'PAID',
//           orderStatus: 'PROCESSING',
//           invoiceNumber,
//           razorpayOrderId,
//           razorpayPaymentId,
//           expiresAt: null
//         }
//       });

//       const cart = await tx.cart.findUnique({ where: { userId: user.id } });
//       if (cart) {
//         await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
//       }

//       return { status: "SUCCESS" };
//     }, {
//       timeout: 15000
//     });

//     if (result.status === "ALREADY_PAID") return { success: true };

//     // Notifications (Async)
//     const { createNotification } = await import('./notifications');
//     const orderWithSellers = await db.order.findUnique({
//       where: { id: orderId },
//       include: { items: { include: { product: { include: { farmer: true, agent: true } } } } }
//     });

//     const notifiedSellers = new Set();
//     for (const item of orderWithSellers.items) {
//       const sellerUserId = item.product.farmer?.userId || item.product.agent?.userId;
//       if (sellerUserId && !notifiedSellers.has(sellerUserId)) {
//         notifiedSellers.add(sellerUserId);
//         await createNotification({
//           userId: sellerUserId,
//           type: 'ORDER_RECEIVED',
//           title: 'New Order Received!',
//           message: `Order #${orderId.slice(-8)} is paid. Please process shipping.`,
//           linkUrl: item.product.sellerType === 'farmer' ? '/farmer-dashboard/sales' : '/agent-dashboard/sales'
//         });
//       }
//     }

//     revalidatePath('/cart');
//     revalidatePath('/my-orders');
//     revalidatePath('/farmer-dashboard/sales');
//     revalidatePath('/agent-dashboard/sales');

//     return { success: true };

//   } catch (err) {
//     // Ultimate Safety Net: If a duplicate webhook manages to throw a P2002 despite all protections, 
//     // it means the order is already fully processed. We catch it and return success gracefully.
//     if (err.code === 'P2002') {
//       console.warn(`Concurrent request intercepted for Order ${orderId}. Safely resolving.`);
//       return { success: true };
//     }

//     console.error('confirmOrderPayment Error:', err);
//     return { success: false, error: err.message || 'Payment confirmation failed' };
//   }
// }


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
        order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
      };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      whereClause = {
        product: { agentId: dbUser.agentProfile.id },
        order: { paymentStatus: { in: ['PAID', 'PENDING'] } }
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
        // Show both PAID and PENDING so users don't see an empty screen if confirmation lags
        paymentStatus: { in: ['PAID', 'PENDING'] }
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

export async function initiateCheckout(addressData) {
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

    for (const it of cart.items) {
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

    // Deterministic Idempotency Key
    const cartFingerprint = cart.items.map(it => `${it.productId}:${it.quantity}`).sort().join("|");
    const idempotencyId = `ord_${user.id.slice(-8)}_${Buffer.from(cartFingerprint).toString('base64').slice(0, 16)}`;

    // STOCK VALIDATION & CALCULATION
    const productSubtotal = cart.items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    const deliveryTotal = cart.items.reduce((sum, it) => {
      if (it.product.deliveryChargeType === 'per_unit') {
        return sum + (it.quantity * (it.product.deliveryCharge || 0));
      }
      return sum + (it.product.deliveryCharge || 0);
    }, 0);

    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    const platformFee = Math.round(cart.items.reduce((sum, it) => sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0));
    const total = productSubtotal + deliveryTotal + platformFee;

    if (!Number.isFinite(total) || total > 100000000) {
      return { success: false, error: "Order total exceeds system limits." };
    }

    const created = await db.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: idempotencyId }
      });

      // Resumption Logic
      if (existing) {
        if (existing.paymentStatus === 'PAID') {
          throw new Error("Order already exists and is paid. Please check your orders page.");
        }
        if (existing.paymentMethod === 'COD') {
          return existing;
        }
        // Safely update timestamps to resume
        const updated = await tx.order.update({
          where: { id: existing.id },
          data: {
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
          }
        });
        return updated;
      }

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

      for (const it of cart.items) {
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
      timeout: 15000
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
            invNum = `${generated}-${entropy}`; // Added Entropy prevents collisions
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

      return { success: true, data: { orderId: created.id, isCod: true } };
    }

    // Razorpay Online Flow
    const amountInPaise = Math.round(total * 100);
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      return { success: false, error: "Razorpay keys not configured" };
    }

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

    if (!response.ok) {
      return { success: false, error: "Failed to create Razorpay order" };
    }

    const razorpayOrder = await response.json();
    await db.order.update({
      where: { id: created.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    return {
      success: true,
      data: { orderId: created.id, razorpayOrderId: razorpayOrder.id, amount: amountInPaise }
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
            invoiceNumber = `${generated}-${entropy}`; // Added Entropy prevents P2002 rollbacks
          }
        } catch (e) {
          console.error("Custom generator error:", e);
        }

        if (!invoiceNumber) {
          invoiceNumber = `INV-${orderId.slice(-6).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        }
      }

      // Safe Update: Cannot fail due to collision now
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

    return { success: true };

  } catch (err) {
    // Truth-Telling Safety Net: If a P2002 STILL happens somehow, check the database.
    if (err.code === 'P2002') {
      const checkOrd = await db.order.findUnique({ where: { id: orderId } });
      if (checkOrd?.paymentStatus === 'PAID') {
        console.log(`Webhook beat us to it. Order ${orderId} already paid.`);
        return { success: true };
      }
      // If it's still PENDING, we do NOT lie.
      return { success: false, error: 'Database busy. Payment received, but status update pending. Refresh page.' };
    }

    console.error('confirmOrderPayment Error:', err);
    return { success: false, error: err.message || 'Payment confirmation failed' };
  }
}