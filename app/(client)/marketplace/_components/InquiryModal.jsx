

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Send, User, Box, Phone, Package,
  IndianRupee, Sparkles, ArrowRight, Leaf, Star,
  MapPin, Shield, Clock, CheckCircle2, AlertCircle, RotateCcw,
  Truck, ShieldCheck, Scale
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { sendSupportMessage } from "@/actions/support";
import { markInquiryAsSent } from "@/actions/special-delivery";

export default function InquiryModal({ isOpen, onClose, product, onSuccess, isSpecialDelivery = false, quantityRequested = "", sellerId = null }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(quantityRequested || "");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [isSending, setIsSending] = useState(false);

  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;

  const handleSendInquiry = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setIsSending(true);
    const fullMessage = `Inquiry regarding: ${product.productName}\n` +
      `Quantity Requested: ${quantity || 'Not specified'} ${product.unit}\n` +
      `Buyer Name: ${name}\n` +
      `------------------\n` +
      `User Message: ${message || 'No message'}`;

    try {
       // 1. If special delivery, create the request FIRST (strict sequence)
       if (isSpecialDelivery && sellerId) {
          const { createSpecialDeliveryRequest } = await import("@/actions/special-delivery");
          const createRes = await createSpecialDeliveryRequest(product.id, quantity || 1, sellerId, product.unit);
          if (!createRes.success) {
             toast.error(createRes.error || "Failed to initiate mediation.");
             setIsSending(false);
             return;
          }
       }

       // 2. Send the support message
       const res = await sendSupportMessage(fullMessage, isSpecialDelivery ? "SPECIAL_DELIVERY_MEDIATION" : "PRODUCT_INQUIRY");
       
       if (res.success) {
          // 3. Flag as inquiry sent if it was a special delivery
          if (isSpecialDelivery) {
             await markInquiryAsSent(product.id);
          }

          toast.success("Request Sent!", {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            description: isSpecialDelivery ? "Mediation initiated. Admin will review soon." : "Admin will contact the seller and get back to you."
          });
          setName("");
          setQuantity("");
          setMessage("");
          if (onSuccess) onSuccess();
          onClose();
       } else {
          toast.error(res.error || "Failed to send request.");
       }
    } catch (err) {
       console.error("Inquiry Error:", err);
       toast.error("Connection error. Try again.");
    } finally {
       setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-slate-900 p-8 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[9px] font-black uppercase px-3 py-1 rounded-full mb-1 tracking-widest">
                  Logistics Mediation
                </Badge>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none">
                  Special Delivery
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-slate-400 font-bold text-sm">
              Requesting a custom logistics quote for out-of-range delivery.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
          {/* Product Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{product.productName}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    <IndianRupee className="h-3 w-3 mr-0.5" />
                    {product.pricePerUnit}/{product.unit}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    {location || 'India'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                Your Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Box className="h-4 w-4 text-emerald-500" />
                Quantity Required
              </Label>
              <div className="relative">
                <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={`e.g. 50 ${product.unit}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                Your Message
              </Label>
              <Textarea
                placeholder="Ask about quality, delivery time, bulk pricing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all resize-none text-base"
              />
            </div>
          </div>

          {/* TRUST INDICATORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <div>
                   <p className="text-[10px] font-black text-slate-900 uppercase">Secure Mediation</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Escrow Protected</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <Scale className="h-5 w-5 text-amber-600" />
                <div>
                   <p className="text-[10px] font-black text-slate-900 uppercase">Fair Pricing</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Market Rates Only</p>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button
            onClick={handleSendInquiry}
            disabled={isSending}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold text-lg shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 rounded-2xl transition-all group"
          >
            {isSending ? (
              <span className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Send Support Request
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
            )}
          </Button>
          <p className="text-xs text-center text-gray-400 mt-3">
            Admin will mediate this conversation to ensure security
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}