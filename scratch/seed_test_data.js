const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data for Large Range Delivery Constraints...');

  // 1. Create a Seller (Farmer) in Pune
  const puneFarmer = await prisma.user.upsert({
    where: { email: 'pune_farmer@test.com' },
    update: {},
    create: {
      id: 'user_pune_farmer_123',
      email: 'pune_farmer@test.com',
      role: 'farmer',
      name: 'Pune Organic Farms',
      farmerProfile: {
        create: {
          name: 'Pune Organic Farms',
          farmName: 'Pune Valley Grapes',
          phone: '9876543210',
          address: 'Hadapsar, Pune, Maharashtra',
          city: 'Pune',
          state: 'Maharashtra',
          lat: 18.5204,
          lng: 73.8567,
          maxDeliveryRange: 50, // 50 KM Range
          deliveryPricePerKm: 12,
          sellingStatus: 'APPROVED',
          usagePurpose: 'buy_and_sell'
        }
      }
    },
    include: { farmerProfile: true }
  });

  // 2. Create a Product for this Farmer
  const grapes = await prisma.productListing.create({
    data: {
      productName: 'Premium Export Grapes',
      description: 'Sweet seedless grapes from Pune valley. High quality.',
      category: 'Fruits',
      quantityLabel: 'Per Box',
      availableStock: 500,
      unit: 'kg',
      pricePerUnit: 65,
      deliveryCharge: 20,
      deliveryChargeType: 'per_unit',
      isAvailable: true,
      sellerType: 'farmer',
      farmerId: puneFarmer.farmerProfile.id,
      images: ['https://images.unsplash.com/photo-1537084642907-629340c7e59c']
    }
  });

  // 3. Create Delivery Partners at different locations
  
  // DP 1: Near Pune (Pickup Point)
  await prisma.user.upsert({
    where: { email: 'dp_pune@test.com' },
    update: {},
    create: {
      id: 'user_dp_pune_123',
      email: 'dp_pune@test.com',
      role: 'delivery',
      name: 'Pune Speed Delivery',
      deliveryProfile: {
        create: {
          name: 'Pune Speed Delivery',
          phone: '9000000001',
          city: 'Pune',
          lat: 18.5000,
          lng: 73.8000,
          radius: 100,
          pricePerKm: 8,
          isOnline: true,
          approvalStatus: 'APPROVED'
        }
      }
    }
  });

  // DP 2: Near Pandharpur (User Location)
  await prisma.user.upsert({
    where: { email: 'dp_pandharpur@test.com' },
    update: {},
    create: {
      id: 'user_dp_pandharpur_123',
      email: 'dp_pandharpur@test.com',
      role: 'delivery',
      name: 'Vitthal Logistics Pandharpur',
      deliveryProfile: {
        create: {
          name: 'Vitthal Logistics Pandharpur',
          phone: '9000000002',
          city: 'Pandharpur',
          lat: 17.6700,
          lng: 75.3300,
          radius: 150,
          pricePerKm: 10,
          isOnline: true,
          approvalStatus: 'APPROVED'
        }
      }
    }
  });

  // DP 3: Mid-way (Solapur)
  await prisma.user.upsert({
    where: { email: 'dp_solapur@test.com' },
    update: {},
    create: {
      id: 'user_dp_solapur_123',
      email: 'dp_solapur@test.com',
      role: 'delivery',
      name: 'Solapur Express',
      deliveryProfile: {
        create: {
          name: 'Solapur Express',
          phone: '9000000003',
          city: 'Solapur',
          lat: 17.6599,
          lng: 75.9064,
          radius: 100,
          pricePerKm: 9,
          isOnline: true,
          approvalStatus: 'APPROVED'
        }
      }
    }
  });

  console.log('Seeding complete!');
  console.log('Scenario:');
  console.log('Seller: Pune (18.5204, 73.8567) - Range 50KM');
  console.log('Buyer Target: Pandharpur (17.6715, 75.3344) - Distance ~215KM');
  console.log('Result: Should show OUT OF RANGE / Special Delivery Request.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
