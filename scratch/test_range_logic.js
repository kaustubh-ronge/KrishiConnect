const { getHaversineDistance } = require('../lib/utils');

// Coordinates
const PANDHARPUR = { lat: 17.6775, lng: 75.3344 };
const NAGPUR = { lat: 21.1458, lng: 79.0882 };

async function runTest() {
    console.log("--- Testing Logistics Range Logic ---");

    // 1. Local Test (Same city)
    const distLocal = getHaversineDistance(PANDHARPUR.lat, PANDHARPUR.lng, PANDHARPUR.lat, PANDHARPUR.lng);
    const limit = 100;
    
    console.log(`\nScenario A: Local Delivery (Pandharpur to Pandharpur)`);
    console.log(`Distance: ${distLocal} km`);
    console.log(`Limit: ${limit} km`);
    console.log(`Result: ${distLocal <= limit ? "✅ IN RANGE" : "❌ OUT OF RANGE"}`);

    // 2. Long Distance Test
    const distFar = getHaversineDistance(PANDHARPUR.lat, PANDHARPUR.lng, NAGPUR.lat, NAGPUR.lng);
    
    console.log(`\nScenario B: Long Distance (Pandharpur to Nagpur)`);
    console.log(`Distance: ${distFar} km`);
    console.log(`Limit: ${limit} km`);
    console.log(`Result: ${distFar <= limit ? "✅ IN RANGE" : "❌ OUT OF RANGE (Correctly Blocked)"}`);
    
    if (distLocal === 0 && distFar > limit) {
        console.log("\n✨ TEST PASSED: Logistics engine correctly distinguishes between local and distant orders.");
    } else {
        console.log("\n⚠️ TEST FAILED: Verification logic mismatch.");
    }
}

runTest();
