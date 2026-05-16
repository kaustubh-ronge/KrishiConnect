"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateAction, standardRateLimit } from "@/lib/arcjet";
import { apiResponse } from "@/lib/permissions";

/**
 * Create a new special delivery request.
 */
export async function createSpecialDeliveryRequest(productId, quantity, sellerId, unit = null) {
    await validateAction(standardRateLimit);
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
            // --- NEW: STRICT RE-REQUEST LOGIC ---
            // Case 1: Already Approved & Not Consumed
            if (existing.status === 'APPROVED' && !existing.isConsumed) {
                if (parseFloat(quantity) <= existing.quantity) {
                    return apiResponse.success(existing, "Current quantity is already covered by an approved mediation.");
                }
                // If quantity exceeds, fall through to update to PENDING below
            }

            // Case 2: Already Pending
            if (existing.status === 'PENDING') {
                if (parseFloat(quantity) === existing.quantity) {
                    return apiResponse.success(existing, "You already have a pending request for this exact quantity.");
                }
                // Fall through to update quantity below
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
                    unit: unit,
                    status: "PENDING",
                    inquirySent: false, // Reset inquiry status on re-request
                    isConsumed: false, // Re-requesting makes it active again
                    rejectedAt: null, // Reset rejection timestamp
                    adminNotes: null, // Clear old notes
                    negotiatedFee: null // Clear old fee
                }
            });

            revalidatePath("/cart");
            return apiResponse.success(updated, "Request submitted for approval.");
        }

        // Create new if none exists
        const request = await db.specialDeliveryRequest.create({
            data: {
                userId: user.id,
                productId: productId,
                quantity: parseFloat(quantity),
                unit: unit,
                sellerId: sellerId,
                status: "PENDING",
                inquirySent: false,
                isConsumed: false
            }
        });

        revalidatePath("/cart");
        return apiResponse.success(request, "Special delivery request submitted for admin approval.");
    } catch (error) {
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
                        email: true,
                        farmerProfile: { select: { phone: true, address: true } },
                        agentProfile: { select: { phone: true, address: true } },
                        deliveryProfile: { select: { phone: true, address: true } }
                    }
                },
                product: {
                    include: {
                        farmer: {
                            select: {
                                name: true,
                                phone: true,
                                address: true,
                                city: true,
                                state: true
                            }
                        },
                        agent: {
                            select: {
                                name: true,
                                companyName: true,
                                phone: true,
                                address: true,
                                city: true,
                                state: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedRequests = requests.map(req => {
            const buyerProfile = req.user.farmerProfile || req.user.agentProfile || req.user.deliveryProfile;
            return {
                ...req,
                buyerPhone: buyerProfile?.phone || "NOT PROVIDED",
                buyerAddress: buyerProfile?.address || "NOT PROVIDED"
            };
        });

        return apiResponse.success(formattedRequests);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}

/**
 * Approve or reject a special delivery request.
 */
export async function updateSpecialDeliveryStatus(requestId, status, negotiatedFee = null, notes = "", adminQuantity = null) {
    try {
        const user = await currentUser();
        // Admin check here

        const updated = await db.specialDeliveryRequest.update({
            where: { id: requestId },
            data: {
                status: status,
                negotiatedFee: negotiatedFee ? parseFloat(negotiatedFee) : null,
                quantity: adminQuantity ? parseFloat(adminQuantity) : undefined, // Admin can override quantity
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
                status: { in: ["PENDING", "APPROVED", "REJECTED"] },
                isConsumed: false
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

/**
 * Delete a special delivery request (Cancel mediation)
 */
export async function deleteSpecialDeliveryRequest(requestId) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        await db.specialDeliveryRequest.delete({
            where: { 
                id: requestId,
                userId: user.id
            }
        });

        revalidatePath("/cart");
        return apiResponse.success(null, "Mediation request cancelled.");
    } catch (error) {
        return apiResponse.error(error.message);
    }
}
