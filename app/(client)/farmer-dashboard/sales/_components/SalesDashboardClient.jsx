"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  IndianRupee, TrendingUp, Package, Calendar, 
  ArrowUpRight, Download, Filter, Search, User
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { motion } from "framer-motion";
import Image from "next/image";

export default function SalesDashboardClient({ sales }) {
  const [searchQuery, setSearchQuery] = useState("");

  // --- DATA PROCESSING FOR CHARTS ---
  const chartData = useMemo(() => {
    // Group sales by date for the Area Chart
    const salesByDate = sales.reduce((acc, sale) => {
        const date = new Date(sale.order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const amount = sale.quantity * sale.priceAtPurchase;
        
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.revenue += amount;
        } else {
            acc.push({ date, revenue: amount });
        }
        return acc;
    }, []);

    return salesByDate.reverse(); 
  }, [sales]);

  const topProductsData = useMemo(() => {
      const productCounts = sales.reduce((acc, sale) => {
          const name = sale.product.productName;
          if (acc[name]) {
              acc[name] += sale.quantity;
          } else {
              acc[name] = sale.quantity;
          }
          return acc;
      }, {});

      return Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
  }, [sales]);

  // --- STATS CALCULATION ---
  const totalEarnings = sales.reduce((sum, sale) => sum + (sale.quantity * sale.priceAtPurchase), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const averageOrderValue = sales.length > 0 ? totalEarnings / sales.length : 0;

  // --- Filter Logic ---
  const filteredSales = sales.filter(sale => 
     sale.product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (sale.order.buyerUser?.farmerProfile?.name || sale.order.buyerUser?.agentProfile?.name || "User").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sales Overview</h1>
            <p className="text-gray-500 mt-1">Track your revenue and product performance</p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" className="h-10"><Calendar className="mr-2 h-4 w-4"/> Last 30 Days</Button>
             <Button variant="outline" className="h-10"><Download className="mr-2 h-4 w-4"/> Export Report</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatsCard 
            title="Total Revenue" 
            value={`₹${totalEarnings.toLocaleString('en-IN')}`} 
            icon={IndianRupee} 
            color="green"
            trend="+12.5% from last month"
         />
         <StatsCard 
            title="Units Sold" 
            value={totalItemsSold} 
            icon={Package} 
            color="blue"
            trend="+5.2% from last month"
         />
         <StatsCard 
            title="Avg. Order Value" 
            value={`₹${averageOrderValue.toFixed(0)}`} 
            icon={TrendingUp} 
            color="purple"
            trend="+2.1% from last month"
         />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Revenue Chart */}
         <Card className="lg:col-span-2 border-gray-200 shadow-sm">
             <CardHeader>
                 <CardTitle>Revenue Analytics</CardTitle>
                 <CardDescription>Income trend over the last 30 days</CardDescription>
             </CardHeader>
             <CardContent className="h-[300px]">
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`₹${value}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No data available yet</div>
                 )}
             </CardContent>
         </Card>

         {/* Top Products Chart */}
         <Card className="border-gray-200 shadow-sm">
             <CardHeader>
                 <CardTitle>Top Selling</CardTitle>
                 <CardDescription>Most popular items by quantity</CardDescription>
             </CardHeader>
             <CardContent className="h-[300px]">
                 {topProductsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{fill: '#4b5563', fontSize: 12}} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No sales yet</div>
                 )}
             </CardContent>
         </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
            <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>A list of your recent sales</CardDescription>
            </div>
            <div className="relative w-64 hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search buyer or product..." 
                    className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </CardHeader>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold">Buyer</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredSales.length > 0 ? (
                        filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                                            {sale.product.images?.[0] ? (
                                                <Image src={sale.product.images[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                            ) : <Package className="h-5 w-5 text-gray-400"/>}
                                        </div>
                                        <span className="font-medium text-gray-900">{sale.product.productName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full"><User className="h-3 w-3" /></div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-medium">
                                                {sale.order.buyerUser?.farmerProfile?.name || sale.order.buyerUser?.agentProfile?.name || "User"}
                                            </span>
                                            <span className="text-xs text-gray-500">{sale.order.buyerUser?.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(sale.order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    {sale.quantity} {sale.product.unit}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                    ₹{(sale.quantity * sale.priceAtPurchase).toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none hover:bg-green-100">Paid</Badge>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                                <div className="flex flex-col items-center justify-center">
                                    <Package className="h-8 w-8 mb-2 opacity-50" />
                                    No sales found matching your search.
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>

    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, trend }) {
    const colors = {
        green: "bg-green-100 text-green-600",
        blue: "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
    };

    return (
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> {trend.split(' ')[0]}
                    </span>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                    <p className="text-xs text-gray-400 mt-2">{trend.substring(trend.indexOf(' '))}</p>
                </div>
            </CardContent>
        </Card>
    );
}