import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getMarketplaceListings } from "@/actions/products";
import MarketplaceClient from "./_components/MarketPlaceClient";

export const dynamic = 'force-dynamic'; // Ensure fresh data

export default async function MarketplacePage() {
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
  const { data: listings, success } = await getMarketplaceListings();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <MarketplaceClient initialListings={success ? listings : []} userRole={dbUser.role} />
    </div>
  );
}