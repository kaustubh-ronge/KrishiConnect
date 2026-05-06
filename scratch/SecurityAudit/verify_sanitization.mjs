
// Simulate the logic inside the createProductListing action
function sanitize(val) {
    return val?.toString().replace(/<[^>]*>?/gm, '');
}

async function verifySanitizationLogic() {
    console.log("🧪 VERIFYING SYSTEM-WIDE SANITIZATION LOGIC");

    const payloads = [
        "<script>alert(1)</script>Hello",
        "<img src=x onerror=alert(1)>",
        "Safe text",
        "<div onmouseover='bad()'>Hover me</div>",
        "<<script>alert(1)>Nested"
    ];

    payloads.forEach(p => {
        const clean = sanitize(p);
        console.log(`📥 Input:  ${p}`);
        console.log(`📤 Output: ${clean}`);
        
        if (clean.includes("<script") || clean.includes("onerror") || clean.includes("onmouseover")) {
            console.error("❌ FAIL: Payload escaped sanitization!");
        } else {
            console.log("✅ PASS: Payload neutralized.");
        }
        console.log("---");
    });
}

verifySanitizationLogic();
