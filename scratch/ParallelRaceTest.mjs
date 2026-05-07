
import { db } from '../lib/prisma.js';

async function runParallelAttack() {
    console.log("🌪️  STARTING PARALLEL RACE SIMULATION\n");

    const orderId = "cmoply4v10009oj8unv34s98m"; // Valid order
    const boyId = "cmop8m7v10000oj2w12345678"; // Valid partner
    const userId = "user_2shR26A74e8z5x5S9p6m1vYh3qB"; // Valid user

    try {
        // --- SCENARIO 1: Concurrent Delivery Hiring ---
        console.log("🥊 SCENARIO 1: 10 partners accepting same job simultaneously...");
        const jobResults = await Promise.allSettled(
            Array.from({ length: 10 }).map(async (_, i) => {
                // Emulate the updateDeliveryJobStatus logic
                return await db.$transaction(async (tx) => {
                    const alreadyAssigned = await tx.deliveryJob.findFirst({
                        where: {
                            orderId,
                            status: { in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] },
                        }
                    });
                    if (alreadyAssigned) throw new Error("ALREADY_ASSIGNED");

                    return await tx.deliveryJob.updateMany({
                        where: { orderId, status: "REQUESTED" },
                        data: { status: "ACCEPTED", notes: `Accepted by ${i}` }
                    });
                });
            })
        );

        const successes = jobResults.filter(r => r.status === 'fulfilled' && r.value.count > 0).length;
        const alreadyAssignedErrors = jobResults.filter(r => r.status === 'rejected' && r.reason.message === 'ALREADY_ASSIGNED').length;

        console.log(`- Successes: ${successes} (Expected: 1)`);
        console.log(`- Blocked (Already Assigned): ${alreadyAssignedErrors} (Expected: 9)`);

        if (successes > 1) {
            console.error("❌ RACE CONDITION DETECTED: Multiple partners accepted the same job!");
        } else {
            console.log("✅ DETERMINISTIC: Only one partner won the race.");
        }

        // --- SCENARIO 2: Concurrent Profile Approval ---
        console.log("\n🥊 SCENARIO 2: 5 admins approving same user simultaneously...");
        const approvalResults = await Promise.allSettled(
            Array.from({ length: 5 }).map(async () => {
                return await db.$transaction(async (tx) => {
                    const p = await tx.farmerProfile.findUnique({ where: { userId } });
                    if (p.sellingStatus === "APPROVED") throw new Error("ALREADY_APPROVED");
                    
                    return await tx.farmerProfile.update({
                        where: { userId },
                        data: { sellingStatus: "APPROVED" }
                    });
                });
            })
        );

        const approvalSuccesses = approvalResults.filter(r => r.status === 'fulfilled').length;
        console.log(`- Successes: ${approvalSuccesses} (Expected: 1)`);
        
        if (approvalSuccesses > 1) {
            console.warn("⚠️  NON-ATOMIC: Multiple approvals processed. Risk of duplicate emails.");
        } else {
            console.log("✅ ATOMIC: Only one approval succeeded.");
        }

        // Cleanup for re-runability
        await db.deliveryJob.updateMany({ where: { orderId }, data: { status: "REQUESTED", notes: "" } });
        await db.farmerProfile.update({ where: { userId }, data: { sellingStatus: "PENDING" } });

    } catch (err) {
        console.error("💥 SIMULATION CRASHED:", err);
    } finally {
        await db.$disconnect();
    }
}

runParallelAttack();
