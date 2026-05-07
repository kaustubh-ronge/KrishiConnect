
"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function selectRole(formData) {
  // selectRole invoked
  const role = formData.get("role")?.toString();
  // Role selected from form

  let user;
  try {
    user = await currentUser();
    if (!user || !user.id) throw new Error("User not found via currentUser()");
    // Clerk user fetched from currentUser
  } catch (err) {
    console.error("selectRole Error: currentUser() failed -", err);
    return { error: "Failed to get user information." };
  }
  const userId = user.id;

  if (role !== "farmer" && role !== "agent" && role !== "delivery") {
    console.error(`selectRole Error: Invalid role detected - ${role}`);
    return { error: "Invalid role selected." };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (existingUser?.role && existingUser.role !== "none") {
      // User already has a role
      return {
        error: "Role already selected",
        message: `You are already registered as a ${existingUser.role}. Role cannot be changed.`,
        existingRole: existingUser.role,
      };
    }
  } catch (err) {
    console.error("selectRole Error: Failed to check existing role -", err);
    return { error: "Failed to verify user role." };
  }

  try {
    // 1. Update Database FIRST (Primary Source of Truth)
    await db.user.update({
      where: { id: userId },
      data: { role: role },
    });
  } catch (err) {
    console.error("selectRole Error: Database update failed -", err);
    return { error: "Database error updating role. Please try again." };
  }

  try {
    // 2. Synchronize with Clerk (Secondary)
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: role },
    });
  } catch (err) {
    console.error(
      "selectRole Error: Clerk metadata update failed (Sync Error) -",
      err
    );
    // We don't block the user if only Clerk sync fails, 
    // as the DB role is what drives the dashboard access.
  }

  revalidatePath("/", "layout");
  return { success: true, redirectUrl: `/${role}-dashboard` };
}
