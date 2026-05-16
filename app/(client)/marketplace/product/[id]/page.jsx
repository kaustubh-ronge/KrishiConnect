export const dynamic = 'force-dynamic';
import { getProductDetail } from "@/actions/products";
import ProductDetailClient from "./_components/ProductDetailClient";
import { redirect } from "next/navigation";
import Schema from "@/components/Schema";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: product } = await getProductDetail(id);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  return {
    title: `${product.productName} | Marketplace`,
    description: `Buy ${product.productName} directly from farmers. ${product.description?.substring(0, 150)}...`,
    alternates: {
      canonical: `/marketplace/product/${id}`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `${product.productName} | KrishiConnect Marketplace`,
      description: product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      url: `/marketplace/product/${id}`,
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.productName,
    "image": product.images || [],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.farmer?.farmName || product.agent?.companyName || "KrishiConnect"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/marketplace/product/${id}`,
      "priceCurrency": "INR",
      "price": product.pricePerUnit,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": product.farmer?.name || product.agent?.name || "KrishiConnect"
      }
    },
    "aggregateRating": product.averageRating ? {
      "@type": "AggregateRating",
      "ratingValue": product.averageRating,
      "reviewCount": product.farmer?.totalReviews || product.agent?.totalReviews || 1
    } : undefined
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Marketplace",
        "item": `${baseUrl}/marketplace`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.productName,
        "item": `${baseUrl}/marketplace/product/${id}`
      }
    ]
  };

  return (
    <>
      <Schema data={productSchema} />
      <Schema data={breadcrumbSchema} />
      <ProductDetailClient 
        product={product} 
        userRole={userData?.role || 'none'} 
        userLat={userLat}
        userLng={userLng}
      />
    </>
  );
}