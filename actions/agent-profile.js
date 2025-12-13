"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

export async function createAgentProfile(formData) {
  // createAgentProfile invoked

  // 1. Auth Check
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) throw new Error("Clerk user not found.");
  } catch (err) {
    return { success: false, error: "Session invalid. Please log in again." };
  }
  const userId = clerkUser.id;

  // 2. Role Verification (Must be 'agent')
  try {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!dbUser) return { success: false, error: "User not found in database." };

    if (dbUser.role !== 'agent') {
      return { success: false, error: "Unauthorized. You are registered as a farmer." };
    }
  } catch (err) {
    return { success: false, error: "Failed to verify role." };
  }

  // 3. Extract Data
  const name = formData.get("name")?.toString();
  const companyName = formData.get("companyName")?.toString();
  const phone = formData.get("phone")?.toString();
  const region = formData.get("region")?.toString();

  // Payment Info (For selling)
  const upiId = formData.get("upiId")?.toString() || null;
  const bankName = formData.get("bankName")?.toString() || null;
  const accountNumber = formData.get("accountNumber")?.toString() || null;
  const ifscCode = formData.get("ifscCode")?.toString() || null;

  // --- NEW: Handle Agent Types Array ---
  const agentType = formData.getAll("agentType").filter(t => t.trim() !== "");

  if (!name || !phone || !region || agentType.length === 0) {
    return { success: false, error: "Name, Phone, Region, and Agent Type are required." };
  }

  // 4. Database Operation
  try {
    const existingProfile = await db.agentProfile.findUnique({ where: { userId } });

    if (existingProfile) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Agent profile already exists for ${userId}`);
      }
      return { success: true };
    }

    await db.agentProfile.create({
      data: {
        userId,
        name,
        companyName,
        phone,
        region,
        agentType, // NEW: Saves the array
        upiId,
        bankName,
        accountNumber,
        ifscCode
      }
    });
    // Agent profile record created

  } catch (err) {
    console.error("Agent Profile DB Error:", err);
    return { success: false, error: "Database error." };
  }

  revalidatePath('/agent-dashboard');
  return { success: true };
}