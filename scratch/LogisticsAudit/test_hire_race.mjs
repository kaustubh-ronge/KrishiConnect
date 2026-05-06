
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testParallelHiringRace() {
    console.log("🧨 INITIATING PARALLEL HIRING RACE CONDITION TEST");

    try {
        const order = await db.order.findFirst();
        const boy = await db.deliveryProfile.findFirst();

        if (!order || !boy) {
            console.error("Order or Partner not found.");
            return;
        }

        const orderId = order.id;
        const boyId = boy.id;

        console.log(`📦 Order: ${orderId} | Partner: ${boyId}`);

        console.log("🔥 Triggering parallel hiring requests...");
        
        const results = await Promise.all([
            // Simulate Action 1
            db.deliveryJob.create({
                data: { orderId, deliveryBoyId: boyId, status: "REQUESTED", distance: 5, totalPrice: 50, otp: "1" }
            }).catch(e => e.message),
            // Simulate Action 2
            db.deliveryJob.create({
                data: { orderId, deliveryBoyId: boyId, status: "REQUESTED", distance: 5, totalPrice: 50, otp: "2" }
            }).catch(e => e.message)
        ]);

        console.log(`🔎 Results Summary: Successes: ${results.filter(r => typeof r === 'object').length}, Errors: ${results.filter(r => typeof r === 'string').length}`);

        // Check DB for duplicates
        const count = await db.deliveryJob.count({
            where: { orderId, deliveryBoyId: boyId }
        });

        console.log(`📊 Active Requests in DB: ${count}`);

        if (count > 1) {
            console.warn("💀 VULNERABILITY CONFIRMED: Double Hiring via Race Condition!");
        } else {
            console.log("✅ PASS: Database constraints or timing prevented duplicates.");
        }

        // Cleanup (only the ones we created in this test)
        await db.deliveryJob.deleteMany({ where: { orderId, deliveryBoyId: boyId, distance: 5, totalPrice: 50 } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

testParallelHiringRace().catch(console.error);
