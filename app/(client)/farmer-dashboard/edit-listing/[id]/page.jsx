import { getProductById } from "@/actions/products";
import EditListingClient from "./EditListingClient";
import { redirect } from "next/navigation";

// Ensure the function is async
export default async function EditListingPage({ params }) {
  // 1. AWAIT THE PARAMS (Next.js 15 Requirement)
  const { id } = await params; 

  // 2. Use the unwrapped 'id'
  const { data: product, success } = await getProductById(id);

  if (!success || !product) {
    // If fetching failed, this redirect happens (which is what you were seeing)
    redirect("/farmer-dashboard/my-listings");
  }

  return <EditListingClient product={product} />;
}