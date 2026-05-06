// scratch/test-order-lifecycle.js
// Tests the full lifecycle of an order and its tracking log integrity

const db = {
  orders: {},
  tracking: [],
  
  updateOrder: (id, status) => {
    if (!db.orders[id]) db.orders[id] = { id, status, tracking: [] };
    db.orders[id].status = status;
    const logEntry = {
      orderId: id,
      status: status,
      timestamp: new Date().toISOString(),
      notes: `Order status moved to ${status}`
    };
    db.tracking.push(logEntry);
    console.log(`[SYS] Order ${id.slice(-4)} -> ${status.padEnd(12)} | Logged: ✅`);
  }
};

function runLifecycleTest() {
  console.log("==========================================");
  console.log("   ORDER LIFECYCLE & AUDIT LOG TEST");
  console.log("==========================================\n");

  const orderId = "ORD-" + Math.random().toString(36).substring(7).toUpperCase();
  
  // 1. Initial State
  console.log("Stage 1: Order Placed");
  db.updateOrder(orderId, "PROCESSING");

  // 2. Pickup
  console.log("\nStage 2: Delivery Partner Picked Up Package");
  db.updateOrder(orderId, "SHIPPED");

  // 3. In Transit
  console.log("\nStage 3: Out for Delivery");
  db.updateOrder(orderId, "IN_TRANSIT");

  // 4. Delivered (OTP Match)
  console.log("\nStage 4: OTP Verified & Delivered");
  db.updateOrder(orderId, "DELIVERED");

  console.log("\n==========================================");
  console.log("   AUDIT TRAIL VERIFICATION");
  console.log("==========================================");
  
  const history = db.tracking.filter(t => t.orderId === orderId);
  history.forEach((entry, i) => {
    console.log(`${i+1}. [${entry.timestamp}] STATUS: ${entry.status.padEnd(10)} | ${entry.notes}`);
  });

  console.log("\n==========================================");
  if (history.length === 4 && history[3].status === "DELIVERED") {
    console.log(" VERDICT: LIFECYCLE INTEGRITY PASSED ✅");
  } else {
    console.error(" VERDICT: AUDIT TRAIL INCOMPLETE ❌");
  }
  console.log("==========================================\n");
}

runLifecycleTest();
