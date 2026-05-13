"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { sendProfileCreationEmail, sendBuyProfileEmail } from "@/lib/email";
import { z } from "zod";
import { farmerSchema } from "@/lib/zodSchema";
import { sanitizeContent } from "@/lib/utils";

/**
 * Creates a FarmerProfile record linked to the current user.
 */
export async function createFarmerProfile(formData) {
  // 1. Get Clerk User
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) {
      throw new Error("Clerk user not found.");
    }
  } catch (err) {
    return { success: false, error: "User session invalid. Please log in." };
  }
  const userId = clerkUser.id;

  try {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!dbUser) return { success: false, error: "User record not found." };
    if (dbUser.role !== 'farmer') return { success: false, error: "Unauthorized." };
  } catch (err) {
    return { success: false, error: "Failed to verify permissions." };
  }

  // 3. Extract & Sanitize Data
  const formValues = Object.fromEntries(formData.entries());
  formValues.primaryProduce = formData.getAll('primaryProduce');

  Object.keys(formValues).forEach(key => {
    if (typeof formValues[key] === 'string') {
      formValues[key] = sanitizeContent(formValues[key]);
    } else if (Array.isArray(formValues[key])) {
      formValues[key] = formValues[key].map(v => typeof v === 'string' ? sanitizeContent(v) : v);
    }
  });

  if (formValues.lat) formValues.lat = parseFloat(formValues.lat);
  if (formValues.lng) formValues.lng = parseFloat(formValues.lng);

  let validatedData;
  try {
    validatedData = farmerSchema.parse(formValues);
  } catch (error) {
    return { success: false, error: "Validation failed." };
  }

  const { name, phone, address, aadharNumber, farmName, district, region, country, state, city, pincode, lat, lng, upiId, bankName, accountNumber, ifscCode } = validatedData;
  const farmSize = validatedData.farmSize ? parseFloat(validatedData.farmSize) : null;
  const farmingExperience = validatedData.farmingExperience ? parseInt(validatedData.farmingExperience) : null;
  const primaryProduce = validatedData.primaryProduce;
  const aadharFront = formData.get('aadharFront')?.toString();
  const aadharBack = formData.get('aadharBack')?.toString();
  const usagePurpose = validatedData.usagePurpose;

  try {
    await db.farmerProfile.create({
      data: {
        userId, name, farmName, phone, address, country, state, city, pincode, lat, lng, district, region,
        aadharNumber, aadharFront, aadharBack, farmSize, farmingExperience, primaryProduce, usagePurpose,
        upiId, bankName, accountNumber, ifscCode,
        sellingStatus: usagePurpose === 'buy_and_sell' ? 'PENDING' : 'NONE'
      }
    });

    if (usagePurpose === 'buy_and_sell') {
      const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (emailAddress) await sendProfileCreationEmail(emailAddress, 'farmer');
    }

  } catch (err) {
    if (err.code === 'P2002') return { success: false, error: "Aadhar or Phone already registered." };
    return { success: false, error: "Database error creating profile." };
  }

  revalidatePath('/farmer-dashboard');
  return { success: true };
}

export async function updateFarmerProfile(formData) {
  let clerkUser;
  try {
    clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) throw new Error('User not found');
  } catch (err) {
    return { success: false, error: 'Session invalid.' };
  }
  const userId = clerkUser.id;

  try {
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!dbUser || dbUser.role !== 'farmer') return { success: false, error: 'Unauthorized.' };
  } catch (err) {
    return { success: false, error: 'Failed to verify role.' };
  }

  // 3. Extract & Sanitize Data
  const formValues = Object.fromEntries(formData.entries());
  formValues.primaryProduce = formData.getAll('primaryProduce');

  Object.keys(formValues).forEach(key => {
    if (typeof formValues[key] === 'string') {
      formValues[key] = sanitizeContent(formValues[key]);
    } else if (Array.isArray(formValues[key])) {
      formValues[key] = formValues[key].map(v => typeof v === 'string' ? sanitizeContent(v) : v);
    }
  });

  if (formValues.lat) formValues.lat = parseFloat(formValues.lat);
  if (formValues.lng) formValues.lng = parseFloat(formValues.lng);

  let validatedData;
  try {
    validatedData = farmerSchema.parse(formValues);
  } catch (error) {
    return { success: false, error: "Validation failed." };
  }

  const { name, phone, address, aadharNumber, farmName, district, region, upiId, bankName, accountNumber, ifscCode, country, state, city, pincode, lat, lng } = validatedData;
  const farmSize = validatedData.farmSize ? parseFloat(validatedData.farmSize) : null;
  const farmingExperience = validatedData.farmingExperience ? parseInt(validatedData.farmingExperience) : null;
  const primaryProduce = validatedData.primaryProduce;
  const aadharFront = formData.get('aadharFront');
  const aadharBack = formData.get('aadharBack');
  const usagePurpose = validatedData.usagePurpose;

  try {
    const existing = await db.farmerProfile.findUnique({ where: { userId } });
    if (!existing) return { success: false, error: 'Profile not found.' };

    let newSellingStatus = existing.sellingStatus;
    let shouldSendEmail = false;

    if (usagePurpose === 'buy_and_sell' && (existing.sellingStatus === 'NONE' || existing.sellingStatus === 'REJECTED')) {
      newSellingStatus = 'PENDING';
      shouldSendEmail = true;
    } else if (usagePurpose === 'buy') {
      newSellingStatus = 'NONE';
    }

    const updateData = {
      name, phone, address, aadharNumber, farmName, farmSize, farmingExperience, primaryProduce,
      upiId, bankName, accountNumber, ifscCode, country, state, city, pincode, lat, lng, district, region,
      usagePurpose, sellingStatus: newSellingStatus
    };

    if (aadharFront && typeof aadharFront === 'string' && aadharFront.trim() !== "") updateData.aadharFront = aadharFront;
    if (aadharBack && typeof aadharBack === 'string' && aadharBack.trim() !== "") updateData.aadharBack = aadharBack;

    await db.farmerProfile.update({
      where: { userId },
      data: updateData
    });

    if (shouldSendEmail) {
      const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (emailAddress) await sendProfileCreationEmail(emailAddress, 'farmer');
    }

    revalidatePath('/farmer-dashboard');
    return { success: true };
  } catch (err) {
    if (err.code === 'P2002') return { success: false, error: 'Aadhar or Phone already registered' };
    return { success: false, error: 'Failed to update profile.' };
  }
}