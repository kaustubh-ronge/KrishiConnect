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

        // Duplicate check removed per user request for now
        /*
        const existing = await db.specialDeliveryRequest.findFirst({
            where: {
                userId: user.id,
                productId: productId,
                status: "PENDING"
            }
        });

        if (existing) {
            return apiResponse.error("You already have a pending request for this product.");
        }
        */

        const request = await db.specialDeliveryRequest.create({
            data: {
                userId: user.id,
                productId: productId,
                quantity: parseFloat(quantity),
                sellerId: sellerId,
                status: "PENDING"
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
                adminNotes: notes
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
        if (!user) return apiResponse.success([]);

        const requests = await db.specialDeliveryRequest.findMany({
            where: {
                userId: user.id,
                status: { in: ["PENDING", "APPROVED"] }
            }
        });

        return apiResponse.success(requests);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}
