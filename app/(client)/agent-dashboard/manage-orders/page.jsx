import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ManageOrdersClient from "../../farmer-dashboard/manage-orders/_components/ManageOrdersClient";
import { getSellerOrders } from "@/actions/order-tracking";

export default async function ManageOrdersPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const ordersResult = await getSellerOrders();
  
  return (
    <ManageOrdersClient 
      initialOrders={ordersResult.success ? ordersResult.data : []} 
      userType="agent"
    />
  );
}

