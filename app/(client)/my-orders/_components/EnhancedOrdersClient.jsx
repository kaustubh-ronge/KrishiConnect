"use client";

import { useEffect, useState } from "react";
import { getBuyerOrders } from "@/actions/orders";
import { createDispute } from "@/actions/disputes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, Calendar, Eye, Download, Star, AlertCircle, Truck, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/invoice-generator";
import OrderTrackingTimeline from "@/components/OrderTrackingTimeline";
import Link from "next/link";

export default function EnhancedOrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      const res = await getBuyerOrders();
      if (res.success) setOrders(res.data);
      setLoading(false);
    }
    loadOrders();
  }, []);

  const handleDownloadInvoice = async (order) => {
    const loadingToast = toast.loading("Generating invoice...");
    
    try {
      // Safety check
      if (!order.buyerUser) {
        toast.error("Order data incomplete. Please refresh the page.", { id: loadingToast });
        return;
      }

      const buyerDetails = {
        name: order.buyerUser.farmerProfile?.name || order.buyerUser.agentProfile?.name || order.buyerUser.name || 'N/A',
        email: order.buyerUser.email || 'N/A',
        phone: order.buyerUser.farmerProfile?.phone || order.buyerUser.agentProfile?.phone || order.buyerPhone || 'N/A',
        address: order.shippingAddress || order.buyerUser.farmerProfile?.address || 'N/A'
      };

      // For simplicity, if multiple sellers, use "Multiple Sellers"
      const firstItem = order.items[0];
      
      if (!firstItem || !firstItem.product) {
        toast.error("Order items data incomplete. Please try again.", { id: loadingToast });
        return;
      }

      const sellerDetails = firstItem.product.sellerType === 'farmer' 
        ? {
            name: firstItem.product.farmer?.name || firstItem.sellerName || 'Seller',
            phone: firstItem.product.farmer?.phone || 'N/A',
            address: firstItem.product.farmer?.address || 'N/A'
          }
        : {
            name: firstItem.product.agent?.companyName || firstItem.product.agent?.name || firstItem.sellerName || 'Seller',
            phone: firstItem.product.agent?.phone || 'N/A',
            address: 'N/A'
          };

      const pdf = await generateInvoicePDF(order, buyerDetails, sellerDetails);
      pdf.save(`Invoice-${order.invoiceNumber || order.id.slice(-8)}.pdf`);
      
      toast.success("Invoice downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Download Invoice Error:", error);
      toast.error(`Failed to download invoice: ${error.message}`, { id: loadingToast });
    }
  };

  const handleOpenTracking = (order) => {
    setSelectedOrder(order);
    setTrackingDialogOpen(true);
  };

  const handleOpenDispute = (order) => {
    setSelectedOrder(order);
    setDisputeDialogOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setSubmittingDispute(true);
    const formData = new FormData();
    formData.append('orderId', selectedOrder.id);
    formData.append('reason', disputeReason);

    const res = await createDispute(formData);
    
    if (res.success) {
      toast.success(res.message);
      setDisputeDialogOpen(false);
      setDisputeReason("");
      // Reload orders
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    
    setSubmittingDispute(false);
  };

  const canDispute = (order) => {
    if (order.orderStatus !== 'DELIVERED') return false;
    if (order.disputeStatus === 'OPEN') return false;
    
    // Check 48-hour window
    const deliveredDate = new Date(order.updatedAt); // Approximate
    const hoursSince = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 48;
  };

  const canReview = (order) => {
    return order.orderStatus === 'DELIVERED';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500">Track your purchases and manage orders.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mb-6">Your purchase history will appear here.</p>
            <Link href="/marketplace">
              <Button className="bg-green-600 hover:bg-green-700">
                Browse Marketplace
              </Button>
            </Link>
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
                <Card className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex gap-6 text-sm text-gray-600">
                        <div>
                          <span className="block text-xs uppercase font-bold text-gray-400">Order Placed</span>
                          <span className="font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase font-bold text-gray-400">Total</span>
                          <span className="font-medium text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase font-bold text-gray-400">Order ID</span>
                          <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none">
                          {order.paymentStatus}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-none">
                          {order.orderStatus}
                        </Badge>
                        {order.disputeStatus === 'OPEN' && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 shadow-none">
                            Dispute Open
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Items */}
                    <div className="space-y-4 mb-6">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                              <Package className="h-8 w-8" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{item.product.productName}</h4>
                              <p className="text-sm text-gray-500">
                                Seller: {item.sellerName || 
                                  (item.product.sellerType === 'farmer' 
                                    ? item.product.farmer?.name 
                                    : (item.product.agent?.companyName || item.product.agent?.name)
                                  ) || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              Qty: {item.quantity} {item.product.unit}
                            </p>
                            <p className="text-sm text-gray-500">₹{item.priceAtPurchase} / unit</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(order)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTracking(order)}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>

                      {canReview(order) && (
                        <Link href={`/my-orders/review/${order.id}`}>
                          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            <Star className="h-4 w-4 mr-2" />
                            Write Review
                          </Button>
                        </Link>
                      )}

                      {canDispute(order) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleOpenDispute(order)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Tracking</DialogTitle>
            <DialogDescription>
              Track your order #{selectedOrder?.id.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderTrackingTimeline 
              orderId={selectedOrder.id} 
              currentStatus={selectedOrder.orderStatus} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Describe the problem with your order. Our team will review it within 24 hours.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disputeReason">Issue Description *</Label>
              <Textarea
                id="disputeReason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="E.g., Received poor quality products, Missing items, Damaged package..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Opening a dispute will temporarily freeze the payout to the seller 
                until an admin reviews and resolves the issue.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeDialogOpen(false)}
              disabled={submittingDispute}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDispute}
              disabled={submittingDispute}
              className="bg-red-600 hover:bg-red-700"
            >
              {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

