"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Eye, Calendar, User, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { updateOrderStatus } from "@/actions/order-tracking";
import { toast } from "sonner";

const statusOptions = [
  { value: 'PROCESSING', label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PACKED', label: 'Packed', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200' }
];

export default function ManageOrdersClient({ initialOrders, userType }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (formData) => {
    setUpdating(true);
    const res = await updateOrderStatus(formData);
    
    if (res.success) {
      toast.success(res.message);
      setIsUpdateDialogOpen(false);
      // Refresh orders
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    
    setUpdating(false);
  };

  const openUpdateDialog = (order) => {
    setSelectedOrder(order);
    setIsUpdateDialogOpen(true);
  };

  const openViewDialog = (order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const config = statusOptions.find(s => s.value === status);
    return config ? (
      <Badge className={`${config.color} shadow-none`}>{config.label}</Badge>
    ) : (
      <Badge>{status}</Badge>
    );
  };

  const getBuyerName = (order) => {
    if (order.buyerUser.farmerProfile?.name) return order.buyerUser.farmerProfile.name;
    if (order.buyerUser.agentProfile?.name) return order.buyerUser.agentProfile.name;
    return order.buyerUser.name || order.buyerUser.email;
  };

  const getBuyerPhone = (order) => {
    if (order.buyerUser.farmerProfile?.phone) return order.buyerUser.farmerProfile.phone;
    if (order.buyerUser.agentProfile?.phone) return order.buyerUser.agentProfile.phone;
    return order.buyerPhone || 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-gray-500">Update order status and add tracking details</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500">Orders will appear here when customers purchase your products</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Order #{order.id.slice(-8).toUpperCase()}
                          {getStatusBadge(order.orderStatus)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Buyer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Buyer</p>
                          <p className="text-sm font-semibold text-gray-900">{getBuyerName(order)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Contact</p>
                          <p className="text-sm font-semibold text-gray-900">{getBuyerPhone(order)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-6">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.productName}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} {item.product.unit} @ ₹{item.priceAtPurchase}/{item.product.unit}
                            </p>
                          </div>
                          <p className="font-bold text-gray-900">
                            ₹{(item.quantity * item.priceAtPurchase).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Latest Tracking */}
                    {order.tracking && order.tracking.length > 0 && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700 font-semibold mb-2">LATEST UPDATE</p>
                        <p className="text-sm text-gray-700">{order.tracking[0].notes || 'Status updated'}</p>
                        {order.tracking[0].transportProvider && (
                          <p className="text-xs text-gray-600 mt-1">
                            Transport: {order.tracking[0].transportProvider} {order.tracking[0].vehicleNumber && `(${order.tracking[0].vehicleNumber})`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => openViewDialog(order)}
                        variant="outline" 
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        onClick={() => openUpdateDialog(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status and add tracking information for this order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <form action={handleUpdateStatus}>
              <input type="hidden" name="orderId" value={selectedOrder.id} />
              
              <div className="space-y-4 py-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" required defaultValue={selectedOrder.orderStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Update Notes</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="E.g., Package is ready for pickup..."
                    rows={3}
                  />
                </div>

                {/* Transport Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transportProvider">Transport Provider</Label>
                    <Input 
                      id="transportProvider" 
                      name="transportProvider" 
                      placeholder="E.g., DTDC, BlueDart"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input 
                      id="vehicleNumber" 
                      name="vehicleNumber" 
                      placeholder="E.g., MH12AB1234"
                    />
                  </div>
                </div>

                {/* Driver Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Driver Name</Label>
                    <Input 
                      id="driverName" 
                      name="driverName" 
                      placeholder="Driver's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Driver Phone</Label>
                    <Input 
                      id="driverPhone" 
                      name="driverPhone" 
                      placeholder="Contact number"
                    />
                  </div>
                </div>

                {/* Location & ETA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input 
                      id="currentLocation" 
                      name="currentLocation" 
                      placeholder="E.g., Mumbai Hub"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                    <Input 
                      id="estimatedDelivery" 
                      name="estimatedDelivery" 
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUpdateDialogOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updating} className="bg-green-600 hover:bg-green-700">
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="font-mono text-sm font-semibold">#{selectedOrder.id.slice(-12).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                  <Badge className="bg-green-100 text-green-700">{selectedOrder.paymentStatus}</Badge>
                </div>
              </div>

              {/* Buyer Details */}
              <div>
                <h4 className="font-semibold mb-3">Buyer Information</h4>
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Name:</span> {getBuyerName(selectedOrder)}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedOrder.buyerUser.email}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {getBuyerPhone(selectedOrder)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{item.product.productName}</p>
                        <p className="font-bold">₹{(item.quantity * item.priceAtPurchase).toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.product.unit} × ₹{item.priceAtPurchase}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking History */}
              {selectedOrder.tracking && selectedOrder.tracking.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Tracking History</h4>
                  <div className="space-y-3">
                    {selectedOrder.tracking.slice().reverse().map((track, index) => (
                      <div key={track.id} className="p-3 border-l-4 border-green-500 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">{statusOptions.find(s => s.value === track.status)?.label}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(track.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        {track.notes && <p className="text-sm text-gray-700 mt-1">{track.notes}</p>}
                        {track.transportProvider && (
                          <p className="text-xs text-gray-600 mt-1">
                            {track.transportProvider} {track.vehicleNumber && `• ${track.vehicleNumber}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

