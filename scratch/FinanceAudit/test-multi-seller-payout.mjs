
import { db } from '../../lib/prisma.js';

async function testMultiSellerCalculations() {
    console.log("=== TESTING MULTI-SELLER PAYOUT CALCULATIONS ===\n");

    // Mock cart items from different sellers
    const mockCartItems = [
        {
            quantity: 10,
            product: {
                pricePerUnit: 15, // < 20 -> 1% Platform Fee
                deliveryCharge: 50,
                deliveryChargeType: 'flat'
            }
        },
        {
            quantity: 5,
            product: {
                pricePerUnit: 100, // > 20 -> 2% Platform Fee
                deliveryCharge: 10,
                deliveryChargeType: 'per_unit'
            }
        }
    ];

    // logic from actions/orders.js
    const productSubtotal = mockCartItems.reduce((sum, it) => sum + (it.quantity * it.product.pricePerUnit), 0);
    
    const deliveryTotal = mockCartItems.reduce((sum, it) => {
      if (it.product.deliveryChargeType === 'per_unit') {
        return sum + (it.quantity * (it.product.deliveryCharge || 0));
      }
      return sum + (it.product.deliveryCharge || 0);
    }, 0);

    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    
    const platformFee = Math.round(mockCartItems.reduce((sum, it) => 
        sum + (it.product.pricePerUnit * it.quantity * platformRateFor(it.product.pricePerUnit)), 0)
    );
    
    const total = productSubtotal + deliveryTotal + platformFee;
    const sellerAmount = Math.max(0, productSubtotal - platformFee);

    console.log("Input Data:");
    console.log("- Item 1: 10 units @ ₹15 (1% fee expected)");
    console.log("- Item 2: 5 units @ ₹100 (2% fee expected)");
    
    console.log("\nResults:");
    console.log(`- Product Subtotal: ₹${productSubtotal}`);
    console.log(`- Delivery Total: ₹${deliveryTotal}`);
    console.log(`- Platform Fee: ₹${platformFee}`);
    console.log(`- Total Payable: ₹${total}`);
    console.log(`- Total Seller Payout (aggregated): ₹${sellerAmount}`);

    // Verification
    const expectedFee1 = (10 * 15) * 0.01; // 1.5
    const expectedFee2 = (5 * 100) * 0.02; // 10
    const totalExpectedFee = Math.round(expectedFee1 + expectedFee2); // 12

    if (platformFee === totalExpectedFee) {
        console.log("\n✅ [PASS] Platform fee calculation is accurate.");
    } else {
        console.log(`\n❌ [FAIL] Platform fee mismatch. Expected ₹${totalExpectedFee}, got ₹${platformFee}`);
    }
}

testMultiSellerCalculations();
