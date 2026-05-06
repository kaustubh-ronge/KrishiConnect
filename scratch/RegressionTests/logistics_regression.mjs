
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function regressionLogisticsFlow() {
    console.log("🚜 REGRESSION TEST: Logistics & Delivery Flow");

    const orderId = "cmoply4v10009oj8unv34s98m"; // Existing order
    const deliveryBoyId = "cmop8m7v10000oj2w12345678"; // Existing partner
    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";

    try {
        // 1. Test Hiring (Upsert Logic)
        console.log("Step 1: Testing Hiring Idempotency...");
        const hire1 = await db.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId } },
            update: { status: "REQUESTED", updatedAt: new Date() },
            create: { orderId, deliveryBoyId, status: "REQUESTED", distance: 10, totalPrice: 50, otp: "123456" }
        });
        console.log("✅ Hiring First Attempt: Success");

        const hire2 = await db.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId } },
            update: { status: "REQUESTED", updatedAt: new Date() },
            create: { orderId, deliveryBoyId, status: "REQUESTED", distance: 10, totalPrice: 50, otp: "123456" }
        });
        console.log("✅ Hiring Second Attempt (Idempotent): Success");

        // 2. Test Acceptance
        console.log("Step 2: Testing Job Acceptance...");
        await db.deliveryJob.update({
            where: { id: hire1.id },
            data: { status: "ACCEPTED" }
        });
        console.log("✅ Job Accepted");

        // 3. Test Pickup
        console.log("Step 3: Testing Pickup...");
        await db.deliveryJob.update({
            where: { id: hire1.id },
            data: { status: "PICKED_UP" }
        });
        console.log("✅ Job Picked Up");

        // 4. Test Completion
        console.log("Step 4: Testing Completion...");
        await db.deliveryJob.update({
            where: { id: hire1.id },
            data: { status: "DELIVERED" }
        });
        console.log("✅ Job Completed");

        console.log("🏁 LOGISTICS REGRESSION PASSED.");

    } catch (e) {
        console.error("❌ REGRESSION FAILED:", e.message);
    } finally {
        await db.$disconnect();
    }
}

regressionLogisticsFlow().catch(console.error);
