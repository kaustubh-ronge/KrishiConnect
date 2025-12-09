import { getProductById } from "@/actions/products";
import AgentEditClient from "./AgentEditClient";
import { redirect } from "next/navigation";

export default async function AgentEditPage({ params }) {
  const { id } = await params;
  const { data: product, success } = await getProductById(id);

  if (!success || !product) redirect("/agent-dashboard/my-listings");

  return <AgentEditClient product={product} />;
}