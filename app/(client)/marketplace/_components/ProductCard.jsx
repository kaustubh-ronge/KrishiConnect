

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Scale, User, MessageCircle, ImageIcon,
  Calendar, Truck, Star, Heart, Eye, ShoppingCart,
  Leaf, Award, Zap, Flame, BadgeCheck,
  Navigation
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import InquiryModal from "./InquiryModal";

export default function ProductCard({ product, index }) {
  const [showInquiry, setShowInquiry] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;

  const themeGradient = isFarmer
    ? "from-emerald-500 to-green-600"
    : "from-blue-500 to-indigo-600";
  const themeColor = isFarmer ? "emerald" : "blue";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const harvestDate = (product.harvestDate && mounted)
    ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full"
      >
        <Card className="group h-full flex flex-col overflow-hidden border-2 border-gray-100 bg-white/80 backdrop-blur-sm hover:border-emerald-200 transition-all duration-500 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1">

          {/* Image Section */}
          <div className="relative h-52 w-full bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[0]}
                  alt={product.productName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">No Image Available</p>
                </div>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              <Badge className={`bg-gradient-to-r ${themeGradient} text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold`}>
                <Leaf className="h-3 w-3 mr-1" />
                {isFarmer ? "Farm Fresh" : "Verified"}
              </Badge>
              {product.availableStock === 1 && (
                <Badge className="bg-red-600 text-white border-0 shadow-lg px-3 py-1 text-xs font-black animate-bounce">
                  <Flame className="h-3 w-3 mr-1" />
                  LAST ITEM
                </Badge>
              )}
              {product.availableStock > 1 && product.availableStock <= 10 && (
                <Badge className="bg-orange-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  Only {product.availableStock} Left
                </Badge>
              )}
              {product.availableStock <= 0 && (
                <Badge className="bg-gray-800 text-white border-0 shadow-lg px-3 py-1 text-xs font-black">
                  SOLD OUT
                </Badge>
              )}
            </div>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className={`absolute top-3 right-3 z-10 p-2 rounded-xl backdrop-blur-sm transition-all ${isLiked
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/80 text-gray-700 hover:bg-white opacity-0 group-hover:opacity-100'
                }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-white' : ''}`} />
            </motion.button>

            {/* Stock Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-medium opacity-80">Available</p>
                <p className="text-sm font-bold">{product.availableStock} {product.unit}</p>
              </div>
              <Badge className={product.availableStock > 0 ? 'bg-green-500' : 'bg-red-500'}>
                {product.availableStock > 0 ? 'In Stock' : 'Sold Out'}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="p-5 grow space-y-3">
            {/* Title & Price */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {product.productName}
                </h3>
                <div className="flex items-center gap-2 mb-2 mt-1">
                  {isFarmer ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                      <Leaf className="h-3 w-3 mr-1" /> Farm
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                      <BadgeCheck className="h-3 w-3 mr-1" /> Trader
                    </Badge>
                  )}
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                    {product.category || "General"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="line-clamp-1">{location || "India"}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-gray-900">₹{product.pricePerUnit}</p>
                <p className="text-[10px] text-gray-400 uppercase font-medium">per {product.unit}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">{product.averageRating || 'New'}</span>
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600">
                <Truck className="h-3.5 w-3.5 text-blue-500" />
                <span>Min: {product.minOrderQuantity || 1}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600">
                <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                <span>₹{isFarmer ? (product.farmer?.deliveryPricePerKm || 10) : (product.agent?.deliveryPricePerKm || 10)}/km</span>
              </div>
              {product.deliveryCharge === 0 && (
                <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Free Delivery</span>
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <div className={`p-1.5 rounded-full ${isFarmer ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-gray-600 truncate flex-1">{sellerName}</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-2">
                <Award className="h-3 w-3 mr-0.5" /> Verified
              </Badge>
            </div>
          </CardContent>

          {/* Action Buttons */}
          <CardFooter className="p-5 pt-0 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowInquiry(true)}
              className={`w-full border-2 ${isFarmer ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'} h-11 text-sm font-semibold rounded-xl transition-all`}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" /> Inquiry
            </Button>

            <Button
              asChild
              className={`w-full bg-gradient-to-r ${themeGradient} hover:shadow-lg text-white h-11 text-sm font-semibold rounded-xl transition-all group/btn`}
            >
              <Link href={`/marketplace/product/${product.id}`} className="flex items-center justify-center gap-1.5">
                <Eye className="h-4 w-4" /> View Details
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