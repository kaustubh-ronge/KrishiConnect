// scratch/test-notification-dedupe.js
// Tests that multiple items from the same seller result in only ONE notification

const db = {
  notifications: [],
  createNotification: (data) => {
    db.notifications.push(data);
    console.log(`[DB] Notification created for User: ${data.userId} | Title: ${data.title}`);
  }
};

function simulateOrderNotification(orderItems) {
  console.log("--- NOTIFICATION DE-DUPE TEST ---\n");

  const notifiedSellers = new Set();
  
  orderItems.forEach((item, index) => {
    console.log(`Processing Item ${index + 1}: ${item.productName} (Seller ID: ${item.sellerUserId})`);
    
    if (item.sellerUserId && !notifiedSellers.has(item.sellerUserId)) {
      notifiedSellers.add(item.sellerUserId);
      db.createNotification({
        userId: item.sellerUserId,
        type: 'ORDER_RECEIVED',
        title: 'New Order Received!',
        message: `You have a new order. Please process it.`
      });
    } else {
      console.log(`[SKIP] Seller ${item.sellerUserId} already notified for this order.`);
    }
  });

  console.log("\n==========================================");
  console.log("   RESULTS");
  console.log("==========================================");
  console.log(`Total Items:         ${orderItems.length}`);
  console.log(`Unique Sellers:      ${notifiedSellers.size}`);
  console.log(`Notifications Sent:  ${db.notifications.length}`);
  console.log("==========================================\n");

  if (db.notifications.length === notifiedSellers.size) {
    console.log(" VERDICT: DE-DUPLICATION SUCCESS ✅");
  } else {
    console.error(" VERDICT: DUPLICATE NOTIFICATIONS DETECTED ❌");
  }
}

// --- TEST DATA ---
// Simulate order with 3 items: 2 from Farmer A, 1 from Agent B
const mockOrderItems = [
  { productName: "Apples", sellerUserId: "user_farmer_A" },
  { productName: "Potatoes", sellerUserId: "user_farmer_A" }, // Same seller
  { productName: "Tractor Oil", sellerUserId: "user_agent_B" }
];

simulateOrderNotification(mockOrderItems);
