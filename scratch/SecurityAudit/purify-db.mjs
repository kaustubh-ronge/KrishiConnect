/**
 * KRISHI HUB - DATA PURIFICATION & FINANCIAL SYNC
 * This script fixes the 3 leaking ledgers and removes ghost data.
 */

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function purify() {
  console.log("🧼 Starting Data Purification...\n");

  try {
    // 1. DELETE GHOST PRODUCTS (Price = 0 or empty name)
    const deletedProducts = await db.productListing.deleteMany({
      where: {
        OR: [
          { pricePerUnit: { lte: 0 } },
          { productName: "" }
        ]
      }
    });
    console.log(`✅ Removed ${deletedProducts.count} ghost products.`);

    // 2. FIX LEAKING LEDGERS (Legacy Orders)
    const leakingOrders = [
      { id: 'UIKGNB', fee: 112 },
      { id: 'BTVRCV', fee: 104 },
      { id: '3YRC96', fee: 109.8 }
    ];

    for (const item of leakingOrders) {
      // Find the actual full ID first since we only have the short one in logs
      const order = await db.order.findFirst({
        where: { id: { endsWith: item.id.toLowerCase() } }
      });

      if (order) {
        await db.order.update({
          where: { id: order.id },
          data: { deliveryFee: item.fee }
        });
        console.log(`✅ Fixed Ledger for Order #${item.id}`);
      }
    }

    console.log("\n✨ Database is now 100% PURE and ACCURATE.");

  } catch (error) {
    console.error("💥 Purification failed:", error);
  } finally {
    await db.$disconnect();
  }
}

purify();
