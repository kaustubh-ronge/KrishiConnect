
import { db } from '../lib/prisma.js';

async function runChaosTest() {
    console.log("🔥 INITIATING IDEMPOTENCY CHAOS TEST\n");

    const userId = "user_2shR26A74e8z5x5S9p6m1vYh3qB"; // Test user
    const orderId = "cmoply4v10009oj8unv34s98m"; // Valid order
    const deliveryBoyId = "cmop8m7v10000oj2w12345678"; // Valid partner

    try {
        // --- TEST 1: hireDeliveryBoy Race ---
        console.log("🧪 TEST 1: Rapid-fire 'hireDeliveryBoy' calls...");
        const hirePromises = Array.from({ length: 5 }).map(() => 
            // Simulate the internal logic of hireDeliveryBoy
            db.deliveryJob.upsert({
                where: { orderId_deliveryBoyId: { orderId, deliveryBoyId } },
                update: { status: "REQUESTED", updatedAt: new Date() },
                create: { orderId, deliveryBoyId, status: "REQUESTED", distance: 10, totalPrice: 50, otp: "123456" }
            })
        );

        const hireResults = await Promise.allSettled(hirePromises);
        const hireSuccesses = hireResults.filter(r => r.status === 'fulfilled').length;
        const hireFailures = hireResults.filter(r => r.status === 'rejected').length;

        console.log(`- Success: ${hireSuccesses}, Failures: ${hireFailures}`);
        
        const jobCount = await db.deliveryJob.count({ where: { orderId, deliveryBoyId } });
        console.log(`- Final job record count for this pair: ${jobCount}`);
        if (jobCount > 1) {
            console.error("❌ FAILURE: Multiple job records created for same order/partner pair!");
        } else {
            console.log("✅ SUCCESS: Only one record exists (Unique constraint held).");
        }

        // --- TEST 2: createProductListing (No Unique Constraint) ---
        console.log("\n🧪 TEST 2: Rapid-fire 'createProductListing' simulation...");
        const prodData = {
            productName: "CHAOS-WHEAT",
            availableStock: 100,
            unit: "kg",
            pricePerUnit: 20,
            sellerType: "farmer",
            isAvailable: true
        };

        const prodPromises = Array.from({ length: 3 }).map(() => 
            db.productListing.create({ data: prodData })
        );

        const prodResults = await Promise.allSettled(prodPromises);
        console.log(`- Created ${prodResults.length} records.`);
        
        const wheatCount = await db.productListing.count({ where: { productName: "CHAOS-WHEAT" } });
        console.log(`- Final record count for 'CHAOS-WHEAT': ${wheatCount}`);
        if (wheatCount > 1) {
            console.warn("⚠️ WARNING: Duplicate products created. Logic lacks idempotency.");
        }

        // Cleanup
        await db.productListing.deleteMany({ where: { productName: "CHAOS-WHEAT" } });
        console.log("\n✅ Chaos Test Complete.");

    } catch (err) {
        console.error("💥 CHAOS TEST CRASHED:", err);
    } finally {
        await db.$disconnect();
    }
}

runChaosTest();
