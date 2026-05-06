import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeliveryBoys() {
  const boys = await prisma.deliveryProfile.findMany({
    where: { approvalStatus: 'APPROVED' },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      approvalStatus: true,
      isOnline: true
    }
  });

  console.log('Approved Delivery Boys:', JSON.stringify(boys, null, 2));

  // Also check some orders to see their lat/lng
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      lat: true,
      lng: true,
      shippingAddress: true
    }
  });
  console.log('Recent Orders:', JSON.stringify(orders, null, 2));
}

checkDeliveryBoys()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
