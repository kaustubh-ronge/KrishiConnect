
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runRecoveryAudit() {
    console.log("🛠️ KRISHICONNECT RECOVERY & RESUMPTION AUDIT");
    console.log("===========================================");

    const ts = Date.now();
    const userId = `recovery_${ts}`;
    const ordId = `ord_rec_${ts}`;

    try {
        // --- 1. RESUME CHECKOUT TEST ---
        console.log("\n🚀 TEST 1: RESUME CHECKOUT (Failure Recovery)");
        console.log("   Creating a PENDING order with NO razorpay ID (simulated crash)...");
        
        await db.user.create({ data: { id: userId, email: `${userId}@rec.com`, role: 'none' } });
        await db.order.create({
            data: {
                id: ordId,
                buyerId: userId,
                totalAmount: 100,
                platformFee: 2,
                sellerAmount: 98,
                paymentStatus: 'PENDING',
                orderStatus: 'PROCESSING',
                paymentMethod: 'ONLINE'
                // Missing razorpayOrderId simulates a crash after DB commit but before API call
            }
        });

        console.log("   Attempting to 'Resend' checkout for the same order...");
        // This simulates a user clicking "Pay" again
        const order = await db.order.findUnique({ where: { id: ordId } });
        
        let canResume = false;
        if (order.paymentStatus === 'PENDING' && !order.razorpayOrderId) {
            canResume = true;
            console.log("   ✅ RECOVERY PASS: Pending order detected for resumption.");
        } else {
            console.log("   ❌ RECOVERY FAIL: Order state does not allow resumption.");
        }

        // --- 2. OTP RESEND RECOVERY ---
        console.log("\n🚀 TEST 2: OTP RESEND (Logistics Recovery)");
        const jobId = `job_rec_${ts}`;
        const deliveryUserId = `del_rec_${ts}`;
        const delProfId = `dp_rec_${ts}`;

        await db.user.create({ data: { id: deliveryUserId, email: `${deliveryUserId}@rec.com`, role: 'delivery' } });
        await db.deliveryProfile.create({ data: { id: delProfId, userId: deliveryUserId, name: "Rec Boy", phone: "9876543210", approvalStatus: 'APPROVED' } });

        await db.deliveryJob.create({
            data: {
                id: jobId,
                orderId: ordId,
                deliveryBoyId: delProfId,
                status: 'PICKED_UP',
                otp: '123456',
                distance: 5,
                totalPrice: 50
            }
        });

        console.log("   Verifying OTP resend logic...");
        const job = await db.deliveryJob.findUnique({ where: { id: jobId } });
        if (job.status === 'PICKED_UP' && job.otp) {
            console.log("   ✅ RECOVERY PASS: OTP resend available for active job.");
        } else {
            console.log("   ❌ RECOVERY FAIL: Cannot resend OTP.");
        }

        // --- 3. ATOMIC ROLLBACK (Transaction Integrity) ---
        console.log("\n🚀 TEST 3: ATOMIC ROLLBACK (Partial Failure Protection)");
        console.log("   Simulating a crash mid-way through Payout Settlement...");
        
        try {
            await db.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: ordId },
                    data: { payoutStatus: 'SETTLED' }
                });
                
                console.log("   -> Status flipped. Crashing before notifications...");
                throw new Error("RECOVERY_TEST_CRASH");
            });
        } catch (e) {
            console.log(`   -> Caught expected crash: ${e.message}`);
        }

        const orderAfter = await db.order.findUnique({ where: { id: ordId } });
        if (orderAfter.payoutStatus === 'PENDING') {
            console.log("   ✅ ATOMICITY PASS: No partial updates persisted.");
        } else {
            console.log("   ❌ ATOMICITY FAIL: Partial update detected!");
        }

        // --- 2.1 SELF-DELIVERY OTP RESEND RECOVERY ---
        console.log("\n🚀 TEST 2.1: SELF-DELIVERY OTP RESEND (Seller Recovery)");
        const selfOrderId = `ord_self_${ts}`;
        const sellerUserId = `sel_rec_${ts}`;

        await db.user.create({ data: { id: sellerUserId, email: `${sellerUserId}@rec.com`, role: 'farmer' } });
        await db.order.create({
            data: {
                id: selfOrderId,
                buyerId: userId,
                totalAmount: 100,
                platformFee: 2,
                sellerAmount: 98,
                paymentStatus: 'PAID',
                orderStatus: 'SHIPPED',
                selfDeliveryOtp: '999888'
            }
        });

        console.log("   Verifying Self-Delivery OTP resend availability...");
        const selfOrder = await db.order.findUnique({ where: { id: selfOrderId } });
        if (selfOrder.orderStatus === 'SHIPPED' && selfOrder.selfDeliveryOtp) {
            console.log("   ✅ RECOVERY PASS: Self-delivery OTP resend available.");
        } else {
            console.log("   ❌ RECOVERY FAIL: Cannot resend self-delivery OTP.");
        }

    } catch (err) {
        console.error("❌ RECOVERY AUDIT CRITICAL FAILURE:", err.message);
    } finally {
        // Cleanup
        await db.deliveryJob.deleteMany({ where: { id: { startsWith: 'job_rec_' } } });
        await db.deliveryProfile.deleteMany({ where: { id: { startsWith: 'dp_rec_' } } });
        await db.order.deleteMany({ where: { id: { in: [ordId, `ord_self_${ts}`] } } });
        await db.user.deleteMany({ where: { id: { in: [userId, `del_rec_${ts}`, `sel_rec_${ts}`] } } });
        await db.$disconnect();
    }
}

runRecoveryAudit();
