import { getSellerSales } from "@/actions/orders";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SalesDashboardClient from "../../farmer-dashboard/sales/_components/SalesDashboardClient";

export const dynamic = 'force-dynamic';

export default async function AgentSalesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { data: sales, success } = await getSellerSales();

  if (!success) {
      return (
        <div className="min-h-screen flex items-center justify-center text-red-500 bg-blue-50">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Unable to load sales data</h3>
                <p className="text-sm text-gray-500">Please try refreshing the page later.</p>
            </div>
        </div>
      );
  }

  return (
    // Pass userType="agent" so the component knows to use Blue theme
    <div className="min-h-screen bg-blue-50/30">
      <SalesDashboardClient sales={sales} userType="agent" />
    </div>
  );
}