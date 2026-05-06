
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runPerformanceAudit() {
    console.log("⚡ KRISHICONNECT PERFORMANCE & LOAD AUDIT");
    console.log("==========================================");

    const results = [];

    async function benchmark(name, fn) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        results.push({ name, duration });
        console.log(`   [${name}] took ${duration}ms`);
    }

    try {
        console.log("🔥 WARMING UP (Connecting to DB)...");
        await db.productListing.findFirst();
        console.log("✅ WARMED UP.");

        // 1. Marketplace Fetch (Large Scale Simulation)
        await benchmark("Marketplace Fetch", async () => {
            return db.productListing.findMany({
                where: { isAvailable: true },
                take: 50,
                include: { farmer: true, agent: true }
            });
        });

        // 2. Admin Stats (Aggregation Check)
        await benchmark("Admin Stats Calculation", async () => {
            const paidOrders = await db.order.findMany({ where: { paymentStatus: "PAID" } });
            paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        });

        // 3. Seller Sales (Filtered Joins)
        await benchmark("Seller Sales Fetch", async () => {
            return db.orderItem.findMany({
                where: { order: { paymentStatus: "PAID" } },
                include: { product: true, order: true }
            });
        });

        // 4. Cart Logic (Atomic Updates)
        await benchmark("Atomic Cart Update", async () => {
             await db.cartItem.upsert({
                where: { cartId_productId: { cartId: 'sys_cart', productId: 'sys_prod' } },
                update: { quantity: { increment: 1 } },
                create: { cartId: 'sys_cart', productId: 'sys_prod', quantity: 1 }
            }).catch(() => {}); // Catch if sys IDs don't exist, we just want to measure query overhead
        });

        console.log("\n📊 PERFORMANCE VERDICT:");
        const slow = results.filter(r => parseFloat(r.duration) > 200);
        if (slow.length > 0) {
            console.log(`   ⚠️ Found ${slow.length} slow operations (>200ms).`);
            slow.forEach(s => console.log(`   - ${s.name}: ${s.duration}ms`));
        } else {
            console.log("   ✅ All core operations within acceptable limits (<200ms).");
        }

    } catch (err) {
        console.error("❌ PERFORMANCE AUDIT ERROR:", err.message);
    } finally {
        await db.$disconnect();
    }
}

runPerformanceAudit();
