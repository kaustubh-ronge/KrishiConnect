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
  // 1. Security Check: Must be logged in
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // 2. Role Check: Must have a DB profile
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role === 'none') {
    redirect("/onboarding"); // Force them to choose a role
  }

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
        userRole={dbUser.role}
        recentlyViewed={recentlyViewed || []}
      />
    </div>
  );
}