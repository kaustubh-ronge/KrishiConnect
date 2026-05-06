
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testLogisticsGuard() {
    console.log('--- 🛡️ Logistics Acceptance Guard Test ---');
    
    const orderId = 'test_order_guard';
    const partnerA = 'partner_a_guard';
    const partnerB = 'partner_b_guard';

    try {
        // SETUP
        console.log('1. Setting up order and dual requests...');
        await prisma.user.upsert({ where: { id: 'some_buyer_guard' }, update: { role: 'none' }, create: { id: 'some_buyer_guard', email: 'buyer_guard@test.com', role: 'none' } });
        await prisma.user.upsert({ where: { id: partnerA }, update: { role: 'delivery' }, create: { id: partnerA, email: 'ag@test.com', role: 'delivery' } });
        await prisma.user.upsert({ where: { id: partnerB }, update: { role: 'delivery' }, create: { id: partnerB, email: 'bg@test.com', role: 'delivery' } });
        await prisma.deliveryProfile.upsert({ where: { userId: partnerA }, update: { approvalStatus: 'APPROVED' }, create: { userId: partnerA, name: 'Partner A', phone: '11', approvalStatus: 'APPROVED' } });
        await prisma.deliveryProfile.upsert({ where: { userId: partnerB }, update: { approvalStatus: 'APPROVED' }, create: { userId: partnerB, name: 'Partner B', phone: '22', approvalStatus: 'APPROVED' } });
        
        await prisma.order.upsert({
            where: { id: orderId },
            update: { orderStatus: 'PROCESSING' },
            create: { id: orderId, buyerId: 'some_buyer_guard', totalAmount: 100, platformFee: 5, sellerAmount: 95 }
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

        // 2. SEQUENTIAL ACCEPTANCE
        console.log('2. Partner A accepting...');
        // Simulation of updateDeliveryJobStatus logic
        await prisma.$transaction(async (tx) => {
            const already = await tx.deliveryJob.findFirst({
                where: { orderId, status: { in: ['ACCEPTED', 'PICKED_UP'] }, id: { not: jobA.id } }
            });
            if (already) throw new Error("ALREADY_ACCEPTED");

            await tx.deliveryJob.update({ where: { id: jobA.id }, data: { status: 'ACCEPTED' } });
            
            // Auto-cancel others
            await tx.deliveryJob.updateMany({
                where: { orderId, status: 'REQUESTED', id: { not: jobA.id } },
                data: { status: 'CANCELLED' }
            });
        });
        console.log('✅ Partner A accepted successfully.');

        console.log('3. Partner B attempting to accept...');
        try {
            await prisma.$transaction(async (tx) => {
                const already = await tx.deliveryJob.findFirst({
                    where: { orderId, status: { in: ['ACCEPTED', 'PICKED_UP'] }, id: { not: jobB.id } }
                });
                if (already) throw new Error("ALREADY_ACCEPTED");

                await tx.deliveryJob.update({ where: { id: jobB.id }, data: { status: 'ACCEPTED' } });
            });
            console.log('❌ FAIL: Partner B accepted an already assigned order.');
        } catch (e) {
            if (e.message === 'ALREADY_ACCEPTED') {
                console.log('✅ PASS: Partner B was correctly blocked by the guard.');
            } else {
                throw e;
            }
        }

        // 4. Verify auto-cancellation
        const finalJobB = await prisma.deliveryJob.findUnique({ where: { id: jobB.id } });
        if (finalJobB.status === 'CANCELLED') {
            console.log('✅ PASS: Other pending requests were auto-cancelled.');
        } else {
            console.log(`❌ FAIL: Job B status is ${finalJobB.status} (expected CANCELLED)`);
        }

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testLogisticsGuard();
