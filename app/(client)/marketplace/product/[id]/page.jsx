export const dynamic = 'force-dynamic';
import { getProductDetail } from "@/actions/products";
import ProductDetailClient from "./_components/ProductDetailClient";
import { redirect } from "next/navigation";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const { data: product, success } = await getProductDetail(id);

  if (!success || !product) {
    redirect("/marketplace");
  }

  const { currentUser } = await import("@clerk/nextjs/server");
  const { db } = await import("@/lib/prisma");
  
  const user = await currentUser();
  let userData = null;
  
  if (user) {
    userData = await db.user.findUnique({ 
      where: { id: user.id }, 
      select: { 
        role: true,
        farmerProfile: { select: { lat: true, lng: true } },
        agentProfile: { select: { lat: true, lng: true } }
      } 
    });
  }

  const userLat = userData?.farmerProfile?.lat || userData?.agentProfile?.lat;
  const userLng = userData?.farmerProfile?.lng || userData?.agentProfile?.lng;

  return <ProductDetailClient 
    product={product} 
    userRole={userData?.role || 'none'} 
    userLat={userLat}
    userLng={userLng}
  />;
}