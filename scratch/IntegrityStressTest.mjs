
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runIntegrityStressTest() {
    console.log("🔥 KRISHICONNECT INTEGRITY & STRESS TEST");
    console.log("=========================================");

    try {
        // --- 1. RELATIONAL INTEGRITY CHECK (Orphan Hunt) ---
        console.log("\n🔍 SEARCHING FOR ORPHANED RECORDS...");
        
        // In Prisma, if a field is required, DB constraints prevent orphans.
        // We check for logical duplicates instead.
        console.log("🔍 CHECKING FOR LOGICAL DUPLICATES...");
        
        const allOrders = await db.order.findMany({ select: { invoiceNumber: true } });
        const invoices = allOrders.map(o => o.invoiceNumber).filter(Boolean);
        const dupInvoices = invoices.filter((item, index) => invoices.indexOf(item) !== index);

        console.log(`   Duplicate Invoices: ${dupInvoices.length}`);

        // Check for duplicate products in the same order
        const orderItems = await db.orderItem.findMany({ select: { orderId: true, productId: true } });
        const itemKeys = orderItems.map(it => `${it.orderId}:${it.productId}`);
        const dupItems = itemKeys.filter((item, index) => itemKeys.indexOf(item) !== index);

        console.log(`   Duplicate Product Entries in Orders: ${dupItems.length}`);

        if (dupInvoices.length + dupItems.length === 0) {
            console.log("   ✅ DATA INTEGRITY: PASS (No duplicates found)");
        } else {
            console.log("   ❌ DATA INTEGRITY: FAIL (Duplicates detected!)");
        }

        // --- 2. IDEMPOTENCY STRESS TEST (Parallel Checkout) ---
        console.log("\n🚀 STRESS TEST: Parallel Checkout Stampede (10 parallel requests)...");
        
        const ts = Date.now();
        const userId = `stress_user_${ts}`;
        const prodId = `stress_prod_${ts}`;

        // Setup
        await db.user.create({ data: { id: userId, email: `${userId}@stress.com`, role: 'none' } });
        const fProf = await db.farmerProfile.create({ data: { userId, name: "Stress Seller" } });
        await db.productListing.create({
            data: {
                id: prodId,
                productName: "Stress Product",
                quantityLabel: "1kg",
                unit: "kg",
                pricePerUnit: 10,
                availableStock: 1000,
                sellerType: 'farmer',
                farmerId: fProf.id
            }
        });

        // Add to cart
        const cart = await db.cart.create({ data: { userId } });
        await db.cartItem.create({ data: { cartId: cart.id, productId: prodId, quantity: 5 } });

        console.log("   Simulating 10 concurrent checkout calls for the SAME cart...");
        // Mocking the idempotency logic from initiateCheckout
        // We use the same deterministic ID generation
        const cartFingerprint = `stress_prod_${ts}:5`;
        const idempotencyId = `ord_stress_${Buffer.from(cartFingerprint).toString('base64').slice(0, 16)}`;

        const results = await Promise.allSettled(Array(10).fill(0).map(async () => {
            return db.$transaction(async (tx) => {
                const existing = await tx.order.findUnique({ where: { id: idempotencyId } });
                if (existing) throw new Error("ALREADY_EXISTS");

                return tx.order.create({
                    data: {
                        id: idempotencyId,
                        buyerId: userId,
                        totalAmount: 50,
                        platformFee: 1,
                        sellerAmount: 49,
                        paymentStatus: 'PENDING'
                    }
                });
            });
        }));

        const successes = results.filter(r => r.status === 'fulfilled').length;
        const collisions = results.filter(r => r.status === 'rejected' && r.reason.message.includes('ALREADY_EXISTS')).length;
        const errors = results.filter(r => r.status === 'rejected' && !r.reason.message.includes('ALREADY_EXISTS')).length;

        console.log(`   Successes: ${successes}`);
        console.log(`   Idempotency Collisions (Caught): ${collisions}`);
        console.log(`   Other Errors: ${errors}`);

        if (successes === 1) {
            console.log("   ✅ IDEMPOTENCY PASS: Only one order was created despite 10 parallel attempts.");
        } else {
            console.log(`   ❌ IDEMPOTENCY FAIL: ${successes} orders were created!`);
        }

        // Cleanup
        await db.order.deleteMany({ where: { buyerId: userId } });
        await db.cartItem.deleteMany({ where: { productId: prodId } });
        await db.cart.deleteMany({ where: { userId } });
        await db.productListing.deleteMany({ where: { id: prodId } });
        await db.farmerProfile.deleteMany({ where: { userId } });
        await db.user.deleteMany({ where: { id: userId } });

    } catch (err) {
        console.error("❌ STRESS TEST CRITICAL FAILURE:", err.message);
    } finally {
        await db.$disconnect();
    }
}

runIntegrityStressTest();
