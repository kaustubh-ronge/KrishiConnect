// scratch/test-pricing-engine.js
// Tests the Tiered Platform Fees (1% vs 2%) and Multi-Seller Split Logic

const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);

function simulateOrderPricing(items) {
  console.log("--- ORDER PRICING SIMULATION ---\n");

  let productSubtotal = 0;
  let deliveryTotal = 0;
  let totalPlatformFee = 0;

  const sellerBreakdown = {};

  items.forEach((it, index) => {
    const itemTotal = it.price * it.qty;
    const rate = platformRateFor(it.price);
    const fee = Math.round(it.price * it.qty * rate);
    const sellerNet = itemTotal - fee;
    
    // Delivery Logic
    let itemDelivery = 0;
    if (it.deliveryType === 'per_unit') {
      itemDelivery = it.qty * it.deliveryCharge;
    } else {
      itemDelivery = it.deliveryCharge; // Flat
    }

    console.log(`Item ${index + 1}: ${it.name}`);
    console.log(`   Price: ₹${it.price} | Qty: ${it.qty} | Unit: ${it.unit}`);
    console.log(`   Platform Fee (${(rate * 100).toFixed(0)}%): ₹${fee}`);
    console.log(`   Delivery (${it.deliveryType}): ₹${itemDelivery}`);
    console.log(`   Seller Net Payout: ₹${sellerNet}\n`);

    productSubtotal += itemTotal;
    deliveryTotal += itemDelivery;
    totalPlatformFee += fee;

    // Track by seller
    if (!sellerBreakdown[it.seller]) {
      sellerBreakdown[it.seller] = { amount: 0, items: [] };
    }
    sellerBreakdown[it.seller].amount += sellerNet;
    sellerBreakdown[it.seller].items.push(it.name);
  });

  const grandTotal = productSubtotal + deliveryTotal + totalPlatformFee;

  console.log("==========================================");
  console.log("   FINAL ORDER SUMMARY");
  console.log("==========================================");
  console.log(`Product Subtotal:    ₹${productSubtotal.toFixed(2)}`);
  console.log(`Delivery Total:      ₹${deliveryTotal.toFixed(2)}`);
  console.log(`Total Platform Fee:  ₹${totalPlatformFee.toFixed(2)}`);
  console.log(`------------------------------------------`);
  console.log(`GRAND TOTAL (Buyer): ₹${grandTotal.toFixed(2)}`);
  console.log("==========================================\n");

  console.log("SELLER DISBURSEMENTS:");
  Object.keys(sellerBreakdown).forEach(seller => {
    console.log(`-> ${seller.padEnd(15)}: ₹${sellerBreakdown[seller].amount.toFixed(2)} (${sellerBreakdown[seller].items.join(", ")})`);
  });
}

// --- TEST DATA ---
const mockCart = [
  { 
    name: "Tomatoes", 
    price: 15, // Should trigger 1% fee
    qty: 10, 
    unit: "kg",
    deliveryCharge: 2, 
    deliveryType: "per_unit",
    seller: "Farmer Ram"
  },
  { 
    name: "Organic Honey", 
    price: 450, // Should trigger 2% fee
    qty: 2, 
    unit: "bottle",
    deliveryCharge: 50, 
    deliveryType: "flat",
    seller: "Agent Suresh"
  },
  { 
    name: "Green Chillies", 
    price: 12, // Should trigger 1% fee
    qty: 5, 
    unit: "kg",
    deliveryCharge: 1, 
    deliveryType: "per_unit",
    seller: "Farmer Ram"
  }
];

simulateOrderPricing(mockCart);
