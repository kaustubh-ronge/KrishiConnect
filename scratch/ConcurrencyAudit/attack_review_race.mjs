
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackReviewRace() {
    console.log("🧨 ATTACKING Review Aggregation (Concurrent Rating Update)");

    const productId = "cmopeyktl0001oj2wbk40uoos";
    const buyerId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";

    try {
        // Reset product
        await db.productListing.update({
            where: { id: productId },
            data: { averageRating: 0, totalReviews: 0 }
        });
        await db.review.deleteMany({ where: { productId } });

        console.log("🛒 Creating 5 dummy orders...");
        const orders = await Promise.all(Array.from({ length: 5 }).map((_, i) => 
            db.order.create({
                data: {
                    buyerId, totalAmount: 10, platformFee: 1, sellerAmount: 9, paymentStatus: "PAID", orderStatus: "DELIVERED"
                }
            })
        ));

        console.log("⭐ Triggering 5 parallel reviews...");

        const tasks = orders.map(async (order, i) => {
            // Logic from actions/reviews.js
            await db.review.create({
                data: {
                    orderId: order.id,
                    productId,
                    userId: buyerId,
                    rating: 5,
                    comment: "Race test",
                    isVerifiedPurchase: true
                }
            });

            const productReviews = await db.review.findMany({ where: { productId } });
            const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

            // Artificial delay to widen race window
            await new Promise(r => setTimeout(r, 50));

            return db.productListing.update({
                where: { id: productId },
                data: { averageRating: avg, totalReviews: productReviews.length }
            });
        });

        await Promise.all(tasks);

        const finalProd = await db.productListing.findUnique({ where: { id: productId } });
        console.log(`📊 Final Total Reviews in DB: ${finalProd.totalReviews}`);
        
        if (finalProd.totalReviews !== 5) {
            console.warn("💀 VULNERABILITY CONFIRMED: Lost Update! Final count is " + finalProd.totalReviews);
        } else {
            console.log("✅ PASS: Aggregates are correct (or luck).");
        }

        // Cleanup
        await db.review.deleteMany({ where: { productId } });
        await db.order.deleteMany({ where: { id: { in: orders.map(o => o.id) } } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackReviewRace().catch(console.error);
