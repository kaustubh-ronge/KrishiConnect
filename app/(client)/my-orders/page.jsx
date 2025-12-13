"use client";

import { useEffect, useState } from "react";
import { getBuyerOrders } from "@/actions/orders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Eye, Download } from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import { motion } from "framer-motion";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      const res = await getBuyerOrders();
      if (res.success) setOrders(res.data);
      setLoading(false);
    }
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Package className="h-8 w-8" /></div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <p className="text-gray-500">Track your purchases and download invoices.</p>
            </div>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
                <h3 className="text-xl font-medium text-gray-900">No past orders found</h3>
                <p className="text-gray-500">Your purchase history will appear here.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {orders.map((order, index) => (
                    <motion.div 
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <div>
                                        <span className="block text-xs uppercase font-bold text-gray-400">Order Placed</span>
                                        <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase font-bold text-gray-400">Total</span>
                                        <span className="font-medium text-gray-900">₹{order.totalAmount}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase font-bold text-gray-400">Order ID</span>
                                        <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none hover:bg-green-100">Paid</Badge>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                        <Eye className="h-4 w-4 mr-2" /> View Invoice
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.product.productName}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Seller: {item.product.sellerType === 'farmer' ? item.product.farmer?.name : item.product.agent?.companyName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">Qty: {item.quantity} {item.product.unit}</p>
                                                <p className="text-sm text-gray-500">₹{item.priceAtPurchase} / unit</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      <InvoiceModal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
      />
    </div>
  );
}