// Test script for Delivery Partner Filtering & Sorting Logic
// Run with: node scratch/test-filtering.js

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function simulateFiltering(lat, lng, partners, existingRequests = []) {
  const priority = { "AVAILABLE": 0, "AVAILABLE_SOON": 1, "AVAILABLE_LATER": 2, "OFFLINE": 3 };

  const processed = partners.map(boy => {
    const distance = getHaversineDistance(lat, lng, boy.lat, boy.lng);
    const myRequestForThisOrder = existingRequests.find(r => r.deliveryBoyId === boy.id);

    let availability = "AVAILABLE";
    if (!boy.isOnline) {
      availability = "OFFLINE";
    } else {
      const activeJobs = boy.jobs || [];
      if (activeJobs.length > 0) {
        if (activeJobs.some(j => j.status === "IN_TRANSIT")) {
          availability = "AVAILABLE_SOON";
        } else {
          availability = "AVAILABLE_LATER";
        }
      }
    }

    return {
      name: boy.name,
      distance,
      radius: boy.radius,
      availability,
      hiringStatus: myRequestForThisOrder ? myRequestForThisOrder.status : null
    };
  }).filter(boy => boy.distance <= boy.radius);

  processed.sort((a, b) => {
    const aHired = a.hiringStatus && a.hiringStatus !== 'REJECTED';
    const bHired = b.hiringStatus && b.hiringStatus !== 'REJECTED';
    
    if (aHired && !bHired) return -1;
    if (!aHired && bHired) return 1;
    
    return (priority[a.availability] - priority[b.availability]) || (a.distance - b.distance);
  });

  return processed;
}

// --- TEST DATA ---
const currentLat = 18.9698;
const currentLng = 72.8193;

const mockPartners = [
  { id: "1", name: "Alice (Available & Near)", lat: 18.97, lng: 72.82, radius: 10, isOnline: true, jobs: [] },
  { id: "2", name: "Bob (Available Soon - In Transit)", lat: 18.98, lng: 72.83, radius: 10, isOnline: true, jobs: [{ status: "IN_TRANSIT" }] },
  { id: "3", name: "Charlie (Offline but Near)", lat: 18.96, lng: 72.81, radius: 10, isOnline: false, jobs: [] },
  { id: "4", name: "David (Available Later - Busy)", lat: 18.95, lng: 72.80, radius: 10, isOnline: true, jobs: [{ status: "ACCEPTED" }] },
  { id: "5", name: "Eve (Available but Far)", lat: 19.50, lng: 73.00, radius: 10, isOnline: true, jobs: [] }, // Out of radius
  { id: "6", name: "Frank (Available & Closer than Alice)", lat: 18.9699, lng: 72.8194, radius: 10, isOnline: true, jobs: [] },
];

const mockRequests = [
  { deliveryBoyId: "4", status: "REQUESTED" } // Already sent a request to David
];

console.log("\n==========================================");
console.log("   DELIVERY PARTNER FILTERING TEST");
console.log("==========================================\n");

const results = simulateFiltering(currentLat, currentLng, mockPartners, mockRequests);

console.log(`Found ${results.length} eligible partners nearby:\n`);

results.forEach((r, i) => {
  let tag = "";
  if (r.hiringStatus) tag = ` [${r.hiringStatus}]`;
  console.log(`${i+1}. ${r.name.padEnd(35)} | ${r.availability.padEnd(15)} | ${r.distance} km${tag}`);
});

console.log("\n==========================================");
console.log(" VERDICT: Check the order above.");
console.log(" Expected Order:");
console.log(" 1. Hired ones (David)");
console.log(" 2. Available (Frank, then Alice)");
console.log(" 3. Available Soon (Bob)");
console.log(" 4. Available Later (None - David was moved to top)");
console.log(" 5. Offline (Charlie)");
console.log("==========================================\n");
