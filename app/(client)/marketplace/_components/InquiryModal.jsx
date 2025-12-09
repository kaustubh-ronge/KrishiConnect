"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, User, Box } from "lucide-react";
import { toast } from "sonner";

export default function InquiryModal({ isOpen, onClose, product }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  // --- SMART WHATSAPP REDIRECT ---
  const handleSendInquiry = () => {
    // 1. Get Seller Phone
    const isFarmer = product.sellerType === 'farmer';
    const seller = isFarmer ? product.farmer : product.agent;
    // Use specific product contact or fallback to profile phone
    const phone = product.whatsappNumber || seller?.phone;

    if (!phone) {
      toast.error("Seller contact number not available.");
      return;
    }

    // 2. Format Message
    const text = `*New Inquiry from KrishiConnect* 🌱\n\n` +
                 `*Product:* ${product.productName}\n` +
                 `*Listed Price:* ₹${product.pricePerUnit}/${product.unit}\n` +
                 `--------------------------\n` +
                 `*Buyer Name:* ${name}\n` +
                 `*Interested Qty:* ${quantity}\n` +
                 `*Note:* ${message}\n\n` +
                 `Is this stock available?`;

    // 3. Detect Device & Open WhatsApp
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(text);
    
    // Check width to guess desktop vs mobile
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
    
    const url = isDesktop 
        ? `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`
        : `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;

    window.open(url, '_blank');
    onClose(); // Close modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <MessageCircle className="h-5 w-5" /> Inquiry for {product.productName}
          </DialogTitle>
          <DialogDescription>
            Send a direct message to the seller via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input placeholder="e.g. Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Quantity Required</Label>
            <Input placeholder={`e.g. 50 ${product.unit}`} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea placeholder="Ask about quality, delivery..." value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSendInquiry} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-lg h-12">
            <Send className="h-5 w-5 mr-2" /> Send on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}