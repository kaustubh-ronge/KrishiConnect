import { getSellerSales } from "@/actions/orders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, Package } from "lucide-react";

export default async function AgentSalesPage() {
  const { data: sales, success } = await getSellerSales();

  if (!success) return <div className="p-8 text-center text-red-500">Failed to load sales data.</div>;

  const totalEarnings = sales.reduce((sum, sale) => sum + (sale.quantity * sale.priceAtPurchase), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Sales Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600"><IndianRupee className="h-8 w-8" /></div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600"><Package className="h-8 w-8" /></div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalItemsSold}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600"><TrendingUp className="h-8 w-8" /></div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Buyer</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(sale.order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.product.productName}</td>
                    <td className="px-6 py-4 text-gray-500">{sale.order.buyerUser?.farmerProfile?.name || sale.order.buyerUser?.agentProfile?.name || "User"}</td>
                    <td className="px-6 py-4">{sale.quantity} {sale.product.unit}</td>
                    <td className="px-6 py-4 font-bold text-green-600">₹{(sale.quantity * sale.priceAtPurchase).toFixed(2)}</td>
                    <td className="px-6 py-4"><Badge className="bg-green-100 text-green-800 border-green-200 shadow-none">Paid</Badge></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No sales yet. Listed products will appear here when sold.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
