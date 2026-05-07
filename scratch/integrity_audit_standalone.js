
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log("🚀 Starting Comprehensive Database Integrity Audit...");

    try {
        // Audit: Check if any orders exist with quantity < product.minOrderQuantity
        console.log("1️⃣  Checking for Minimum Quantity Violations...");
        const violations = await prisma.orderItem.findMany({
            include: { product: true }
        });

        const invalidItems = violations.filter(it => it.product && it.quantity < (it.product.minOrderQuantity || 0));
        
        if (invalidItems.length > 0) {
            console.log(`   ⚠️ FOUND ${invalidItems.length} INTEGRITY VIOLATIONS in existing orders!`);
            invalidItems.forEach(it => {
                console.log(`   - Order #${it.orderId}: Product ${it.product.productName} has Qty ${it.quantity} but Min is ${it.product.minOrderQuantity}`);
            });
        } else {
            console.log("   ✅ No minimum quantity violations found.");
        }

        // Audit: Check self-purchase violations
        console.log("\n2️⃣  Checking for Self-Purchase Violations...");
        const selfPurchases = await prisma.orderItem.findMany({
            include: { 
                product: true,
                order: { 
                    include: { 
                        buyerUser: { 
                            include: { 
                                farmerProfile: { select: { id: true } }, 
                                agentProfile: { select: { id: true } } 
                            } 
                        } 
                    } 
                }
            }
        });

        const spViolations = selfPurchases.filter(it => {
            const buyer = it.order.buyerUser;
            if (!buyer) return false;
            if (it.product.farmerId && buyer.farmerProfile?.id === it.product.farmerId) return true;
            if (it.product.agentId && buyer.agentProfile?.id === it.product.agentId) return true;
            return false;
        });

        if (spViolations.length > 0) {
            console.log(`   ⚠️ FOUND ${spViolations.length} SELF-PURCHASE VIOLATIONS!`);
            spViolations.forEach(it => {
                console.log(`   - Order #${it.orderId}: User ${it.order.buyerId} purchased their own product ${it.product.productName}`);
            });
        } else {
            console.log("   ✅ No self-purchase violations found.");
        }

        // Audit: Check for PENDING orders that might be stale
        console.log("\n3️⃣  Checking for Stale PENDING Orders...");
        const staleOrders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PENDING',
                createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } // 30 mins old
            }
        });

        if (staleOrders.length > 0) {
            console.log(`   ℹ️ Found ${staleOrders.length} stale PENDING orders older than 30 minutes.`);
        } else {
            console.log("   ✅ No stale PENDING orders found.");
        }

        console.log("\n🏁 Audit Complete.");

    } catch (err) {
        console.error("❌ Audit Failed:", err);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

runTest();
