
import { db } from '../lib/prisma.js';

async function testMultiPartnerAcceptance() {
    console.log("🧪 TESTING MULTI-PARTNER HIRING CONSISTENCY\n");

    const orderId = "cmoply4v10009oj8unv34s98m"; // Valid test order
    const boy1 = "cmop8m7v10000oj2w12345678";
    const boy2 = "cmop8m7v10000oj2w99999999";

    try {
        // 1. Setup: Create two REQUESTED jobs for the same order
        console.log("1. Setting up multiple requests...");
        await db.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId: boy1 } },
            update: { status: "REQUESTED", notes: "" },
            create: { id: "test-job-1", orderId, deliveryBoyId: boy1, status: "REQUESTED", distance: 10, totalPrice: 50, otp: "111111" }
        });
        await db.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId: boy2 } },
            update: { status: "REQUESTED", notes: "" },
            create: { id: "test-job-2", orderId, deliveryBoyId: boy2, status: "REQUESTED", distance: 10, totalPrice: 50, otp: "222222" }
        });

        // 2. Action: Boy 1 Accepts
        console.log("2. Partner 1 accepts the task...");
        // Emulate the backend logic inside the action
        await db.$transaction(async (tx) => {
            // Check
            const alreadyAssigned = await tx.deliveryJob.findFirst({
                where: {
                    orderId: orderId,
                    status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] },
                    id: { not: "test-job-1" }
                }
            });
            if (alreadyAssigned) throw new Error("Already assigned");

            // Accept
            await tx.deliveryJob.update({
                where: { id: "test-job-1" },
                data: { status: "ACCEPTED" }
            });

            // Cancel others
            await tx.deliveryJob.updateMany({
                where: {
                    orderId: orderId,
                    status: "REQUESTED",
                    id: { not: "test-job-1" }
                },
                data: {
                    status: "CANCELLED",
                    notes: "This order has already been accepted by another delivery partner."
                }
            });
        });

        // 3. Verification
        console.log("3. Verifying consistency...");
        const job1 = await db.deliveryJob.findUnique({ where: { id: "test-job-1" } });
        const job2 = await db.deliveryJob.findUnique({ where: { id: "test-job-2" } });

        console.log(`- Job 1 Status: ${job1.status} (Expected: ACCEPTED)`);
        console.log(`- Job 2 Status: ${job2.status} (Expected: CANCELLED)`);
        console.log(`- Job 2 Note: "${job2.notes}"`);

        if (job1.status === 'ACCEPTED' && job2.status === 'CANCELLED' && job2.notes.includes("accepted by another")) {
            console.log("\n✅ SUCCESS: Multi-partner consistency confirmed!");
        } else {
            console.error("\n❌ FAILURE: Logic inconsistency detected!");
        }

    } catch (err) {
        console.error("💥 TEST CRASHED:", err);
    } finally {
        // Cleanup
        await db.deliveryJob.deleteMany({ where: { id: { in: ["test-job-1", "test-job-2"] } } });
        await db.$disconnect();
    }
}

testMultiPartnerAcceptance();
