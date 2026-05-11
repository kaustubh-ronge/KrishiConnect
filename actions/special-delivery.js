"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { apiResponse } from "@/lib/permissions";

/**
 * Create a new special delivery request.
 */
export async function createSpecialDeliveryRequest(productId, quantity, sellerId) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        // Check for existing request
        const existing = await db.specialDeliveryRequest.findFirst({
            where: {
                userId: user.id,
                productId: productId
            }
        });

        const COOLDOWN_MINUTES = 15;

        if (existing) {
            // Logic for existing requests
            if (existing.status === 'PENDING') {
                return apiResponse.error("You already have a pending request for this product.");
            }

            if (existing.status === 'REJECTED' && existing.rejectedAt) {
                const now = new Date();
                const cooldownEnd = new Date(existing.rejectedAt.getTime() + COOLDOWN_MINUTES * 60 * 1000);

                if (now < cooldownEnd) {
                    const remaining = Math.ceil((cooldownEnd - now) / 1000 / 60);
                    return apiResponse.error(`This request was recently rejected. Please wait ${remaining} minutes before re-requesting.`);
                }
            }

            // Update existing record (Re-request)
            const updated = await db.specialDeliveryRequest.update({
                where: { id: existing.id },
                data: {
                    quantity: parseFloat(quantity),
                    status: "PENDING",
                    inquirySent: false, // Reset inquiry status on re-request
                    rejectedAt: null, // Reset rejection timestamp
                    adminNotes: null, // Clear old notes
                    negotiatedFee: null // Clear old fee
                }
            });

            revalidatePath("/cart");
            return apiResponse.success(updated, "Request re-submitted for approval.");
        }

        // Create new if none exists
        const request = await db.specialDeliveryRequest.create({
            data: {
                userId: user.id,
                productId: productId,
                quantity: parseFloat(quantity),
                sellerId: sellerId,
                status: "PENDING",
                inquirySent: false
            }
        });

        revalidatePath("/cart");
        return apiResponse.success(request, "Special delivery request submitted for admin approval.");
    } catch (error) {
        return apiResponse.error(error.message);
    }
}

/**
 * Create bulk special delivery requests for multiple items.
 */
export async function bulkCreateSpecialDeliveryRequests(items) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        console.log(`[Special Delivery] Bulk creating ${items.length} requests for user ${user.id}`);

        const results = [];

        for (const it of items) {
            const productId = it.productId;
            const quantity = it.quantity;
            const sellerId = it.product.farmerId || it.product.agentId;

            // Check for existing request
            const existing = await db.specialDeliveryRequest.findFirst({
                where: {
                    userId: user.id,
                    productId: productId
                }
            });

            if (existing) {
                if (existing.status === 'PENDING') {
                    results.push(existing);
                    continue;
                }

                const updated = await db.specialDeliveryRequest.update({
                    where: { id: existing.id },
                    data: {
                        quantity: parseFloat(quantity),
                        status: "PENDING",
                        inquirySent: false,
                        rejectedAt: null,
                        adminNotes: null,
                        negotiatedFee: null
                    }
                });
                results.push(updated);
            } else {
                const request = await db.specialDeliveryRequest.create({
                    data: {
                        userId: user.id,
                        productId: productId,
                        quantity: parseFloat(quantity),
                        sellerId: sellerId,
                        status: "PENDING",
                        inquirySent: false
                    }
                });
                results.push(request);
            }
        }

        revalidatePath("/cart");
        return apiResponse.success(results, "Special delivery requests submitted for all selected items.");
    } catch (error) {
        console.error("[Special Delivery] Bulk Error:", error);
        return apiResponse.error(error.message);
    }
}

/**
 * Get all special delivery requests for Admin.
 */
export async function getSpecialDeliveryRequests() {
    try {
        const user = await currentUser();
        // In a real app, check for ADMIN role here

        const requests = await db.specialDeliveryRequest.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                product: {
                    include: {
                        farmer: true,
                        agent: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return apiResponse.success(requests);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}

/**
 * Approve or reject a special delivery request.
 */
export async function updateSpecialDeliveryStatus(requestId, status, negotiatedFee = null, notes = "") {
    try {
        const user = await currentUser();
        // Admin check here

        const updated = await db.specialDeliveryRequest.update({
            where: { id: requestId },
            data: {
                status: status,
                negotiatedFee: negotiatedFee ? parseFloat(negotiatedFee) : null,
                adminNotes: notes,
                rejectedAt: status === 'REJECTED' ? new Date() : null
            }
        });

        revalidatePath("/admin-dashboard");
        revalidatePath("/cart");
        return apiResponse.success(updated, `Request ${status.toLowerCase()} successfully.`);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}

/**
 * Get active approved requests for a user's cart.
 */
export async function getUserSpecialDeliveryRequests() {
    try {
        const user = await currentUser();
        if (!user) return apiResponse.error("Unauthorized");

        // CLEANUP STEP: Remove rejected requests (and cart items) older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const staleRequests = await db.specialDeliveryRequest.findMany({
            where: {
                userId: user.id,
                status: 'REJECTED',
                rejectedAt: { lt: oneHourAgo }
            }
        });

        if (staleRequests.length > 0) {
            const productIdsToRemove = staleRequests.map(r => r.productId);

            // 1. Remove from Cart
            await db.cartItem.deleteMany({
                where: {
                    cart: { userId: user.id },
                    productId: { in: productIdsToRemove }
                }
            });

            // 2. Delete the stale requests (or mark them as ARCHIVED if we had that status)
            await db.specialDeliveryRequest.deleteMany({
                where: { id: { in: staleRequests.map(r => r.id) } }
            });
        }

        const requests = await db.specialDeliveryRequest.findMany({
            where: {
                userId: user.id,
                status: { in: ["PENDING", "APPROVED", "REJECTED"] }
            }
        });

        return apiResponse.success(requests);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}

/**
 * Mark an inquiry as sent for a specific product.
 */
export async function markInquiryAsSent(productId) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        const updated = await db.specialDeliveryRequest.updateMany({
            where: {
                userId: user.id,
                productId: productId,
                status: "PENDING"
            },
            data: {
                inquirySent: true
            }
        });

        revalidatePath("/marketplace");
        revalidatePath("/cart");
        return apiResponse.success(updated, "Inquiry marked as sent.");
    } catch (error) {
        return apiResponse.error(error.message);
    }
}
