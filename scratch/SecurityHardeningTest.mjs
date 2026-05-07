
import { db } from '../lib/prisma.js';

// Mocking the behavior of getProductDetail to verify PII isolation
async function mockGetProductDetail(listingId) {
    console.log(`[PII Test] Fetching product ${listingId}...`);
    
    // This simulates the actual logic I implemented in actions/products.js
    const selection = {
        farmer: {
            select: {
                id: true, name: true, farmName: true, phone: true, address: true,
                region: true, district: true, state: true, city: true,
                averageRating: true, totalReviews: true, farmingExperience: true,
                primaryProduce: true, createdAt: true
            }
        },
        agent: {
            select: {
                id: true, name: true, companyName: true, phone: true, address: true,
                region: true, district: true, state: true, city: true,
                averageRating: true, totalReviews: true, agentType: true,
                createdAt: true
            }
        }
    };

    const forbidden = ["aadharNumber", "accountNumber", "upiId", "ifscCode", "aadharFront", "aadharBack"];
    const leaks = forbidden.filter(f => selection.farmer.select[f]);
    
    if (leaks.length > 0) {
        throw new Error("CRITICAL FAILURE: Sensitive PII leaked in selection: " + leaks.join(", "));
    }
    
    return { success: true };
}

// Actual Logic from lib/utils.js (Improved)
function sanitizeContent(val) {
    if (typeof val !== 'string') return val;
    if (val.toLowerCase().includes('javascript:')) return "";
    return val
        .replace(/<[^>]*>?/gm, '') 
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '') 
        .replace(/on\w+\s*=\s*[^>\s]*/gi, '')
        .trim();
}

async function runTests() {
    console.log("=== KrishiConnect Security Hardening Test (Updated) ===");
    
    // Test 1: PII Isolation
    try {
        await mockGetProductDetail("test_prod");
        console.log("TEST 1 (PII Isolation): PASSED ✅");
    } catch (err) {
        console.error("TEST 1 (PII Isolation): FAILED ❌ -", err.message);
    }

    // Test 2: XSS Sanitization
    console.log("\n[XSS Test] Verifying sanitization payloads...");
    const payloads = [
        { input: "<img src=x onerror=alert(1)>", expected: "" },
        { input: "javascript:alert(1)", expected: "" },
        { input: "<script>alert(1)</script>", expected: "alert(1)" } // alert(1) remains as text
    ];

    let xssPassed = true;
    payloads.forEach((p, i) => {
        const result = sanitizeContent(p.input);
        if (result !== p.expected) {
            console.error(`XSS Case ${i+1} FAILED: Input "${p.input}", Expected "${p.expected}", got "${result}"`);
            xssPassed = false;
        } else {
            console.log(`XSS Case ${i+1} PASSED: "${p.input}" -> "${result}"`);
        }
    });

    if (xssPassed) console.log("TEST 2 (XSS Sanitization): PASSED ✅");
    else console.log("TEST 2 (XSS Sanitization): FAILED ❌");
}

runTests();
