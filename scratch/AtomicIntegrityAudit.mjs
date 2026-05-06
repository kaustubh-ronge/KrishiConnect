
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveAtomicIntegrity() {
    console.log("💎 PROVING ATOMIC INTEGRITY & ROLLBACKS");
    console.log("=======================================");

    const ts = Date.now();
    const userId = `atomic_user_${ts}`;

    try {
        console.log("\n🏗️ SETUP: Creating Test User...");
        await db.user.create({
            data: { id: userId, email: `${userId}@atomic.com`, role: 'farmer', adminNotes: "Initial" }
        });
        await db.farmerProfile.create({
            data: { userId, name: "Atomic Farmer", phone: "0", address: "X", sellingStatus: 'PENDING' }
        });

        console.log("\n🚀 TEST: Simulating Mid-Transaction Crash during Approval...");
        try {
            await db.$transaction(async (tx) => {
                // Step 1: Update Notes
                await tx.user.update({
                    where: { id: userId },
                    data: { adminNotes: "CRASH_TEST_NOTES" }
                });

                console.log("   -> Updated notes. Now throwing intentional error...");
                throw new Error("INTENTIONAL_CRASH");
                
                // Step 2: (Will never reach) Update Profile Status
                await tx.farmerProfile.update({
                    where: { userId },
                    data: { sellingStatus: 'APPROVED' }
                });
            });
        } catch (e) {
            console.log(`   -> Error caught: ${e.message}`);
        }

        console.log("\n🔍 VERIFYING STATE CORRECTNESS (Rollback Check)...");
        const user = await db.user.findUnique({ where: { id: userId } });
        const profile = await db.farmerProfile.findUnique({ where: { userId } });

        console.log(`   Notes State: ${user.adminNotes} (Expected: Initial)`);
        console.log(`   Status State: ${profile.sellingStatus} (Expected: PENDING)`);

        if (user.adminNotes === "Initial" && profile.sellingStatus === "PENDING") {
            console.log("\n✅ ATOMICITY PROVEN: Partial update was successfully rolled back!");
        } else {
            console.log("\n❌ ATOMICITY FAILED: System is in a partial/mismatched state.");
        }

    } catch (err) {
        console.error("❌ AUDIT CRITICAL FAILURE:", err.message);
    } finally {
        await db.farmerProfile.deleteMany({ where: { userId } });
        await db.user.deleteMany({ where: { id: userId } });
        await db.$disconnect();
    }
}

proveAtomicIntegrity();
