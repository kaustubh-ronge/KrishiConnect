
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { z } from "zod";
import { agentSchema } from "@/lib/zodSchema";
import { revalidatePath } from "next/cache";
import { sendProfileCreationEmail, sendBuyProfileEmail } from "@/lib/email";
import { sanitizeContent } from "@/lib/utils";

export async function createAgentProfile(formData) {
  // 1. Auth Check
  let user;
  try {
    user = await currentUser();
    if (!user) throw new Error("Not logged in");
  } catch (err) {
    return { success: false, error: "Please log in." };
  }
  const userId = user.id;

  // 2. Role Check
  try {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!dbUser) return { success: false, error: "User record not found." };
    if (dbUser.role !== 'agent') return { success: false, error: "Unauthorized." };
  } catch (err) {
    return { success: false, error: "Failed to verify role." };
  }

  // 3. Extract & Sanitize Data
  const formValues = Object.fromEntries(formData.entries());
  formValues.agentType = formData.getAll("agentType").filter(t => t.trim() !== "");

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
    validatedData = agentSchema.parse(formValues);
  } catch (error) {
    return { success: false, error: "Validation failed." };
  }

  const { name, companyName, phone, region, district, upiId, bankName, accountNumber, ifscCode, agentType, aadharNumber, address, country, state, city, pincode, lat, lng, usagePurpose } = validatedData;
  const aadharFront = formData.get('aadharFront')?.toString();
  const aadharBack = formData.get('aadharBack')?.toString();

  try {
    await db.agentProfile.create({
      data: {
        userId, name, companyName, phone, region, upiId, bankName, accountNumber, ifscCode, agentType, aadharNumber,
        address, country, state, city, pincode, lat, lng, district, aadharFront, aadharBack, usagePurpose,
        sellingStatus: usagePurpose === 'buy_and_sell' ? 'PENDING' : 'NONE'
      }
    });

    if (usagePurpose === 'buy_and_sell') {
      const emailAddress = user.emailAddresses?.[0]?.emailAddress;
      if (emailAddress) await sendProfileCreationEmail(emailAddress, 'agent');
    }

    revalidatePath("/agent-dashboard");
    return { success: true };
  } catch (err) {
    if (err.code === 'P2002') return { success: false, error: "Aadhar or Phone already registered." };
    return { success: false, error: "Database failed." };
  }
}

export async function updateAgentProfile(formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };
  const userId = user.id;

  // 3. Extract & Sanitize Data
  const formValues = Object.fromEntries(formData.entries());
  formValues.agentType = formData.getAll("agentType").filter(t => t.trim() !== "");

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
    validatedData = agentSchema.parse(formValues);
  } catch (error) {
    return { success: false, error: "Validation failed." };
  }

  const { name, companyName, phone, region, district, upiId, bankName, accountNumber, ifscCode, agentType, aadharNumber, address, country, state, city, pincode, lat, lng, usagePurpose } = validatedData;
  const aadharFront = formData.get('aadharFront')?.toString();
  const aadharBack = formData.get('aadharBack')?.toString();

  try {
    const existing = await db.agentProfile.findUnique({ where: { userId } });
    if (!existing) return { success: false, error: "Profile not found." };

    let newSellingStatus = existing.sellingStatus;
    if (usagePurpose === 'buy_and_sell' && (existing.sellingStatus === 'NONE' || existing.sellingStatus === 'REJECTED')) {
      newSellingStatus = 'PENDING';
      const emailAddress = user.emailAddresses?.[0]?.emailAddress;
      if (emailAddress) await sendProfileCreationEmail(emailAddress, 'agent');
    } else if (usagePurpose === 'buy') {
      newSellingStatus = 'NONE';
    }

    const updateData = {
        name, companyName, phone, region, district, upiId, bankName, accountNumber, ifscCode, agentType, aadharNumber,
        address, country, state, city, pincode, lat, lng, usagePurpose, sellingStatus: newSellingStatus
    };

    if (aadharFront && aadharFront.trim() !== "") updateData.aadharFront = aadharFront;
    if (aadharBack && aadharBack.trim() !== "") updateData.aadharBack = aadharBack;

    await db.agentProfile.update({
      where: { userId },
      data: updateData
    });

    revalidatePath("/agent-dashboard/profile");
    return { success: true };
  } catch (err) {
    if (err.code === 'P2002') return { success: false, error: "Aadhar or Phone already registered." };
    return { success: false, error: "Failed to update profile." };
  }
}