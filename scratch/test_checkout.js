
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCheckout() {
    console.log("🛠️ Starting Simulation: initiateCheckout");

    // 1. Get a mock user
    const user = await prisma.user.findFirst({
        include: { farmerProfile: true, agentProfile: true }
    });

    if (!user) {
        console.log("❌ No user found to test with.");
        return;
    }

    console.log(`👤 Testing as User: ${user.email} (Role: ${user.role})`);

    // 2. Get a product
    const product = await prisma.productListing.findFirst({
        where: { availableStock: { gt: 10 } }
    });

    if (!product) {
        console.log("❌ No product with stock found.");
        return;
    }

    console.log(`🍎 Product: ${product.productName} (Seller ID: ${product.farmerId || product.agentId})`);

    // 3. Mock cart
    const items = [{
        productId: product.id,
        quantity: product.minOrderQuantity || 1,
        product: product
    }];

    // 4. Calculations
    const productSubtotal = items.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    const platformFee = Math.round(productSubtotal * 0.02);
    const total = productSubtotal + platformFee;

    const idempotencyId = `test_ord_${Date.now()}`;

    console.log(`💵 Total: ${total}, Fee: ${platformFee}`);

    try {
        const result = await prisma.$transaction(async (tx) => {
            console.log("➡️ Step 1: Creating Order...");
            const newOrder = await tx.order.create({
                data: {
                    id: idempotencyId,
                    buyerId: user.id,
                    totalAmount: total,
                    platformFee: platformFee,
                    sellerAmount: productSubtotal - platformFee,
                    paymentStatus: "PENDING",
                    orderStatus: "PROCESSING",
                    paymentMethod: "ONLINE",
                    shippingAddress: "Test Address",
                    buyerPhone: "1234567890",
                    buyerName: "Test Buyer"
                }
            });

            console.log("➡️ Step 2: Creating Order Item...");
            await tx.orderItem.create({
                data: {
                    orderId: newOrder.id,
                    productId: product.id,
                    quantity: items[0].quantity,
                    priceAtPurchase: product.pricePerUnit,
                    sellerId: product.farmerId || product.agentId,
                    sellerType: product.sellerType,
                    sellerName: "Test Seller"
                }
            });

            console.log("➡️ Step 3: Decrementing Stock...");
            const updateResult = await tx.productListing.updateMany({
                where: { 
                    id: product.id,
                    availableStock: { gte: items[0].quantity } 
                },
                data: { 
                    availableStock: { decrement: items[0].quantity }
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Insufficient stock");
            }

            console.log("✅ Transaction Logic Success!");
            return newOrder;
        });

        console.log("🎉 Simulation Success! Order Created:", result.id);
        
        // Clean up
        await prisma.orderItem.deleteMany({ where: { orderId: result.id } });
        await prisma.order.delete({ where: { id: result.id } });
        await prisma.productListing.update({ where: { id: product.id }, data: { availableStock: { increment: items[0].quantity } } });
        console.log("🧹 Cleaned up test data.");

    } catch (err) {
        console.error("❌ Simulation Failed:", err.message);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

testCheckout();
