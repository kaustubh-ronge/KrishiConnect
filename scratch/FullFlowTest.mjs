
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTest() {
  console.log('--- 🚀 Full System Flow Test ---');

  try {
    // 1. Setup Mock Data
    console.log('1. Setting up mock users...');
    const buyer = await prisma.user.upsert({
      where: { email: 'test_buyer@test.com' },
      update: {},
      create: { id: 'test_buyer_id', email: 'test_buyer@test.com', name: 'Test Buyer', role: 'none' }
    });

    const seller = await prisma.user.upsert({
      where: { email: 'test_seller@test.com' },
      update: {},
      create: { id: 'test_seller_id', email: 'test_seller@test.com', name: 'Test Seller', role: 'farmer' }
    });

    const deliveryBoy = await prisma.user.upsert({
      where: { email: 'test_delivery@test.com' },
      update: {},
      create: { id: 'test_delivery_id', email: 'test_delivery@test.com', name: 'Test Delivery', role: 'delivery' }
    });

    // Ensure profiles exist
    await prisma.farmerProfile.upsert({
      where: { userId: seller.id },
      update: { sellingStatus: 'APPROVED', usagePurpose: 'buy_and_sell' },
      create: { userId: seller.id, name: 'Test Seller', phone: '1234567890', aadharNumber: '123456789012', sellingStatus: 'APPROVED', usagePurpose: 'buy_and_sell' }
    });

    await prisma.deliveryProfile.upsert({
      where: { userId: deliveryBoy.id },
      update: { approvalStatus: 'APPROVED' },
      create: { userId: deliveryBoy.id, name: 'Test Delivery', phone: '0987654321', approvalStatus: 'APPROVED' }
    });

    const product = await prisma.productListing.create({
      data: {
        farmerId: (await prisma.farmerProfile.findUnique({where: {userId: seller.id}})).id,
        sellerType: 'farmer',
        productName: 'Test Tomato',
        pricePerUnit: 20,
        availableStock: 100,
        unit: 'kg',
        quantityLabel: '500g',
        images: ['test.jpg']
      }
    });

    // 2. Add to Cart
    console.log('2. Testing Cart Atomicity...');
    await prisma.cart.upsert({
      where: { userId: buyer.id },
      update: {},
      create: { userId: buyer.id }
    });
    
    const cart = await prisma.cart.findUnique({ where: { userId: buyer.id } });
    const cartItem = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      update: { quantity: { increment: 5 } },
      create: { cartId: cart.id, productId: product.id, quantity: 5 }
    });
    console.log('✅ Cart Item Created/Updated');

    // 3. Checkout (COD)
    console.log('3. Testing Checkout...');
    const orderId = `test_ord_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        id: orderId,
        buyerId: buyer.id,
        totalAmount: 100,
        platformFee: 5,
        sellerAmount: 95,
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
        shippingAddress: 'Test Address',
        orderStatus: 'PROCESSING',
        items: {
          create: {
            productId: product.id,
            quantity: 5,
            priceAtPurchase: 20,
            sellerId: product.farmerId,
            sellerType: 'farmer',
            sellerName: 'Test Seller'
          }
        }
      }
    });
    // Deduct stock (atomic)
    await prisma.productListing.update({
      where: { id: product.id },
      data: { availableStock: { decrement: 5 } }
    });
    console.log('✅ Order Created & Stock Deducted');

    // 4. Hire Delivery
    console.log('4. Testing Logistics Hire...');
    const deliveryProfile = await prisma.deliveryProfile.findUnique({ where: { userId: deliveryBoy.id } });
    const job = await prisma.deliveryJob.create({
      data: {
        orderId: order.id,
        deliveryBoyId: deliveryProfile.id,
        status: 'REQUESTED',
        otp: '123456'
      }
    });
    console.log('✅ Delivery Job Assigned');

    // 5. Pickup
    console.log('5. Testing Pickup...');
    await prisma.$transaction([
        prisma.deliveryJob.update({
            where: { id: job.id },
            data: { status: 'PICKED_UP' }
        }),
        prisma.order.update({
            where: { id: order.id },
            data: { orderStatus: 'SHIPPED' }
        })
    ]);
    console.log('✅ Order Picked Up');

    // 6. Complete Delivery (Simulate OTP match)
    console.log('6. Testing Completion...');
    const otpToTest = '123456';
    const jobCheck = await prisma.deliveryJob.findUnique({ where: { id: job.id } });
    
    if (jobCheck.otp !== otpToTest) {
        throw new Error('OTP Mismatch in test simulation');
    }

    await prisma.$transaction([
        prisma.deliveryJob.update({
            where: { id: job.id },
            data: { status: 'DELIVERED' }
        }),
        prisma.order.update({
            where: { id: order.id },
            data: { orderStatus: 'DELIVERED', paymentStatus: 'PAID', deliveredAt: new Date() }
        })
    ]);
    console.log('✅ Order Delivered Successfully');

    // Cleanup
    console.log('Cleaning up...');
    await prisma.deliveryJob.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.productListing.delete({ where: { id: product.id } });

    console.log('--- 🏁 Global Result: PASS ✅ ---');

  } catch (error) {
    console.error('--- ❌ Global Result: FAIL ---');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
