

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle, CheckCircle2, XCircle, Eye, User, Phone,
  Mail, Package, Scale, FileText, CreditCard, ShieldAlert,
  ShoppingBag, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-6">
          <div className="bg-rose-100 p-3 rounded-2xl text-rose-600 shadow-sm border border-rose-200/50">
            <Scale className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dispute Management</h1>
            <p className="text-slate-500 font-medium mt-1">Review and resolve customer disputes effectively.</p>
          </div>
        </div>

        <Tabs defaultValue="open" className="space-y-8">
          <TabsList className="grid w-full md:w-[500px] grid-cols-3 h-14 items-center bg-slate-200/50 p-1.5 rounded-xl shadow-inner">
            <TabsTrigger value="open" className="h-full rounded-lg text-slate-600 font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all relative">
              Open
              {openDisputes.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {openDisputes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="h-full rounded-lg text-slate-600 font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">
              Resolved ({resolvedDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="h-full rounded-lg text-slate-600 font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">
              Rejected ({rejectedDisputes.length})
            </TabsTrigger>
          </TabsList>

          {/* OPEN DISPUTES TAB */}
          <TabsContent value="open" className="outline-none">
            {openDisputes.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
                <CardContent className="text-center py-20">
                  <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4 opacity-80" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No open disputes</h3>
                  <p className="text-slate-500 font-medium">Awesome! All disputes have been resolved.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* RESOLVED DISPUTES TAB */}
          <TabsContent value="resolved" className="outline-none">
            {resolvedDisputes.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
                <CardContent className="text-center py-20">
                  <p className="text-slate-500 font-medium">No resolved disputes yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* REJECTED DISPUTES TAB */}
          <TabsContent value="rejected" className="outline-none">
            {rejectedDisputes.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
                <CardContent className="text-center py-20">
                  <p className="text-slate-500 font-medium">No rejected disputes</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* --- BEAUTIFIED VIEW DIALOG --- */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50 border-0 shadow-2xl rounded-2xl">
          <DialogHeader className={`px-8 py-6 text-white border-b-0 m-0 ${selectedDispute?.disputeStatus === 'OPEN' ? 'bg-gradient-to-r from-rose-600 to-red-500' :
            selectedDispute?.disputeStatus === 'RESOLVED' ? 'bg-gradient-to-r from-emerald-600 to-green-500' :
              'bg-gradient-to-r from-slate-700 to-slate-600'
            }`}>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white tracking-tight">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Dispute Details
              </DialogTitle>
              <Badge className={`px-3 py-1 text-sm font-bold uppercase tracking-wider bg-white/20 text-white hover:bg-white/30 border-none shadow-none`}>
                {selectedDispute?.disputeStatus}
              </Badge>
            </div>
            <DialogDescription className="text-white/80 font-medium mt-2">
              Reported on {selectedDispute && mounted ? new Date(selectedDispute.disputeCreatedAt).toLocaleString('en-IN') : '---'}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="px-6 md:px-8 py-6 grow overflow-y-auto space-y-6 custom-scrollbar">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Info Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" /> Order Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Order ID</span>
                      <span className="font-bold text-slate-900 font-mono">#{selectedDispute.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Total Amount</span>
                      <span className="font-bold text-emerald-600">₹{selectedDispute.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Payment Status</span>
                      <span className="font-semibold text-slate-700">{selectedDispute.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Payout Status</span>
                      <span className="font-semibold text-slate-700">{selectedDispute.payoutStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Buyer Info Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Buyer Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Name</span>
                      <span className="font-bold text-slate-900">{getBuyerName(selectedDispute)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Email</span>
                      <span className="font-medium text-slate-700">{selectedDispute.buyerUser.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Phone</span>
                      <span className="font-medium text-slate-700">{getBuyerPhone(selectedDispute)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispute Reason Card */}
              <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Dispute Reason
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed bg-white p-4 rounded-lg border border-rose-100/50 shadow-sm">
                  {selectedDispute.disputeReason}
                </p>
              </div>

              {/* Order Items Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Order Items
                </h3>
                <div className="space-y-3">
                  {selectedDispute.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">{item.product.productName}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Seller: <span className="text-slate-700">{item.product.sellerType === 'farmer' ? item.product.farmer?.name : item.product.agent?.name}</span>
                        </p>
                        <Badge variant="secondary" className="mt-2 bg-white border-slate-200 text-slate-600 shadow-sm font-semibold">
                          {item.quantity} {item.product.unit} × ₹{item.priceAtPurchase}
                        </Badge>
                      </div>
                      <p className="font-black text-lg text-slate-900">₹{(item.quantity * item.priceAtPurchase).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Details (If closed) */}
              {selectedDispute.disputeStatus !== 'OPEN' && selectedDispute.disputeResolvedAt && (
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Resolution Details
                  </h3>
                  <p className="text-sm text-emerald-800 font-medium">
                    Action taken on {mounted ? new Date(selectedDispute.disputeResolvedAt).toLocaleString('en-IN') : '---'}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="px-6 md:px-8 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="font-semibold text-slate-700 border-slate-200 hover:bg-slate-50">Close window</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- BEAUTIFIED RESOLVE DIALOG --- */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col bg-white border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="px-8 py-6 bg-slate-50 border-b border-slate-100 m-0">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md">
                <ShieldAlert className="h-5 w-5" />
              </div>
              Resolve Dispute
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              Review the buyer's claim carefully and make a final binding decision.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolution Decision <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={resolution === 'RESOLVED' ? 'default' : 'outline'}
                  onClick={() => setResolution('RESOLVED')}
                  className={`h-12 font-semibold transition-all ${resolution === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md text-white border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <CheckCircle2 className={`h-4 w-4 mr-2 ${resolution === 'RESOLVED' ? 'text-white' : 'text-emerald-500'}`} />
                  Favor Buyer
                </Button>
                <Button
                  variant={resolution === 'REJECTED' ? 'default' : 'outline'}
                  onClick={() => setResolution('REJECTED')}
                  className={`h-12 font-semibold transition-all ${resolution === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700 shadow-md text-white border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <XCircle className={`h-4 w-4 mr-2 ${resolution === 'REJECTED' ? 'text-white' : 'text-rose-500'}`} />
                  Favor Seller
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="adminNotes" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Notes <span className="text-red-500">*</span></Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain the reasoning behind your decision... This will be recorded."
                rows={4}
                className="resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-slate-400"
              />
            </div>

            {/* Dynamic Consequence Box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={resolution}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border ${resolution === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
              >
                <p className={`text-sm font-bold mb-2 ${resolution === 'RESOLVED' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {resolution === 'RESOLVED' ? '✓ Favoring Buyer will:' : '✗ Favoring Seller will:'}
                </p>
                <ul className={`text-sm space-y-1.5 ml-1 ${resolution === 'RESOLVED' ? 'text-emerald-700' : 'text-rose-700'} font-medium`}>
                  {resolution === 'RESOLVED' ? (
                    <>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Cancel the payout to the seller</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Notify the buyer of successful resolution</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Notify the seller of the decision</li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div> Unfreeze the payout to the seller</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div> Notify the buyer that dispute was rejected</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div> Notify the seller of the decision</li>
                    </>
                  )}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          <DialogFooter className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={submitting}
              className="font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={submitting}
              className={`font-semibold shadow-md ${resolution === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            >
              {submitting ? (<><Loader2 className="animate-spin h-4 w-4 mr-2" /> Processing...</>) : 'Confirm Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Beautified Reusable Card
function DisputeCard({ dispute, index, getBuyerName, getBuyerPhone, onView, onResolve, status }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-[0_12px_30px_-5px_rgba(0,0,0,0.08)] hover:border-slate-200 overflow-hidden relative group">
        {/* Color accent line */}
        <div className={`absolute top-0 left-0 w-1 h-full ${status === 'open' ? 'bg-rose-500' :
          status === 'resolved' ? 'bg-emerald-500' :
            'bg-slate-400'
          }`}></div>

        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
                Order #{dispute.id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Reported {mounted ? new Date(dispute.disputeCreatedAt).toLocaleDateString('en-IN') : '---'}
              </p>
            </div>
            <Badge className={`px-2.5 py-0.5 shadow-none font-bold uppercase tracking-wider text-[10px] ${status === 'open' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-none' :
              status === 'resolved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none' :
                'bg-slate-100 text-slate-700 hover:bg-slate-200 border-none'
              }`}>
              {dispute.disputeStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Buyer Details</p>
              <p className="text-sm font-bold text-slate-800">{getBuyerName(dispute)}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{dispute.buyerUser.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Order Total</p>
              <p className="text-xl font-black text-slate-900">₹{dispute.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Dispute Reason
            </p>
            <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed">
              {dispute.disputeReason}
            </p>
          </div>

          <div className="flex gap-3 mt-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(dispute)}
              className="flex-1 h-10 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {status === 'open' && onResolve && (
              <Button
                size="sm"
                onClick={() => onResolve(dispute)}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                <Scale className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}