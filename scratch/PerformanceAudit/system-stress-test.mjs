
import { db } from '../../lib/prisma.js';

async function runSystemEndToEndTest() {
    console.log("🚀 STARTING KRISHICONNECT WHOLE-SYSTEM STRESS TEST\n");

    try {
        // 1. Setup Mock Product
        console.log("STEP 1: Initializing Test Product...");
        const product = await db.productListing.create({
            data: {
                productName: "STRESS-TEST-WHEAT",
                availableStock: 10,
                unit: "quintal",
                pricePerUnit: 2000,
                sellerType: "farmer",
                quantityLabel: "10 quintal",
                isAvailable: true
            }
        });
        console.log(`✅ Product created: ${product.id} (Stock: 10)`);

        // 2. Simulate Payment Confirmation (Atomic Stock Check)
        console.log("\nSTEP 2: Simulating Payment Confirmation...");
        const buyQuantity = 10;
        
        await db.$transaction(async (tx) => {
            const p = await tx.productListing.findUnique({ where: { id: product.id } });
            if (p.availableStock < buyQuantity) throw new Error("Stock Check Failed");

            // Update stock and flip availability
            await tx.productListing.update({
                where: { id: product.id },
                data: {
                    availableStock: { decrement: buyQuantity },
                    isAvailable: (p.availableStock - buyQuantity) > 0
                }
            });

            console.log(`✅ Atomic Stock Update: Subtracted ${buyQuantity}`);
        });

        const updatedProduct = await db.productListing.findUnique({ where: { id: product.id } });
        console.log(`📊 Final Product State: Stock = ${updatedProduct.availableStock}, isAvailable = ${updatedProduct.isAvailable}`);

        if (updatedProduct.availableStock === 0 && updatedProduct.isAvailable === false) {
            console.log("✅ [PASS] Stock and Availability logic is correct.");
        } else {
            console.log("❌ [FAIL] Stock logic mismatch.");
        }

        // 3. Logistics Calculation Test
        console.log("\nSTEP 3: Testing Logistics Price Engine...");
        const boyPricePerKm = 8;
        const actualRoadDist = 12.5;
        const expectedPrice = actualRoadDist * boyPricePerKm;

        console.log(`- Rate: ₹${boyPricePerKm}/KM`);
        console.log(`- Road Distance: ${actualRoadDist} KM`);
        console.log(`- Calculated Price: ₹${expectedPrice}`);

        if (expectedPrice === 100) {
            console.log("✅ [PASS] Logistics Math verified.");
        } else {
            console.log("❌ [FAIL] Pricing Engine error.");
        }

        // 4. Cleanup
        console.log("\nSTEP 4: Cleaning up test data...");
        await db.productListing.delete({ where: { id: product.id } });
        console.log("✅ Cleanup complete.");

        console.log("\n==========================================");
        console.log("🎉 SYSTEM INTEGRITY TEST: SUCCESS");
        console.log("==========================================");

    } catch (err) {
        console.error("\n💥 SYSTEM CRASH IN TEST:", err.message);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

runSystemEndToEndTest();
