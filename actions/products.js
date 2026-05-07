"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { db } from "@/lib/prisma";
import { sanitizeContent } from "@/lib/utils";

/**
 * 1. CREATE LISTING (Handles Farmer & Agent)
 */
export async function createProductListing(formData) {
  // createProductListing invoked

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
      if (dbUser.farmerProfile.sellingStatus !== 'APPROVED') {
        return { success: false, error: "Your seller profile is pending approval. You cannot create listings yet." };
      }
      sellerType = 'farmer';
      sellerProfileId = dbUser.farmerProfile.id;
    } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
      if (dbUser.agentProfile.sellingStatus !== 'APPROVED') {
        return { success: false, error: "Your seller profile is pending approval. You cannot create listings yet." };
      }
      sellerType = 'agent';
      sellerProfileId = dbUser.agentProfile.id;
    } else {
      return { success: false, error: "Complete your profile first." };
    }
  } catch (err) {
    return { success: false, error: "Profile validation failed." };
  }

  // 3. Extract & Sanitize Data (Strips all HTML tags to prevent XSS)

  const productName = sanitizeContent(formData.get("productName"))?.slice(0, 100);
  const category = sanitizeContent(formData.get("category"))?.slice(0, 50);
  const variety = sanitizeContent(formData.get("variety"))?.slice(0, 50);
  const description = sanitizeContent(formData.get("description"))?.slice(0, 2000);

  const rawStock = parseFloat(formData.get("availableStock")?.toString() || "0");
  const rawPrice = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
  const rawMin = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
  
  // BOUNDARY PROTECTION: Cap numbers and handle NaN
  const availableStock = isNaN(rawStock) ? 0 : Math.min(rawStock, 10000000); 
  const pricePerUnit = isNaN(rawPrice) ? 0 : Math.min(rawPrice, 1000000); 
  const minOrderQuantity = isNaN(rawMin) ? 0 : Math.min(rawMin, 1000000); 

  const deliveryChargeVal = parseFloat(formData.get("deliveryCharge")?.toString() || "0");
  const deliveryCharge = isNaN(deliveryChargeVal) ? 0 : Math.min(deliveryChargeVal, 100000);
  const deliveryChargeType = formData.get("deliveryChargeType")?.toString() || "per_unit";

  const qualityGrade = sanitizeContent(formData.get("qualityGrade"))?.slice(0, 50);
  const shelfLife = sanitizeContent(formData.get("shelfLife"))?.slice(0, 50);
  const whatsappNumber = sanitizeContent(formData.get("whatsappNumber"))?.slice(0, 20);
  const unit = formData.get("unit")?.toString() || "kg";

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

  // Strict Numerical Validation
  if (availableStock <= 0) return { success: false, error: "Stock must be positive." };
  if (pricePerUnit <= 0) return { success: false, error: "Price must be positive." };
  if (deliveryCharge < 0) return { success: false, error: "Invalid delivery charge." };

  if (!['per_unit', 'flat'].includes(deliveryChargeType)) {
    return { success: false, error: "Invalid delivery type." };
  }

  try {
    // IDEMPOTENCY CHECK: Prevent duplicate submissions within 1 minute
    const recentlyCreated = await db.productListing.findFirst({
      where: {
        productName,
        sellerType,
        farmerId: sellerType === 'farmer' ? sellerProfileId : null,
        agentId: sellerType === 'agent' ? sellerProfileId : null,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) } // Last 60 seconds
      }
    });

    if (recentlyCreated) {
      console.warn(`[Products] Duplicate submission blocked for user ${user.id}`);
      return { success: true, duplicated: true }; // Return success so UI doesn't show error, but we blocked the duplicate
    }

    await db.productListing.create({
      data: {
        productName, category, variety, description, images,
        quantityLabel: `${availableStock} ${unit}`,
        availableStock, unit, pricePerUnit, deliveryCharge, deliveryChargeType, minOrderQuantity,
        qualityGrade, shelfLife, harvestDate, whatsappNumber,
        shelfLifeStartDate, 
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
      where: { id: listingId },
      include: {
        farmer: { select: { userId: true } },
        agent: { select: { userId: true } }
      }
    });
    if (!listing) return { success: false, error: "Listing not found" };

    // IDOR Check: Ensure requester is the owner
    const isOwner = 
      (listing.farmer && listing.farmer.userId === user.id) || 
      (listing.agent && listing.agent.userId === user.id);

    if (!isOwner) return { success: false, error: "Unauthorized access to listing details." };

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

    // SECURITY: Ensure seller is still APPROVED
    const sellerProfile = dbUser.farmerProfile || dbUser.agentProfile;
    if (sellerProfile?.sellingStatus !== 'APPROVED') {
        return { success: false, error: "Your seller profile must be approved to update listings." };
    }

    // Extract & Sanitize Data

    const productName = sanitizeContent(formData.get("productName"))?.slice(0, 100);
    const category = sanitizeContent(formData.get("category"))?.slice(0, 50);
    const variety = sanitizeContent(formData.get("variety"))?.slice(0, 50);
    const description = sanitizeContent(formData.get("description"))?.slice(0, 2000);

    const rawStock = parseFloat(formData.get("availableStock")?.toString() || "0");
    const rawPrice = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
    const rawMin = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
    
    // BOUNDARY PROTECTION
    const availableStock = isNaN(rawStock) ? 0 : Math.min(rawStock, 10000000); 
    const pricePerUnit = isNaN(rawPrice) ? 0 : Math.min(rawPrice, 1000000); 
    const minOrderQuantity = isNaN(rawMin) ? 0 : Math.min(rawMin, 1000000); 

    const deliveryChargeVal = parseFloat(formData.get("deliveryCharge")?.toString() || "0");
    const deliveryCharge = isNaN(deliveryChargeVal) ? 0 : Math.min(deliveryChargeVal, 100000);
    const deliveryChargeType = formData.get("deliveryChargeType")?.toString() || "per_unit";
    const qualityGrade = sanitizeContent(formData.get("qualityGrade"))?.slice(0, 50);
    const shelfLife = sanitizeContent(formData.get("shelfLife"))?.slice(0, 50);
    const whatsappNumber = sanitizeContent(formData.get("whatsappNumber"))?.slice(0, 20);
    const unit = formData.get("unit")?.toString() || "kg";

    const harvestDateStr = formData.get("harvestDate")?.toString();
    const harvestDate = harvestDateStr ? new Date(harvestDateStr) : null;

    // NEW: Shelf Life Start Date
    const shelfLifeStartDateStr = formData.get("shelfLifeStartDate")?.toString();
    const shelfLifeStartDate = shelfLifeStartDateStr ? new Date(shelfLifeStartDateStr) : null;

    // Filter empty images
    const images = formData.getAll("images").filter(img => img && img.toString().trim() !== "");

    // Strict Numerical Validation
    if (availableStock <= 0) return { success: false, error: "Stock must be positive." };
    if (pricePerUnit <= 0) return { success: false, error: "Price must be positive." };
    if (deliveryCharge < 0) return { success: false, error: "Invalid delivery charge." };

    if (!['per_unit', 'flat'].includes(deliveryChargeType)) {
      return { success: false, error: "Invalid delivery type." };
    }

    await db.productListing.update({
      where: { id: listingId },
      data: {
        productName, category, variety, description, images,
        quantityLabel: `${availableStock} ${unit}`,
        availableStock, unit, pricePerUnit, deliveryCharge, deliveryChargeType, minOrderQuantity,
        qualityGrade, shelfLife, harvestDate, whatsappNumber,
        shelfLifeStartDate, 
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

    // Check for active orders - if orders exist, we cannot hard-delete due to DB constraints
    // and marketplace integrity.
    const hasOrders = await db.orderItem.findFirst({ where: { productId: listingId } });
    
    if (hasOrders) {
      return { 
        success: false, 
        error: "This product has transaction history and cannot be deleted. Please mark it as 'Unavailable' instead to hide it from the marketplace." 
      };
    }

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
export async function getMarketplaceListings({ 
  page = 1, 
  limit = 12, 
  search = "", 
  category = "All", 
  sellerType = "all",
  sortBy = "newest",
  region = "",
  district = ""
} = {}) {
  const user = await currentUser();
  
  // Use a cache key that depends on the filters
  const cacheKey = `marketplace-${page}-${limit}-${search}-${category}-${sellerType}-${sortBy}-${region}-${district}-${user?.id || 'public'}`;
  
  return await unstable_cache(
    async () => {
      try {
        const skip = (page - 1) * limit;
        
        let whereClause = {
          isAvailable: true,
          availableStock: { gt: 0 }
        };

        if (search) {
          whereClause.OR = [
            { productName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (category !== "All") {
          whereClause.category = category;
        }

        if (sellerType !== "all") {
          whereClause.sellerType = sellerType === 'farmers' ? 'farmer' : 'agent';
        }

        // Region/District filtering
        if (region || district) {
          const geoConditions = [];
          if (region) {
            geoConditions.push({ farmer: { region: { contains: region, mode: 'insensitive' } } });
            geoConditions.push({ agent: { region: { contains: region, mode: 'insensitive' } } });
          }
          if (district) {
            geoConditions.push({ farmer: { district: { contains: district, mode: 'insensitive' } } });
            geoConditions.push({ agent: { district: { contains: district, mode: 'insensitive' } } });
          }
          whereClause.AND = whereClause.AND || [];
          whereClause.AND.push({ OR: geoConditions });
        }

        if (user) {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { 
              farmerProfile: { select: { id: true } }, 
              agentProfile: { select: { id: true } } 
            }
          });

          if (dbUser) {
            whereClause.AND = whereClause.AND || [];
            if (dbUser.farmerProfile) {
              whereClause.AND.push({
                OR: [
                  { farmerId: { not: dbUser.farmerProfile.id } },
                  { farmerId: null }
                ]
              });
            }
            if (dbUser.agentProfile) {
              whereClause.AND.push({
                OR: [
                  { agentId: { not: dbUser.agentProfile.id } },
                  { agentId: null }
                ]
              });
            }
          }
        }

        const [listings, totalCount] = await Promise.all([
          db.productListing.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: sortBy === "price_low" ? { pricePerUnit: 'asc' } :
                     sortBy === "price_high" ? { pricePerUnit: 'desc' } :
                     sortBy === "rating" ? { averageRating: 'desc' } :
                     { createdAt: 'desc' },
            include: {
              farmer: {
                select: { name: true, farmName: true, region: true, district: true, averageRating: true }
              },
              agent: {
                select: { name: true, companyName: true, region: true, district: true, averageRating: true }
              }
            }
          }),
          db.productListing.count({ where: whereClause })
        ]);

        return { 
          success: true, 
          data: listings, 
          pagination: {
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
            currentPage: page
          }
        };
      } catch (err) {
        console.error("Marketplace Error:", err);
        return { success: false, error: "Failed to load marketplace." };
      }
    },
    [cacheKey],
    { revalidate: 60, tags: ['marketplace'] }
  )();
}

/**
 * 7. GET PRODUCT DETAIL (Full Info for Detail Page)
 */
export async function getProductDetail(listingId) {
  try {
    const product = await db.productListing.findUnique({
      where: { id: listingId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            farmName: true,
            phone: true, // Needed for contact
            address: true,
            region: true,
            district: true,
            state: true,
            city: true,
            averageRating: true,
            totalReviews: true,
            farmingExperience: true,
            primaryProduce: true,
            createdAt: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true, // Needed for contact
            address: true,
            region: true,
            district: true,
            state: true,
            city: true,
            averageRating: true,
            totalReviews: true,
            agentType: true,
            createdAt: true
          }
        }
      }
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: "Database error" };
  }
}