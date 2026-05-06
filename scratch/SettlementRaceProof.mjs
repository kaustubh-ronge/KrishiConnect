
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function proveSettlementRace() {
    console.log("🧪 PROVING SETTLEMENT RACE CONDITION (INCONSISTENT STATE)");
    console.log("-------------------------------------------------------");

    // 1. Setup: Get a real product and create an order with 2 items
    const user = await db.user.findFirst();
    const product = await db.productListing.findFirst();
    const orderId = `settle_race_${Date.now()}`;

    await db.order.create({
        data: {
            id: orderId,
            buyerId: user.id, totalAmount: 200, platformFee: 4, sellerAmount: 196,
            paymentStatus: "PAID", payoutStatus: "PENDING", orderStatus: "DELIVERED",
            shippingAddress: "Race Track",
            items: {
                create: [
                    { id: `${orderId}_it1`, productId: product.id, quantity: 1, priceAtPurchase: 100, payoutStatus: "PENDING", sellerId: 's1', sellerType: 'farmer', sellerName: 'S1' },
                    { id: `${orderId}_it2`, productId: product.id, quantity: 1, priceAtPurchase: 100, payoutStatus: "PENDING", sellerId: 's1', sellerType: 'farmer', sellerName: 'S1' }
                ]
            }
        }
    });

    console.log(`📦 Order created with 2 PENDING items.`);

    // 2. Simulate 2 admins settling the 2 items simultaneously
    const buggySettle = async (itemId, adminId) => {
        try {
            await db.$transaction(async (tx) => {
                // Step A: Update Item
                await tx.orderItem.update({
                    where: { id: itemId },
                    data: { payoutStatus: "SETTLED" }
                });

                // Step B: Sleep to ensure overlap
                await new Promise(r => setTimeout(r, 1000));

                // Step C: Read ALL items
                // This read will NOT see the update from the OTHER transaction because of isolation level (Read Committed)
                const allItems = await tx.orderItem.findMany({ where: { orderId: orderId } });
                
                // Step D: Update Order if all settled
                if (allItems.every(it => it.payoutStatus === "SETTLED")) {
                    console.log(`🚀 Admin ${adminId} updating Order to SETTLED...`);
                    await tx.order.update({
                        where: { id: orderId },
                        data: { payoutStatus: "SETTLED" }
                    });
                } else {
                    const pendingCount = allItems.filter(i => i.payoutStatus === 'PENDING').length;
                    console.log(`ℹ️ Admin ${adminId} sees ${pendingCount} items still PENDING.`);
                }
            });
        } catch (e) {
            console.error(`💥 Admin ${adminId} failed: ${e.message}`);
        }
    };

    console.log("🔥 Running parallel settlement tasks...");
    await Promise.all([
        buggySettle(`${orderId}_it1`, "Admin_A"),
        buggySettle(`${orderId}_it2`, "Admin_B")
    ]);

    // 3. Check final Order status
    const finalOrder = await db.order.findUnique({ where: { id: orderId } });
    console.log(`\n🏁 FINAL ORDER PAYOUT STATUS: ${finalOrder.payoutStatus}`);
    
    if (finalOrder.payoutStatus === "PENDING") {
        console.log("\n❌ INCONSISTENT STATE PROVEN: Order is still PENDING but all items are SETTLED!");
    } else {
        console.log("\n✅ Order successfully marked as SETTLED.");
    }

    // Cleanup
    await db.orderItem.deleteMany({ where: { orderId } });
    await db.order.delete({ where: { id: orderId } });

    await db.$disconnect();
}

proveSettlementRace();
