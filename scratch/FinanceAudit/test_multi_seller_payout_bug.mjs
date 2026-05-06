
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function testMultiSellerPayoutBug() {
    console.log("🧨 INITIATING MULTI-SELLER PAYOUT DATA CORRUPTION TEST");

    const BUYER_ID = "user_34Yh1vTuoKzapmiYNijyQ7BSLiJ";
    const ts = Date.now();
    const S1_ID = `S1_${ts}`;
    const S2_ID = `S2_${ts}`;

    try {
        // 1. Create two sellers
        await db.user.create({ data: { id: S1_ID, email: `${S1_ID}@test.com`, role: "farmer" } });
        const p1 = await db.farmerProfile.create({ data: { userId: S1_ID, name: "Seller 1" } });
        
        await db.user.create({ data: { id: S2_ID, email: `${S2_ID}@test.com`, role: "farmer" } });
        const p2 = await db.farmerProfile.create({ data: { userId: S2_ID, name: "Seller 2" } });

        // 2. Create products
        const prod1 = await db.productListing.create({ data: { productName: "S1 Apple", pricePerUnit: 100, availableStock: 10, unit: "kg", quantityLabel: "1kg", sellerType: "farmer", farmerId: p1.id } });
        const prod2 = await db.productListing.create({ data: { productName: "S2 Mango", pricePerUnit: 200, availableStock: 10, unit: "kg", quantityLabel: "1kg", sellerType: "farmer", farmerId: p2.id } });

        // 3. Create single order with both products
        const order = await db.order.create({
            data: {
                buyerId: BUYER_ID,
                totalAmount: 300,
                platformFee: 30,
                sellerAmount: 270,
                paymentStatus: "PAID",
                payoutStatus: "PENDING",
                items: {
                    create: [
                        { productId: prod1.id, quantity: 1, priceAtPurchase: 100 },
                        { productId: prod2.id, quantity: 1, priceAtPurchase: 200 }
                    ]
                }
            }
        });

        console.log(`✅ Order Created: ${order.id} with items from S1 and S2.`);

        // 4. Simulate Admin Settle
        console.log("🛠️ Admin marks order as SETTLED (thinking they paid both)...");
        await db.order.update({
            where: { id: order.id },
            data: { payoutStatus: "SETTLED" }
        });

        const updatedOrder = await db.order.findUnique({ where: { id: order.id } });
        console.log(`🔎 Order Payout Status: ${updatedOrder.payoutStatus}`);
        console.log(`⚠️ RESULT: Both S1 and S2 are now marked as "Paid" in the system logic.`);
        console.log(`💀 CORRUPTION: If Admin only sent money to S1, S2 has no way to claim their 200 INR because the order is 'SETTLED'.`);

        // Cleanup
        await db.orderItem.deleteMany({ where: { orderId: order.id } });
        await db.order.delete({ where: { id: order.id } });
        await db.productListing.deleteMany({ where: { id: { in: [prod1.id, prod2.id] } } });
        await db.farmerProfile.deleteMany({ where: { userId: { in: [S1_ID, S2_ID] } } });
        await db.user.deleteMany({ where: { id: { in: [S1_ID, S2_ID] } } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

testMultiSellerPayoutBug().catch(console.error);
