// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input"; 
// import { ArrowLeft, MapPin, Scale, Info, MessageCircle, ShieldCheck, Truck, User, Calendar, ShoppingCart, CheckCircle2 } from "lucide-react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import InquiryModal from "../../../_components/InquiryModal";
// import { useCartStore } from "@/store/useCartStore";
// import { toast } from "sonner";
// import { trackProductView } from "@/actions/products-enhanced";

// export default function ProductDetailClient({ product }) {
//   const router = useRouter();
//   const [activeImage, setActiveImage] = useState(product.images[0]);
//   const [showInquiry, setShowInquiry] = useState(false);

//   // --- QUANTITY STATE ---
//   const [qty, setQty] = useState(product.minOrderQuantity || 1);
//   const [isAdding, setIsAdding] = useState(false);

//   const { addItem } = useCartStore();

//   // Track product view
//   useEffect(() => {
//     trackProductView(product.id);
//   }, [product.id]);

//   const isFarmer = product.sellerType === 'farmer';
//   const seller = isFarmer ? product.farmer : product.agent;
//   const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
//   const location = isFarmer ? seller?.address : seller?.region;
//   const themeColor = isFarmer ? "text-green-600" : "text-blue-600";
//   const bgColor = isFarmer ? "bg-green-600" : "bg-blue-600";
//   const lightBg = isFarmer ? "bg-green-50" : "bg-blue-50";

//   // Handle Add to Cart
//   const handleAddToCart = async () => {
//     if (qty > product.availableStock) {
//         toast.error(`Only ${product.availableStock} ${product.unit} available.`);
//         return;
//     }
//     if (qty < (product.minOrderQuantity || 1)) {
//         toast.error(`Minimum order is ${product.minOrderQuantity} ${product.unit}`);
//         return;
//     }

//     setIsAdding(true);
//     const success = await addItem(product.id, parseFloat(qty));
//     setIsAdding(false);

//     if (success) {
//         router.push('/cart'); // Redirect to Cart Page
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/50 py-8 px-4 pb-20">
//       <div className="max-w-7xl mx-auto">

//         {/* Back Button */}
//         <Button variant="ghost" onClick={() => router.back()} className="mb-6 pl-0 hover:bg-transparent hover:text-green-700">
//             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
//         </Button>

//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

//           {/* Left: Images */}
//           <div className="lg:col-span-7 space-y-6">
//              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-200">
//                {activeImage && <Image src={activeImage} alt="Product" fill className="object-cover" />}
//                <Badge className={`absolute top-4 left-4 ${bgColor} text-white border-0 px-3 py-1`}>{isFarmer ? "Farm Fresh" : "Trader Stock"}</Badge>
//              </motion.div>
//              {/* Description Card */}
//              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
//                 <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
//                 <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
//                 {/* Stats Grid */}
//                 <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-100">
//                     <StatItem label="Shelf Life" value={product.shelfLife || "N/A"} icon={Info} />
//                     <StatItem label="Harvested" value={product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "N/A"} icon={Calendar} />
//                     <StatItem label="Grade" value={product.qualityGrade || "Standard"} icon={CheckCircle2} />
//                     <StatItem label="Min Order" value={`${product.minOrderQuantity || 1} ${product.unit}`} icon={Truck} />
//                 </div>
//              </div>
//           </div>

//           {/* Right: Purchase Card */}
//           <div className="lg:col-span-5">
//             <div className="sticky top-24">
//                 <Card className="border-gray-200 shadow-xl overflow-hidden rounded-3xl bg-white p-8 space-y-6">

//                     {/* Header */}
//                     <div>
//                         <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.productName}</h1>
//                         <div className="flex items-end gap-2">
//                             <p className={`text-4xl font-black ${themeColor}`}>₹{product.pricePerUnit}</p>
//                             <span className="text-gray-500 text-lg font-medium mb-1">/ {product.unit}</span>
//                         </div>
//                     </div>

//                     {/* Stock Display */}
//                     <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                             <Scale className="h-5 w-5 text-blue-600" />
//                             <div>
//                                 <p className="text-xs text-gray-500 uppercase font-semibold">Available Stock</p>
//                                 <p className="text-gray-900 font-bold text-lg">{product.availableStock} {product.unit}</p>
//                             </div>
//                         </div>
//                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
//                     </div>

