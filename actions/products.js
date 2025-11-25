// "use server";

// import { currentUser } from "@clerk/nextjs/server";
// import { revalidatePath } from "next/cache";
// import { db } from "@/lib/prisma";

// /**
//  * 1. CREATE LISTING
//  */
// export async function createProductListing(formData) {
//   console.log("--- createProductListing Action Started ---");

//   // 1. Auth Check
//   let user;
//   try {
//     user = await currentUser();
//     if (!user) throw new Error("Not logged in");
//   } catch (err) {
//     return { success: false, error: "Please log in to create a listing." };
//   }

//   // 2. Profile Check
//   let sellerType = null;
//   let sellerProfileId = null;

//   try {
//     const dbUser = await db.user.findUnique({
//       where: { id: user.id },
//       include: { farmerProfile: true, agentProfile: true }
//     });

//     if (!dbUser) return { success: false, error: "User not found." };

//     if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
//       sellerType = 'farmer';
//       sellerProfileId = dbUser.farmerProfile.id;
//     } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
//       sellerType = 'agent';
//       sellerProfileId = dbUser.agentProfile.id;
//     } else {
//       return { success: false, error: "Complete your profile first." };
//     }
//   } catch (err) {
//     return { success: false, error: "Profile validation failed." };
//   }

//   // 3. Extract Data
//   const productName = formData.get("productName")?.toString();
//   const variety = formData.get("variety")?.toString();
//   const description = formData.get("description")?.toString();
  
//   const availableStock = parseFloat(formData.get("availableStock")?.toString() || "0");
//   const pricePerUnit = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
//   const minOrderQuantity = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
//   const unit = formData.get("unit")?.toString();

//   const qualityGrade = formData.get("qualityGrade")?.toString();
//   const shelfLife = formData.get("shelfLife")?.toString();
//   const whatsappNumber = formData.get("whatsappNumber")?.toString();
  
//   const harvestDateStr = formData.get("harvestDate")?.toString();
//   const harvestDate = harvestDateStr ? new Date(harvestDateStr) : null;

//   // Images (Base64 strings)
//   const images = formData.getAll("images");

//   // 4. Validation
//   if (!productName || !availableStock || !pricePerUnit || !unit) {
//     return { success: false, error: "Required fields missing." };
//   }

//   // 5. Create
//   try {
//     await db.productListing.create({
//       data: {
//         productName,
//         variety,
//         description,
//         images, 
//         quantityLabel: `${availableStock} ${unit}`,
//         availableStock,
//         unit,
//         pricePerUnit,
//         minOrderQuantity,
//         qualityGrade,
//         shelfLife,
//         harvestDate,
//         whatsappNumber,
//         isAvailable: true,
//         sellerType,
//         farmerId: sellerType === 'farmer' ? sellerProfileId : null,
//         agentId: sellerType === 'agent' ? sellerProfileId : null,
//       },
//     });
//   } catch (err) {
//     console.error("Create Listing DB Error:", err);
//     return { success: false, error: "Failed to save listing. Images might be too large." };
//   }

//   revalidatePath(`/${sellerType}-dashboard/my-listings`);
//   revalidatePath(`/marketplace`); 

//   return { success: true };
// }

// /**
//  * 2. FETCH MY LISTINGS
//  */
// export async function getMyListings() {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     const dbUser = await db.user.findUnique({
//       where: { id: user.id },
//       include: { farmerProfile: true, agentProfile: true }
//     });

//     if (!dbUser) return { success: false, error: "User not found" };

//     let whereClause = {};

//     if (dbUser.role === 'farmer' && dbUser.farmerProfile) {
//       whereClause = { farmerId: dbUser.farmerProfile.id };
//     } else if (dbUser.role === 'agent' && dbUser.agentProfile) {
//       whereClause = { agentId: dbUser.agentProfile.id };
//     } else {
//       return { success: false, data: [] };
//     }

//     const listings = await db.productListing.findMany({
//       where: whereClause,
//       orderBy: { createdAt: 'desc' }
//     });

//     return { success: true, data: listings };

//   } catch (err) {
//     console.error("Fetch Error:", err);
//     return { success: false, error: "Failed to fetch listings" };
//   }
// }

// /**
//  * 3. DELETE LISTING
//  */
// export async function deleteListing(listingId) {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     const dbUser = await db.user.findUnique({
//       where: { id: user.id },
//       include: { farmerProfile: true, agentProfile: true }
//     });

//     const listing = await db.productListing.findUnique({ where: { id: listingId } });
//     if (!listing) return { success: false, error: "Listing not found" };

//     const isOwner = 
//       (dbUser.role === 'farmer' && listing.farmerId === dbUser.farmerProfile?.id) ||
//       (dbUser.role === 'agent' && listing.agentId === dbUser.agentProfile?.id);

