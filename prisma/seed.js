const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding distance-test data...');

  // 1. Create a Farmer in Delhi (Far away from Pandharpur)
  const delhiUser = await prisma.user.upsert({
    where: { email: 'delhi.farmer@test.com' },
    update: {},
    create: {
      id: 'test_delhi_farmer_id',
      email: 'delhi.farmer@test.com',
      name: 'Delhi Farmer Raj',
      role: 'farmer',
    },
  });

  const delhiFarmer = await prisma.farmerProfile.upsert({
    where: { userId: delhiUser.id },
    update: {},
    create: {
      userId: delhiUser.id,
      name: 'Delhi Farmer Raj',
      farmName: 'North Indian Vineyards',
      phone: '9999988888',
      address: 'Near Red Fort, Delhi',
      city: 'Delhi',
      state: 'DL',
      lat: 28.6139,
      lng: 77.2090,
      maxDeliveryRange: 100, // 100km limit
      usagePurpose: 'buy_and_sell',
      sellingStatus: 'APPROVED',
    },
  });

  // 2. Create a Product for this far-away farmer
  await prisma.productListing.create({
    data: {
      productName: 'Premium Delhi Grapes',
      description: 'Special grapes from the north. Very far from Pandharpur!',
      category: 'Fruits',
      quantityLabel: '100 kg available',
      availableStock: 100,
      unit: 'kg',
      pricePerUnit: 120,
      deliveryCharge: 50,
      deliveryChargeType: 'flat',
      maxDeliveryRange: 50, // Even tighter limit for the product
      isAvailable: true,
      sellerType: 'farmer',
      farmerId: delhiFarmer.id,
    },
  });

  console.log('✅ Distance-test data seeded successfully!');
  console.log('📍 Seller Location: Delhi (28.6139, 77.2090)');
  console.log('📍 Product: Premium Delhi Grapes (Range: 50km)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
