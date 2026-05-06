import { db } from "./prisma.js";

/**
 * Checks if a user is the seller of a specific order.
 */
export async function isSellerOfOrder(userId, orderId) {
  if (!userId || !orderId) return false;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
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

  if (!order) return false;

  return order.items.some(item => {
    if (item.product.sellerType === 'farmer' && item.product.farmer) {
      return item.product.farmer.userId === userId;
    }
    if (item.product.sellerType === 'agent' && item.product.agent) {
      return item.product.agent.userId === userId;
    }
    return false;
  });
}

/**
 * Checks if a user is the assigned delivery partner for a job.
 */
export async function isAssignedDeliveryPartner(userId, jobId) {
  if (!userId || !jobId) return false;

  const job = await db.deliveryJob.findUnique({
    where: { id: jobId },
    include: { deliveryBoy: true }
  });

  return job?.deliveryBoy?.userId === userId;
}

/**
 * Shared Response Helper
 */
export const apiResponse = {
  success: (data = null, message = "Operation successful") => ({ success: true, data, message }),
  error: (error = "An error occurred", status = 400) => ({ success: false, error, status })
};
