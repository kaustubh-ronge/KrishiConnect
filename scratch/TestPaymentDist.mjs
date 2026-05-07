
import { getOSRMDistance } from '../lib/utils.js';

async function testComprehensiveCalculations() {
    console.log("🧪 COMPREHENSIVE DELIVERY CALCULATION TEST\n");

    const sellerLoc = { lat: 18.5204, lng: 73.8567 }; // Pune
    const buyerLoc = { lat: 19.0760, lng: 72.8777 };  // Mumbai
    const pricePerKm = 10;

    const scenarios = [
        {
            name: "1. NORMAL PICKUP (at Seller)",
            start: sellerLoc,
            end: buyerLoc,
            expected: "Seller-Buyer Distance (~145km)"
        },
        {
            name: "2. FORGOTTEN PICKUP (Null Start)",
            start: null,
            end: buyerLoc,
            expected: "Seller-Buyer Fallback (~145km)"
        },
        {
            name: "3. LATE PICKUP (Click at Destination)",
            start: buyerLoc,
            end: buyerLoc,
            expected: "Protective Fallback (~145km)"
        },
        {
            name: "4. CUSTOM PICKUP (Mid-way)",
            start: { lat: 18.7481, lng: 73.4072 }, // Lonavala
            end: buyerLoc,
            expected: "Lonavala-Mumbai Distance (~85km)"
        }
    ];

    for (const s of scenarios) {
        console.log(`\n▶ SCENARIO: ${s.name}`);
        let actualDist = 0;

        if (s.start) {
            // Logic A
            actualDist = await getOSRMDistance(s.start.lat, s.start.lng, s.end.lat, s.end.lng);
            if (actualDist < 0.1) {
                console.log("   [Detected Late Click] Falling back to baseline...");
                actualDist = await getOSRMDistance(sellerLoc.lat, sellerLoc.lng, s.end.lat, s.end.lng);
            }
        } else {
            // Logic B
            console.log("   [Detected Null Start] Falling back to baseline...");
            actualDist = await getOSRMDistance(sellerLoc.lat, sellerLoc.lng, s.end.lat, s.end.lng);
        }

        const totalPrice = actualDist * pricePerKm;
        console.log(`   Result: ${actualDist.toFixed(2)} km | Price: ₹${totalPrice.toFixed(2)}`);
        console.log(`   Expectation: ${s.expected}`);
    }
}

testComprehensiveCalculations();
