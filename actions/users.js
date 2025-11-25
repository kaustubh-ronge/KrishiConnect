
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { Clerk } from "@clerk/clerk-sdk-node";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const clerkClient = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export async function selectRole(formData) {
  console.log("CLERK_SECRET_KEY available:", !!process.env.CLERK_SECRET_KEY);
  console.log(`\n--- selectRole Action Started ---`);
  const role = formData.get("role")?.toString();
  console.log(`Role selected from form: ${role}`);

  let user;
  try {
    user = await currentUser();
    if (!user || !user.id) throw new Error("User not found via currentUser()");
    console.log(`currentUser() fetched: User ID: ${user.id}`);
  } catch (err) {
    console.error("selectRole Error: currentUser() failed -", err);
    return { error: "Failed to get user information." };
  }
  const userId = user.id;

  if (role !== "farmer" && role !== "agent") {
    console.error(`selectRole Error: Invalid role detected - ${role}`);
    return { error: "Invalid role selected." };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (existingUser?.role && existingUser.role !== "none") {
      console.log(`User ${userId} already has role: ${existingUser.role}`);
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
    if (
      !clerkClient ||
      !clerkClient.users ||
      !clerkClient.users.updateUserMetadata
    ) {
      throw new Error("Clerk client misconfiguration.");
    }
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: role },
    });
    console.log("Clerk metadata update successful");
  } catch (err) {
    console.error(
      "selectRole Error: Explicit clerkClient.users.updateUserMetadata failed -",
      err
    );
    return { error: "Could not set role via Clerk API." };
  }

  try {
    await db.user.update({
      // Changed from upsert back to update
      where: { id: userId },
      data: { role: role },
    });
    console.log("Database update successful: User role set.");
  } catch (err) {
    console.error("selectRole Error: Database update failed -", err);
    return { error: "Database error updating role." };
  }

  revalidatePath("/onboarding");
  console.log(`Redirecting user ${userId} to ${role}-dashboard...`);
  redirect(`/${role}-dashboard`);
}
