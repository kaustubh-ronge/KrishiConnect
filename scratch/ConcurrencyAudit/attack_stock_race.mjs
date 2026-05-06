
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackStockRace() {
    console.log("🧨 ATTACKING Stock Consistency (Flash Sale Race)");

    const productId = "cmopeyktl0001oj2wbk40uoos";
    const userId1 = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const userId2 = "user_A"; // Simulate second user

    try {
        // 1. Reset stock to 1
        await db.productListing.update({
            where: { id: productId },
            data: { availableStock: 1, isAvailable: true }
        });

        console.log("📦 Stock set to 1. Triggering 2 parallel purchases...");

        const tasks = [
            // User 1 Purchase
            db.$transaction(async (tx) => {
                const prod = await tx.productListing.findUnique({
                    where: { id: productId },
                    select: { availableStock: true }
                });
                if (prod.availableStock < 1) throw new Error("Sold Out (1)");
                
                // Simulate some work to widen the race window
                await new Promise(r => setTimeout(r, 100));

                return tx.productListing.update({
                    where: { id: productId },
                    data: { availableStock: { decrement: 1 } }
                });
            }),
            // User 2 Purchase
            db.$transaction(async (tx) => {
                const prod = await tx.productListing.findUnique({
                    where: { id: productId },
                    select: { availableStock: true }
                });
                if (prod.availableStock < 1) throw new Error("Sold Out (2)");
                
                await new Promise(r => setTimeout(r, 100));

                return tx.productListing.update({
                    where: { id: productId },
                    data: { availableStock: { decrement: 1 } }
                });
            })
        ];

        const results = await Promise.allSettled(tasks);
        console.log(`🔎 Results:`, results.map(r => r.status === "fulfilled" ? "SUCCESS" : `FAIL (${r.reason.message})`));

        const finalProd = await db.productListing.findUnique({ where: { id: productId } });
        console.log(`📊 Final Stock in DB: ${finalProd.availableStock}`);

        if (finalProd.availableStock < 0) {
            console.warn("💀 VULNERABILITY CONFIRMED: Stock went negative! Overselling detected.");
        } else {
            console.log("✅ PASS: Transaction isolation blocked overselling.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackStockRace().catch(console.error);
