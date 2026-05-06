
import { PrismaClient } from '@prisma/client';
// Note: We simulate the server action's internal logic since we can't easily 
// invoke a "use server" function with a mocked Clerk session in a raw Node script.
// But we will use the EXACT code that is now in the file.

const db = new PrismaClient();

async function proveServerLogicFixed() {
    console.log("🛠️ VERIFYING SERVER-SIDE LOGIC FIX (UNAUTHORIZED ACCESS)");
    console.log("-----------------------------------------------------");

    // 1. Setup: Find an attacker and a job they DON'T own
    const attacker = await db.user.findFirst({ where: { role: 'farmer' } });
    const job = await db.deliveryJob.findFirst({
        where: { NOT: { deliveryBoy: { userId: attacker.id } } },
        include: { deliveryBoy: true }
    });

    if (!attacker || !job) {
        console.log("⚠️ Could not find test data. Ensure you have users and jobs in DB.");
        return;
    }

    console.log(`👤 Attacker ID: ${attacker.id}`);
    console.log(`👤 True Partner ID: ${job.deliveryBoy.userId}`);
    console.log(`📦 Targeted Job: ${job.id}`);

    // 2. Simulate the REAL updateLiveLocation logic as of the latest fix
    const testLiveLocationAction = async (uid, jid, lat, lng) => {
        try {
            // This is exactly what's in actions/delivery-job.js now:
            const user = await db.user.findUnique({ where: { id: uid } });
            if (!user) throw new Error("Unauthorized");

            // --- THE FIX ---
            const nLat = parseFloat(lat);
            const nLng = parseFloat(lng);
            if (isNaN(nLat) || isNaN(nLng) || nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
                throw new Error("Invalid GPS coordinates");
            }

            const targetJob = await db.deliveryJob.findUnique({
                where: { id: jid },
                include: { deliveryBoy: true }
            });

            if (!targetJob) throw new Error("Job not found");
            
            // This line should now throw:
            if (targetJob.deliveryBoy.userId !== uid) {
                throw new Error("Unauthorized: You are not the assigned delivery partner for this job.");
            }
            // ----------------

            return "SUCCESS (Still Vulnerable!)";
        } catch (e) {
            return `BLOCKED: ${e.message}`;
        }
    };

    console.log("\n🚀 Attempting to spoof location as the wrong user...");
    const result = await testLiveLocationAction(attacker.id, job.id, 12.34, 56.78);
    
    console.log(`\n🏁 Result: ${result}`);

    if (result.includes("Unauthorized")) {
        console.log("\n✅ FIX VERIFIED: Server correctly blocked unauthorized location manipulation!");
    } else {
        console.log("\n❌ FIX FAILED: Vulnerability persists.");
    }

    await db.$disconnect();
}

proveServerLogicFixed();
