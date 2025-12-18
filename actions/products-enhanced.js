"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Track recently viewed product
export async function trackProductView(productId) {
  const user = await currentUser();
  if (!user) return { success: false };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { recentlyViewedProducts: true }
    });

    if (!dbUser) return { success: false };

    // Add to recently viewed (max 20, most recent first)
    let recentlyViewed = dbUser.recentlyViewedProducts || [];
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    
    // Add to front
    recentlyViewed.unshift(productId);
    
    // Keep only last 20
    recentlyViewed = recentlyViewed.slice(0, 20);

    await db.user.update({
      where: { id: user.id },
      data: { recentlyViewedProducts: recentlyViewed }
    });

    return { success: true };
  } catch (error) {
    console.error("Track Product View Error:", error);
    return { success: false };
  }
}

// Get recently viewed products
export async function getRecentlyViewedProducts() {
  const user = await currentUser();
  if (!user) return { success: false, data: [] };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { recentlyViewedProducts: true }
    });

    if (!dbUser || !dbUser.recentlyViewedProducts || dbUser.recentlyViewedProducts.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch the actual products
    const products = await db.productListing.findMany({
      where: {
        id: { in: dbUser.recentlyViewedProducts },
        isAvailable: true
      },
      include: {
        farmer: {
          select: {
            name: true,
            farmName: true,
            region: true,
            district: true,
            averageRating: true,
            totalReviews: true
          }
        },
        agent: {
          select: {
            name: true,
            companyName: true,
            region: true,
            district: true,
            averageRating: true,
            totalReviews: true
          }
        }
      }
    });

    // Sort by the order in recentlyViewedProducts
    const sortedProducts = dbUser.recentlyViewedProducts
      .map(id => products.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 10); // Return max 10

    return { success: true, data: sortedProducts };
  } catch (error) {
    console.error("Get Recently Viewed Error:", error);
    return { success: false, data: [] };
  }
}

// Get products with enhanced filters
export async function getProductsEnhanced({ 
  region, 
  district, 
  harvestDateFrom, 
  harvestDateTo,
  sortBy 
}) {
  try {
    const whereClause = {
      isAvailable: true
    };

    // Region/District filtering
    if (region || district) {
      whereClause.OR = [];
      
      if (region) {
        whereClause.OR.push({
          farmer: { region: { contains: region, mode: 'insensitive' } }
        });
        whereClause.OR.push({
          agent: { region: { contains: region, mode: 'insensitive' } }
        });
      }

      if (district) {
        whereClause.OR.push({
          farmer: { district: { contains: district, mode: 'insensitive' } }
        });
        whereClause.OR.push({
          agent: { district: { contains: district, mode: 'insensitive' } }
        });
      }
    }

    // Harvest date filtering
    if (harvestDateFrom || harvestDateTo) {
      whereClause.harvestDate = {};
      if (harvestDateFrom) {
        whereClause.harvestDate.gte = new Date(harvestDateFrom);
      }
      if (harvestDateTo) {
        whereClause.harvestDate.lte = new Date(harvestDateTo);
      }
    }

    const products = await db.productListing.findMany({
      where: whereClause,
      include: {
        farmer: {
          select: {
            name: true,
            farmName: true,
            region: true,
            district: true,
            averageRating: true,
            totalReviews: true
          }
        },
        agent: {
          select: {
            name: true,
            companyName: true,
            region: true,
            district: true,
            averageRating: true,
            totalReviews: true
          }
        }
      },
      orderBy: sortBy === 'rating' 
        ? { averageRating: 'desc' }
        : sortBy === 'harvest'
        ? { harvestDate: 'desc' }
        : { createdAt: 'desc' }
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Get Products Enhanced Error:", error);
    return { success: false, data: [], error: "Failed to fetch products" };
  }
}