//                     {/* --- QUANTITY SELECTOR (User Requirement: Show Unit) --- */}
//                     <div className="space-y-2">
//                         <label className="text-sm font-semibold text-gray-700">Select Quantity ({product.unit})</label>
//                         <div className="flex gap-4">
//                             <Input 
//                                 type="number" 
//                                 value={qty} 
//                                 onChange={(e) => setQty(e.target.value)}
//                                 min={product.minOrderQuantity || 1}
//                                 max={product.availableStock}
//                                 className="h-12 text-lg font-medium w-32 bg-gray-50"
//                             />
//                             <div className="flex flex-col justify-center">
//                                 <p className="text-sm text-gray-500">Total Price</p>
//                                 {(() => {
//                                     const deliveryForThis = product.deliveryChargeType === 'per_unit' ? (qty * (product.deliveryCharge || 0)) : (product.deliveryCharge || 0);
//                                     const totalPrice = (qty * product.pricePerUnit) + deliveryForThis;
//                                     return (
//                                         <>
//                                             <p className="text-lg font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
//                                             <p className="text-xs text-gray-500">{product.deliveryCharge ? (product.deliveryChargeType === 'per_unit' ? `Delivery: ₹${product.deliveryCharge} / ${product.unit}` : `Delivery (flat): ₹${product.deliveryCharge}`) : 'Free Delivery'}</p>
//                                         </>
//                                     )
//                                 })()}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="flex flex-col gap-3 pt-2">
//                         <Button 
//                             onClick={handleAddToCart}
//                             disabled={product.availableStock <= 0 || isAdding}
//                             className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-lg font-bold shadow-lg"
//                         >
//                             {isAdding ? (
//                                 "Adding..." 
//                             ) : (
//                                 <>
//                                    <ShoppingCart className="mr-2 h-5 w-5" /> 
//                                    {product.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
//                                 </>
//                             )}
//                         </Button>
//                         <Button 
//                             variant="outline"
//                             onClick={() => setShowInquiry(true)} 
//                             className={`w-full h-12 text-base font-semibold border-${isFarmer ? 'green' : 'blue'}-200 text-${isFarmer ? 'green' : 'blue'}-700`}
//                         >
//                             <MessageCircle className="mr-2 h-5 w-5" /> Chat with Seller
//                         </Button>
//                     </div>

//                     {/* Seller Info */}
//                     <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
//                         <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${bgColor}`}>{sellerName?.charAt(0)}</div>
//                         <div>
//                             <p className="text-sm text-gray-500">Sold by <span className="font-bold text-gray-900">{sellerName}</span></p>
//                             <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {location || "India"} (Verified)</p>
//                         </div>
//                     </div>

//                 </Card>
//             </div>
//           </div>
//         </div>
//       </div>
//       <InquiryModal isOpen={showInquiry} onClose={() => setShowInquiry(false)} product={product} />
//     </div>
//   );
// }

// function StatItem({ label, value, icon: Icon }) {
//     return (
//         <div className="flex items-start gap-3">
//             <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Icon className="h-5 w-5" /></div>
//             <div><p className="text-xs text-gray-400 uppercase font-medium">{label}</p><p className="font-semibold text-gray-900">{value}</p></div>
//         </div>
//     )
// }


"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, Scale, Info, MessageCircle, ShieldCheck,
  Truck, User, Calendar, ShoppingCart, CheckCircle2, Heart,
  Share2, Star, Award, Clock, Package, Leaf, Sparkles,
  ChevronRight, Minus, Plus, RotateCcw, Zap, TrendingUp,
  Verified, Phone, Navigation, IndianRupee, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import InquiryModal from "../../../_components/InquiryModal";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { trackProductView } from "@/actions/products-enhanced";

