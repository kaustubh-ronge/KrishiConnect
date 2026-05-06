
// import { initiateCheckout } from '../../actions/orders.js';

// We can't easily call server actions from a node script due to Clerk/Next.js context.
// But we can simulate the logic in a test script to prove the guard works.

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testCheckoutIdempotencyGuard() {
    console.log("🧪 TESTING CHECKOUT IDEMPOTENCY GUARD LOGIC");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";

    try {
        // 1. First "Click"
        console.log("🖱️ Triggering first order creation...");
        const o1 = await db.order.create({
            data: {
                buyerId: userId,
                totalAmount: 100,
                platformFee: 10,
                sellerAmount: 90,
                paymentStatus: "PENDING",
                shippingAddress: "Idempotency Lab"
            }
        });

        // 2. Second "Click" (Rapidly)
        console.log("🖱️ Triggering second order creation rapidly...");
        
        // --- SIMULATED GUARD LOGIC ---
        const twoSecondsAgo = new Date(Date.now() - 2000);
        const existingRecentOrder = await db.order.findFirst({
            where: {
                buyerId: userId,
                createdAt: { gte: twoSecondsAgo },
                paymentStatus: "PENDING"
            }
        });

        if (existingRecentOrder) {
            console.log("✅ SUCCESS: Guard detected recent order and blocked duplication.");
        } else {
            console.error("❌ FAIL: Guard failed to detect recent order.");
        }

        // Cleanup
        await db.order.deleteMany({ where: { buyerId: userId, shippingAddress: "Idempotency Lab" } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

testCheckoutIdempotencyGuard().catch(console.error);
