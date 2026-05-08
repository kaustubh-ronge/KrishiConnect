const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runExtremeLoadTest() {
  console.log("=========================================");
  console.log("🚀 STARTING EXTREME LOAD CONCURRENCY TEST");
  console.log("=========================================");

  // 1. Setup Data
  const stockToCreate = 5;
  console.log(`[SETUP] Creating a product with exactly ${stockToCreate} units in stock...`);
  
  // We need a dummy user for the farmer
  const dummyUser = await prisma.user.upsert({
    where: { id: 'test_load_user' },
    update: {},
    create: {
      id: 'test_load_user',
      email: 'test_load@example.com',
      role: 'farmer',
      farmerProfile: {
        create: {
          name: 'Load Test Farmer',
          phone: '0000000000',
          sellingStatus: 'APPROVED',
          lat: 18.0,
          lng: 73.0
        }
      }
    },
    include: { farmerProfile: true }
  });

  const testProduct = await prisma.productListing.create({
    data: {
      productName: 'Load Test Tomato',
      description: 'Used for extreme concurrency testing',
      category: 'Vegetables',
      quantityLabel: 'Per Kg',
      availableStock: stockToCreate,
      unit: 'kg',
      pricePerUnit: 20,
      sellerType: 'farmer',
      farmerId: dummyUser.farmerProfile.id,
    }
  });

  console.log(`[SETUP] Product created: ${testProduct.id} with Stock: ${testProduct.availableStock}`);

  // 2. Simulate Extreme Concurrency (50 concurrent purchase attempts of 1 unit)
  const concurrentAttempts = 50;
  console.log(`\n[TEST] Firing ${concurrentAttempts} concurrent purchase transactions trying to buy 1 unit each...`);
  
  let successCount = 0;
  let failCount = 0;

  // The core transaction logic from actions/orders.js initiateCheckout
  const attemptPurchase = async (attemptId) => {
    try {
      await prisma.$transaction(async (tx) => {
        // Mock order creation
        const newOrder = await tx.order.create({
          data: {
            id: `ord_load_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            buyerId: dummyUser.id,
            totalAmount: 20,
            platformFee: 0,
            deliveryFee: 0,
            sellerAmount: 20,
            paymentStatus: 'PENDING',
            orderStatus: 'PROCESSING',
          }
        });

        // The critical concurrency barrier
        const updateResult = await tx.productListing.updateMany({
          where: {
            id: testProduct.id,
            availableStock: { gte: 1 } // Must have at least 1
          },
          data: {
            availableStock: { decrement: 1 }
          }
        });

        if (updateResult.count === 0) {
          throw new Error(`Insufficient stock`);
        }
        
        return newOrder;
      }, { timeout: 10000 }); // strict timeout

      successCount++;
    } catch (e) {
      failCount++;
    }
  };

  // Fire all promises at the exact same time
  const promises = [];
  for (let i = 0; i < concurrentAttempts; i++) {
    promises.push(attemptPurchase(i));
  }

  await Promise.all(promises);

  // 3. Verify Results
  console.log("\n=========================================");
  console.log("📊 LOAD TEST RESULTS");
  console.log("=========================================");
  console.log(`Total Attempts: ${concurrentAttempts}`);
  console.log(`Successful Purchases: ${successCount}`);
  console.log(`Failed Purchases (Blocked by DB): ${failCount}`);

  const finalProductState = await prisma.productListing.findUnique({
    where: { id: testProduct.id }
  });

  console.log(`Final Database Stock: ${finalProductState.availableStock}`);

  if (successCount === stockToCreate && finalProductState.availableStock === 0) {
    console.log("✅ PASSED: The database successfully prevented negative stock conditions under extreme concurrency!");
  } else {
    console.log("❌ FAILED: Concurrency violation detected!");
  }

  // Cleanup
  console.log("\n[CLEANUP] Removing test data...");
  await prisma.productListing.delete({ where: { id: testProduct.id } });
  
}

runExtremeLoadTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
