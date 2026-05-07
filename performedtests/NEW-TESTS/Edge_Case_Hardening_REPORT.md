# KrishiConnect: Edge Case & Invalid Input Testing Report

## 🧪 Testing Overview
Performed a deep-dive audit of **Server Actions** and **Utility Libraries** to identify vulnerabilities to malformed payloads, boundary overflows, and inconsistent states.

---

## 🚩 Issues Found & Fixed

### **1. Numeric Instability (NaN Vulnerabilities)**
- **Issue**: `parseFloat()` was used without `isNaN()` checks in `products.js` and `delivery-job.js`. Non-numeric strings (e.g., `"abc"`) would result in `NaN` being sent to Prisma, causing database crashes.
- **Fix**: Implemented `isNaN()` validation and safe defaults (0 or positive minimums) for all numeric inputs in `createProductListing`, `updateProductListing`, and `hireDeliveryBoy`.

### **2. Logical Boundary Failures**
- **Issue**: Cart quantities and review ratings lacked explicit positive-only checks in the server actions, potentially allowing negative quantities if bypasses occurred.
- **Fix**: Enforced `quantity > 0` and `rating >= 1` logic in `cart.js` and `reviews.js`.

### **3. Authentication Edge Cases (Deactivated Users)**
- **Issue**: Deactivated users (with `isDisabled: true`) could still access dashboards if they had an active session.
- **Fix**: Updated `getUserWithProfileStatus.js` to explicitly check for the `isDisabled` flag and return a specific `ACCOUNT_DISABLED` error.

### **4. Payload Bloat (Oversized Inputs)**
- **Issue**: Notification titles and product descriptions lacked truncation at the action level, risking database storage overflow or UI breaks.
- **Fix**: Implemented `.slice()` truncation for notifications, reviews, and product metadata.

---

## 📊 Summary of Edge Cases Tested

| Input Type | Case Tested | Result | Fix Applied? |
| :--- | :--- | :--- | :--- |
| **Numeric** | `NaN` / Non-numeric strings | ❌ Crashed DB initially | ✅ Yes (Hardened) |
| **Numeric** | Negative quantities | ⚠️ Logic bypass potential | ✅ Yes (Positive-only constraint) |
| **String** | 10,000+ character messages | ⚠️ Potential UI break | ✅ Yes (Truncation) |
| **Auth** | Deactivated account access | ⚠️ Permission leak | ✅ Yes (`isDisabled` check) |
| **Payload** | Null/Undefined IDs | ❌ Prisma Error | ✅ Yes (Null-guards added) |

---

## ✅ Regression Validation
- **Cart Workflow**: Verified that adding valid quantities still works perfectly.
- **Marketplace**: Confirmed that search and filtering still function with the new numeric caps.
- **Onboarding**: Validated that `getUserWithProfileStatus` correctly handles normal users while blocking disabled ones.

**Final Status**: The application is now resilient against malicious or accidental malformed inputs, ensuring **Data Integrity** and **System Stability**.
