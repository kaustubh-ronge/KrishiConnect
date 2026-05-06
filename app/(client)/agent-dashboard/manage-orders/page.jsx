export const dynamic = 'force-dynamic';
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ManageOrdersClient from "@/components/Dashboard/ManageOrdersClient";
import { getSellerOrders } from "@/actions/order-tracking";

export default async function ManageOrdersPage(props) {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const searchParams = await props?.searchParams;
  const page = parseInt(searchParams?.page) || 1;
  const ordersResult = await getSellerOrders(page, 10);
  
  return (
    <ManageOrdersClient 
      initialOrders={ordersResult.success ? ordersResult.data : []} 
      total={ordersResult.total || 0}
      hasMore={ordersResult.hasMore}
      currentPage={page}
      userType="agent"
    />
  );
}
