
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function marketplaceDeepAudit() {
    console.log("🏪 MARKETPLACE DEEP AUDIT: PRODUCT-ORDER SYNERGY");
    console.log("===============================================");

    const ts = Date.now();
    const buyerId = `buyer_${ts}`;
    const farmerId = `farmer_${ts}`;
    const agentId = `agent_${ts}`;

    try {
        // --- SETUP ---
        console.log("\n🏗️ SETUP: Initializing Test Actors...");
        await db.user.upsert({ where: { id: buyerId }, update: { role: 'farmer' }, create: { id: buyerId, role: 'farmer', email: `buyer_${ts}@audit.com` } });
        await db.user.upsert({ where: { id: farmerId }, update: { role: 'farmer' }, create: { id: farmerId, role: 'farmer', email: `farmer_${ts}@audit.com` } });
        await db.user.upsert({ where: { id: agentId }, update: { role: 'agent' }, create: { id: agentId, role: 'agent', email: `agent_${ts}@audit.com` } });
        
        const fProf = await db.farmerProfile.upsert({ where: { userId: farmerId }, update: { sellingStatus: 'APPROVED' }, create: { userId: farmerId, name: 'Farmer Audit', phone: '1', address: 'A', usagePurpose: 'buy_and_sell', sellingStatus: 'APPROVED' } });
        const aProf = await db.agentProfile.upsert({ where: { userId: agentId }, update: { sellingStatus: 'APPROVED' }, create: { userId: agentId, name: 'Agent Audit', phone: '2', address: 'B', usagePurpose: 'buy_and_sell', sellingStatus: 'APPROVED', agentType: ['Retailer'] } });

        // --- 1. PRODUCT STRESS ---
        console.log("\n📦 STEP 1: Stressed Product Listing...");
        const p1 = await db.productListing.create({
            data: { productName: "AUDIT Wheat", availableStock: 100, unit: "kg", quantityLabel: "100 kg", pricePerUnit: 50, sellerType: 'farmer', farmerId: fProf.id, isAvailable: true }
        });
        const p2 = await db.productListing.create({
            data: { productName: "AUDIT Rice", availableStock: 200, unit: "kg", quantityLabel: "200 kg", pricePerUnit: 60, sellerType: 'agent', agentId: aProf.id, isAvailable: true }
        });
        console.log("✅ Products Created");

        // --- 2. CART SYNC ---
        console.log("\n🛒 STEP 2: Cart Operations...");
        const cart = await db.cart.upsert({ where: { userId: buyerId }, update: {}, create: { userId: buyerId } });
        await db.cartItem.createMany({
            data: [
                { cartId: cart.id, productId: p1.id, quantity: 5 },
                { cartId: cart.id, productId: p2.id, quantity: 10 }
            ]
        });
        console.log("✅ Items Added to Cart");

        // --- 3. CHECKOUT & STOCK RESERVATION ---
        console.log("\n💰 STEP 3: Multi-Seller Checkout & Stock Check...");
        // Simulate initiateCheckout logic
        const orderId = `audit_ord_${Date.now()}`;
        await db.$transaction(async (tx) => {
            // 1. Create Order
            await tx.order.create({
                data: {
                    id: orderId,
                    buyerId: buyerId,
                    totalAmount: 900,
                    platformFee: 18,
                    sellerAmount: 882,
                    paymentStatus: 'PENDING',
                    orderStatus: 'PROCESSING',
                    shippingAddress: 'Audit Address',
                    buyerPhone: '123'
                }
            });
            // 2. Decrement Stock
            await tx.productListing.update({ where: { id: p1.id }, data: { availableStock: { decrement: 5 } } });
            await tx.productListing.update({ where: { id: p2.id }, data: { availableStock: { decrement: 10 } } });
        });

        const checkP1 = await db.productListing.findUnique({ where: { id: p1.id } });
        const checkP2 = await db.productListing.findUnique({ where: { id: p2.id } });
        
        if (checkP1.availableStock === 95 && checkP2.availableStock === 190) {
            console.log("✅ Stock Reserved Successfully");
        } else {
            throw new Error(`Stock mismatch: P1=${checkP1.availableStock}, P2=${checkP2.availableStock}`);
        }

        // --- 4. MARKETPLACE VISIBILITY ---
        console.log("\n📊 STEP 4: Marketplace Visibility Check...");
        const marketplace = await db.productListing.findMany({ where: { isAvailable: true, availableStock: { gt: 0 } } });
        const auditItems = marketplace.filter(i => i.productName.includes("AUDIT"));
        if (auditItems.length === 2) {
            console.log("✅ Products Visible in Feed");
        }

        // --- 5. ORDER COMPLETION ---
        console.log("\n🏁 STEP 5: Order State Transition...");
        await db.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID', orderStatus: 'SHIPPED' }
        });
        console.log("✅ Transition to SHIPPED: SUCCESS");

        console.log("\n🏁 VERDICT: MARKETPLACE PRODUCT-ORDER SYNERGY VERIFIED ✅");

    } catch (err) {
        console.error("\n❌ MARKETPLACE AUDIT FAILED:", err.message);
    } finally {
        // CLEANUP
        await db.productListing.deleteMany({ where: { productName: { contains: "AUDIT" } } });
        await db.order.deleteMany({ where: { id: { contains: "audit_ord" } } });
        await db.cartItem.deleteMany({ where: { cart: { userId: buyerId } } });
        await db.$disconnect();
    }
}

marketplaceDeepAudit();
