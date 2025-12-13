"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

/**
 * 1. CREATE LISTING (Handles Farmer & Agent)
 */
export async function createProductListing(formData) {
  console.log("--- createProductListing Action Started ---");

  // 1. Auth Check
  let user;
  try {
    user = await currentUser();
    if (!user) throw new Error("Not logged in");
  } catch (err) {
    return { success: false, error: "Please log in." };
  }

  // 2. Identify Seller Type & Profile
  let sellerType = null;
  let sellerProfileId = null;

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return { success: false, error: "User not found." };

    if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
      sellerType = 'farmer';
      sellerProfileId = dbUser.farmerProfile.id;
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      sellerType = 'agent';
      sellerProfileId = dbUser.agentProfile.id;
    } else {
      return { success: false, error: "Complete your profile first." };
    }
  } catch (err) {
    return { success: false, error: "Profile validation failed." };
  }

  // 3. Extract Data
  const productName = formData.get("productName")?.toString();
  const variety = formData.get("variety")?.toString();
  const description = formData.get("description")?.toString();

  const availableStock = parseFloat(formData.get("availableStock")?.toString() || "0");
  const pricePerUnit = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
  const minOrderQuantity = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
  const unit = formData.get("unit")?.toString();

  const qualityGrade = formData.get("qualityGrade")?.toString();
  const shelfLife = formData.get("shelfLife")?.toString();
  const whatsappNumber = formData.get("whatsappNumber")?.toString();

  const harvestDateStr = formData.get("harvestDate")?.toString();
  const harvestDate = harvestDateStr ? new Date(harvestDateStr) : null;

  // NEW: Shelf Life Start Date
  const shelfLifeStartDateStr = formData.get("shelfLifeStartDate")?.toString();
  const shelfLifeStartDate = shelfLifeStartDateStr ? new Date(shelfLifeStartDateStr) : null;

  // Filter empty images
  const images = formData.getAll("images").filter(img => img && img.toString().trim() !== "");

  if (!productName || !availableStock || !pricePerUnit || !unit) {
    return { success: false, error: "Required fields missing." };
  }

  try {
    await db.productListing.create({
      data: {
        productName, variety, description, images,
        quantityLabel: `${availableStock} ${unit}`,
        availableStock, unit, pricePerUnit, minOrderQuantity,
        qualityGrade, shelfLife, harvestDate, whatsappNumber,
        shelfLifeStartDate, // <<< NEW FIELD
        isAvailable: true,
        sellerType,
        farmerId: sellerType === 'farmer' ? sellerProfileId : null,
        agentId: sellerType === 'agent' ? sellerProfileId : null,
      },
    });
  } catch (err) {
    console.error("Create Error:", err);
    if (err.message && err.message.includes("too large")) {
      return { success: false, error: "Images too large." };
    }
    return { success: false, error: "Failed to save listing." };
  }

  revalidatePath(`/${sellerType}-dashboard/my-listings`);
  revalidatePath(`/marketplace`);
  return { success: true };
}

/**
 * 2. GET MY LISTINGS (Auto-detects role)
 */
export async function getMyListings() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return { success: false, error: "User not found" };

    let whereClause = {};
    if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
      whereClause = { farmerId: dbUser.farmerProfile.id };
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      whereClause = { agentId: dbUser.agentProfile.id };
    } else {
      return { success: false, data: [] };
    }

    const listings = await db.productListing.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: listings };
  } catch (err) {
    return { success: false, error: "Failed to fetch listings" };
  }
}

/**
 * 3. GET SINGLE PRODUCT (For Edit)
 */
export async function getProductById(listingId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const listing = await db.productListing.findUnique({
      where: { id: listingId }
    });
    if (!listing) return { success: false, error: "Listing not found" };
    return { success: true, data: listing };
  } catch (err) {
    return { success: false, error: "Database error" };
  }
}

/**
 * 4. UPDATE LISTING (Secure Ownership Check)
 */
