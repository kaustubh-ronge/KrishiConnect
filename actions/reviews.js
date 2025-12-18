"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// Create a review (only allowed after delivery)
export async function createReview(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const orderId = formData.get('orderId');
    const productId = formData.get('productId');
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment') || null;

    // Validation
    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    // Verify order belongs to user and is delivered
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { productId },
          include: {
            product: {
              include: {
                farmer: true,
                agent: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.buyerId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (order.orderStatus !== 'DELIVERED') {
      return { success: false, error: "You can only review after the order is delivered" };
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({
      where: {
        orderId_productId_userId: {
          orderId,
          productId,
          userId: user.id
        }
      }
    });

    if (existingReview) {
      return { success: false, error: "You have already reviewed this product" };
    }

    // Create review
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

    // Update product rating
    const allReviews = await db.review.findMany({
      where: { productId, isHidden: false }
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db.productListing.update({
      where: { id: productId },
      data: {
        averageRating: avgRating,
        totalReviews: allReviews.length
      }
    });

    // Update seller rating
    const orderItem = order.items[0];
    if (orderItem) {
      if (orderItem.product.sellerType === 'farmer' && orderItem.product.farmer) {
        const sellerReviews = await db.review.findMany({
          where: {
            product: { farmerId: orderItem.product.farmer.id },
            isHidden: false
          }
        });
        
        const sellerAvg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
        
        await db.farmerProfile.update({
          where: { id: orderItem.product.farmer.id },
          data: {
            averageRating: sellerAvg,
            totalReviews: sellerReviews.length
          }
        });

        // Notify seller
        await createNotification({
          userId: orderItem.product.farmer.userId,
          type: 'REVIEW_RECEIVED',
          title: 'New Review Received',
          message: `You received a ${rating}-star review on ${orderItem.product.productName}`,
          linkUrl: `/farmer-dashboard/my-listings`
        });
      } else if (orderItem.product.sellerType === 'agent' && orderItem.product.agent) {
        const sellerReviews = await db.review.findMany({
          where: {
            product: { agentId: orderItem.product.agent.id },
            isHidden: false
          }
        });
        
        const sellerAvg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
        
        await db.agentProfile.update({
          where: { id: orderItem.product.agent.id },
          data: {
            averageRating: sellerAvg,
            totalReviews: sellerReviews.length
          }
        });

        // Notify seller
        await createNotification({
          userId: orderItem.product.agent.userId,
          type: 'REVIEW_RECEIVED',
          title: 'New Review Received',
          message: `You received a ${rating}-star review on ${orderItem.product.productName}`,
          linkUrl: `/agent-dashboard/my-listings`
        });
      }
    }

    revalidatePath(`/marketplace/product/${productId}`);
    revalidatePath('/my-orders');

    return { success: true, message: "Review submitted successfully" };
  } catch (error) {
    console.error("Create Review Error:", error);
    return { success: false, error: "Failed to submit review" };
  }
}

// Get reviews for a product
export async function getProductReviews(productId) {
  try {
    const reviews = await db.review.findMany({
      where: { 
        productId,
        isHidden: false
      },
      include: {
        user: {
          select: {
            name: true,
            farmerProfile: { select: { name: true } },
            agentProfile: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

// Check if user can review a product from an order
export async function canReviewProduct(orderId, productId) {
  const user = await currentUser();
  if (!user) return { success: false, canReview: false };

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { productId }
        }
      }
    });

    if (!order || order.buyerId !== user.id) {
      return { success: true, canReview: false, reason: "Invalid order" };
    }

    if (order.orderStatus !== 'DELIVERED') {
      return { success: true, canReview: false, reason: "Order not delivered yet" };
    }

    // Check if already reviewed
    const existingReview = await db.review.findUnique({
      where: {
        orderId_productId_userId: {
          orderId,
          productId,
          userId: user.id
        }
      }
    });

    if (existingReview) {
      return { success: true, canReview: false, reason: "Already reviewed" };
    }

    return { success: true, canReview: true };
  } catch (error) {
    console.error("Can Review Product Error:", error);
    return { success: false, canReview: false };
  }
}

// Get reviews written by user
export async function getUserReviews() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const reviews = await db.review.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            images: true
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("Get User Reviews Error:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

