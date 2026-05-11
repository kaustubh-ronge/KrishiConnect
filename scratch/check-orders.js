const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count();
  const orders = await prisma.order.findMany({
    where: { isSpecialDelivery: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total special delivery orders:', orders.length);
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
