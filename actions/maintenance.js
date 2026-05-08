
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { ensureAdmin } from "./admin";


/**
 * Background-friendly action to reclaim stock from abandoned/expired checkouts.
 * Should be triggered by a cron job or admin periodically.
 */
export async function reclaimAbandonedStock() {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await ensureAdmin(user.id);

        const now = new Date();

        // 1. Find all PENDING orders that have expired
        const expiredOrders = await db.order.findMany({
            where: {
                paymentStatus: "PENDING",
                expiresAt: { lt: now }
            },
            include: {
                items: true
            }
        });

        if (expiredOrders.length === 0) {
            return { success: true, reclaimedCount: 0 };
        }


        let totalReclaimed = 0;

        for (const order of expiredOrders) {
            await db.$transaction(async (tx) => {
                // ATOMIC GUARD: Only one process should succeed in flipping the status
                const updateRes = await tx.order.updateMany({
                    where: {
                        id: order.id,
                        paymentStatus: "PENDING"
                    },
                    data: {
                        paymentStatus: "CANCELLED",
                        orderStatus: "CANCELLED",
                        expiresAt: null
                    }
                });

                if (updateRes.count === 0) {
                    return;
                }

                // Restore stock ONLY if we won the race
                for (const item of order.items) {
                    await tx.productListing.update({
                        where: { id: item.productId },
                        data: {
                            availableStock: { increment: item.quantity },
                            isAvailable: true
                        }
                    });
                }

                totalReclaimed++;
            });
        }

        revalidatePath('/marketplace');
        revalidatePath('/farmer-dashboard');
        revalidatePath('/agent-dashboard');

        return { success: true, reclaimedCount: totalReclaimed };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
