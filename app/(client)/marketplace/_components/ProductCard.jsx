"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Scale, IndianRupee, User, MessageCircle, Calendar, Truck, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import InquiryModal from "./InquiryModal";

export default function ProductCard({ product, index }) {
  const [showInquiry, setShowInquiry] = useState(false);

  // Data Extraction
  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;
  
  // Visuals
  const badgeColor = isFarmer ? "bg-emerald-600" : "bg-blue-600";
  const badgeText = isFarmer ? "Farmer Direct" : "Verified Trader";
  
  const harvestDate = product.harvestDate 
    ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) 
    : null;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 group bg-white rounded-xl">
        
        {/* --- 1. Image Section --- */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image 
              src={product.images[0]} 
              alt={product.productName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300 bg-gray-50 text-sm">No Image</div>
          )}
          
          {/* Badges */}
          <Badge className={`absolute top-3 left-3 ${badgeColor} text-white border-0 shadow-md px-2.5 py-0.5 text-xs font-medium z-10`}>
            {badgeText}
          </Badge>

          {/* Stock Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 flex justify-between items-end text-white">
             <div>
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Stock</p>
                <p className="text-sm font-bold flex items-center gap-1">
                   <Scale className="h-3 w-3" /> {product.availableStock} {product.unit}
                </p>
             </div>
          </div>
        </div>

        {/* --- 2. Details Section --- */}
        <CardContent className="p-4 flex-grow flex flex-col gap-2">
          
          {/* Title & Price */}
          <div className="flex justify-between items-start">
            <div>
               <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors">
                 {product.productName}
               </h3>
               <div className="flex items-center text-xs text-gray-500 mt-0.5">
                 <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                 <span className="line-clamp-1">{location || "India"}</span>
               </div>
            </div>
            <div className="text-right">
               <p className="text-xl font-extrabold text-gray-900">₹{product.pricePerUnit}</p>
               <p className="text-[10px] text-gray-400 uppercase">per {product.unit}</p>
            </div>
          </div>

          <div className="h-px bg-gray-50 w-full my-2" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
             <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded">
                <Truck className="h-3.5 w-3.5 text-blue-500" />
                <span className="truncate">Min: {product.minOrderQuantity || "1"} {product.unit}</span>
             </div>
             <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>{harvestDate || "N/A"}</span>
             </div>
          </div>

          {/* Seller */}
          <div className="mt-auto pt-3 flex items-center gap-2">
             <div className={`p-1 rounded-full ${isFarmer ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
               <User className="h-3 w-3" />
             </div>
             <span className="text-xs font-medium text-gray-600 truncate">{sellerName}</span>
          </div>
        </CardContent>

        {/* --- 3. Action Buttons --- */}
        <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-3">
          
          <Button 
            variant="outline" 
            onClick={() => setShowInquiry(true)}
            className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 h-10 text-sm font-semibold"
          >
             <MessageCircle className="h-4 w-4 mr-1.5" /> Chat
          </Button>

          <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 text-sm font-semibold shadow-md">
            <Link href={`/marketplace/product/${product.id}`}>
                Buy Now
            </Link>
          </Button>

        </CardFooter>
      </Card>
    </motion.div>

    <InquiryModal 
        isOpen={showInquiry} 
        onClose={() => setShowInquiry(false)} 
        product={product} 
    />
    </>
  );
}