
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveACIDCompliance() {
    console.log("🛡️ KRISHICONNECT ACID COMPLIANCE AUDIT");
    console.log("=====================================");

    const ts = Date.now();
    const userId = `acid_user_${ts}`;
    const prodId = `acid_prod_${ts}`;

    try {
        // --- SETUP ---
        console.log("\n🏗️ SETUP: Creating test assets...");
        await db.user.create({ data: { id: userId, email: `${userId}@acid.com`, role: 'none' } });
        const farmerUserId = `acid_f_${ts}`;
        const farmerProfId = `acid_fp_${ts}`;
        await db.user.create({ data: { id: farmerUserId, email: `${farmerUserId}@acid.com`, role: 'farmer' } });
        await db.farmerProfile.create({ data: { id: farmerProfId, userId: farmerUserId, name: "ACID Seller" } });

        await db.productListing.create({
            data: {
                id: prodId,
                productName: "ACID Test Product",
                quantityLabel: "5kg",
                unit: "kg",
                pricePerUnit: 100,
                availableStock: 5, // Low stock for race testing
                sellerType: 'farmer',
                farmerId: farmerProfId
            }
        });

        // --- 1. ISOLATION: Concurrent Cart Addition ---
        console.log("\n🚀 TEST 1: ISOLATION (Concurrent Cart Upsert)");
        console.log("   Hammering addToCart for NEW cart...");
        
        // Mocking the logic from actions/cart.js
        const concurrentAdds = Array(5).fill(0).map(async () => {
             const cart = await db.cart.upsert({
                where: { userId: userId },
                update: {},
                create: { userId: userId }
            });
            return db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId: prodId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId: prodId, quantity: 1 }
            });
        });

        await Promise.all(concurrentAdds);
        const finalCartItem = await db.cartItem.findFirst({ 
            where: { product: { id: prodId }, cart: { userId: userId } } 
        });
        console.log(`   Final Cart Quantity: ${finalCartItem.quantity} (Expected: 5)`);
        if (finalCartItem.quantity === 5) console.log("   ✅ ISOLATION PASS: No lost updates or duplicate carts.");
        else console.log("   ❌ ISOLATION FAIL: Quantity mismatch.");

        // --- 2. ATOMICITY & CONSISTENCY: Dispute Resolution Stock Restore ---
        console.log("\n🚀 TEST 2: ATOMICITY (Dispute Rollback)");
        
        // Create an order
        const ordId = `acid_ord_${ts}`;
        await db.order.create({
            data: {
                id: ordId,
                buyerId: userId,
                totalAmount: 100,
                platformFee: 2,
                sellerAmount: 98,
                paymentStatus: 'PAID',
                orderStatus: 'DELIVERED',
                disputeStatus: 'OPEN'
            }
        });
        await db.orderItem.create({
            data: { orderId: ordId, productId: prodId, quantity: 2, priceAtPurchase: 100, sellerId: 'S1', sellerType: 'farmer' }
        });

        const initialStock = (await db.productListing.findUnique({ where: { id: prodId } })).availableStock;
        console.log(`   Initial Stock: ${initialStock}`);

        console.log("   Simulating ResolveDispute with intentional failure...");
        try {
            await db.$transaction(async (tx) => {
                // Step 1: Resolve Dispute
                await tx.order.update({
                    where: { id: ordId },
                    data: { disputeStatus: 'RESOLVED', payoutStatus: 'CANCELLED' }
                });

                // Step 2: Restore Stock
                await tx.productListing.update({
                    where: { id: prodId },
                    data: { availableStock: { increment: 2 } }
                });

                console.log("   -> Halfway done. Crashing...");
                throw new Error("INTENTIONAL_CRASH");
            });
        } catch (e) {
            console.log(`   -> Caught expected error: ${e.message}`);
        }

        const orderAfter = await db.order.findUnique({ where: { id: ordId } });
        const stockAfter = await db.productListing.findUnique({ where: { id: prodId } });

        console.log(`   Order Status After Crash: ${orderAfter.disputeStatus} (Expected: OPEN)`);
        console.log(`   Stock After Crash: ${stockAfter.availableStock} (Expected: ${initialStock})`);

        if (orderAfter.disputeStatus === 'OPEN' && stockAfter.availableStock === initialStock) {
            console.log("   ✅ ATOMICITY PASS: Transaction fully rolled back.");
        } else {
            console.log("   ❌ ATOMICITY FAIL: Partial state persisted.");
        }

    } catch (err) {
        console.error("❌ ACID AUDIT CRITICAL FAILURE:", err.message);
    } finally {
        // Cleanup
        await db.cartItem.deleteMany({ where: { productId: prodId } });
        await db.cart.deleteMany({ where: { userId: userId } });
        await db.orderItem.deleteMany({ where: { productId: prodId } });
        await db.order.deleteMany({ where: { id: `acid_ord_${ts}` } });
        await db.productListing.deleteMany({ where: { id: prodId } });
        await db.farmerProfile.deleteMany({ where: { userId: `acid_f_${ts}` } });
        await db.user.deleteMany({ where: { id: { in: [userId, `acid_f_${ts}`] } } });
        await db.$disconnect();
    }
}

proveACIDCompliance();
