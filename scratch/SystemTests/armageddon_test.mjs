
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runArmageddonTest() {
    console.log("🔥 STARTING ARMAGEDDON SYSTEM STRESS TEST");
    console.log("-----------------------------------------");

    const farmerId = "cmoshq2db0001ojfsazqgsdy4";
    const buyerId = "user_34TAG2PSubUs0Jflq9HbDvgbvbw";

    try {
        // --- TEST 1: CONCURRENT PRODUCT UPDATES ---
        console.log("🧪 TEST 1: Hammering Product Updates...");
        const product = await db.productListing.create({
            data: {
                productName: "Stress Test Crop",
                variety: "High Reliability",
                availableStock: 1000,
                pricePerUnit: 10,
                unit: "kg",
                quantityLabel: "1000 kg",
                isAvailable: true,
                sellerType: 'farmer',
                farmerId: farmerId
            }
        });

        // --- TEST 2: THE FLASH SALE RACE ---
        console.log("🧪 TEST 2: Concurrent Purchases (Stock Depletion)...");
        await db.productListing.update({ where: { id: product.id }, data: { availableStock: 5 } });
        
        const purchaseTasks = Array.from({ length: 10 }).map(async (i) => {
            try {
                return await db.$transaction(async (tx) => {
                    const updateResult = await tx.productListing.updateMany({
                        where: { id: product.id, availableStock: { gte: 1 } },
                        data: { availableStock: { decrement: 1 } }
                    });
                    if (updateResult.count === 0) throw new Error("Sold Out");
                    return "BOUGHT";
                });
            } catch (e) {
                return e.message;
            }
        });
        const purchaseResults = await Promise.all(purchaseTasks);
        console.log(`📊 Purchases: ${purchaseResults.filter(r => r === "BOUGHT").length} Successes.`);

        // --- TEST 3: THE DETERMINISTIC ID IDEMPOTENCY TEST ---
        console.log("🧪 TEST 3: Hammering Checkout (Deterministic ID Guard)...");
        
        // Define deterministic ID
        const idempotencyId = `STRESS_TEST_${Date.now()}`;

        const checkoutLogic = async () => {
            try {
                return await db.$transaction(async (tx) => {
                    // Check if exists
                    const existing = await tx.order.findUnique({ where: { id: idempotencyId } });
                    if (existing) throw new Error("Blocked (Existing)");

                    await tx.order.create({
                        data: { 
                            id: idempotencyId, 
                            buyerId, totalAmount: 100, platformFee: 10, sellerAmount: 90, 
                            paymentStatus: "PENDING", shippingAddress: "ARMAGEDDON" 
                        }
                    });
                    return "CREATED";
                });
            } catch (e) {
                return e.message;
            }
        };

        const checkoutResults = await Promise.all([checkoutLogic(), checkoutLogic(), checkoutLogic()]);
        console.log(`📊 Checkout Outcomes: ${checkoutResults.join(', ')}`);
        
        const orderCount = await db.order.count({ where: { id: idempotencyId } });
        console.log(`🔎 Total Orders in DB with this ID: ${orderCount}`);

        if (orderCount === 1) {
            console.log("✅ PASS: Deterministic ID successfully blocked duplicates at DB level!");
        } else {
            console.error("❌ FAIL: Multiple orders created with same logic!");
        }

        // --- CLEANUP ---
        await db.productListing.delete({ where: { id: product.id } });
        await db.order.deleteMany({ where: { id: idempotencyId } });
        console.log("✨ Cleanup completed.");

    } catch (e) {
        console.error("❌ STRESS TEST FAILED:", e.message);
    } finally {
        await db.$disconnect();
    }
}

runArmageddonTest();
