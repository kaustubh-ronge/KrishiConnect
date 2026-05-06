# KrishiConnect Comprehensive Test Suite (v1.0)

This document outlines the end-to-end testing strategy for the KrishiConnect platform.

## 1. Authentication & Onboarding
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Farmer Signup | New User | Sign up, select "Farmer" role, fill profile with Aadhar. | User is redirected to Farmer Dashboard with "Pending Approval" state. |
| **AUTH-02** | Role Gatekeeping | Farmer | Attempt to access `/delivery-dashboard`. | Redirected back to Farmer Dashboard or "Access Denied" shown. |

## 2. Marketplace & Discovery
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **MKT-01** | Role Visibility | Farmer | Browse Marketplace. | Sees Agent products and other Farmer products; cannot see own products. |
| **MKT-02** | Search & Filter | Any | Search for "Wheat", filter by "Agent". | Only Agent-sold wheat listings are shown. |
| **MKT-03** | Min Order Qty UI | Buyer | Product Detail: Attempt to set quantity below `minOrderQuantity`. | Decrement button is disabled; manual input corrected to min value. |

## 3. Cart & Inventory
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **CRT-01** | Cart Enforcement | Buyer | Add item to cart. Try to decrease quantity below min limit. | UI prevents quantity from dropping below the limit. |
| **CRT-02** | Stock Validation | Buyer | Attempt to add more items than available in stock. | "Insufficient Stock" toast or button disabled. |

## 4. Checkout & Payments
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **PAY-01** | COD Flow | Buyer | Select COD, place order. | Redirected to `/my-orders`; Order status is `PROCESSING`. |
| **PAY-02** | Online Flow | Buyer | Select Razorpay, complete payment. | Order status is `PROCESSING`, `paymentStatus` is `PAID`. |
| **PAY-03** | Stock Lock | Buyer | Initiate Checkout but don't pay. | Stock is temporarily "reserved" (via `expiresAt`). |

## 5. Seller Operations (Manage Orders)
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **SEL-01** | Dashboard View | Seller | View "Manage Orders". | New orders appear with "PAID" or "UNPAID" (pending) status. |
| **SEL-02** | Self-Delivery OTP | Seller | Mark order as SHIPPED (Self-delivery). | 6-digit OTP is generated and sent to buyer. |
| **SEL-03** | Verification | Seller | Input buyer's OTP to mark as DELIVERED. | Order status updates to `DELIVERED` in DB and UI. |

## 6. Logistics (Delivery Partner)
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **DLV-01** | Hire Partner | Seller | Paid Order: Click "Hire Courier", select partner. | Delivery Job created with status `REQUESTED`. |
| **DLV-02** | Acceptance | Partner | View Dashboard, Accept Job. | Status updates to `ACCEPTED`; Buyer notified. |
| **DLV-03** | OTP Delivery | Partner | Input Buyer OTP on delivery. | Job and Order status both move to `DELIVERED`. |

## 7. Admin Operations
| ID | Title | Persona | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Seller Approval | Admin | View pending Farmers. Approve one. | Farmer's `sellingStatus` becomes `APPROVED`. |
| **ADM-02** | Dispute Mgmt | Admin | Buyer files dispute. Admin resolves. | Order `disputeStatus` updates; payouts adjusted. |
