
// Test logic for Seller Approval Verification
async function verifySellerStatus(role, sellingStatus) {
    console.log(`[Status Test] Verifying role: ${role}, status: ${sellingStatus}...`);
    
    // This replicates the logic in actions/products.js:createProductListing
    let isPermitted = false;
    let errorMessage = "";

    if (role === 'farmer' || role === 'agent') {
        if (sellingStatus === 'APPROVED') {
            isPermitted = true;
        } else {
            errorMessage = "Your seller profile is pending approval. You cannot create listings yet.";
        }
    }

    if (isPermitted) {
        console.log("SUCCESS: Action Permitted.");
        return { success: true };
    } else {
        console.log("BLOCKED: " + errorMessage);
        return { success: false, error: errorMessage };
    }
}

async function runTests() {
    console.log("=== KrishiConnect Seller Approval Logic Test ===");

    // Case 1: Approved Farmer
    const res1 = await verifySellerStatus('farmer', 'APPROVED');
    if (res1.success) console.log("Case 1 (Approved Farmer): PASSED ✅");
    else console.log("Case 1 (Approved Farmer): FAILED ❌");

    // Case 2: Pending Farmer
    const res2 = await verifySellerStatus('farmer', 'PENDING');
    if (!res2.success && res2.error.includes("pending approval")) console.log("Case 2 (Pending Farmer): PASSED ✅");
    else console.log("Case 2 (Pending Farmer): FAILED ❌");

    // Case 3: Rejected Agent
    const res3 = await verifySellerStatus('agent', 'REJECTED');
    if (!res3.success) console.log("Case 3 (Rejected Agent): PASSED ✅");
    else console.log("Case 3 (Rejected Agent): FAILED ❌");
}

runTests();
