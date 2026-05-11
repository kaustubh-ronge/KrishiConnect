const { sendSupportMessage } = require('../actions/support');

async function test() {
  // Mocking Clerk currentUser is hard in a scratch script, 
  // but let's see if we can trigger the action.
  console.log("Calling sendSupportMessage...");
  try {
     // This will likely fail due to lack of Clerk context,
     // but it will tell us if the action is correctly exported and reachable.
     const res = await sendSupportMessage("Test message from scratch script", "GENERAL");
     console.log("Result:", res);
  } catch (err) {
     console.error("Caught error:", err);
  }
}

test();
