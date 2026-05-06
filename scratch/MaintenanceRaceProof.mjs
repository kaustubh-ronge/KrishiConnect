
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveMaintenanceRace() {
    console.log("🧪 PROVING MAINTENANCE RACE CONDITION (DOUBLE RECLAIM)");
    console.log("--------------------------------------------------");

    // 1. Setup: Create an expired order with stock decremented
    const user = await db.user.findFirst();
    const product = await db.productListing.findFirst();
    const initialStock = product.availableStock;

    const orderId = `expire_race_${Date.now()}`;
    await db.order.create({
        data: {
            id: orderId,
            buyerId: user.id, totalAmount: 100, platformFee: 2, sellerAmount: 98,
            paymentStatus: "PENDING", orderStatus: "PROCESSING", 
            expiresAt: new Date(Date.now() - 1000), // Already expired
            items: {
                create: {
                    productId: product.id, quantity: 10, priceAtPurchase: 10,
                    sellerId: 'any', sellerType: 'farmer', sellerName: 'test'
                }
            }
        }
    });

    console.log(`📦 Order created with 10 units. Initial Product Stock: ${initialStock}`);

    // 2. Simulate 2 parallel maintenance tasks
    // Mimicking the current logic in maintenance.js:
    // read expired -> loop -> transaction { update stock, update order }
    const buggyReclaim = async (id) => {
        const ord = await db.order.findUnique({ 
            where: { id: orderId }, 
            include: { items: true } 
        });
        
        if (ord && ord.paymentStatus === "PENDING") {
            console.log(`🚀 Task ${id} starting transaction...`);
            await db.$transaction(async (tx) => {
                // Simulating slight delay to ensure overlap
                await new Promise(r => setTimeout(r, 100));

                for (const item of ord.items) {
                    await tx.productListing.update({
                        where: { id: item.productId },
                        data: { availableStock: { increment: item.quantity } }
                    });
                }
                await tx.order.update({
                    where: { id: ord.id },
                    data: { paymentStatus: "CANCELLED" }
                });
            });
            console.log(`✅ Task ${id} finished.`);
        }
    };

    console.log("🔥 Running parallel reclamation tasks...");
    await Promise.all([buggyReclaim(1), buggyReclaim(2)]);

    // 3. Check final stock
    const finalProduct = await db.productListing.findUnique({ where: { id: product.id } });
    console.log(`\n🏁 FINAL STOCK: ${finalProduct.availableStock}`);
    console.log(`📈 Expected: ${initialStock + 10}`);

    if (finalProduct.availableStock > (initialStock + 10)) {
        console.log("\n❌ VULNERABILITY PROVEN: Stock was reclaimed twice!");
    } else {
        console.log("\n✅ No race condition observed (this time).");
    }

    // Cleanup
    await db.orderItem.deleteMany({ where: { orderId } });
    await db.order.delete({ where: { id: orderId } });
    await db.productListing.update({ where: { id: product.id }, data: { availableStock: initialStock } });

    await db.$disconnect();
}

proveMaintenanceRace();
