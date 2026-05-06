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
  let userRole = 'none';
  
  if (user) {
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    userRole = dbUser?.role || 'none';
  }

  return <ProductDetailClient product={product} userRole={userRole} />;
}