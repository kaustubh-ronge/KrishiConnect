export const dynamic = 'force-dynamic';
import { getProductDetail } from "@/actions/products";
import ProductDetailClient from "./_components/ProductDetailClient";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: product } = await getProductDetail(id);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false },
    };
  }

  return {
    title: `${product.name} | Marketplace`,
    description: `Buy ${product.name} directly from farmers. ${product.description?.substring(0, 100)}...`,
    robots: {
      index: false, // Protected route
      follow: false,
    },
    openGraph: {
      title: `${product.name} | KrishiConnect Marketplace`,
      description: product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

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
        agentProfile: { select: { lat: true, lng: true } },
        deliveryProfile: { select: { lat: true, lng: true } }
      } 
    });
  }

  const userLat = userData?.farmerProfile?.lat ?? userData?.agentProfile?.lat ?? userData?.deliveryProfile?.lat ?? null;
  const userLng = userData?.farmerProfile?.lng ?? userData?.agentProfile?.lng ?? userData?.deliveryProfile?.lng ?? null;

  return <ProductDetailClient 
    product={product} 
    userRole={userData?.role || 'none'} 
    userLat={userLat}
    userLng={userLng}
  />;
}