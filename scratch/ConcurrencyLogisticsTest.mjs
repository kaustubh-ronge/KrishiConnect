
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testLogisticsConcurrency() {
    console.log('--- 🛡️ Logistics Concurrency Race Test ---');
    
    const orderId = 'test_order_race';
    const partnerA = 'partner_a';
    const partnerB = 'partner_b';

    try {
        // SETUP
        console.log('1. Setting up order and dual requests...');
        await prisma.user.upsert({ where: { id: 'some_buyer' }, update: { role: 'none' }, create: { id: 'some_buyer', email: 'buyer@test.com', role: 'none' } });
        await prisma.user.upsert({ where: { id: partnerA }, update: { role: 'delivery' }, create: { id: partnerA, email: 'a@test.com', role: 'delivery' } });
        await prisma.user.upsert({ where: { id: partnerB }, update: { role: 'delivery' }, create: { id: partnerB, email: 'b@test.com', role: 'delivery' } });
        await prisma.deliveryProfile.upsert({ where: { userId: partnerA }, update: { approvalStatus: 'APPROVED' }, create: { userId: partnerA, name: 'Partner A', phone: '1', approvalStatus: 'APPROVED' } });
        await prisma.deliveryProfile.upsert({ where: { userId: partnerB }, update: { approvalStatus: 'APPROVED' }, create: { userId: partnerB, name: 'Partner B', phone: '2', approvalStatus: 'APPROVED' } });
        
        await prisma.order.upsert({
            where: { id: orderId },
            update: { orderStatus: 'PROCESSING' },
            create: { id: orderId, buyerId: 'some_buyer', totalAmount: 100, platformFee: 5, sellerAmount: 95 }
        });

        const profileA = await prisma.deliveryProfile.findUnique({ where: { userId: partnerA } });
        const profileB = await prisma.deliveryProfile.findUnique({ where: { userId: partnerB } });

        const jobA = await prisma.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId: profileA.id } },
            update: { status: 'REQUESTED' },
            create: { orderId, deliveryBoyId: profileA.id, status: 'REQUESTED' }
        });

        const jobB = await prisma.deliveryJob.upsert({
            where: { orderId_deliveryBoyId: { orderId, deliveryBoyId: profileB.id } },
            update: { status: 'REQUESTED' },
            create: { orderId, deliveryBoyId: profileB.id, status: 'REQUESTED' }
        });

        // 2. CONCURRENT ACCEPTANCE
        console.log('2. Simulating Concurrent Acceptance...');
        
        // This simulates two parallel calls to updateDeliveryJobStatus
        const acceptAction = async (jobId) => {
            return await prisma.$transaction(async (tx) => {
                // Read check (Acceptance Guard)
                const already = await tx.deliveryJob.findFirst({
                    where: { orderId, status: 'ACCEPTED', id: { not: jobId } }
                });
                if (already) throw new Error("ALREADY_ACCEPTED");

                // Execute Accept
                await tx.deliveryJob.update({
                    where: { id: jobId },
                    data: { status: 'ACCEPTED' }
                });
                
                // Cancel others
                await tx.deliveryJob.updateMany({
                    where: { orderId, status: 'REQUESTED', id: { not: jobId } },
                    data: { status: 'CANCELLED' }
                });
                
                return "SUCCESS";
            });
        };

        const results = await Promise.allSettled([acceptAction(jobA.id), acceptAction(jobB.id)]);
        
        console.log('Results:', results.map(r => r.status === 'fulfilled' ? r.value : r.reason.message));

        const successes = results.filter(r => r.status === 'fulfilled' && r.value === 'SUCCESS').length;
        const failures = results.filter(r => r.status === 'rejected' && r.reason.message === 'ALREADY_ACCEPTED').length;

        if (successes === 1 && failures === 1) {
            console.log('✅ PASS: Exactly one partner accepted, the other was blocked.');
        } else {
            console.log('❌ FAIL: Multiple partners accepted or both failed.', { successes, failures });
        }

        // Verify cleanup
        const jobB_final = await prisma.deliveryJob.findUnique({ where: { id: jobB.id } });
        if (jobB_final.status === 'CANCELLED' || jobB_final.status === 'ACCEPTED') {
            console.log(`Job B status: ${jobB_final.status}`);
        }

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testLogisticsConcurrency();
