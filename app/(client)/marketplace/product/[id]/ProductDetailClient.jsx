"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, MapPin, Phone, Calendar, Scale, Info, 
  MessageCircle, ShieldCheck, Truck, User, Star, CheckCircle2
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import InquiryModal from "../../_components/InquiryModal"; // Import the shared modal

export default function ProductDetailClient({ product }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [showInquiry, setShowInquiry] = useState(false); // State for modal

  // Determine Seller Info based on type
  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;
  
  // Theme
  const themeColor = isFarmer ? "text-green-600" : "text-blue-600";
  const bgColor = isFarmer ? "bg-green-600" : "bg-blue-600";
  const hoverColor = isFarmer ? "hover:bg-green-700" : "hover:bg-blue-700";
  const lightBg = isFarmer ? "bg-green-50" : "bg-blue-50";

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb / Back */}
        <nav className="flex items-center gap-2 mb-8 text-sm text-gray-500">
            <button onClick={() => router.push('/marketplace')} className="hover:text-gray-900 transition-colors">Marketplace</button>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.productName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Images (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-200 group"
            >
              {activeImage ? (
                <Image src={activeImage} alt={product.productName} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">No Image</div>
              )}
              <Badge className={`absolute top-4 left-4 ${bgColor} text-white border-0 px-3 py-1 text-sm shadow-md z-10`}>
                {isFarmer ? "Farm Fresh" : "Trader Stock"}
              </Badge>
            </motion.div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === img ? `border-${isFarmer ? 'green' : 'blue'}-600 shadow-md scale-105` : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <Image src={img} alt="thumb" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description & Specs (Mobile/Desktop) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Product Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                    {product.description || "No detailed description provided by the seller."}
                </p>
                
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
                    <StatItem label="Shelf Life" value={product.shelfLife || "N/A"} icon={Info} />
                    <StatItem label="Harvested" value={product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "N/A"} icon={Calendar} />
                    <StatItem label="Grade" value={product.qualityGrade || "Standard"} icon={CheckCircle2} />
                    <StatItem label="Min Order" value={product.minOrderQuantity ? `${product.minOrderQuantity} ${product.unit}` : "N/A"} icon={Truck} />
                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Purchase Card (Span 5, Sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
                <Card className="border-gray-200 shadow-xl overflow-hidden rounded-3xl bg-white">
                    <div className="p-8">
                        
                        {/* Title & Price */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.productName}</h1>
                            <div className="flex items-end gap-2">
                                <p className={`text-4xl font-black ${themeColor}`}>₹{product.pricePerUnit}</p>
                                <span className="text-gray-500 text-lg font-medium mb-1">/ {product.unit}</span>
                            </div>
                        </div>

                        {/* Stock Status */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Available Stock</p>
                                    <p className="text-gray-900 font-bold text-lg">{product.availableStock} {product.unit}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
                        </div>

                        {/* Variety Tags */}
                        {product.variety && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {product.variety.split(',').map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {/* 1. Chat Button (Triggers Modal) */}
                            <Button 
                                onClick={() => setShowInquiry(true)} 
                                className={`w-full ${lightBg} ${themeColor} hover:opacity-90 h-14 text-lg font-semibold shadow-sm border border-transparent hover:border-${isFarmer ? 'green' : 'blue'}-200`}
                            >
                                <MessageCircle className="mr-2 h-5 w-5" /> Chat / Inquiry
                            </Button>
                            
                            {/* 2. Buy Button */}
                            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-lg font-bold shadow-lg shadow-gray-200">
                                Buy Now
                            </Button>
                        </div>
                        
                        <p className="text-center text-xs text-gray-400 mt-4">Secure transaction via KrishiConnect Escrow</p>
                    </div>

                    {/* Seller Info Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${bgColor}`}>
                                {sellerName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Sold by</p>
                                <p className="font-bold text-gray-900 text-lg leading-tight">{sellerName}</p>
                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                    <MapPin className="h-3.5 w-3.5 mr-1" /> {location || "India"}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200 justify-center">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span>Identity Verified & Bank Account Linked</span>
                        </div>
                    </div>
                </Card>
            </div>
          </div>
        </div>

      </div>

      {/* Reusing the Global Inquiry Modal */}
      <InquiryModal 
        isOpen={showInquiry} 
        onClose={() => setShowInquiry(false)} 
        product={product} 
      />
    </div>
  );
}

function StatItem({ label, value, icon: Icon }) {
    return (
        <div className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    )
}