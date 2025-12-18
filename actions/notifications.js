"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Create a new notification
export async function createNotification({ userId, type, title, message, linkUrl }) {
  try {
    await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl
      }
    });

    // Trigger revalidation for notification UI
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("Create Notification Error:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Get user notifications
export async function getUserNotifications() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false }
    });

    return { success: true, data: notifications, unreadCount };
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

// Delete notification
export async function deleteNotification(notificationId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.delete({
      where: { id: notificationId }
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// Clear all notifications
export async function clearAllNotifications() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await db.notification.deleteMany({
      where: { userId: user.id }
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error("Clear All Notifications Error:", error);
    return { success: false, error: "Failed to clear notifications" };
  }
}

