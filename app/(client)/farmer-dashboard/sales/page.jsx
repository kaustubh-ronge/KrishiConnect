import { getSellerSales } from "@/actions/orders";
import SalesDashboardClient from "./_components/SalesDashboardClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SalesDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { data: sales, success } = await getSellerSales();

  if (!success) {
      return (
        <div className="min-h-screen flex items-center justify-center text-red-500 bg-gray-50">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Unable to load sales data</h3>
                <p className="text-sm text-gray-500">Please try refreshing the page later.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <SalesDashboardClient sales={sales} />
    </div>
  );
}