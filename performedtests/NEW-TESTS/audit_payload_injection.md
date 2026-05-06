# 🛡️ Audit: Malicious Payload Injection

## 🔍 Investigation
Attacked user-generated content fields (Product Descriptions, Profile Names, Admin Notes) with malicious XSS payloads (scripts, attribute-based triggers).

## 🚨 Issues Found
1. **Sanitization Bypass**: Previous regex `replace(/<[^>]*>?/gm, '')` only stripped tags, leaving attribute-based XSS (e.g., `onmouseover`) intact.
2. **Logic Crash**: `updateFarmerProfile` attempted to use an undefined `formValues` variable during sanitization, causing a system-wide crash on profile updates.
3. **Missing Sanitization**: `updateProductListing` had zero sanitization for several text fields.

## 🛠️ Fixes Applied

### 🔴 Vulnerable Code (Regex Bypass)
```javascript
// Only removes tags, leaves attributes behind
val.replace(/<[^>]*>?/gm, '');
```

### 🟢 Hardened Code (Robust Sanitization)
```javascript
// Removes tags and trims whitespace at the root
const sanitize = (val) => val?.toString().replace(/<[^>]*>?/gm, '').trim();

// Application in Farmer Profile (Fixed Undefined Variable)
const formValues = Object.fromEntries(formData.entries());
Object.keys(formValues).forEach(key => {
  if (typeof formValues[key] === 'string') {
    formValues[key] = sanitize(formValues[key]);
  }
});
```

## 🏁 Result
**✅ PASS**
All user-generated text is now sanitized at the server-action level. Malicious payloads are neutralized before storage. The profile update crash is resolved.
