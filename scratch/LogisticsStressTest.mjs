LogisticsStressTest
import { db } from "../lib/prisma.js";
import { initiateCheckout, calculateDynamicDeliveryFee } from "../actions/orders.js";

async function runLogisticsTest() {
    console.log("🚀 STARTING LOGISTICS & FINANCIAL STRESS TEST\n");

    try {
        // 1. Setup Test Data
        const testUser = await db.user.findFirst({ where: { role: 'admin' } });
        const farmer = await db.farmerProfile.findFirst({ include: { user: true } });
        const product = await db.productListing.findFirst({
            where: { farmerId: farmer.id },
            include: { farmer: true }
        });

        if (!testUser || !farmer || !product) {
            console.error("❌ Missing test data. Ensure you have an admin user, a farmer, and a product.");
            return;
        }

        console.log(`📦 Testing with Product: ${product.productName} (Price: ₹${product.pricePerUnit})`);
        console.log(`🚜 Seller: ${farmer.name} (Rate: ₹${farmer.deliveryPricePerKm || 10}/km)`);

        // Create a mock cart item
        const cartItem = await db.cartItem.create({
            data: {
                cartId: "test-cart-id-" + Date.now(),
                productId: product.id,
                quantity: 2
            }
        });

        // 2. Test Scenario: Online Order with Location (Dynamic Fee)
        console.log("\n--- SCENARIO 1: ONLINE + DYNAMIC DELIVERY ---");
        const addressData = {
            name: "Test Buyer",
            phone: "1234567890",
            address: "123 Buyer Lane",
            paymentMethod: "ONLINE",
            lat: 18.5204, // Pune
            lng: 73.8567
        };

        // Injecting mock locations for farmer if missing
        if (!farmer.lat) {
            await db.farmerProfile.update({
                where: { id: farmer.id },
                data: { lat: 19.0760, lng: 72.8777, deliveryPricePerKm: 15 } // Mumbai (~150km)
            });
        }

        const feeRes = await calculateDynamicDeliveryFee([cartItem.id], addressData.lat, addressData.lng);
        console.log(`✅ Preview Fee: ₹${feeRes.fee}`);

        const checkoutRes = await initiateCheckout([cartItem.id], addressData, testUser.id);
        if (checkoutRes.success) {
            const order = await db.order.findUnique({ where: { id: checkoutRes.data.id } });
            const subtotal = product.pricePerUnit * 2;

            console.log(`💰 Order Totals:`);
            console.log(`   Subtotal: ₹${subtotal}`);
            console.log(`   Delivery: ₹${order.deliveryFee}`);
            console.log(`   Platform: ₹${order.platformFee}`);
            console.log(`   Total:    ₹${order.totalAmount}`);
            console.log(`   Seller Cut: ₹${order.sellerAmount}`);

            // Verification
            const expectedFee = Math.round(subtotal * 0.03); // Online 3%
            if (order.platformFee === expectedFee) console.log("✅ Platform Fee Correct (3%)");
            else console.log(`❌ Platform Fee Mismatch! Expected ${expectedFee}, got ${order.platformFee}`);

            if (order.sellerAmount === (subtotal + order.deliveryFee)) console.log("✅ Seller Amount Correct (Subtotal + Delivery)");
            else console.log("❌ Seller Amount Mismatch!");
        }

        // 3. Test Scenario: COD Order (1.5% Fee)
        console.log("\n--- SCENARIO 2: COD + 1.5% FEE ---");
        addressData.paymentMethod = "COD";
        const codRes = await initiateCheckout([cartItem.id], addressData, testUser.id);
        if (codRes.success) {
            const order = await db.order.findUnique({ where: { id: codRes.data.id } });
            const subtotal = product.pricePerUnit * 2;
            const expectedFee = Math.round(subtotal * 0.015);

            if (order.platformFee === expectedFee) console.log(`✅ Platform Fee Correct (1.5%): ₹${order.platformFee}`);
            else console.log(`❌ Platform Fee Mismatch! Expected ${expectedFee}, got ${order.platformFee}`);
        }

        // 4. Test Scenario: Fallback to "Per Unit"
        console.log("\n--- SCENARIO 3: FALLBACK TO PER_UNIT (No Location) ---");
        await db.productListing.update({
            where: { id: product.id },
            data: { deliveryCharge: 50, deliveryChargeType: 'per_unit' }
        });

        const fallbackRes = await initiateCheckout([cartItem.id], { ...addressData, lat: null, lng: null }, testUser.id);
        if (fallbackRes.success) {
            const order = await db.order.findUnique({ where: { id: fallbackRes.data.id } });
            if (order.deliveryFee === 100) console.log("✅ Fallback Correct (50 * 2 items = 100)");
            else console.log(`❌ Fallback Failed! Got ₹${order.deliveryFee}`);
        }

        // 5. Cleanup
        await db.cartItem.delete({ where: { id: cartItem.id } });
        console.log("\n🏁 TEST COMPLETED SUCCESSFULLY");

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err);
    }
}

runLogisticsTest();