//     if (!isOwner) return { success: false, error: "Unauthorized" };

//     await db.productListing.delete({ where: { id: listingId } });
    
//     revalidatePath('/farmer-dashboard/my-listings');
//     revalidatePath('/marketplace');
//     return { success: true };

//   } catch (err) {
//     return { success: false, error: "Failed to delete" };
//   }
// }

// /**
//  * 4. GET SINGLE LISTING (For Edit Page)
//  */
// export async function getProductById(listingId) {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Not logged in" };

//   try {
//     const listing = await db.productListing.findUnique({
//       where: { id: listingId }
//     });
    
//     if (!listing) return { success: false, error: "Listing not found" };
//     return { success: true, data: listing };
//   } catch (err) {
//     return { success: false, error: "Database error" };
//   }
// }

// /**
//  * 5. UPDATE LISTING
//  */
// export async function updateProductListing(listingId, formData) {
//   const user = await currentUser();
//   if (!user) return { success: false, error: "Unauthorized" };

//   // 1. Verify Ownership Logic (Simplified for brevity, reusing delete logic recommended)
//   // ... (Assuming similar ownership check as deleteListing)

//   // 2. Extract Data (Similar to Create)
//   const productName = formData.get("productName")?.toString();
//   const variety = formData.get("variety")?.toString();
//   const description = formData.get("description")?.toString();
  
//   const availableStock = parseFloat(formData.get("availableStock")?.toString() || "0");
//   const pricePerUnit = parseFloat(formData.get("pricePerUnit")?.toString() || "0");
//   const minOrderQuantity = parseFloat(formData.get("minOrderQuantity")?.toString() || "0");
//   const unit = formData.get("unit")?.toString();

//   const qualityGrade = formData.get("qualityGrade")?.toString();
//   const shelfLife = formData.get("shelfLife")?.toString();
//   const whatsappNumber = formData.get("whatsappNumber")?.toString();
  
//   const harvestDateStr = formData.get("harvestDate")?.toString();
//   const harvestDate = harvestDateStr ? new Date(harvestDateStr) : null;

//   const images = formData.getAll("images");

//   try {
//     await db.productListing.update({
//       where: { id: listingId },
//       data: {
//         productName, variety, description, images,
//         quantityLabel: `${availableStock} ${unit}`,
//         availableStock, unit, pricePerUnit, minOrderQuantity,
//         qualityGrade, shelfLife, harvestDate, whatsappNumber
//       }
//     });
//   } catch (err) {
//     return { success: false, error: "Update failed" };
//   }

//   revalidatePath("/farmer-dashboard/my-listings");
//   revalidatePath("/marketplace");
//   return { success: true };
// }


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
  const images = formData.getAll("images");

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
        isAvailable: true,
        sellerType,
        farmerId: sellerType === 'farmer' ? sellerProfileId : null,
        agentId: sellerType === 'agent' ? sellerProfileId : null,
      },
    });
  } catch (err) {
    console.error("Create Error:", err);
    return { success: false, error: "Failed to save listing." };
  }

  revalidatePath(`/${sellerType}-dashboard/my-listings`);
  revalidatePath(`/marketplace`); 
  return { success: true };
}

/**
 * 2. GET MY LISTINGS
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
 * 4. UPDATE LISTING (Now with Ownership Check)
 */
export async function updateProductListing(listingId, formData) {
  console.log(`Updating listing ${listingId}...`);
  
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // --- SECURITY CHECK START ---
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (!dbUser) return { success: false, error: "User not found" };

    const existingListing = await db.productListing.findUnique({
      where: { id: listingId }
    });

    if (!existingListing) return { success: false, error: "Listing not found" };

    // Verify if the user actually owns this listing
    const isOwner = 
      (dbUser.role === 'farmer' && existingListing.farmerId === dbUser.farmerProfile?.id) ||
      (dbUser.role === 'agent' && existingListing.agentId === dbUser.agentProfile?.id);

    if (!isOwner) {
        console.error(`Security Alert: User ${user.id} tried to edit listing ${listingId} owned by someone else.`);
        return { success: false, error: "Unauthorized: You do not own this listing." };
    }
    // --- SECURITY CHECK END ---

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
    const images = formData.getAll("images");

    await db.productListing.update({
      where: { id: listingId },
      data: {
        productName, variety, description, images,
        quantityLabel: `${availableStock} ${unit}`,
        availableStock, unit, pricePerUnit, minOrderQuantity,
        qualityGrade, shelfLife, harvestDate, whatsappNumber
      }
    });

  } catch (err) {
    console.error("Update Failed:", err);
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