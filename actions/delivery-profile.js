"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendDeliveryProfileCreationEmail } from "@/lib/email";
import { sanitizeContent } from "@/lib/utils";

/**
 * Creates a new Delivery Boy profile.
 */
export async function createDeliveryProfile(formData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    // 1. Check for existing profile
    const existing = await db.deliveryProfile.findUnique({
      where: { userId: clerkUser.id }
    });
    if (existing) return { success: true, profile: existing };

    // 2. Extract and Sanitize
    const rawData = Object.fromEntries(formData.entries());
    const safeParse = (val) => {
      const p = parseFloat(val);
      return isNaN(p) ? 0 : p;
    };

    const data = {
      userId: clerkUser.id,
      name: sanitizeContent(rawData.name),
      phone: sanitizeContent(rawData.phone),
      address: sanitizeContent(rawData.address),
      country: sanitizeContent(rawData.country),
      state: sanitizeContent(rawData.state),
      city: sanitizeContent(rawData.city),
      pincode: sanitizeContent(rawData.pincode),
      lat: safeParse(rawData.lat),
      lng: safeParse(rawData.lng),
      vehicleType: sanitizeContent(rawData.vehicleType),
      vehicleNumber: sanitizeContent(rawData.vehicleNumber),
      licenseNumber: sanitizeContent(rawData.licenseNumber),
      aadharNumber: sanitizeContent(rawData.aadharNumber),
      aadharFront: rawData.aadharFront?.toString(),
      aadharBack: rawData.aadharBack?.toString(),
      licenseImage: rawData.licenseImage?.toString(),
      upiId: sanitizeContent(rawData.upiId),
      paymentType: sanitizeContent(rawData.paymentType),
      bankName: sanitizeContent(rawData.bankName),
      accountNumber: sanitizeContent(rawData.accountNumber),
      ifscCode: sanitizeContent(rawData.ifscCode),
      radius: safeParse(rawData.radius),
      pricePerKm: safeParse(rawData.pricePerKm),
      approvalStatus: "PENDING",
    };

    const { profile } = await db.$transaction(async (tx) => {
      const p = await tx.deliveryProfile.create({
        data,
      });

      // Update user role
      await tx.user.update({
        where: { id: clerkUser.id },
        data: { role: "delivery" },
      });

      return { profile: p };
    });

    revalidatePath("/delivery-dashboard");
    
    // Send email notification
    if (clerkUser.primaryEmailAddress?.emailAddress) {
      await sendDeliveryProfileCreationEmail(clerkUser.primaryEmailAddress.emailAddress);
    }

    return { success: true, profile };
  } catch (error) {
    console.error("createDeliveryProfile Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing Delivery Boy profile.
 */
export async function updateDeliveryProfile(formData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const profile = await db.deliveryProfile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile) throw new Error("Profile not found");

    const safeParse = (val) => {
      const p = parseFloat(val);
      return isNaN(p) ? 0 : p;
    };

    const updateData = {
      name: sanitizeContent(formData.get("name")),
      phone: sanitizeContent(formData.get("phone")),
      address: sanitizeContent(formData.get("address")),
      country: sanitizeContent(formData.get("country")),
      state: sanitizeContent(formData.get("state")),
      city: sanitizeContent(formData.get("city")),
      pincode: sanitizeContent(formData.get("pincode")),
      lat: safeParse(formData.get("lat")),
      lng: safeParse(formData.get("lng")),
      vehicleType: sanitizeContent(formData.get("vehicleType")),
      vehicleNumber: sanitizeContent(formData.get("vehicleNumber")),
      licenseNumber: sanitizeContent(formData.get("licenseNumber")),
      aadharNumber: sanitizeContent(formData.get("aadharNumber")),
      upiId: sanitizeContent(formData.get("upiId")),
      paymentType: sanitizeContent(formData.get("paymentType")),
      bankName: sanitizeContent(formData.get("bankName")),
      accountNumber: sanitizeContent(formData.get("accountNumber")),
      ifscCode: sanitizeContent(formData.get("ifscCode")),
      radius: safeParse(formData.get("radius")),
      pricePerKm: safeParse(formData.get("pricePerKm")),
      approvalStatus: profile.approvalStatus === "REJECTED" ? "PENDING" : profile.approvalStatus,
    };

    const aadharFront = formData.get("aadharFront");
    const aadharBack = formData.get("aadharBack");
    const licenseImage = formData.get("licenseImage");

    if (aadharFront && typeof aadharFront === 'string' && aadharFront.trim() !== "") updateData.aadharFront = aadharFront;
    if (aadharBack && typeof aadharBack === 'string' && aadharBack.trim() !== "") updateData.aadharBack = aadharBack;
    if (licenseImage && typeof licenseImage === 'string' && licenseImage.trim() !== "") updateData.licenseImage = licenseImage;

    const updatedProfile = await db.deliveryProfile.update({
      where: { userId: clerkUser.id },
      data: updateData,
    });

    revalidatePath("/delivery-dashboard");
    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error("updateDeliveryProfile Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggles online/offline status.
 */
export async function toggleOnlineStatus(isOnline) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    await db.deliveryProfile.update({
      where: { userId: clerkUser.id },
      data: { isOnline },
    });

    revalidatePath("/delivery-dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
