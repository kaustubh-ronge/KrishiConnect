
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runIdempotencyTest() {
    console.log("🧬 STARTING IDEMPOTENCY & RACE CONDITION TEST");
    console.log("===========================================");

    const results = [];

    // Setup: Get a user and a product
    const user = await db.user.findFirst({ where: { role: 'farmer' } });
    const product = await db.productListing.findFirst({ where: { availableStock: { gt: 20 } } });

    if (!user || !product) {
        console.log("❌ Setup failed: Need a user and a product with stock.");
        return;
    }

    console.log(`👤 User: ${user.id} | 📦 Product: ${product.id} (Stock: ${product.availableStock})`);

    // --- TEST 1: RACE CONDITION - Simultaneous Checkout ---
    console.log("\n🧪 TEST 1: Simultaneous Checkout Attack (10 parallel attempts)...");
    
    // Simulating the logic of 'initiateCheckout'
    // 1. Generate the deterministic ID
    const cartFingerprint = `${product.id}:1`;
    const idempotencyId = `race_ord_${user.id.slice(-5)}_${Buffer.from(cartFingerprint).toString('base64').slice(0, 10)}`;

    const checkoutLogic = async (i) => {
        try {
            return await db.$transaction(async (tx) => {
                // Check if exists
                const existing = await tx.order.findUnique({ where: { id: idempotencyId } });
                if (existing) throw new Error("Duplicate Blocked");

                // Create Order
                await tx.order.create({
                    data: {
                        id: idempotencyId,
                        buyerId: user.id,
                        totalAmount: 100, platformFee: 2, sellerAmount: 98,
                        paymentStatus: "PENDING", orderStatus: "PROCESSING",
                        shippingAddress: "Race Track"
                    }
                });

                // Decrement Stock
                const update = await tx.productListing.updateMany({
                    where: { id: product.id, availableStock: { gte: 1 } },
                    data: { availableStock: { decrement: 1 } }
                });
                if (update.count === 0) throw new Error("Sold Out");

                return "SUCCESS";
            });
        } catch (e) {
            return e.message;
        }
    };

    const checkoutAttempts = await Promise.all(Array.from({ length: 10 }).map((_, i) => checkoutLogic(i)));
    
    const successes = checkoutAttempts.filter(r => r === "SUCCESS").length;
    const duplicates = checkoutAttempts.filter(r => r === "Duplicate Blocked").length;

    console.log(`📊 Outcomes: ${successes} Success, ${duplicates} Duplicates Blocked.`);
    
    const finalStock = await db.productListing.findUnique({ where: { id: product.id } });
    const expectedStock = product.availableStock - 1; // Only 1 should succeed

    if (successes === 1 && finalStock.availableStock === expectedStock) {
        results.push({ name: "Checkout Idempotency", result: "PASS ✅", note: "Only 1 order created, stock decremented exactly once." });
    } else {
        results.push({ name: "Checkout Idempotency", result: "FAIL ❌", note: `Created ${successes} orders, Stock off by ${finalStock.availableStock - expectedStock}` });
    }

    // --- CLEANUP ---
    await db.order.delete({ where: { id: idempotencyId } }).catch(() => {});
    await db.productListing.update({ where: { id: product.id }, data: { availableStock: product.availableStock } });

    // --- TEST 2: RACE CONDITION - Hire Partner ---
    console.log("\n🧪 TEST 2: Simultaneous Partner Hiring...");
    // Create a dummy order first
    const dummyOrder = await db.order.create({
        data: {
            id: `hire_race_${Date.now()}`,
            buyerId: user.id, totalAmount: 100, platformFee: 2, sellerAmount: 98,
            paymentStatus: "PAID", orderStatus: "PROCESSING", shippingAddress: "Hire Track"
        }
    });

    const partner = await db.deliveryProfile.findFirst();
    
    const hireLogic = async () => {
        try {
            // Simulating upsert logic
            await db.deliveryJob.upsert({
                where: { orderId_deliveryBoyId: { orderId: dummyOrder.id, deliveryBoyId: partner.id } },
                update: { status: "REQUESTED", updatedAt: new Date() },
                create: { 
                    orderId: dummyOrder.id, deliveryBoyId: partner.id, 
                    status: "REQUESTED", distance: 10, totalPrice: 100, otp: "123456" 
                }
            });
            return "SUCCESS";
        } catch (e) { return e.message; }
    };

    const hireAttempts = await Promise.all(Array.from({ length: 10 }).map(() => hireLogic()));
    const jobCount = await db.deliveryJob.count({ where: { orderId: dummyOrder.id } });

    if (jobCount === 1) {
        results.push({ name: "Hiring Idempotency", result: "PASS ✅", note: "Only 1 job record exists despite 10 simultaneous upserts." });
    } else {
        results.push({ name: "Hiring Idempotency", result: "FAIL ❌", note: `Found ${jobCount} job records for one order!` });
    }

    // --- CLEANUP ---
    await db.deliveryJob.deleteMany({ where: { orderId: dummyOrder.id } }).catch(() => {});
    await db.order.delete({ where: { id: dummyOrder.id } }).catch(() => {});

    // --- SUMMARY ---
    console.log("\n===========================================");
    console.log("📊 IDEMPOTENCY TEST SUMMARY");
    console.log("===========================================");
    results.forEach(r => console.log(`${r.result} ${r.name.padEnd(25)}: ${r.note}`));
    
    await db.$disconnect();
}

runIdempotencyTest();
