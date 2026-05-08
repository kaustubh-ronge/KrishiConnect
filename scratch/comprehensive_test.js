
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
    console.log("--- Starting Comprehensive Payment System Tests ---");
    try {
        // 0. Find a valid user
        const testUser = await prisma.user.findFirst();
        if (!testUser) {
            console.log("No users found in DB. Please create one first.");
            return;
        }
        const buyerId = testUser.id;
        console.log(`Testing with User: ${buyerId}`);

        // 0. Find a valid product
        const product = await prisma.productListing.findFirst();
        if (!product) {
            console.log("No products found in DB. Please create one first.");
            return;
        }
        const productId = product.id;
        const initialProduct = product;
        console.log(`Testing with Product: ${product.productName} (${productId})`);
        console.log(`Initial Stock: ${initialProduct.availableStock}`);

        // --- SCENARIO 1: COD ORDER ---
        console.log("\nScenario 1: COD Order");
        const codOrder = await prisma.order.create({
            data: {
                buyerId,
                totalAmount: 100,
                platformFee: 5,
                sellerAmount: 95,
                paymentMethod: 'COD',
                paymentStatus: 'PENDING',
                orderStatus: 'PROCESSING',
                shippingAddress: 'Test Address',
                buyerName: 'Test Buyer',
                buyerPhone: '1234567890',
                items: {
                    create: {
                        productId,
                        quantity: 2,
                        priceAtPurchase: 50,
                        sellerId: initialProduct.farmerId || initialProduct.agentId,
                        sellerType: initialProduct.sellerType,
                        sellerName: 'Test Seller'
                    }
                }
            }
        });
        // Simulating stock decrement (as initiateCheckout would do)
        await prisma.productListing.update({ where: { id: productId }, data: { availableStock: { decrement: 2 } } });
        console.log(`COD Order Created: ${codOrder.id}`);

        // Check Visibility
        const buyerOrders = await prisma.order.findMany({
            where: {
                buyerId,
                OR: [{ paymentStatus: 'PAID' }, { paymentMethod: 'COD', paymentStatus: 'PENDING' }]
            }
        });
        const foundCod = buyerOrders.find(o => o.id === codOrder.id);
        console.log(foundCod ? "✅ PASS: COD Order visible in Buyer Dashboard" : "❌ FAIL: COD Order hidden from Buyer Dashboard");

        const recoveryOrders = await prisma.order.findMany({
            where: { buyerId, paymentStatus: 'PENDING', paymentMethod: 'ONLINE' }
        });
        const foundCodInRecovery = recoveryOrders.find(o => o.id === codOrder.id);
        console.log(!foundCodInRecovery ? "✅ PASS: COD Order hidden from Recovery Cart" : "❌ FAIL: COD Order visible in Recovery Cart");


        // --- SCENARIO 2: ONLINE ABANDONED ORDER ---
        console.log("\nScenario 2: Online Abandoned Order");
        const onlineOrder = await prisma.order.create({
            data: {
                buyerId,
                totalAmount: 200,
                platformFee: 10,
                sellerAmount: 190,
                paymentMethod: 'ONLINE',
                paymentStatus: 'PENDING',
                orderStatus: 'PROCESSING',
                shippingAddress: 'Test Address',
                buyerName: 'Test Buyer',
                buyerPhone: '1234567890',
                items: {
                    create: {
                        productId,
                        quantity: 3,
                        priceAtPurchase: 60,
                        sellerId: initialProduct.farmerId || initialProduct.agentId,
                        sellerType: initialProduct.sellerType,
                        sellerName: 'Test Seller'
                    }
                }
            }
        });
        await prisma.productListing.update({ where: { id: productId }, data: { availableStock: { decrement: 3 } } });
        console.log(`Online Pending Order Created: ${onlineOrder.id}`);

        // Check Visibility
        const buyerOrdersOnline = await prisma.order.findMany({
            where: {
                buyerId,
                OR: [{ paymentStatus: 'PAID' }, { paymentMethod: 'COD', paymentStatus: 'PENDING' }]
            }
        });
        const foundOnlineInDash = buyerOrdersOnline.find(o => o.id === onlineOrder.id);
        console.log(!foundOnlineInDash ? "✅ PASS: Online Pending Order hidden from Dashboards" : "❌ FAIL: Online Pending Order visible in Dashboards");

        const recoveryOrdersOnline = await prisma.order.findMany({
            where: { buyerId, paymentStatus: 'PENDING', paymentMethod: 'ONLINE' }
        });
        const foundOnlineInRecovery = recoveryOrdersOnline.find(o => o.id === onlineOrder.id);
        console.log(foundOnlineInRecovery ? "✅ PASS: Online Pending Order visible in Recovery Cart" : "❌ FAIL: Online Pending Order hidden from Recovery Cart");


        // --- SCENARIO 3: CANCEL & RESTORE STOCK ---
        console.log("\nScenario 3: Cancel Order & Restore Stock");
        const stockBeforeCancel = (await prisma.productListing.findUnique({ where: { id: productId } })).availableStock;
        console.log(`Stock before cancel: ${stockBeforeCancel}`);

        // Simulate cancelPendingOrder logic
        await prisma.$transaction(async (tx) => {
            const orderToCancel = await tx.order.findUnique({ where: { id: onlineOrder.id }, include: { items: true } });
            for (const item of orderToCancel.items) {
                await tx.productListing.update({ where: { id: item.productId }, data: { availableStock: { increment: item.quantity } } });
            }
            await tx.order.update({ where: { id: onlineOrder.id }, data: { orderStatus: 'CANCELLED', paymentStatus: 'CANCELLED' } });
        });

        const stockAfterCancel = (await prisma.productListing.findUnique({ where: { id: productId } })).availableStock;
        console.log(`Stock after cancel: ${stockAfterCancel}`);
        console.log(stockAfterCancel === stockBeforeCancel + 3 ? "✅ PASS: Stock restored correctly" : "❌ FAIL: Stock restoration mismatch");


        // Cleanup
        await prisma.orderItem.deleteMany({ where: { orderId: { in: [codOrder.id, onlineOrder.id] } } });
        await prisma.order.deleteMany({ where: { id: { in: [codOrder.id, onlineOrder.id] } } });
        await prisma.productListing.update({ where: { id: productId }, data: { availableStock: initialProduct.availableStock } });
        console.log("\nCleanup done. Tests Finished.");

    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
