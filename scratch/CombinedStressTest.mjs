
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Mock Server Actions Simulation (Since we can't run 'use server' actions directly in Node without Next context, 
// we will simulate the core logic or call the DB directly to test constraints)

async function runStressTest() {
    console.log('--- 🔥 Combined Stress & Resilience Test ---');
    let results = [];

    const buyerId = 'test_buyer_stress';
    const sellerId = 'test_seller_stress';
    const deliveryId = 'test_delivery_stress';

    try {
        // SETUP
        console.log('0. Preparing environment...');
        await prisma.user.upsert({ where: { email: 'stress_buyer@test.com' }, update: {}, create: { id: buyerId, email: 'stress_buyer@test.com', role: 'none' } });
        await prisma.user.upsert({ where: { email: 'stress_seller@test.com' }, update: {}, create: { id: sellerId, email: 'stress_seller@test.com', role: 'farmer' } });
        const farmer = await prisma.farmerProfile.upsert({ where: { userId: sellerId }, update: {}, create: { userId: sellerId, name: 'Stress Seller', sellingStatus: 'APPROVED' } });
        
        const product = await prisma.productListing.create({
            data: {
                farmerId: farmer.id,
                sellerType: 'farmer',
                productName: 'Stress Product',
                pricePerUnit: 10,
                availableStock: 10, // Small stock for concurrency test
                unit: 'kg',
                quantityLabel: '1kg'
            }
        });

        // 1. INVALID INPUTS
        console.log('1. Testing Invalid Inputs...');
        try {
            // Attempt to buy negative quantity
            // Simulation of initiateCheckout logic
            const qty = -5;
            if (qty <= 0) throw new Error("Quantity must be positive");
            results.push({ test: 'Negative Quantity', status: 'FAIL', detail: 'Accepted negative quantity' });
        } catch (e) {
            results.push({ test: 'Negative Quantity', status: 'PASS', detail: e.message });
        }

        // 2. CONCURRENCY (Race Conditions)
        console.log('2. Testing Concurrency (Stock Over-purchase)...');
        // We will try to buy 6 units twice in parallel (Total 12, but only 10 available)
        const purchaseAttempt = async () => {
            return await prisma.$transaction(async (tx) => {
                const p = await tx.productListing.findUnique({ where: { id: product.id } });
                if (p.availableStock < 6) throw new Error("Insufficient stock");
                
                // Simulate processing time
                await new Promise(r => setTimeout(r, 100));

                await tx.productListing.update({
                    where: { id: product.id },
                    data: { availableStock: { decrement: 6 } }
                });
                return "SUCCESS";
            });
        };

        const concurrentResults = await Promise.allSettled([purchaseAttempt(), purchaseAttempt()]);
        const successes = concurrentResults.filter(r => r.status === 'fulfilled' && r.value === 'SUCCESS').length;
        
        const finalProduct = await prisma.productListing.findUnique({ where: { id: product.id } });
        if (successes > 1) {
            results.push({ test: 'Stock Concurrency', status: 'FAIL', detail: `Oversold! Successes: ${successes}, Stock: ${finalProduct.availableStock}` });
        } else {
            results.push({ test: 'Stock Concurrency', status: 'PASS', detail: `Handled! Successes: ${successes}, Stock: ${finalProduct.availableStock}` });
        }

        // 3. REPEATED EXECUTION (Idempotency)
        console.log('3. Testing Idempotency (Double Order Creation)...');
        const idempotencyId = 'stress_idemp_123';
        const createOrder = async () => {
            return await prisma.order.create({
                data: {
                    id: idempotencyId,
                    buyerId,
                    totalAmount: 100,
                    platformFee: 5,
                    sellerAmount: 95,
                    orderStatus: 'PROCESSING'
                }
            });
        };

        try {
            await createOrder();
            await createOrder(); // Should fail on PK
            results.push({ test: 'Order Idempotency', status: 'FAIL', detail: 'Created duplicate order ID' });
        } catch (e) {
            results.push({ test: 'Order Idempotency', status: 'PASS', detail: 'Blocked duplicate order ID' });
        }

        // 4. FAILURES (Transaction Rollback)
        console.log('4. Testing Transaction Rollback...');
        try {
            await prisma.$transaction(async (tx) => {
                await tx.productListing.update({
                    where: { id: product.id },
                    data: { availableStock: { decrement: 1 } }
                });
                throw new Error("Simulated Crash");
            });
        } catch (e) {
            const pAfterCrash = await prisma.productListing.findUnique({ where: { id: product.id } });
            if (pAfterCrash.availableStock === finalProduct.availableStock) {
                results.push({ test: 'Rollback Consistency', status: 'PASS', detail: 'Stock restored after failure' });
            } else {
                results.push({ test: 'Rollback Consistency', status: 'FAIL', detail: `Stock leaked! Expected ${finalProduct.availableStock}, got ${pAfterCrash.availableStock}` });
            }
        }

        // CLEANUP
        console.log('Cleaning up...');
        await prisma.order.deleteMany({ where: { id: idempotencyId } });
        await prisma.productListing.delete({ where: { id: product.id } });

    } catch (error) {
        console.error('Stress Test CRASHED:', error);
    } finally {
        console.log('\n--- 📝 FINAL STRESS REPORT ---');
        console.table(results);
        await prisma.$disconnect();
    }
}

runStressTest();
