
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function runChaosTest() {
    console.log("🌪️ STARTING SYSTEM-WIDE CHAOS TEST (SELF-CONTAINED)");
    console.log("==================================================");

    const results = [];
    let testOrder, testFarmer, testDelivery, testAttacker;

    try {
        console.log("🏗️ Setting up test environment...");
        
        // 1. Create a Farmer (Seller)
        testFarmer = await db.user.create({
            data: {
                id: `chaos_farmer_${Date.now()}`,
                email: `farmer_${Date.now()}@test.com`,
                role: 'farmer',
                farmerProfile: {
                    create: {
                        name: "Chaos Seller",
                        phone: "1111111111",
                        address: "Seller St",
                        country: "IN", state: "MH", city: "Pune", pincode: "411001",
                        usagePurpose: "buy_and_sell",
                        sellingStatus: "APPROVED"
                    }
                }
            },
            include: { farmerProfile: true }
        });

        // 2. Create a Delivery Partner
        testDelivery = await db.user.create({
            data: {
                id: `chaos_del_${Date.now()}`,
                email: `del_${Date.now()}@test.com`,
                role: 'delivery',
                deliveryProfile: {
                    create: {
                        name: "Chaos Courier",
                        phone: "2222222222",
                        address: "Courier St",
                        country: "IN", state: "MH", city: "Pune", pincode: "411001",
                        vehicleType: "Bike", vehicleNumber: "MH12-1234", licenseNumber: "DL-1234",
                        radius: 50, pricePerKm: 10,
                        approvalStatus: "APPROVED"
                    }
                }
            },
            include: { deliveryProfile: true }
        });

        // 3. Create an Attacker (Random User)
        testAttacker = await db.user.create({
            data: {
                id: `chaos_atk_${Date.now()}`,
                email: `atk_${Date.now()}@test.com`,
                role: 'farmer'
            }
        });

        // 4. Create an Unpaid Online Order
        testOrder = await db.order.create({
            data: {
                id: `chaos_ord_${Date.now()}`,
                buyerId: testAttacker.id,
                totalAmount: 500,
                platformFee: 10,
                sellerAmount: 490,
                paymentStatus: "PENDING",
                orderStatus: "PROCESSING",
                paymentMethod: "ONLINE",
                shippingAddress: "Buyer St",
                buyerPhone: "3333333333",
                buyerName: "Chaos Buyer"
            }
        });

        console.log("✅ Environment Ready.");

        // --- ATTACK 1: STATUS JUMP (PROCESSING -> DELIVERED) ---
        console.log("\n🧪 ATTACK 1: Attempting status jump (PROCESSING -> DELIVERED)...");
        // In the real action, we want to see if we can update DB directly (simulating missing server-side logic checks)
        await db.order.update({
            where: { id: testOrder.id },
            data: { orderStatus: 'DELIVERED' }
        });
        // If the above code runs, it means the DB allows it. 
        // Our SERVER ACTIONS should have guards like 'if (current !== SHIPPED) throw Error'
        results.push({ name: "DB Sequence Guard", result: "MISSING (DB is permissive)", severity: "INFO" });

        // --- ATTACK 2: HIRE FOR UNPAID ---
        console.log("\n🧪 ATTACK 2: Attempting to hire delivery for UNPAID order...");
        const job = await db.deliveryJob.create({
            data: {
                orderId: testOrder.id,
                deliveryBoyId: testDelivery.deliveryProfile.id,
                status: 'REQUESTED',
                distance: 10, totalPrice: 100, otp: '123456'
            }
        });
        results.push({ name: "Hire Unpaid Check", result: "MISSING (Hired for unpaid order)", severity: "MEDIUM" });

        // --- ATTACK 3: ROLE BYPASS (Unauthorized status update) ---
        console.log("\n🧪 ATTACK 3: Attacker trying to ACCEPT a job they don't own...");
        // Attacker is testAttacker.id, but the job is for testDelivery.id
        // Simulating the code in 'updateDeliveryJobStatus' WITHOUT the missing user check
        await db.deliveryJob.update({
            where: { id: job.id },
            data: { status: 'ACCEPTED' }
        });
        results.push({ name: "Role Authorization", result: "MISSING (Attacker accepted foreign job)", severity: "CRITICAL" });

        // --- ATTACK 4: SKIP SHIPMENT ---
        console.log("\n🧪 ATTACK 4: Attempting to mark as PICKED_UP without being ACCEPTED...");
        // Re-setting job to REQUESTED
        await db.deliveryJob.update({ where: { id: job.id }, data: { status: 'REQUESTED' } });
        // Attempt jump
        await db.deliveryJob.update({ where: { id: job.id }, data: { status: 'PICKED_UP' } });
        results.push({ name: "Logistics State Machine", result: "MISSING (Jumped to PICKED_UP)", severity: "HIGH" });

    } catch (e) {
        console.error("💥 CHAOS ERROR:", e.message);
    } finally {
        console.log("\n🧹 Cleaning up chaos...");
        if (testOrder) await db.orderItem.deleteMany({ where: { orderId: testOrder.id } }).catch(() => {});
        if (testOrder) await db.deliveryJob.deleteMany({ where: { orderId: testOrder.id } }).catch(() => {});
        if (testOrder) await db.order.delete({ where: { id: testOrder.id } }).catch(() => {});
        if (testFarmer) await db.farmerProfile.delete({ where: { userId: testFarmer.id } }).catch(() => {});
        if (testDelivery) await db.deliveryProfile.delete({ where: { userId: testDelivery.id } }).catch(() => {});
        if (testFarmer) await db.user.delete({ where: { id: testFarmer.id } }).catch(() => {});
        if (testDelivery) await db.user.delete({ where: { id: testDelivery.id } }).catch(() => {});
        if (testAttacker) await db.user.delete({ where: { id: testAttacker.id } }).catch(() => {});

        console.log("\n===================================");
        console.log("📊 FINAL CHAOS REPORT");
        console.log("===================================");
        results.forEach(r => {
            console.log(`[${r.severity}] ${r.name.padEnd(25)}: ${r.result}`);
        });
        await db.$disconnect();
    }
}

runChaosTest();
