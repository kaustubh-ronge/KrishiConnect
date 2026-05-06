
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function attackAddToCart() {
    console.log("🧨 ATTACKING addToCart (Simultaneous Execution)");

    const userId = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const productId = "cmopeyktl0001oj2wbk40uoos";

    try {
        // 1. Ensure cart exists
        let cart = await db.cart.upsert({
            where: { userId },
            update: {},
            create: { userId }
        });

        // 2. Trigger 5 simultaneous calls
        console.log("🔥 Hammering addToCart with 5 parallel requests...");
        const results = await Promise.all([
            db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId, quantity: 1 }
            }).catch(e => e.message),
            db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId, quantity: 1 }
            }).catch(e => e.message),
            db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId, quantity: 1 }
            }).catch(e => e.message),
            db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId, quantity: 1 }
            }).catch(e => e.message),
            db.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: { increment: 1 } },
                create: { cartId: cart.id, productId, quantity: 1 }
            }).catch(e => e.message)
        ]);

        console.log("🔎 Results Summary:", results.map(r => typeof r === 'string' ? "FAIL" : "SUCCESS"));

        const finalItem = await db.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } }
        });

        console.log(`📊 Final Quantity in DB: ${finalItem?.quantity}`);
        console.log(`⚠️ Expected if idempotent increment: 5. If race condition: < 5.`);

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

attackAddToCart().catch(console.error);
