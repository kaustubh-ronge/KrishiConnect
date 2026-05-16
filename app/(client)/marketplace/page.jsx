import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getMarketplaceListings } from "@/actions/products";
import { getRecentlyViewedProducts } from "@/actions/products-enhanced";
import MarketplaceClient from "./_components/MarketPlaceClient";

export const dynamic = 'force-dynamic'; // Ensure fresh data

export default async function MarketplacePage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 12;
  // 1. Get User if logged in
  const user = await currentUser();
  
  // 2. Fetch DB profile if user exists
  let dbUser = null;
  if (user) {
    dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        role: true,
        farmerProfile: { select: { id: true } },
        agentProfile: { select: { id: true } },
        deliveryProfile: { select: { id: true } }
      }
    });
  }

  // 3. Robust Role Verification (Self-Healing in-memory for UI)
  let userRole = dbUser?.role || 'none';
  if (userRole === 'farmer' && !dbUser?.farmerProfile) userRole = 'none';
  if (userRole === 'agent' && !dbUser?.agentProfile) userRole = 'none';
  if (userRole === 'delivery' && !dbUser?.deliveryProfile) userRole = 'none';

  // 3. Fetch Data
  const { data: listings, success, pagination } = await getMarketplaceListings({ 
    page, 
    limit,
    search: params.search || "",
    category: params.category || "All",
    sortBy: params.sortBy || "newest",
    sellerType: params.sellerType || "all",
    region: params.region || "",
    district: params.district || ""
  });
  const { data: recentlyViewed } = await getRecentlyViewedProducts();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <MarketplaceClient 
        initialListings={success ? (listings || []) : []} 
        metadata={success ? {
          total: pagination?.total || 0,
          totalPages: pagination?.pages || 0,
          page: pagination?.currentPage || 1,
          limit: 12
        } : { total: 0, totalPages: 0, page: 1, limit: 12 }}
        userRole={userRole}
        userId={user?.id}
        recentlyViewed={recentlyViewed || []}
      />
    </div>
  );
}