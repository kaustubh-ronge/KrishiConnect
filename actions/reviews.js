
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createReview(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orderId = formData.get('orderId');
    const productId = formData.get('productId');
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment');

    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: "Please provide a valid rating (1-5)." };
    }

    // 1. Verify valid delivered order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return { success: false, error: "Order not found." };
    if (order.buyerId !== user.id) return { success: false, error: "Unauthorized." };
    
    // In real-world, enforce 'DELIVERED'. For testing, you might comment this out.
    if (order.orderStatus !== 'DELIVERED') {
       return { success: false, error: "You can only review delivered items." };
    }

    // 2. Check if already reviewed
    const existing = await db.review.findUnique({
        where: {
            orderId_productId_userId: {
                orderId, productId, userId: user.id
            }
        }
    });

    if (existing) return { success: false, error: "You already reviewed this product." };

    // 3. Create Review
    await db.review.create({
      data: {
        orderId,
        productId,
        userId: user.id,
        rating,
        comment,
        isVerifiedPurchase: true
      }
    });

    // 4. Update Product & Seller Stats (Aggregates)
    const productReviews = await db.review.findMany({ where: { productId } });
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await db.productListing.update({
        where: { id: productId },
        data: { averageRating: avgRating, totalReviews: productReviews.length }
    });

    revalidatePath('/my-orders');
    return { success: true, message: "Review submitted successfully!" };

  } catch (err) {
    console.error("Review Error:", err);
    return { success: false, error: "Failed to submit review." };
  }
}