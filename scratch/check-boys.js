
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const boys = await prisma.deliveryProfile.findMany({
    select: {
      id: true,
      name: true,
      approvalStatus: true,
      isOnline: true,
      lat: true,
      lng: true
    }
  });
  console.log("Delivery Boys in DB:", JSON.stringify(boys, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
