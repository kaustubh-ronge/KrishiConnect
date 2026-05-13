"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { apiResponse } from "@/lib/permissions";

import { validateAction, standardRateLimit } from "@/lib/arcjet";

/**
 * Send a message to admin from any user.
 */
export async function sendSupportMessage(message, type = "GENERAL") {
  await validateAction(standardRateLimit);
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch user profile to get role and names
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        farmerProfile: true,
        agentProfile: true,
        deliveryProfile: true
      }
    });

    const role = fullUser?.role || "none";
    const name = fullUser?.farmerProfile?.name || 
                 fullUser?.agentProfile?.name || 
                 fullUser?.deliveryProfile?.name || 
                 user.firstName + " " + user.lastName;

    const supportMsg = await db.supportMessage.create({
      data: {
        userId: user.id,
        userName: name,
        userEmail: user.emailAddresses[0]?.emailAddress,
        userRole: role,
        type: type,
        message: message
      }
    });

    revalidatePath("/admin-dashboard");
    return apiResponse.success(supportMsg, "Message sent to support. We will get back to you soon.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Get all support messages for Admin.
 */
export async function getSupportMessages(page = 1, search = "") {
  try {
    const user = await currentUser();
    // In a real app, check for ADMIN role here
    
    const limit = 10;
    const skip = (page - 1) * limit;

    const messages = await db.supportMessage.findMany({
      where: {
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { userEmail: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await db.supportMessage.count({
      where: {
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { userEmail: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ]
      }
    });

    return apiResponse.success({ messages, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Mark a message as read.
 */
export async function markSupportMessageAsRead(id) {
  try {
    await db.supportMessage.update({
      where: { id },
      data: { isRead: true }
    });
    revalidatePath("/admin-dashboard");
    return apiResponse.success(null, "Message marked as read.");
  } catch (error) {
    return apiResponse.error(error.message);
  }
}

/**
 * Get count of unread messages.
 */
export async function getUnreadSupportCount() {
    try {
        const count = await db.supportMessage.count({
            where: { isRead: false }
        });
        return apiResponse.success(count);
    } catch (error) {
        return apiResponse.error(error.message);
    }
}
/**
 * Delete a support message (Close Ticket permanently).
 */
export async function deleteSupportMessage(id) {
    try {
        await db.supportMessage.delete({
            where: { id }
        });
        revalidatePath("/admin-dashboard");
        return apiResponse.success(null, "Ticket closed and removed successfully.");
    } catch (error) {
        return apiResponse.error(error.message);
    }
}
