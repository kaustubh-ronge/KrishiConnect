
// SIMULATION OF delivery-job.js completeDeliveryWithOtp LOGIC
// We are testing the distance and price calculation logic branch by branch.

/**
 * Mocking getOSRMDistance
 */
async function mockOSRMDistance(lat1, lng1, lat2, lng2) {
    // Simple mock: if coords are very close, return small value
    const dLat = Math.abs(lat1 - lat2);
    const dLng = Math.abs(lng1 - lng2);
    if (dLat < 0.001 && dLng < 0.001) return 0.05; // 50 meters
    
    // Return a deterministic distance based on lat diff
    return parseFloat((dLat * 111).toFixed(2)); // Roughly 111km per degree
}

/**
 * The logic extracted from delivery-job.js for testing
 */
async function calculateDeliveryStats(job, lat, lng) {
    let updateData = {};
    const endLat = parseFloat(lat);
    const endLng = parseFloat(lng);
    updateData.endLat = endLat;
    updateData.endLng = endLng;

    let actualDist = 0;
    let logicBranch = "";

    if (job.startLat && job.startLng) {
        // LOGIC A: Pickup Location -> Delivery Location
        actualDist = await mockOSRMDistance(job.startLat, job.startLng, endLat, endLng);
        logicBranch = "LOGIC A (Pickup to Delivery)";

        // PROTECTIVE FALLBACK: Late Click detection
        if (actualDist < 0.1) {
            logicBranch += " -> PROTECTIVE FALLBACK (Late Click)";
            const firstItem = job.order.items?.[0];
            const seller = firstItem?.product?.farmer || firstItem?.product?.agent;
            if (seller?.lat && seller?.lng && job.order.lat && job.order.lng) {
                actualDist = await mockOSRMDistance(seller.lat, seller.lng, job.order.lat, job.order.lng);
            }
        }
    } else {
        // LOGIC B: Fallback (Seller Location -> Buyer/Order Location)
        logicBranch = "LOGIC B (Seller to Buyer)";
        const firstItem = job.order.items?.[0];
        const seller = firstItem?.product?.farmer || firstItem?.product?.agent;

        if (seller?.lat && seller?.lng && job.order.lat && job.order.lng) {
            actualDist = await mockOSRMDistance(seller.lat, seller.lng, job.order.lat, job.order.lng);
        } else {
            logicBranch += " -> LAST RESORT (Initial Estimate)";
            actualDist = job.distance || 0;
        }
    }

    updateData.actualDistance = actualDist;
    updateData.totalPrice = actualDist * job.deliveryBoy.pricePerKm;
    updateData.logicBranch = logicBranch;

    return updateData;
}

async function runTests() {
    console.log("🚚 DELIVERY CALCULATION LOGIC AUDIT\n");

    const sellerCoords = { lat: 18.5204, lng: 73.8567 }; // Pune
    const buyerCoords = { lat: 19.0760, lng: 72.8777 }; // Mumbai (~150km)
    const pricePerKm = 10;

    const mockJobTemplate = {
        order: {
            lat: buyerCoords.lat,
            lng: buyerCoords.lng,
            items: [{
                product: {
                    farmer: { lat: sellerCoords.lat, lng: sellerCoords.lng }
                }
            }]
        },
        deliveryBoy: { pricePerKm },
        distance: 140 // Initial estimate
    };

    // --- CASE 1: PERFECT WORKFLOW (LOGIC A) ---
    console.log("🔹 CASE 1: Perfect Workflow");
    const job1 = { ...mockJobTemplate, startLat: 18.5204, startLng: 73.8567 }; // Pickup at seller
    const res1 = await calculateDeliveryStats(job1, buyerCoords.lat, buyerCoords.lng);
    console.log(`   Branch: ${res1.logicBranch}`);
    console.log(`   Distance: ${res1.actualDistance} km`);
    console.log(`   Price: ₹${res1.totalPrice}`);
    if (res1.actualDistance > 100 && res1.totalPrice > 1000) console.log("   ✅ PASSED");
    else console.log("   ❌ FAILED");

    // --- CASE 2: LATE PICKUP CLICK (LOGIC A FALLBACK) ---
    console.log("\n🔹 CASE 2: Late Pickup Click (Clicked pickup at destination)");
    // Pickup coords are set at the buyer's location (mistake by boy)
    const job2 = { ...mockJobTemplate, startLat: buyerCoords.lat, startLng: buyerCoords.lng }; 
    const res2 = await calculateDeliveryStats(job2, buyerCoords.lat, buyerCoords.lng);
    console.log(`   Branch: ${res2.logicBranch}`);
    console.log(`   Distance: ${res2.actualDistance} km`);
    console.log(`   Price: ₹${res2.totalPrice}`);
    // Should fallback to Seller->Buyer distance (~150km) instead of 0
    if (res2.actualDistance > 100) console.log("   ✅ PASSED: System detected late click and used baseline distance.");
    else console.log("   ❌ FAILED: System used 0 distance for late click!");

    // --- CASE 3: SKIPPED PICKUP UPDATE (LOGIC B) ---
    console.log("\n🔹 CASE 3: Skipped Pickup Update (startLat is null)");
    const job3 = { ...mockJobTemplate, startLat: null, startLng: null };
    const res3 = await calculateDeliveryStats(job3, buyerCoords.lat, buyerCoords.lng);
    console.log(`   Branch: ${res3.logicBranch}`);
    console.log(`   Distance: ${res3.actualDistance} km`);
    console.log(`   Price: ₹${res3.totalPrice}`);
    if (res3.actualDistance > 100) console.log("   ✅ PASSED: System used Seller->Buyer distance.");
    else console.log("   ❌ FAILED");

    // --- CASE 4: TOTAL DATA FAILURE (LAST RESORT) ---
    console.log("\n🔹 CASE 4: Total Data Failure (Seller/Order coords missing)");
    const job4 = { 
        ...mockJobTemplate, 
        startLat: null, 
        order: { lat: null, lng: null, items: [] }, // Corrupt order data
        distance: 140 
    };
    const res4 = await calculateDeliveryStats(job4, buyerCoords.lat, buyerCoords.lng);
    console.log(`   Branch: ${res4.logicBranch}`);
    console.log(`   Distance: ${res4.actualDistance} km`);
    console.log(`   Price: ₹${res4.totalPrice}`);
    if (res4.actualDistance === 140) console.log("   ✅ PASSED: System used initial estimate as last resort.");
    else console.log("   ❌ FAILED");

    // --- CASE 5: EDGE CASE - MISSING PRICE PER KM ---
    console.log("\n🔹 CASE 5: Missing Price per Km");
    const job5 = { ...mockJobTemplate, startLat: 18.5204, deliveryBoy: { pricePerKm: 0 } };
    const res5 = await calculateDeliveryStats(job5, buyerCoords.lat, buyerCoords.lng);
    console.log(`   Price: ₹${res5.totalPrice}`);
    if (res5.totalPrice === 0) console.log("   ✅ PASSED: Handled zero price correctly.");
    else console.log("   ❌ FAILED");

    console.log("\n🏁 AUDIT COMPLETE");
}

runTests();
