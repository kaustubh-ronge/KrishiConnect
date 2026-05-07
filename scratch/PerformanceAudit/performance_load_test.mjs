
import { db } from '../../lib/prisma.js';

async function runPerformanceLoadTest() {
    console.log("🚀 INITIATING PERFORMANCE LOAD TEST (500 Products)");

    try {
        const user = await db.user.create({ data: { id: "PERF_USER", email: "perf@test.com", role: "farmer" } });
        const profile = await db.farmerProfile.create({ data: { userId: user.id, name: "Perf Farm" } });

        console.log("⌛ Seeding 500 products...");
        const productsData = Array.from({ length: 500 }).map((_, i) => ({
            productName: `Product ${i}`,
            pricePerUnit: 10 + i,
            availableStock: 100,
            unit: "kg",
            quantityLabel: "1kg",
            sellerType: "farmer",
            farmerId: profile.id,
            isAvailable: true,
            category: "VEGETABLES"
        }));

        await db.productListing.createMany({ data: productsData });

        console.log("⏱️ Testing Query Performance...");
        const start = Date.now();
        
        // Mocking getProductsEnhanced logic with heavy filter
        const results = await db.productListing.findMany({
            where: {
                isAvailable: true,
                availableStock: { gt: 0 },
                productName: { contains: "49", mode: 'insensitive' }
            },
            include: { farmer: true }
        });

        const duration = Date.now() - start;
        console.log(`✅ Fetched ${results.length} results in ${duration}ms`);

        if (duration > 500) {
            console.warn("⚠️ PERFORMANCE ALERT: Query took > 500ms. Consider adding indexes to productName and availableStock.");
        } else {
            console.log("💎 Performance within acceptable limits.");
        }

        // Cleanup
        await db.productListing.deleteMany({ where: { farmerId: profile.id } });
        await db.farmerProfile.delete({ where: { id: profile.id } });
        await db.user.delete({ where: { id: user.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

runPerformanceLoadTest().catch(console.error);