export default function ProductDetailClient({ product, userRole }) {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [showInquiry, setShowInquiry] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // --- QUANTITY STATE ---
  const [qty, setQty] = useState(product.minOrderQuantity || 1);
  const [isAdding, setIsAdding] = useState(false);

  const { addItem } = useCartStore();

  // Track product view
  useEffect(() => {
    trackProductView(product.id);
  }, [product.id]);

  const isFarmer = product.sellerType === 'farmer';
  const seller = isFarmer ? product.farmer : product.agent;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);
  const location = isFarmer ? seller?.address : seller?.region;
  const themeColor = isFarmer ? "emerald" : "blue";
  const themeGradient = isFarmer
    ? "from-emerald-500 to-green-600"
    : "from-blue-500 to-indigo-600";
  const themeLightBg = isFarmer ? "bg-emerald-50" : "bg-blue-50";
  const themeLightText = isFarmer ? "text-emerald-700" : "text-blue-700";
  const themeBorder = isFarmer ? "border-emerald-200" : "border-blue-200";

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (qty > product.availableStock) {
      toast.error(`Only ${product.availableStock} ${product.unit} available.`, {
        icon: <AlertCircle className="h-5 w-5" />,
      });
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
      router.push('/cart');
    }
  };

  const deliveryCost = product.deliveryChargeType === 'per_unit'
    ? qty * (product.deliveryCharge || 0)
    : (product.deliveryCharge || 0);
  const totalPrice = (qty * product.pricePerUnit) + deliveryCost;

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-gray-50 via-emerald-50/30 to-teal-50/40">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-125 h-125 bg-linear-to-br from-emerald-300/10 to-green-400/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-blue-300/10 to-indigo-400/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative py-8 px-4 pb-20 max-w-7xl mx-auto">

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="group text-gray-600 hover:text-emerald-700 pl-0 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Marketplace
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Images Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Main Image */}
              <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-white shadow-2xl border-2 border-gray-100 group">
                {activeImage && (
                  <Image
                    src={activeImage}
                    alt={product.productName}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}

                {/* Image Overlay Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={`bg-linear-to-r ${themeGradient} text-white border-0 px-4 py-2 shadow-lg text-sm font-semibold`}>
                    <Leaf className="h-4 w-4 mr-1.5" />
                    {isFarmer ? "Farm Fresh" : "Verified Stock"}
                  </Badge>
                  {product.availableStock <= 10 && product.availableStock > 0 && (
                    <Badge className="bg-orange-500 text-white border-0 px-4 py-2 shadow-lg animate-pulse">
                      <Zap className="h-4 w-4 mr-1.5" />
                      Low Stock
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2.5 rounded-xl backdrop-blur-sm transition-all ${isLiked
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/80 text-gray-700 hover:bg-white'
                      }`}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-white' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-all shadow-lg"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Stock Indicator Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-80">Available Stock</p>
                      <p className="text-2xl font-bold">{product.availableStock} <span className="text-lg">{product.unit}</span></p>
                    </div>
                    <Badge className={`${product.availableStock > 0 ? 'bg-green-500' : 'bg-red-500'} text-white border-0`}>
                      {product.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Image Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                  {product.images.map((img, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveImage(img)}
                      className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img
                          ? `border-${themeColor}-500 shadow-lg shadow-${themeColor}-500/25 ring-2 ring-${themeColor}-300`
                          : 'border-gray-200 hover:border-gray-400'
                        }`}
                    >
                      <Image src={img} alt={`${product.productName} ${idx + 1}`} fill className="object-cover" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-gray-100 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
                  <Info className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
                  <p className="text-sm text-gray-500">All information about this listing</p>
                </div>
              </div>

              {/* Description */}
              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                  {product.description || "No description provided for this product."}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem
                  label="Shelf Life"
                  value={product.shelfLife || "N/A"}
                  icon={Clock}
                  color="orange"
                />
                <StatItem
                  label="Harvest Date"
                  value={product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                  icon={Calendar}
                  color="green"
                />
                <StatItem
                  label="Quality Grade"
                  value={product.qualityGrade || "Standard"}
                  icon={Award}
                  color="purple"
                />
                <StatItem
                  label="Min Order"
                  value={`${product.minOrderQuantity || 1} ${product.unit}`}
                  icon={Package}
                  color="blue"
                />
              </div>

              {/* Tags */}
              {product.variety && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Variety & Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.variety.split(", ").map((tag, idx) => (
                        <Badge
                          key={idx}
                          className="bg-linear-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-sm font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Right: Purchase Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-24"
            >
              <Card className="relative overflow-hidden border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl">
                {/* Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${themeGradient}`} />

                <div className="p-8 space-y-6">
                  {/* Product Title & Price */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {isFarmer ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Leaf className="h-3 w-3 mr-1" /> Direct from Farm
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Verified className="h-3 w-3 mr-1" /> Verified Trader
                        </Badge>
                      )}
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500" /> {product.averageRating || 'New'}
                      </Badge>
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 mb-3">{product.productName}</h1>

                    <div className="flex items-end gap-2">
                      <p className={`text-5xl font-black bg-linear-to-r ${themeGradient} bg-clip-text text-transparent`}>
                        ₹{product.pricePerUnit}
                      </p>
                      <span className="text-gray-500 text-lg font-semibold mb-2">/ {product.unit}</span>
                    </div>
                  </div>

                  {/* Stock & Delivery Info */}
                  <div className="bg-linear-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-5 border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100">
                          <Scale className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Stock Available</p>
                          <p className="text-lg font-bold text-gray-900">{product.availableStock} {product.unit}</p>
                        </div>
                      </div>
                      {product.availableStock > 0 && (
                        <Badge className="bg-green-500 text-white px-3 py-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-100">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Delivery</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {product.deliveryCharge
                            ? `₹${product.deliveryCharge} ${product.deliveryChargeType === 'per_unit' ? `/ ${product.unit}` : '(Flat)'}`
                            : 'Free Delivery'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Select Quantity ({product.unit})
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5 border border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setQty(Math.max(product.minOrderQuantity || 1, qty - 1))}
                          className="p-2 rounded-xl hover:bg-white hover:shadow-md transition-all disabled:opacity-30"
                          disabled={qty <= (product.minOrderQuantity || 1)}
                        >
                          <Minus className="h-5 w-5 text-gray-700" />
                        </motion.button>
                        <Input
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const min = product.minOrderQuantity || 1;
                            setQty(val < min ? min : val);
                          }}
                          min={product.minOrderQuantity || 1}
                          max={product.availableStock}
                          className="w-24 h-12 text-center text-xl font-bold border-0 bg-transparent focus:ring-0"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setQty(Math.min(product.availableStock, qty + 1))}
                          className="p-2 rounded-xl hover:bg-white hover:shadow-md transition-all disabled:opacity-30"
                          disabled={qty >= product.availableStock}
                        >
                          <Plus className="h-5 w-5 text-gray-700" />
                        </motion.button>
                      </div>

                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-2xl font-black text-gray-900">₹{totalPrice.toFixed(2)}</p>
                        {deliveryCost > 0 && (
                          <p className="text-xs text-gray-400">incl. delivery ₹{deliveryCost}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {!isAdmin && (
                      <Button
                        onClick={handleAddToCart}
                        disabled={product.availableStock <= 0 || isAdding}
                        className={`w-full h-14 text-lg font-bold shadow-2xl transition-all duration-300 ${product.availableStock > 0
                            ? `bg-linear-to-r ${themeGradient} hover:shadow-${themeColor}-500/50 text-white`
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {isAdding ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="h-5 w-5" />
                            Adding to Cart...
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6" />
                            {product.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                            <ChevronRight className="h-5 w-5 ml-auto" />
                          </span>
                        )}
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowInquiry(true)}
                        className={`h-12 font-semibold border-2 ${themeBorder} ${themeLightText} hover:${themeLightBg} transition-all`}
                      >
                        <MessageCircle className="mr-2 h-5 w-5" /> Chat Seller
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <Phone className="mr-2 h-5 w-5" /> Call Now
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Seller Info */}
                  <div className="flex items-center gap-4">
                    <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl bg-linear-to-br ${themeGradient} shadow-lg`}>
                      {sellerName?.charAt(0)?.toUpperCase()}
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-lg">{sellerName}</p>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {location || "India"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        product={product}
      />
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color = "gray" }) {
  const colorMap = {
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    green: { bg: "bg-emerald-100", text: "text-emerald-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
  };

  const colors = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
    >
      <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
        <p className="font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}