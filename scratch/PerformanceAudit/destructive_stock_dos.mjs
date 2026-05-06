
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runStockLockDoS() {
    console.log("🧨 INITIATING STOCK LOCK-IN DoS ATTACK SIMULATION");

    try {
        const product = await db.productListing.findFirst({ where: { availableStock: { gt: 10 } } });
        if (!product) {
            console.error("No product with enough stock found.");
            return;
        }

        console.log(`📦 Target Product: ${product.productName} (Initial Stock: ${product.availableStock})`);

        // We simulate the logic of initiateCheckout (decrementing stock)
        // without the subsequent confirmOrderPayment (restoring/finalizing)
        
        console.log("🔥 Spammig 10 checkout initiations...");
        
        for (let i = 0; i < 10; i++) {
            await db.$transaction(async (tx) => {
                const p = await tx.productListing.findUnique({ where: { id: product.id } });
                if (p.availableStock > 0) {
                    await tx.productListing.update({
                        where: { id: p.id },
                        data: { availableStock: { decrement: 1 } }
                    });
                }
            });
        }

        const finalProduct = await db.productListing.findUnique({ where: { id: product.id } });
        console.log(`📉 Final Stock: ${finalProduct.availableStock}`);
        console.log(`⚠️ RESULT: ${10} items are now LOCKED. If the user never pays, this stock is LOST unless a cleanup cron exists.`);

        if (finalProduct.availableStock === product.availableStock - 10) {
            console.warn("💀 VULNERABILITY CONFIRMED: Stock can be 'Hostaged' by repeatedly initiating checkout without payment.");
        }

        // Restore stock
        await db.productListing.update({
            where: { id: product.id },
            data: { availableStock: product.availableStock }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

runStockLockDoS().catch(console.error);
