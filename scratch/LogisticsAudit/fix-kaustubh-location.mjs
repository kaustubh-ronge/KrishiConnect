import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateKaustubhLocation() {
  const updated = await prisma.deliveryProfile.updateMany({
    where: { name: { contains: 'Kaustubh' } },
    data: {
      lat: 17.67,
      lng: 75.33,
      isOnline: true // Make sure he's online too
    }
  });

  console.log('Updated rows:', updated.count);
}

updateKaustubhLocation()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
