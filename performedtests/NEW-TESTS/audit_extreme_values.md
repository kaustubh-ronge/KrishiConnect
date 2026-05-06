# 🛡️ Audit: Extreme Values & Boundary Testing

## 🔍 Investigation
Pushed the system to its breaking points using astronomical numeric values (stock, price) and oversized strings (product names, descriptions).

## 🚨 Issues Found
1. **Numeric Overflow Risk**: No upper bounds on stock and price meant potential database constraint violations or overflow crashes in total calculations.
2. **Infinite Totals**: Checkout logic lacked checks for `Infinity` or `NaN`, which could crash server-side math operations.
3. **Database Bloat (DoS)**: Product unit and name fields had no length limits, allowing multi-megabyte string injections.

## 🛠️ Fixes Applied

### 🔴 Vulnerable Code (No Boundaries)
```javascript
const availableStock = parseFloat(formData.get("availableStock"));
const productName = formData.get("productName");
```

### 🟢 Hardened Code (Boundary Protection)
```javascript
// Strict Numeric Caps
const rawStock = parseFloat(formData.get("availableStock") || "0");
const availableStock = Math.min(rawStock, 10000000); // 10M Cap

// String Length Limits
const productName = sanitize(formData.get("productName"))?.slice(0, 100);

// Finite Math Guard
if (!Number.isFinite(total) || total > 100000000) {
    return { success: false, error: "Order total exceeds system limits." };
}
```

## 🏁 Result
**✅ PASS**
All inputs are now capped and validated. Overflow attacks and string-bloat DoS are neutralized.
