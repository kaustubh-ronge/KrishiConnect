"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, XCircle, Eye, User, Phone, Mail, Package } from "lucide-react";
import { motion } from "framer-motion";
import { resolveDispute } from "@/actions/disputes";
import { toast } from "sonner";

export default function DisputesClient({ initialDisputes }) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState("RESOLVED");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openViewDialog = (dispute) => {
    setSelectedDispute(dispute);
    setViewDialogOpen(true);
  };

  const openResolveDialog = (dispute) => {
    setSelectedDispute(dispute);
    setResolveDialogOpen(true);
    setResolution("RESOLVED");
    setAdminNotes("");
  };

  const handleResolve = async () => {
    if (!adminNotes.trim()) {
      toast.error("Please provide admin notes");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('orderId', selectedDispute.id);
    formData.append('resolution', resolution);
    formData.append('adminNotes', adminNotes);

    const res = await resolveDispute(formData);
    
    if (res.success) {
      toast.success(res.message);
      setResolveDialogOpen(false);
      // Reload page
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    
    setSubmitting(false);
  };

  const openDisputes = disputes.filter(d => d.disputeStatus === 'OPEN');
  const resolvedDisputes = disputes.filter(d => d.disputeStatus === 'RESOLVED');
  const rejectedDisputes = disputes.filter(d => d.disputeStatus === 'REJECTED');

  const getBuyerName = (dispute) => {
    if (dispute.buyerUser.farmerProfile?.name) return dispute.buyerUser.farmerProfile.name;
    if (dispute.buyerUser.agentProfile?.name) return dispute.buyerUser.agentProfile.name;
    return dispute.buyerUser.name || dispute.buyerUser.email;
  };

  const getBuyerPhone = (dispute) => {
    if (dispute.buyerUser.farmerProfile?.phone) return dispute.buyerUser.farmerProfile.phone;
    if (dispute.buyerUser.agentProfile?.phone) return dispute.buyerUser.agentProfile.phone;
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
            <p className="text-gray-500">Review and resolve customer disputes</p>
          </div>
        </div>

        <Tabs defaultValue="open" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="open" className="relative">
              Open
              {openDisputes.length > 0 && (
                <Badge className="ml-2 bg-red-500 hover:bg-red-600">{openDisputes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedDisputes.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedDisputes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {openDisputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No open disputes</h3>
                  <p className="text-gray-500">All disputes have been resolved</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {openDisputes.map((dispute, index) => (
                  <DisputeCard 
                    key={dispute.id} 
                    dispute={dispute} 
                    index={index}
                    getBuyerName={getBuyerName}
                    getBuyerPhone={getBuyerPhone}
                    onView={openViewDialog}
                    onResolve={openResolveDialog}
                    status="open"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            {resolvedDisputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <p className="text-gray-500">No resolved disputes yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resolvedDisputes.map((dispute, index) => (
                  <DisputeCard 
                    key={dispute.id} 
                    dispute={dispute} 
                    index={index}
                    getBuyerName={getBuyerName}
                    getBuyerPhone={getBuyerPhone}
                    onView={openViewDialog}
                    status="resolved"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedDisputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <p className="text-gray-500">No rejected disputes</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedDisputes.map((dispute, index) => (
                  <DisputeCard 
                    key={dispute.id} 
                    dispute={dispute} 
                    index={index}
                    getBuyerName={getBuyerName}
                    getBuyerPhone={getBuyerPhone}
                    onView={openViewDialog}
                    status="rejected"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Badge className={
                  selectedDispute.disputeStatus === 'OPEN' ? 'bg-red-100 text-red-700 border-red-200' :
                  selectedDispute.disputeStatus === 'RESOLVED' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }>
                  {selectedDispute.disputeStatus}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {new Date(selectedDispute.disputeCreatedAt).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Order ID:</strong> #{selectedDispute.id.slice(-8).toUpperCase()}</p>
                  <p><strong>Total Amount:</strong> ₹{selectedDispute.totalAmount.toFixed(2)}</p>
                  <p><strong>Payment Status:</strong> {selectedDispute.paymentStatus}</p>
                  <p><strong>Payout Status:</strong> {selectedDispute.payoutStatus}</p>
                </CardContent>
              </Card>

              {/* Buyer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Buyer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Name:</strong> {getBuyerName(selectedDispute)}</p>
                  <p><strong>Email:</strong> {selectedDispute.buyerUser.email}</p>
                  <p><strong>Phone:</strong> {getBuyerPhone(selectedDispute)}</p>
                </CardContent>
              </Card>

              {/* Dispute Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dispute Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedDispute.disputeReason}</p>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDispute.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product.productName}</p>
                        <p className="text-sm text-gray-600">
                          Seller: {item.product.sellerType === 'farmer' 
                            ? item.product.farmer?.name 
                            : item.product.agent?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.product.unit} × ₹{item.priceAtPurchase}
                        </p>
                      </div>
                      <p className="font-bold">₹{(item.quantity * item.priceAtPurchase).toFixed(2)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selectedDispute.disputeStatus !== 'OPEN' && selectedDispute.disputeResolvedAt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">
                      Resolved on {new Date(selectedDispute.disputeResolvedAt).toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute and make a decision
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Decision *</Label>
              <div className="flex gap-3">
                <Button
                  variant={resolution === 'RESOLVED' ? 'default' : 'outline'}
                  onClick={() => setResolution('RESOLVED')}
                  className={resolution === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve (Buyer Favor)
                </Button>
                <Button
                  variant={resolution === 'REJECTED' ? 'default' : 'outline'}
                  onClick={() => setResolution('REJECTED')}
                  className={resolution === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject (Seller Favor)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes *</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain your decision and any actions taken..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className={`p-4 rounded-lg ${resolution === 'RESOLVED' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-sm font-medium mb-2">
                {resolution === 'RESOLVED' ? '✓ Resolving in buyer favor will:' : '✗ Rejecting will:'}
              </p>
              <ul className="text-sm space-y-1 ml-4">
                {resolution === 'RESOLVED' ? (
                  <>
                    <li>• Cancel the payout to the seller</li>
                    <li>• Notify the buyer of successful resolution</li>
                    <li>• Notify the seller of the decision</li>
                  </>
                ) : (
                  <>
                    <li>• Unfreeze the payout to the seller</li>
                    <li>• Notify the buyer that dispute was rejected</li>
                    <li>• Notify the seller of the decision</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={submitting}
              className={resolution === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? 'Processing...' : 'Confirm Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DisputeCard({ dispute, index, getBuyerName, getBuyerPhone, onView, onResolve, status }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Order #{dispute.id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-500">
                Reported {new Date(dispute.disputeCreatedAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <Badge className={
              status === 'open' ? 'bg-red-100 text-red-700 border-red-200' :
              status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }>
              {dispute.disputeStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Buyer</p>
              <p className="text-sm font-medium">{getBuyerName(dispute)}</p>
              <p className="text-xs text-gray-500">{dispute.buyerUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Order Total</p>
              <p className="text-lg font-bold text-gray-900">₹{dispute.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Reason:</strong> {dispute.disputeReason}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(dispute)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {status === 'open' && onResolve && (
              <Button
                size="sm"
                onClick={() => onResolve(dispute)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Resolve Dispute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

