
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sanitizeContent } from "@/lib/utils";

export async function createReview(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  // 3. Extract & Validate Data
  const formValues = Object.fromEntries(formData.entries());
  
  // Sanitize all string values
  Object.keys(formValues).forEach(key => {
    if (typeof formValues[key] === 'string') {
      formValues[key] = sanitizeContent(formValues[key]);
    } else if (Array.isArray(formValues[key])) {
      formValues[key] = formValues[key].map(v => typeof v === 'string' ? sanitizeContent(v) : v);
    }
  });

  const orderId = formData.get('orderId')?.toString();
  const productId = formData.get('productId')?.toString();
  const rawRating = formData.get('rating')?.toString();
  const rating = parseInt(rawRating || "0");
  const comment = sanitizeContent(formData.get('comment'))?.slice(0, 1000);

  if (!orderId || !productId) {
    return { success: false, error: "Missing required order or product information." };
  }

  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Please provide a valid rating (1-5)." };
  }

  try {
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

    // 4. Update Product Aggregates
    const productReviews = await db.review.findMany({ where: { productId } });
    const avgProductRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    const product = await db.productListing.update({
        where: { id: productId },
        data: { averageRating: avgProductRating, totalReviews: productReviews.length },
        include: { farmer: true, agent: true }
    });

    // 5. Update Seller Aggregates (Reputation)
    const sellerId = product.farmerId || product.agentId;
    const sellerType = product.farmerId ? 'farmer' : 'agent';
    
    if (sellerId) {
        await db.$transaction(async (tx) => {
            const allSellerReviews = await tx.review.findMany({
                where: {
                    product: {
                        OR: [{ farmerId: sellerId }, { agentId: sellerId }]
                    }
                }
            });
            
            const sellerAvg = allSellerReviews.length > 0 
                ? allSellerReviews.reduce((sum, r) => sum + r.rating, 0) / allSellerReviews.length
                : 0;
            
            if (sellerType === 'farmer') {
                await tx.farmerProfile.update({
                    where: { id: sellerId },
                    data: { averageRating: sellerAvg, totalReviews: allSellerReviews.length }
                });
            } else {
                await tx.agentProfile.update({
                    where: { id: sellerId },
                    data: { averageRating: sellerAvg, totalReviews: allSellerReviews.length }
                });
            }
        }, { isolationLevel: "Serializable" });
    }

    revalidatePath('/my-orders');
    return { success: true, message: "Review submitted successfully!" };

  } catch (err) {
    console.error("Review Error:", err);
    return { success: false, error: "Failed to submit review." };
  }
}