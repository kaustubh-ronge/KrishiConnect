"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; 
import { ArrowLeft, MapPin, Scale, Info, MessageCircle, ShieldCheck, Truck, User, Calendar, ShoppingCart, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import InquiryModal from "../../_components/InquiryModal";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

export default function ProductDetailClient({ product }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [showInquiry, setShowInquiry] = useState(false);
  
  // --- QUANTITY STATE ---
  const [qty, setQty] = useState(product.minOrderQuantity || 1);
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem } = useCartStore();

  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;
  const themeColor = isFarmer ? "text-green-600" : "text-blue-600";
  const bgColor = isFarmer ? "bg-green-600" : "bg-blue-600";
  const lightBg = isFarmer ? "bg-green-50" : "bg-blue-50";

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (qty > product.availableStock) {
        toast.error(`Only ${product.availableStock} ${product.unit} available.`);
        return;
    }
    if (qty < (product.minOrderQuantity || 1)) {
        toast.error(`Minimum order is ${product.minOrderQuantity} ${product.unit}`);
        return;
    }
    
    setIsAdding(true);
    const success = await addItem(product.id, parseFloat(qty));
    setIsAdding(false);

    if (success) {
        router.push('/cart'); // Redirect to Cart Page
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 pl-0 hover:bg-transparent hover:text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Images */}
          <div className="lg:col-span-7 space-y-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-200">
               {activeImage && <Image src={activeImage} alt="Product" fill className="object-cover" />}
               <Badge className={`absolute top-4 left-4 ${bgColor} text-white border-0 px-3 py-1`}>{isFarmer ? "Farm Fresh" : "Trader Stock"}</Badge>
             </motion.div>
             {/* Description Card */}
             <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
                {/* Stats Grid */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
                    <StatItem label="Shelf Life" value={product.shelfLife || "N/A"} icon={Info} />
                    <StatItem label="Harvested" value={product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "N/A"} icon={Calendar} />
                    <StatItem label="Grade" value={product.qualityGrade || "Standard"} icon={CheckCircle2} />
                    <StatItem label="Min Order" value={`${product.minOrderQuantity || 1} ${product.unit}`} icon={Truck} />
                </div>
             </div>
          </div>

          {/* Right: Purchase Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
                <Card className="border-gray-200 shadow-xl overflow-hidden rounded-3xl bg-white p-8 space-y-6">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.productName}</h1>
                        <div className="flex items-end gap-2">
                            <p className={`text-4xl font-black ${themeColor}`}>₹{product.pricePerUnit}</p>
                            <span className="text-gray-500 text-lg font-medium mb-1">/ {product.unit}</span>
                        </div>
                    </div>

                    {/* Stock Display */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Scale className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Available Stock</p>
                                <p className="text-gray-900 font-bold text-lg">{product.availableStock} {product.unit}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
                    </div>

                    {/* --- QUANTITY SELECTOR (User Requirement: Show Unit) --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Select Quantity ({product.unit})</label>
                        <div className="flex gap-4">
                            <Input 
                                type="number" 
                                value={qty} 
                                onChange={(e) => setQty(e.target.value)}
                                min={product.minOrderQuantity || 1}
                                max={product.availableStock}
                                className="h-12 text-lg font-medium w-32 bg-gray-50"
                            />
                            <div className="flex flex-col justify-center">
                                <p className="text-sm text-gray-500">Total Price</p>
                                {(() => {
                                    const deliveryForThis = product.deliveryChargeType === 'per_unit' ? (qty * (product.deliveryCharge || 0)) : (product.deliveryCharge || 0);
                                    const totalPrice = (qty * product.pricePerUnit) + deliveryForThis;
                                    return (
                                        <>
                                            <p className="text-lg font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">{product.deliveryCharge ? (product.deliveryChargeType === 'per_unit' ? `Delivery: ₹${product.deliveryCharge} / ${product.unit}` : `Delivery (flat): ₹${product.deliveryCharge}`) : 'Free Delivery'}</p>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <Button 
                            onClick={handleAddToCart}
                            disabled={product.availableStock <= 0 || isAdding}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-lg font-bold shadow-lg"
                        >
                            {isAdding ? (
                                "Adding..." 
                            ) : (
                                <>
                                   <ShoppingCart className="mr-2 h-5 w-5" /> 
                                   {product.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => setShowInquiry(true)} 
                            className={`w-full h-12 text-base font-semibold border-${isFarmer ? 'green' : 'blue'}-200 text-${isFarmer ? 'green' : 'blue'}-700`}
                        >
                            <MessageCircle className="mr-2 h-5 w-5" /> Chat with Seller
                        </Button>
                    </div>

                    {/* Seller Info */}
                    <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${bgColor}`}>{sellerName?.charAt(0)}</div>
                        <div>
                            <p className="text-sm text-gray-500">Sold by <span className="font-bold text-gray-900">{sellerName}</span></p>
                            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {location || "India"} (Verified)</p>
                        </div>
                    </div>

                </Card>
            </div>
          </div>
        </div>
      </div>
      <InquiryModal isOpen={showInquiry} onClose={() => setShowInquiry(false)} product={product} />
    </div>
  );
}

function StatItem({ label, value, icon: Icon }) {
    return (
        <div className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Icon className="h-5 w-5" /></div>
            <div><p className="text-xs text-gray-400 uppercase font-medium">{label}</p><p className="font-semibold text-gray-900">{value}</p></div>
        </div>
    )
}