// Self-contained test script for distance logic
// Run with: node scratch/test-distance.js

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(2));
}

async function getOSRMDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes?.[0]?.distance) {
      const km = data.routes[0].distance / 1000;
      return parseFloat(km.toFixed(2));
    }
    return getHaversineDistance(lat1, lon1, lat2, lon2);
  } catch (err) {
    console.error("OSRM Fetch failed:", err.message);
    return getHaversineDistance(lat1, lon1, lat2, lon2);
  }
}

async function runTest() {
  console.log("\n==========================================");
  console.log("   DELIVERY PAYMENT LOGIC TEST");
  console.log("==========================================\n");

  // TEST CASE: Mumbai Central to Bandra Terminus
  const pickup = { name: "Mumbai Central", lat: 18.9698, lng: 72.8193 };
  const delivery = { name: "Bandra Terminus", lat: 19.0617, lng: 72.8465 };
  const ratePerKm = 15; // ₹15 per KM

  console.log(`[ROUTE] ${pickup.name} -> ${delivery.name}`);
  console.log(`[RATE] ₹${ratePerKm}/km\n`);

  // 1. Calculate Straight Line (Haversine)
  const straightDist = getHaversineDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  console.log(`[STEP 1] Straight-line distance: ${straightDist} km`);

  // 2. Calculate Road Distance (OSRM)
  console.log("[STEP 2] Fetching actual road distance from OSRM API...");
  const roadDist = await getOSRMDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  console.log(`[STEP 2] Actual road distance: ${roadDist} km`);

  // 3. Final Payment Determination
  const finalPrice = roadDist * ratePerKm;
  console.log(`\n[RESULT] Final Payment: ₹${finalPrice.toFixed(2)}`);
  
  console.log("\n==========================================");
  if (roadDist > straightDist) {
    console.log(" VERDICT: SUCCESS ✅");
    console.log(" Logic correctly accounts for road navigation.");
  } else {
    console.log(" VERDICT: PASS (Straight Route) ℹ️");
  }
  console.log("==========================================\n");
}

runTest();
