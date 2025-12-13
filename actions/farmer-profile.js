"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

/**
 * Creates a FarmerProfile record linked to the current user.
 */
export async function createFarmerProfile(formData) {
  // createFarmerProfile invoked

  // 1. Get Clerk User
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) {
      throw new Error("Clerk user not found.");
    }
  } catch (err) {
    console.error("createFarmerProfile Error: currentUser() failed -", err);
    return { success: false, error: "User session invalid. Please log in." };
  }
  const userId = clerkUser.id;


  try {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!dbUser) {
      return { success: false, error: "User record not found in database." };
    }

    if (dbUser.role !== 'farmer') {
       console.error(`createFarmerProfile Error: Unauthorized DB role - ${dbUser.role}`);
       return { success: false, error: "Unauthorized. You are not registered as a farmer." };
    }
  } catch (err) {
    console.error("createFarmerProfile Error: Failed to verify role -", err);
    return { success: false, error: "Failed to verify permissions." };
  }

  // 3. Extract & Validate Data
  const name = formData.get("name")?.toString();
  const farmName = formData.get("farmName")?.toString();
  const phone = formData.get("phone")?.toString();
  const address = formData.get("address")?.toString();
  const aadharNumber = formData.get("aadharNumber")?.toString() || null;
  
  // Numeric fields need parsing
  const farmSizeRaw = formData.get("farmSize")?.toString();
  const farmSize = farmSizeRaw ? parseFloat(farmSizeRaw) : null;

  const experienceRaw = formData.get("farmingExperience")?.toString();
  const farmingExperience = experienceRaw ? parseInt(experienceRaw) : null;

  // Handle Multi-select (Checkboxes)
  const primaryProduce = formData.getAll("primaryProduce");

  // Basic Validation
  if (!name || !phone || !address) {
    return { success: false, error: "Name, Phone, and Address are required." };
  }

  // Farmer data validated and ready to save

  // 4. Database Operation
  try {
    // Check for existing profile to prevent duplicates
    const existingProfile = await db.farmerProfile.findUnique({ 
        where: { userId: userId } 
    });

    if (existingProfile) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`createFarmerProfile: Profile already exists for ${userId}`);
      }
      return { success: true }; // Treat as success, maybe they double-clicked
    }

    await db.farmerProfile.create({
      data: {
        userId,
        name,
        farmName,
        phone,
        address,
        aadharNumber,
        farmSize,
        farmingExperience,
        primaryProduce // Prisma handles String[] automatically
      }
    });

    // Farmer profile created

  } catch (err) {
    console.error("createFarmerProfile Error: Database failed -", err);
    // Handle unique constraint violation specifically (e.g. Aadhar)
    if (err.code === 'P2002') {
        return { success: false, error: "This Aadhar number is already registered." };
    }
    return { success: false, error: "Database error creating profile." };
  }

  // 5. Revalidate Dashboard
  revalidatePath('/farmer-dashboard');
  
  return { success: true };
}