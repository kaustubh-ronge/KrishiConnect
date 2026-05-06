
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveCartRace() {
    console.log("🧪 PROVING CART RACE CONDITION (LOST UPDATE)");
    console.log("------------------------------------------");

    const user = await db.user.findFirst();
    const product = await db.productListing.findFirst();

    // 1. Ensure a cart exists
    let cart = await db.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
    });

    // 2. Clear existing items for this product
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId: product.id } });

    // 3. Create initial item with quantity 1
    const item = await db.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 }
    });

    console.log(`📦 Initial Quantity: ${item.quantity}`);

    // 4. Simulate 10 simultaneous "Add to Cart (qty 1)" calls
    // Mimicking the buggy logic: read current, add 1, write back.
    const buggyAdd = async () => {
        // Step A: Read
        const current = await db.cartItem.findUnique({ where: { id: item.id } });
        // Step B: Sleep slightly to ensure overlap (simulating network lag)
        await new Promise(r => setTimeout(r, Math.random() * 50));
        // Step C: Write
        await db.cartItem.update({
            where: { id: item.id },
            data: { quantity: current.quantity + 1 }
        });
    };

    console.log("🚀 Hammering 'Update' with 10 parallel tasks...");
    await Promise.all(Array.from({ length: 10 }).map(() => buggyAdd()));

    // 5. Check final quantity
    const final = await db.cartItem.findUnique({ where: { id: item.id } });
    console.log(`\n🏁 FINAL QUANTITY: ${final.quantity}`);
    console.log(`📈 Expected: 11 (1 + 10)`);

    if (final.quantity < 11) {
        console.log("\n❌ RACE CONDITION PROVEN: Updates were lost!");
    } else {
        console.log("\n✅ Test Passed (by luck? or no lag).");
    }

    await db.$disconnect();
}

proveCartRace();
