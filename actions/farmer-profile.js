"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

export async function createFarmerProfile(formData) {
  // ... (Your existing create logic here - keep it as is) ...
  // For brevity I am not repeating the create logic you already have.
  // Just ensure updateFarmerProfile is added below it.
}

export async function updateFarmerProfile(formData) {
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) throw new Error("Clerk user not found.");
  } catch (err) {
    return { success: false, error: "Session invalid. Please log in." };
  }
  const userId = clerkUser.id;

  try {
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!dbUser || dbUser.role !== 'farmer') return { success: false, error: "Unauthorized." };
  } catch (err) {
    return { success: false, error: "Failed to verify role." };
  }

  // Extract fields
  const name = formData.get("name")?.toString();
  const farmName = formData.get("farmName")?.toString();
  const phone = formData.get("phone")?.toString();
  const address = formData.get("address")?.toString();
  const aadharNumber = formData.get("aadharNumber")?.toString() || null;
  const farmSize = parseFloat(formData.get("farmSize")?.toString() || "0") || null;
  const farmingExperience = parseInt(formData.get("farmingExperience")?.toString() || "0") || null;
  
  // Payment Info
  const upiId = formData.get("upiId")?.toString() || null;
  const bankName = formData.get("bankName")?.toString() || null;
  const accountNumber = formData.get("accountNumber")?.toString() || null;
  const ifscCode = formData.get("ifscCode")?.toString() || null;

  // Handle "Other" Produce
  const rawProduce = formData.getAll("primaryProduce");
  const primaryProduce = rawProduce.filter(p => p && p !== "Other" && p.trim() !== "");

  try {
    const existing = await db.farmerProfile.findUnique({ where: { userId } });
    if (!existing) return { success: false, error: "Profile not found." };

    await db.farmerProfile.update({
      where: { userId },
      data: {
        name, farmName, phone, address, aadharNumber, farmSize, farmingExperience, primaryProduce,
        upiId, bankName, accountNumber, ifscCode
      }
    });

    revalidatePath('/farmer-dashboard');
    return { success: true };
  } catch (err) {
    console.error("updateFarmerProfile Error:", err);
    return { success: false, error: "Failed to update profile." };
  }
}