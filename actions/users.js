
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
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: role },
    });
    // Clerk metadata update attempted
  } catch (err) {
    console.error(
      "selectRole Error: Explicit clerkClient.users.updateUserMetadata failed -",
      err
    );
    return { error: "Could not set role via Clerk API." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { role: role },
    });
    // Database update successful: User role set.
  } catch (err) {
    console.error("selectRole Error: Database update failed -", err);
    return { error: "Database error updating role." };
  }

  revalidatePath("/", "layout");
  return { success: true, redirectUrl: `/${role}-dashboard` };
}
