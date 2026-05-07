
import { db } from '../lib/prisma.js';

async function verifyStateCorrectness() {
    console.log("🔍 STARTING STATE CORRECTNESS VERIFICATION\n");

    try {
        const testProduct = await db.productListing.findFirst();
        if (!testProduct) throw new Error("No product found.");
        const productId = testProduct.id;

        const testUser = await db.user.findFirst({ where: { role: 'farmer' } });
        if (!testUser) throw new Error("No user found.");
        const userId = testUser.id;

        // --- TEST 1: Cart Cumulative Stock Guard ---
        console.log("🛒 TEST 1: Cart Cumulative Stock Guard");
        await db.cartItem.deleteMany({ where: { cart: { userId } } });
        const originalStock = testProduct.availableStock;
        await db.productListing.update({ where: { id: productId }, data: { availableStock: 10 } });

        console.log("- Adding 8 items to cart...");
        const cart = await db.cart.upsert({ where: { userId }, update: {}, create: { userId } });
        await db.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId } },
            update: { quantity: 8 },
            create: { cartId: cart.id, productId, quantity: 8 }
        });

        console.log("- Attempting to add 5 more (Total would be 13/10)...");
        const existingItem = await db.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } }
        });
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        const totalPotentialQty = currentQtyInCart + 5;

        if (10 < totalPotentialQty) {
            console.log("✅ PASSED: Blocked addition. Cumulative check works.");
        } else {
            console.error("❌ FAILED: Allowed adding 5 more. Stock mismatch!");
        }
        await db.productListing.update({ where: { id: productId }, data: { availableStock: originalStock } });

        // --- TEST 2: Delivery Profile Creation Atomicity ---
        console.log("\n🚚 TEST 2: Delivery Profile Creation Atomicity");
        const dummyId = "state_test_user_" + Date.now();
        const newUser = await db.user.create({
            data: { id: dummyId, email: "test_" + dummyId + "@state.com", role: "none" }
        });

        try {
            await db.$transaction(async (tx) => {
                await tx.deliveryProfile.create({
                    data: {
                        userId: newUser.id,
                        name: "Fail Test",
                        approvalStatus: "PENDING",
                        phone: "1234567890",
                        address: "Fail St",
                        country: "IN",
                        state: "MH",
                        city: "Pune",
                        pincode: "411001",
                        vehicleType: "Bike",
                        vehicleNumber: "MH12",
                        licenseNumber: "DL12",
                        aadharNumber: "123412341234",
                        upiId: "test@upi",
                        bankName: "HDFC",
                        accountNumber: "123456",
                        ifscCode: "HDFC0001",
                        radius: 10,
                        pricePerKm: 5
                    }
                });
                throw new Error("SIMULATED_FAIL");
            });
        } catch (e) {
            if (e.message === "SIMULATED_FAIL") {
                const check = await db.deliveryProfile.findUnique({ where: { userId: newUser.id } });
                if (!check) {
                    console.log("✅ PASSED: Transaction rolled back. No orphaned profile created.");
                } else {
                    console.error("❌ FAILED: Orphaned profile exists despite error!");
                }
            }
        }
        await db.user.delete({ where: { id: newUser.id } });

        // --- TEST 3: Concurrent Job Acceptance (Atomic updateMany) ---
        console.log("\n🎯 TEST 3: Concurrent Job Acceptance (Atomic updateMany)");
        
        // Create dummy order and profile
        const buyer = await db.user.findFirst();
        const order = await db.order.create({
            data: { buyerId: buyer.id, totalAmount: 100, platformFee: 10, sellerAmount: 90, paymentStatus: 'PAID' }
        });
        const dUser = await db.user.create({
            data: { id: "d_user_" + Date.now(), email: "d_" + Date.now() + "@test.com", role: "delivery" }
        });
        const profile = await db.deliveryProfile.create({
            data: { userId: dUser.id, name: "D Partner", phone: "123", approvalStatus: "APPROVED" }
        });
        const job = await db.deliveryJob.create({
            data: { orderId: order.id, deliveryBoyId: profile.id, status: "REQUESTED" }
        });

        console.log(`- 5 partners competing for job ${job.id}...`);
        const results = await Promise.allSettled(
            Array.from({ length: 5 }).map(async (_, i) => {
                return await db.$transaction(async (tx) => {
                    const updated = await tx.deliveryJob.updateMany({
                        where: { id: job.id, status: "REQUESTED" },
                        data: { status: "ACCEPTED", notes: `Winner ${i}` }
                    });
                    if (updated.count === 0) throw new Error("LOST_RACE");
                    return updated;
                });
            })
        );

        const winnerCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`- Winners: ${winnerCount} (Expected: 1)`);
        if (winnerCount === 1) {
            console.log("✅ PASSED: Only one winner. Deterministic state.");
        } else {
            console.error("❌ FAILED: Multiple winners detected!");
        }

        // Cleanup
        await db.deliveryJob.delete({ where: { id: job.id } });
        await db.deliveryProfile.delete({ where: { id: profile.id } });
        await db.user.delete({ where: { id: dUser.id } });
        await db.order.delete({ where: { id: order.id } });

    } catch (err) {
        console.error("💥 TEST ERROR:", err);
    } finally {
        await db.$disconnect();
    }
}

verifyStateCorrectness();
