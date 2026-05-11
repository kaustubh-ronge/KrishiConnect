

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
  MapPin, Shield, Clock, CheckCircle2, AlertCircle, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { sendSupportMessage } from "@/actions/support";

export default function InquiryModal({ isOpen, onClose, product, onSuccess }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
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
       const res = await sendSupportMessage(fullMessage, "PRODUCT_INQUIRY");
       if (res.success) {
          toast.success("Request Sent!", {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            description: "Admin will contact the seller and get back to you."
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
        <div className="relative bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl"
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Contact Support
                </DialogTitle>
                <DialogDescription className="text-green-100 mt-1">
                  Request product info through platform admin
                </DialogDescription>
              </div>
            </div>
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

          {/* Seller Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {sellerName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900">{sellerName}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>Verified Seller</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>Usually responds in 2hrs</span>
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