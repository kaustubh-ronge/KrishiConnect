import { getProductDetail } from "@/actions/products";
import ProductDetailClient from "./_components/ProductDetailClient";
import { redirect } from "next/navigation";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const { data: product, success } = await getProductDetail(id);

  if (!success || !product) {
    redirect("/marketplace");
  }

  return <ProductDetailClient product={product} />;
}