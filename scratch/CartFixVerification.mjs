
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveCartFix() {
    console.log("🧪 VERIFYING CART ATOMIC FIX");
    console.log("----------------------------");

    const testUserId = "user_cart_test_999";
    const testProdId = "prod_cart_test_999";

    await db.cartItem.deleteMany({ where: { cart: { userId: testUserId } } });
    await db.cart.deleteMany({ where: { userId: testUserId } });
    await db.productListing.deleteMany({ where: { id: testProdId } });

    await db.user.upsert({ where: { id: testUserId }, update: {}, create: { id: testUserId, role: 'farmer', email: 'cart@test.com' } });
    await db.farmerProfile.upsert({ where: { userId: testUserId }, update: {}, create: { userId: testUserId, name: 'Cart Tester', phone: '000', address: 'Test' } });
    
    const product = await db.productListing.upsert({
        where: { id: testProdId },
        update: { availableStock: 100 },
        create: { id: testProdId, productName: 'Cart Test Prod', availableStock: 100, unit: 'kg', quantityLabel: '100 kg', pricePerUnit: 1, sellerType: 'farmer', farmerId: (await db.farmerProfile.findUnique({where:{userId:testUserId}})).id, isAvailable: true }
    });

    let cart = await db.cart.upsert({
        where: { userId: testUserId },
        update: {},
        create: { userId: testUserId }
    });

    const item = await db.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 }
    });

    const atomicAdd = async () => {
        // Step: Atomic Increment (No read-modify-write!)
        await db.cartItem.update({
            where: { id: item.id },
            data: { quantity: { increment: 1 } }
        });
    };

    console.log("🚀 Hammering 'Atomic Update' with 10 parallel tasks...");
    await Promise.all(Array.from({ length: 10 }).map(() => atomicAdd()));

    const final = await db.cartItem.findUnique({ where: { id: item.id } });
    console.log(`\n🏁 FINAL QUANTITY: ${final.quantity}`);
    console.log(`📈 Expected: 11`);

    if (final.quantity === 11) {
        console.log("\n✅ ATOMIC FIX VERIFIED: All increments recorded!");
    } else {
        console.log("\n❌ FIX FAILED: Some updates still lost.");
    }

    await db.$disconnect();
}

proveCartFix();
