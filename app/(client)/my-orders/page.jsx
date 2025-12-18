
// import { getBuyerOrders } from "@/actions/orders";
// import EnhancedOrdersClient from "./_components/EnhancedOrdersClient";
// import { currentUser } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";

// export const dynamic = 'force-dynamic';

// export default async function MyOrdersPage() {
//   const user = await currentUser();
//   if (!user) redirect("/sign-in");

//   const { data: orders, success } = await getBuyerOrders();

//   return (
//     <div className="min-h-screen bg-gray-50/50">
//       <EnhancedOrdersClient initialOrders={success ? orders : []} />
//     </div>
//   );
// }

import { getBuyerOrders } from "@/actions/orders";
import EnhancedOrdersClient from "./_components/EnhancedOrdersClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { data: orders, success } = await getBuyerOrders();

  return (
    // Beautiful Gradient Background
    <div className="min-h-screen bg-linear-to-br from-green-100 via-green-50 to-emerald-100">
      <EnhancedOrdersClient initialOrders={success ? orders : []} />
    </div>
  );
}