export async function updateProductListing(listingId, formData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    const existingListing = await db.productListing.findUnique({ where: { id: listingId } });
    if (!existingListing) return { success: false, error: "Not found" };

    const isOwner =
      (dbUser.role === 'farmer' && existingListing.farmerId === dbUser.farmerProfile?.id) ||
      (dbUser.role === 'agent' && existingListing.agentId === dbUser.agentProfile?.id);

    if (!isOwner) return { success: false, error: "Unauthorized" };

    // Extract Data
    const productName = formData.get("productName")?.toString();
    const variety = formData.get("variety")?.toString();
    const description = formData.get("description")?.toString();
    const availableStock = parseFloat(formData.get("availableStock")?.toString() || "0");
    const pricePerUnit = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
    const minOrderQuantity = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
    const unit = formData.get("unit")?.toString();
    const qualityGrade = formData.get("qualityGrade")?.toString();
    const shelfLife = formData.get("shelfLife")?.toString();
    const whatsappNumber = formData.get("whatsappNumber")?.toString();
    const harvestDateStr = formData.get("harvestDate")?.toString();
    const harvestDate = harvestDateStr ? new Date(harvestDateStr) : null;

    // NEW: Shelf Life Start Date
    const shelfLifeStartDateStr = formData.get("shelfLifeStartDate")?.toString();
    const shelfLifeStartDate = shelfLifeStartDateStr ? new Date(shelfLifeStartDateStr) : null;

    // Filter empty images
    const images = formData.getAll("images").filter(img => img && img.toString().trim() !== "");

    await db.productListing.update({
      where: { id: listingId },
      data: {
        productName, variety, description, images,
        quantityLabel: `${availableStock} ${unit}`,
        availableStock, unit, pricePerUnit, minOrderQuantity,
        qualityGrade, shelfLife, harvestDate, whatsappNumber,
        shelfLifeStartDate, // <<< NEW FIELD
      }
    });

  } catch (err) {
    return { success: false, error: "Update failed" };
  }

  revalidatePath("/agent-dashboard/my-listings");
  revalidatePath("/farmer-dashboard/my-listings");
  revalidatePath("/marketplace");
  return { success: true };
}

/**
 * 5. DELETE LISTING
 */
export async function deleteListing(listingId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    const listing = await db.productListing.findUnique({ where: { id: listingId } });
    if (!listing) return { success: false, error: "Listing not found" };

    const isOwner =
      (dbUser.role === 'farmer' && listing.farmerId === dbUser.farmerProfile?.id) ||
      (dbUser.role === 'agent' && listing.agentId === dbUser.agentProfile?.id);

    if (!isOwner) return { success: false, error: "Unauthorized" };

    await db.productListing.delete({ where: { id: listingId } });

    revalidatePath('/agent-dashboard/my-listings');
    revalidatePath('/farmer-dashboard/my-listings');
    revalidatePath('/marketplace');
    return { success: true };

  } catch (err) {
    return { success: false, error: "Failed to delete" };
  }
}

/**
 * 6. GET MARKETPLACE LISTINGS (Public Feed for Agents/Farmers)
 */
export async function getMarketplaceListings() {
  try {
    const listings = await db.productListing.findMany({
      where: {
        isAvailable: true,
        availableStock: { gt: 0 } // Hide out of stock
      },
      orderBy: { createdAt: 'desc' },
      include: {
        // Include minimal seller info for the card
        farmer: {
          select: { name: true, address: true, farmName: true }
        },
        agent: {
          select: { name: true, companyName: true, region: true }
        }
      }
    });
    return { success: true, data: listings };
  } catch (err) {
    console.error("Marketplace Error:", err);
    return { success: false, error: "Failed to load marketplace." };
  }
}

/**
 * 7. GET PRODUCT DETAIL (Full Info for Detail Page)
 */
export async function getProductDetail(listingId) {
  try {
    const product = await db.productListing.findUnique({
      where: { id: listingId },
      include: {
        farmer: true, // Get full farmer details
        agent: true   // Get full agent details
      }
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: "Database error" };
  }
}