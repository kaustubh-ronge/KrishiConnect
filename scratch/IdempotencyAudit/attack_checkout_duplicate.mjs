
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackCheckoutDuplicate() {
    console.log("🧨 ATTACKING initiateCheckout (Duplicate Order Race)");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";

    try {
        // 1. Setup cart
        const cart = await db.cart.upsert({
            where: { userId },
            update: {},
            create: { userId }
        });
        
        // Ensure at least one item
        await db.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId: "cmopeyktl0001oj2wbk40uoos" } },
            update: { quantity: 1 },
            create: { cartId: cart.id, productId: "cmopeyktl0001oj2wbk40uoos", quantity: 1 }
        });

        console.log("🔥 Hammering initiateCheckout with 3 parallel requests...");
        
        const tasks = Array.from({ length: 3 }).map(async () => {
            // Simulate the logic in initiateCheckout
            return db.order.create({
                data: {
                    buyerId: userId,
                    totalAmount: 100,
                    platformFee: 10,
                    sellerAmount: 90,
                    paymentStatus: "PENDING",
                    shippingAddress: "Attack Lab"
                }
            });
        });

        const results = await Promise.all(tasks);
        console.log(`🔎 Orders Created: ${results.length}`);

        const count = await db.order.count({
            where: { buyerId: userId, shippingAddress: "Attack Lab", paymentStatus: "PENDING" }
        });

        console.log(`📊 Duplicate Orders in DB: ${count}`);

        if (count > 1) {
            console.warn("💀 VULNERABILITY CONFIRMED: Triple Order Creation Detected!");
        } else {
            console.log("✅ PASS: No duplicates.");
        }

        // Cleanup
        await db.order.deleteMany({ where: { buyerId: userId, shippingAddress: "Attack Lab" } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackCheckoutDuplicate().catch(console.error);
