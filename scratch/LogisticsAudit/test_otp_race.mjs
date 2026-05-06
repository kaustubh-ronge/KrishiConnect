
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testOTPReplayRace() {
    console.log("🧨 INITIATING OTP REPLAY RACE CONDITION TEST");

    const ts = Date.now();
    const D1_ID = `D1_${ts}`;

    try {
        // Setup a temp job
        const user = await db.user.create({ data: { id: D1_ID, email: `${D1_ID}@test.com`, role: "delivery" } });
        const profile = await db.deliveryProfile.create({ 
            data: { 
                userId: D1_ID, 
                name: "D1", 
                phone: `999${ts.toString().slice(-7)}`,
                approvalStatus: "APPROVED" 
            } 
        });
        
        const order = await db.order.create({
            data: {
                buyerId: "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ",
                totalAmount: 100,
                platformFee: 10,
                sellerAmount: 90,
                paymentStatus: "PAID",
                payoutStatus: "PENDING"
            }
        });

        const job = await db.deliveryJob.create({
            data: {
                orderId: order.id,
                deliveryBoyId: profile.id,
                status: "PICKED_UP",
                otp: "123456",
                distance: 5,
                totalPrice: 50
            }
        });

        console.log(`📦 Created Job: ${job.id} | OTP: 123456`);

        console.log("🔥 Triggering parallel completion requests...");
        
        const results = await Promise.all([
            db.$transaction(async (tx) => {
                const j = await tx.deliveryJob.findUnique({ where: { id: job.id } });
                if (j.status === "DELIVERED") throw new Error("Already Delivered (A)");
                await tx.deliveryJob.update({ where: { id: job.id }, data: { status: "DELIVERED" } });
                return "SUCCESS_A";
            }, { isolationLevel: "Serializable" }).catch(e => e.message),
            db.$transaction(async (tx) => {
                const j = await tx.deliveryJob.findUnique({ where: { id: job.id } });
                if (j.status === "DELIVERED") throw new Error("Already Delivered (B)");
                await tx.deliveryJob.update({ where: { id: job.id }, data: { status: "DELIVERED" } });
                return "SUCCESS_B";
            }, { isolationLevel: "Serializable" }).catch(e => e.message)
        ]);

        console.log(`🔎 Results:`, results);

        if (results.includes("SUCCESS_A") && results.includes("SUCCESS_B")) {
            console.warn("💀 VULNERABILITY CONFIRMED: Double Completion via Race Condition!");
        } else {
            console.log("✅ PASS: Transaction isolation blocked the race condition.");
        }

        // Cleanup
        await db.deliveryJob.delete({ where: { id: job.id } });
        await db.order.delete({ where: { id: order.id } });
        await db.deliveryProfile.delete({ where: { id: profile.id } });
        await db.user.delete({ where: { id: D1_ID } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

testOTPReplayRace().catch(console.error);
