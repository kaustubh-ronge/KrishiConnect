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

export async function updateFarmerProfile(formData) {
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) throw new Error('User not found');
  } catch (err) {
    return { success: false, error: 'Session invalid. Please log in.' };
  }
  const userId = clerkUser.id;

  try {
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!dbUser || dbUser.role !== 'farmer') return { success: false, error: 'Unauthorized.' };
  } catch (err) {
    return { success: false, error: 'Failed to verify role.' };
  }

  // Extract fields
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const address = formData.get('address')?.toString() || null;
  const aadharNumber = formData.get('aadharNumber')?.toString() || null;
  const farmName = formData.get('farmName')?.toString() || null;
  const farmSizeRaw = formData.get('farmSize')?.toString();
  const farmSize = farmSizeRaw ? parseFloat(farmSizeRaw) : null;
  const farmingExperienceRaw = formData.get('farmingExperience')?.toString();
  const farmingExperience = farmingExperienceRaw ? parseInt(farmingExperienceRaw) : null;
  const primaryProduce = formData.getAll('primaryProduce');

  // Payment details
  const upiId = formData.get('upiId')?.toString() || null;
  const bankName = formData.get('bankName')?.toString() || null;
  const accountNumber = formData.get('accountNumber')?.toString() || null;
  const ifscCode = formData.get('ifscCode')?.toString() || null;

  try {
    const existing = await db.farmerProfile.findUnique({ where: { userId } });
    if (!existing) return { success: false, error: 'Profile not found.' };

    await db.farmerProfile.update({
      where: { userId },
      data: { name, phone, address, aadharNumber, farmName, farmSize, farmingExperience, primaryProduce, upiId, bankName, accountNumber, ifscCode }
    });

    revalidatePath('/farmer-dashboard');
    return { success: true };
  } catch (err) {
    console.error('updateFarmerProfile Error:', err);
    if (err.code === 'P2002') return { success: false, error: 'Aadhar already registered' };
    return { success: false, error: 'Failed to update profile.' };
  }
}