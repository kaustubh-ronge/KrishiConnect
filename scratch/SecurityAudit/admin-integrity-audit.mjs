/**
 * KRISHI HUB - FINAL UI QUALITY AUDIT (V6)
 */

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runFinalAudit() {
  console.log("💎 RUNNING FINAL QUALITY AUDIT...\n");
  const issues = [];

  try {
    // Check all product listings
    const products = await db.productListing.findMany();
    console.log(`📦 Checking ${products.length} products...`);
    
    products.forEach(p => {
        if (!p.category || p.category === "" || p.category === "General") {
            // "General" is the default, but we want "General Produce" for professionalism
            issues.push(`[Product #${p.id.slice(-6)}] Category is too generic or missing: '${p.category}'`);
        }
    });

    // Check all orders
    const orders = await db.order.findMany();
    console.log(`💰 Checking ${orders.length} orders...`);
    orders.forEach(o => {
        if (!o.buyerName || o.buyerName === "NOT PROVIDED") issues.push(`[Order #${o.id.slice(-6)}] Missing Buyer Name`);
        if (!o.shippingAddress || o.shippingAddress === "NOT PROVIDED") issues.push(`[Order #${o.id.slice(-6)}] Missing Address`);
    });

    console.log("\n--- QUALITY REPORT ---");
    if (issues.length === 0) console.log("✅ 100% QUALITY PASS. NO DATA GAPS.");
    else {
        console.log(`⚠️ FOUND ${issues.length} MINOR QUALITY ISSUES:`);
        issues.forEach(i => console.log(i));
    }

  } catch (e) { console.error(e); }
  finally { await db.$disconnect(); }
}

runFinalAudit();
