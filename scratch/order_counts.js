
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCounts() {
    console.log("📊 Global Order Status Snapshot:");
    try {
        const orderCounts = await prisma.order.groupBy({
            by: ['paymentStatus', 'orderStatus'],
            _count: { id: true }
        });

        if (orderCounts.length === 0) {
            console.log("❌ NO ORDERS FOUND IN DATABASE AT ALL.");
        } else {
            orderCounts.forEach(c => {
                console.log(`- [Payment: ${c.paymentStatus}] [Order: ${c.orderStatus}]: ${c._count.id} orders`);
            });
        }

        const itemsCount = await prisma.orderItem.count();
        console.log(`\n📦 Total Order Items: ${itemsCount}`);

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

checkCounts();
