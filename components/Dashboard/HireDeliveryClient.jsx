
// // "use client";

// // import { useState, useMemo } from "react";
// // import {
// //     Truck, MapPin, Phone, Star, Filter, ArrowLeft,
// //     ChevronRight, CheckCircle2, Clock, AlertCircle, Search, Loader2,
// //     X
// // } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Badge } from "@/components/ui/badge";
// // import { Separator } from "@/components/ui/separator";
// // import { toast } from "sonner";
// // import Link from "next/link";
// // import { useRouter } from "next/navigation";
// // import { hireDeliveryBoy } from "@/actions/delivery-job";
// // import { motion, AnimatePresence } from "framer-motion";
// // import { DASHBOARD_THEMES } from "@/data/DashboardData/constants";

// // export default function HireDeliveryClient({ order, initialBoys, deliveryCoords, userType = "farmer" }) {
// //     const router = useRouter();
// //     const [hiringId, setHiringId] = useState(null);
// //     const [searchTerm, setSearchTerm] = useState("");
// //     const [maxDistance, setMaxDistance] = useState(50);
// //     const [maxPrice, setMaxPrice] = useState(100);

// //     // Theme configuration based on userType from central data
// //     const isFarmer = userType === "farmer";
// //     const theme = DASHBOARD_THEMES[userType] || DASHBOARD_THEMES.farmer;

// //     // Track status locally for optimistic updates
// //     const [partners, setPartners] = useState(initialBoys);

// //     const filteredBoys = useMemo(() => {
// //         return partners.filter(boy => {
// //             const matchesSearch = boy.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //                 boy.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase());
// //             const matchesDistance = boy.distance <= maxDistance;
// //             const matchesPrice = boy.pricePerKm <= maxPrice;
// //             return matchesSearch && matchesDistance && matchesPrice;
// //         });
// //     }, [partners, searchTerm, maxDistance, maxPrice]);

// //     const handleHireAction = async (boyId, distance) => {
// //         setHiringId(boyId);

// //         // Optimistic UI update
// //         setPartners(prev => prev.map(p =>
// //             p.id === boyId ? { ...p, hiringStatus: 'REQUESTED' } : p
// //         ));

// //         try {
// //             const res = await hireDeliveryBoy(order.id, boyId, distance);
// //             if (res.success) {
// //                 toast.success("Hire request sent successfully!");
// //                 // Small delay to let user see the status change
// //                 setTimeout(() => {
// //                     router.push(`/${userType}-dashboard/manage-orders`);
// //                 }, 1500);
// //             } else {
// //                 toast.error(res.error || "Failed to send hire request");
// //                 // Rollback status
// //                 setPartners(prev => prev.map(p =>
// //                     p.id === boyId ? { ...p, hiringStatus: null } : p
// //                 ));
// //             }
// //         } catch (error) {
// //             toast.error("Something went wrong");
// //             // Rollback status
// //             setPartners(prev => prev.map(p =>
// //                 p.id === boyId ? { ...p, hiringStatus: null } : p
// //             ));
// //         } finally {
// //             setHiringId(null);
// //         }
// //     };

// //     return (
// //         <div className="container mx-auto max-w-7xl px-4">
// //             {/* Header */}
// //             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
// //                 <div>
// //                     <Button variant="ghost" asChild className="mb-1 -ml-2 text-gray-500 hover:text-gray-900 h-8 text-[10px] uppercase font-black">
// //                         <Link href={`/${userType}-dashboard/manage-orders`}>
// //                             <ArrowLeft className="h-3 w-3 mr-2" /> Back to Orders
// //                         </Link>
// //                     </Button>
// //                     <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Hire Delivery Partner</h1>
// //                     <div className="text-slate-400 flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase">
// //                         Order <Badge variant="secondary" className="font-mono text-[9px] px-2 py-0">#{order.id.slice(-8).toUpperCase()}</Badge>
// //                         <Separator orientation="vertical" className="h-3" />
// //                         <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {order.shippingAddress || "N/A"}</span>
// //                     </div>
// //                 </div>
// //             </div>

// //             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
// //                 {/* Filters Sidebar */}
// //                 <div className="lg:col-span-3 space-y-6">
// //                     <Card className="border-gray-200 shadow-sm sticky top-24">
// //                         <CardHeader className="pb-4">
// //                             <CardTitle className="text-sm font-bold flex items-center gap-2">
// //                                 <Filter className="h-4 w-4" /> Filter Partners
// //                             </CardTitle>
// //                         </CardHeader>
// //                         <CardContent className="space-y-6">
// //                             <div className="space-y-2">
// //                                 <label className="text-xs font-bold text-gray-400 uppercase">Search Partner</label>
// //                                 <div className="relative">
// //                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
// //                                     <Input
// //                                         placeholder="Name or vehicle..."
// //                                         className="pl-9 bg-gray-50"
// //                                         value={searchTerm}
// //                                         onChange={(e) => setSearchTerm(e.target.value)}
// //                                     />
// //                                 </div>
// //                             </div>

// //                             <div className="space-y-4">
// //                                 <div className="flex justify-between items-center">
// //                                     <label className="text-xs font-bold text-gray-400 uppercase">Max Distance</label>
// //                                     <span className={`text-sm font-bold ${theme.text}`}>{maxDistance} km</span>
// //                                 </div>
// //                                 <input
// //                                     type="range"
// //                                     min="1"
// //                                     max="100"
// //                                     value={maxDistance}
// //                                     onChange={(e) => setMaxDistance(parseInt(e.target.value))}
// //                                     className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${theme.accent}`}
// //                                 />
// //                             </div>

// //                             <div className="space-y-4">
// //                                 <div className="flex justify-between items-center">
// //                                     <label className="text-xs font-bold text-gray-400 uppercase">Max Price/KM</label>
// //                                     <span className={`text-sm font-bold ${theme.text}`}>{"\u20B9"}{maxPrice}</span>
// //                                 </div>
// //                                 <input
// //                                     type="range"
// //                                     min="1"
// //                                     max="200"
// //                                     value={maxPrice}
// //                                     onChange={(e) => setMaxPrice(parseInt(e.target.value))}
// //                                     className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${theme.accent}`}
// //                                 />
// //                             </div>

// //                             <div className="pt-4">
// //                                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
// //                                     <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
// //                                     <p className="text-[10px] text-blue-700 leading-relaxed">
// //                                         Showing partners available near the delivery location. Estimated prices are based on per KM rates.
// //                                     </p>
// //                                 </div>
// //                             </div>
// //                         </CardContent>
// //                     </Card>
// //                 </div>

// //                 {/* Main List */}
// //                 <div className="lg:col-span-9 space-y-4">
// //                     {/* Buyer Summary */}
// //                     <Card className={`${theme.bg} text-white border-none shadow-lg mb-6 overflow-hidden relative rounded-[2rem]`}>
// //                         <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
// //                         <CardContent className="p-4 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
// //                             <div className="flex items-center gap-4">
// //                                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
// //                                     <Truck className="h-6 w-6 text-white" />
// //                                 </div>
// //                                 <div>
// //                                     <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Delivery Destination</p>
// //                                     <p className="text-lg font-black tracking-tighter line-clamp-1">
// //                                         {order.shippingAddress || order.buyerUser.farmerProfile?.city || order.buyerUser.agentProfile?.city || "Unknown Location"}
// //                                     </p>
// //                                 </div>
// //                             </div>
// //                             <div className="flex gap-4">
// //                                 <div className="text-right">
// //                                     <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Buyer Contact</p>
// //                                     <p className="font-black text-sm flex items-center gap-2 justify-end">
// //                                         <Phone className="h-3 w-3" /> {order.buyerPhone || "N/A"}
// //                                     </p>
// //                                 </div>
// //                             </div>
// //                         </CardContent>
// //                     </Card>

// //                     {/* Delivery Partner List */}
// //                     <AnimatePresence mode="popLayout">
// //                         {filteredBoys.length > 0 ? (
// //                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                                 {filteredBoys.map((boy, index) => (
// //                                     <motion.div
// //                                         key={boy.id}
// //                                         initial={{ opacity: 0, y: 20 }}
// //                                         animate={{ opacity: 1, y: 0 }}
// //                                         transition={{ delay: index * 0.05 }}
// //                                     >
// //                                         <Card className="hover:shadow-xl transition-all border-slate-100 group overflow-hidden rounded-3xl">
// //                                             <CardContent className="p-0">
// //                                                 <div className="p-4">
// //                                                     <div className="flex justify-between items-start mb-3">
// //                                                         <div className="flex items-center gap-2">
// //                                                             <div className={`h-10 w-10 rounded-xl ${isFarmer ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center font-black text-sm uppercase shadow-inner border border-current/10`}>
// //                                                                 {boy.fullName?.[0]}
// //                                                             </div>
// //                                                             <div>
// //                                                                 <h3 className={`font-black text-slate-900 text-sm group-hover:${theme.text} transition-colors`}>{boy.fullName}</h3>
// //                                                                 <div className="flex items-center gap-1 text-[10px] text-amber-500">
// //                                                                     <Star className="h-3 w-3 fill-current" />
// //                                                                     <span className="font-black">4.8</span>
// //                                                                     <span className="text-slate-400 font-bold ml-1">(24 orders)</span>
// //                                                                 </div>
// //                                                             </div>
// //                                                         </div>
// //                                                         <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 border-0 rounded-lg ${boy.availability === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
// //                                                                 boy.availability === 'AVAILABLE_SOON' ? 'bg-indigo-50 text-indigo-700' :
// //                                                                     'bg-slate-100 text-slate-600'
// //                                                             }`}>
// //                                                             {boy.availability.replace('_', ' ')}
// //                                                         </Badge>
// //                                                     </div>

// //                                                     <div className="grid grid-cols-2 gap-3 mb-4">
// //                                                         <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
// //                                                             <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Vehicle</p>
// //                                                             <p className="text-[11px] font-black text-slate-700 capitalize">{boy.vehicleType}</p>
// //                                                         </div>
// //                                                         <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
// //                                                             <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Pricing</p>
// //                                                             <p className="text-[11px] font-black text-slate-700">{"\u20B9"}{boy.pricePerKm}/km</p>
// //                                                         </div>
// //                                                     </div>

// //                                                     <div className={`flex items-center justify-between p-2.5 ${theme.lightBg}/30 rounded-xl border ${theme.border} mb-4`}>
// //                                                         <div className="flex items-center gap-2">
// //                                                             <MapPin className={`h-3.5 w-3.5 ${isFarmer ? 'text-emerald-600' : 'text-indigo-600'}`} />
// //                                                             <span className="text-[10px] font-bold text-slate-500">Dist: <span className="text-slate-900 font-black">{boy.distance} km</span></span>
// //                                                         </div>
// //                                                         <div className="text-right">
// //                                                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Est. Cost</p>
// //                                                             <p className={`text-base font-black ${isFarmer ? 'text-emerald-700' : 'text-indigo-700'}`}>{"\u20B9"}{(boy.distance * boy.pricePerKm).toFixed(0)}</p>
// //                                                         </div>
// //                                                     </div>

// //                                                     <Button
// //                                                         onClick={() => handleHireAction(boy.id, boy.distance)}
// //                                                         disabled={hiringId === boy.id || (boy.hiringStatus && boy.hiringStatus !== 'REJECTED' && boy.hiringStatus !== 'CANCELLED')}
// //                                                         className={`w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${boy.hiringStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100' :
// //                                                             boy.hiringStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
// //                                                                 boy.hiringStatus === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
// //                                                                     'bg-slate-950 hover:bg-black text-white shadow-lg'
// //                                                             }`}
// //                                                     >
// //                                                         {hiringId === boy.id ? (
// //                                                             <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Transmitting...</>
// //                                                         ) : boy.hiringStatus ? (
// //                                                             <div className="flex items-center gap-2">
// //                                                                 {boy.hiringStatus === 'REQUESTED' && <Clock className="h-3.5 w-3.5" />}
// //                                                                 {boy.hiringStatus === 'ACCEPTED' && <CheckCircle2 className="h-3.5 w-3.5" />}
// //                                                                 {boy.hiringStatus === 'REJECTED' && <X className="h-3.5 w-3.5" />}
// //                                                                 {boy.hiringStatus.replace('_', ' ')}
// //                                                             </div>
// //                                                         ) : (
// //                                                             <>Request Hire <ChevronRight className="ml-1 h-3 w-3" /></>
// //                                                         )}
// //                                                     </Button>
// //                                                 </div>
// //                                             </CardContent>
// //                                         </Card>
// //                                     </motion.div>
// //                                 ))}
// //                             </div>
// //                         ) : (
// //                             <motion.div
// //                                 initial={{ opacity: 0 }}
// //                                 animate={{ opacity: 1 }}
// //                                 className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-100 text-center"
// //                             >
// //                                 <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
// //                                     <AlertCircle className="h-10 w-10 text-gray-300" />
// //                                 </div>
// //                                 <h3 className="text-xl font-bold text-gray-900 mb-2">No Partners Found</h3>
// //                                 <p className="text-gray-500 max-sm mx-auto">
// //                                     We couldn't find any available delivery partners matching your current filters. Try increasing the search radius or price range.
// //                                 </p>
// //                                 <Button
// //                                     variant="outline"
// //                                     className="mt-6"
// //                                     onClick={() => {
// //                                         setSearchTerm("");
// //                                         setMaxDistance(100);
// //                                         setMaxPrice(200);
// //                                     }}
// //                                 >
// //                                     Clear All Filters
// //                                 </Button>
// //                             </motion.div>
// //                         )}
// //                     </AnimatePresence>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // }


// "use client";

// import { useState, useMemo } from "react";
// import {
//     Truck, MapPin, Phone, Star, Filter, ArrowLeft,
//     ChevronRight, CheckCircle2, Clock, AlertCircle, Search, Loader2,
//     X, Sparkles, Navigation, IndianRupee, Award, Shield
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { toast } from "sonner";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { hireDeliveryBoy } from "@/actions/delivery-job";
// import { motion, AnimatePresence } from "framer-motion";
// import { DASHBOARD_THEMES } from "@/data/DashboardData/constants";

// export default function HireDeliveryClient({ order, initialBoys, deliveryCoords, userType = "farmer" }) {
//     const router = useRouter();
//     const [hiringId, setHiringId] = useState(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [maxDistance, setMaxDistance] = useState(50);
//     const [maxPrice, setMaxPrice] = useState(100);

//     // Theme configuration based on userType from central data
//     const isFarmer = userType === "farmer";
//     const theme = DASHBOARD_THEMES[userType] || DASHBOARD_THEMES.farmer;

//     // Track status locally for optimistic updates
//     const [partners, setPartners] = useState(initialBoys);

//     const filteredBoys = useMemo(() => {
//         return partners.filter(boy => {
//             const matchesSearch = boy.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 boy.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase());
//             const matchesDistance = boy.distance <= maxDistance;
//             const matchesPrice = boy.pricePerKm <= maxPrice;
//             return matchesSearch && matchesDistance && matchesPrice;
//         });
//     }, [partners, searchTerm, maxDistance, maxPrice]);

//     const handleHireAction = async (boyId, distance) => {
//         setHiringId(boyId);

//         // Optimistic UI update
//         setPartners(prev => prev.map(p =>
//             p.id === boyId ? { ...p, hiringStatus: 'REQUESTED' } : p
//         ));

//         try {
//             const res = await hireDeliveryBoy(order.id, boyId, distance);
//             if (res.success) {
//                 toast.success("Hire request sent successfully!");
//                 // Small delay to let user see the status change
//                 setTimeout(() => {
//                     router.push(`/${userType}-dashboard/manage-orders`);
//                 }, 1500);
//             } else {
//                 toast.error(res.error || "Failed to send hire request");
//                 // Rollback status
//                 setPartners(prev => prev.map(p =>
//                     p.id === boyId ? { ...p, hiringStatus: null } : p
//                 ));
//             }
//         } catch (error) {
//             toast.error("Something went wrong");
//             // Rollback status
//             setPartners(prev => prev.map(p =>
//                 p.id === boyId ? { ...p, hiringStatus: null } : p
//             ));
//         } finally {
//             setHiringId(null);
//         }
//     };

//     return (
//         <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 overflow-hidden">
//             {/* Animated background orbs */}
//             <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 <motion.div
//                     animate={{ x: [0, 150, 0], y: [0, -80, 0] }}
//                     transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
//                     className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/20 to-green-300/15 rounded-full blur-3xl"
//                 />
//                 <motion.div
//                     animate={{ x: [0, -120, 0], y: [0, 90, 0] }}
//                     transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
//                     className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/20 to-indigo-300/15 rounded-full blur-3xl"
//                 />
//                 {/* Floating particles */}
//                 {[...Array(15)].map((_, i) => (
//                     <motion.div
//                         key={i}
//                         className="absolute w-1.5 h-1.5 rounded-full"
//                         style={{
//                             left: `${Math.random() * 100}%`,
//                             top: `${Math.random() * 100}%`,
//                             background: `linear-gradient(135deg, ${['#10b981', '#3b82f6', '#8b5cf6'][i % 3]}, ${['#059669', '#2563eb', '#7c3aed'][i % 3]})`,
//                         }}
//                         animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.3, 0.8] }}
//                         transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
//                     />
//                 ))}
//             </div>

//             <div className="relative container mx-auto max-w-7xl px-4 py-8">
//                 {/* Header */}
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8">
//                     <div>
//                         <Button variant="ghost" asChild className="mb-1 -ml-2 text-gray-500 hover:text-gray-900 h-8 text-[10px] uppercase font-black">
//                             <Link href={`/${userType}-dashboard/manage-orders`}>
//                                 <ArrowLeft className="h-3 w-3 mr-2" /> Back to Orders
//                             </Link>
//                         </Button>
//                         <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Hire Delivery Partner</h1>
//                         <div className="text-slate-400 flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase">
//                             Order <Badge variant="secondary" className="font-mono text-[9px] px-2 py-0">#{order.id.slice(-8).toUpperCase()}</Badge>
//                             <Separator orientation="vertical" className="h-3" />
//                             <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {order.shippingAddress || "N/A"}</span>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//                     {/* Filters Sidebar */}
//                     <div className="lg:col-span-3 space-y-6">
//                         <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl sticky top-24 overflow-hidden">
//                             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
//                             <CardHeader className="pb-4 pt-5">
//                                 <CardTitle className="text-sm font-bold flex items-center gap-2">
//                                     <Filter className="h-4 w-4 text-emerald-600" /> Filter Partners
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-6">
//                                 <div className="space-y-2">
//                                     <label className="text-xs font-bold text-gray-400 uppercase">Search Partner</label>
//                                     <div className="relative">
//                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                         <Input
//                                             placeholder="Name or vehicle..."
//                                             className="pl-9 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-400 transition-all"
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                         />
//                                     </div>
//                                 </div>

//                                 <Separator />

//                                 <div className="space-y-4">
//                                     <div className="flex justify-between items-center">
//                                         <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
//                                             <Navigation className="h-3 w-3" /> Max Distance
//                                         </label>
//                                         <span className={`text-sm font-bold ${theme.text}`}>{maxDistance} km</span>
//                                     </div>
//                                     <input
//                                         type="range"
//                                         min="1"
//                                         max="100"
//                                         value={maxDistance}
//                                         onChange={(e) => setMaxDistance(parseInt(e.target.value))}
//                                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
//                                     />
//                                     <div className="flex justify-between text-[9px] text-gray-400 font-bold">
//                                         <span>1 km</span>
//                                         <span>100 km</span>
//                                     </div>
//                                 </div>

//                                 <Separator />

//                                 <div className="space-y-4">
//                                     <div className="flex justify-between items-center">
//                                         <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
//                                             <IndianRupee className="h-3 w-3" /> Max Price/KM
//                                         </label>
//                                         <span className={`text-sm font-bold ${theme.text}`}>{"\u20B9"}{maxPrice}</span>
//                                     </div>
//                                     <input
//                                         type="range"
//                                         min="1"
//                                         max="200"
//                                         value={maxPrice}
//                                         onChange={(e) => setMaxPrice(parseInt(e.target.value))}
//                                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
//                                     />
//                                     <div className="flex justify-between text-[9px] text-gray-400 font-bold">
//                                         <span>₹1</span>
//                                         <span>₹200</span>
//                                     </div>
//                                 </div>

//                                 <div className="pt-4">
//                                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
//                                         <div className="bg-blue-100 p-1.5 rounded-lg shrink-0">
//                                             <Clock className="h-3.5 w-3.5 text-blue-500" />
//                                         </div>
//                                         <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
//                                             Showing partners available near the delivery location. Estimated prices are based on per KM rates.
//                                         </p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>

//                     {/* Main List */}
//                     <div className="lg:col-span-9 space-y-4">
//                         {/* Buyer Summary */}
//                         <Card className={`${theme.bg} text-white border-none shadow-xl mb-6 overflow-hidden relative rounded-2xl`}>
//                             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
//                             <div className="absolute right-40 -top-10 w-20 h-20 bg-white/5 rounded-full blur-xl" />
//                             <CardContent className="p-5 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
//                                 <div className="flex items-center gap-4">
//                                     <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
//                                         <Truck className="h-6 w-6 text-white" />
//                                     </div>
//                                     <div>
//                                         <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Delivery Destination</p>
//                                         <p className="text-lg font-black tracking-tighter line-clamp-1">
//                                             {order.shippingAddress || order.buyerUser.farmerProfile?.city || order.buyerUser.agentProfile?.city || "Unknown Location"}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex gap-4">
//                                     <div className="text-right">
//                                         <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Buyer Contact</p>
//                                         <p className="font-black text-sm flex items-center gap-2 justify-end">
//                                             <Phone className="h-3 w-3" /> {order.buyerPhone || "N/A"}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {/* Delivery Partner List */}
//                         <AnimatePresence mode="popLayout">
//                             {filteredBoys.length > 0 ? (
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     {filteredBoys.map((boy, index) => (
//                                         <motion.div
//                                             key={boy.id}
//                                             initial={{ opacity: 0, y: 20 }}
//                                             animate={{ opacity: 1, y: 0 }}
//                                             exit={{ opacity: 0, y: -20 }}
//                                             transition={{ delay: index * 0.05 }}
//                                         >
//                                             <Card className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-xl overflow-hidden rounded-2xl">
//                                                 {/* Hover glow */}
//                                                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />

//                                                 <CardContent className="p-0 relative">
//                                                     <div className="p-5">
//                                                         <div className="flex justify-between items-start mb-4">
//                                                             <div className="flex items-center gap-3">
//                                                                 <div className={`h-12 w-12 rounded-2xl ${isFarmer ? 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600' : 'bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600'} flex items-center justify-center font-black text-sm uppercase shadow-inner border border-current/10`}>
//                                                                     {boy.fullName?.[0]}
//                                                                 </div>
//                                                                 <div>
//                                                                     <h3 className={`font-black text-slate-900 text-sm group-hover:${theme.text} transition-colors`}>{boy.fullName}</h3>
//                                                                     <div className="flex items-center gap-1 text-[10px] text-amber-500">
//                                                                         <Star className="h-3 w-3 fill-current" />
//                                                                         <span className="font-black">4.8</span>
//                                                                         <span className="text-slate-400 font-bold ml-1">(24 orders)</span>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                             <Badge className={`text-[8px] font-black uppercase px-3 py-1 border-0 rounded-full shadow-sm ${boy.availability === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
//                                                                 boy.availability === 'AVAILABLE_SOON' ? 'bg-indigo-100 text-indigo-700' :
//                                                                     'bg-gray-100 text-gray-600'
//                                                                 }`}>
//                                                                 {boy.availability.replace('_', ' ')}
//                                                             </Badge>
//                                                         </div>

//                                                         <div className="grid grid-cols-2 gap-3 mb-4">
//                                                             <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl border border-gray-100 shadow-sm">
//                                                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Vehicle</p>
//                                                                 <p className="text-xs font-black text-slate-700 capitalize">{boy.vehicleType}</p>
//                                                             </div>
//                                                             <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl border border-gray-100 shadow-sm">
//                                                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Pricing</p>
//                                                                 <p className="text-xs font-black text-slate-700">{"\u20B9"}{boy.pricePerKm}/km</p>
//                                                             </div>
//                                                         </div>

//                                                         <div className={`flex items-center justify-between p-3 ${theme.lightBg}/30 rounded-xl border ${theme.border} mb-4 bg-gradient-to-r from-white to-gray-50`}>
//                                                             <div className="flex items-center gap-2">
//                                                                 <MapPin className={`h-4 w-4 ${isFarmer ? 'text-emerald-600' : 'text-indigo-600'}`} />
//                                                                 <span className="text-[10px] font-bold text-slate-500">Dist: <span className="text-slate-900 font-black">{boy.distance} km</span></span>
//                                                             </div>
//                                                             <div className="text-right">
//                                                                 <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Est. Cost</p>
//                                                                 <p className={`text-lg font-black ${isFarmer ? 'text-emerald-700' : 'text-indigo-700'}`}>{"\u20B9"}{(boy.distance * boy.pricePerKm).toFixed(0)}</p>
//                                                             </div>
//                                                         </div>

//                                                         <Button
//                                                             onClick={() => handleHireAction(boy.id, boy.distance)}
//                                                             disabled={hiringId === boy.id || (boy.hiringStatus && boy.hiringStatus !== 'REJECTED' && boy.hiringStatus !== 'CANCELLED')}
//                                                             className={`w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${boy.hiringStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100' :
//                                                                 boy.hiringStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
//                                                                     boy.hiringStatus === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
//                                                                         'bg-gradient-to-r from-slate-900 to-gray-800 hover:from-black hover:to-gray-900 text-white'
//                                                                 }`}
//                                                         >
//                                                             {hiringId === boy.id ? (
//                                                                 <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Transmitting...</>
//                                                             ) : boy.hiringStatus ? (
//                                                                 <div className="flex items-center gap-2">
//                                                                     {boy.hiringStatus === 'REQUESTED' && <Clock className="h-3.5 w-3.5" />}
//                                                                     {boy.hiringStatus === 'ACCEPTED' && <CheckCircle2 className="h-3.5 w-3.5" />}
//                                                                     {boy.hiringStatus === 'REJECTED' && <X className="h-3.5 w-3.5" />}
//                                                                     {boy.hiringStatus.replace('_', ' ')}
//                                                                 </div>
//                                                             ) : (
//                                                                 <><Sparkles className="mr-1.5 h-3 w-3" /> Request Hire <ChevronRight className="ml-1 h-3 w-3" /></>
//                                                             )}
//                                                         </Button>
//                                                     </div>
//                                                 </CardContent>
//                                             </Card>
//                                         </motion.div>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <motion.div
//                                     initial={{ opacity: 0 }}
//                                     animate={{ opacity: 1 }}
//                                     className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border-2 border-dashed border-gray-200 text-center shadow-lg"
//                                 >
//                                     <motion.div
//                                         animate={{ y: [0, -10, 0] }}
//                                         transition={{ duration: 3, repeat: Infinity }}
//                                         className="bg-gradient-to-br from-gray-100 to-gray-200 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"
//                                     >
//                                         <AlertCircle className="h-10 w-10 text-gray-400" />
//                                     </motion.div>
//                                     <h3 className="text-xl font-bold text-gray-900 mb-2">No Partners Found</h3>
//                                     <p className="text-gray-500 max-w-sm mx-auto">
//                                         We couldn't find any available delivery partners matching your current filters. Try increasing the search radius or price range.
//                                     </p>
//                                     <Button
//                                         variant="outline"
//                                         className="mt-6 rounded-xl border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 font-bold"
//                                         onClick={() => {
//                                             setSearchTerm("");
//                                             setMaxDistance(100);
//                                             setMaxPrice(200);
//                                         }}
//                                     >
//                                         Clear All Filters
//                                     </Button>
//                                 </motion.div>
//                             )}
//                         </AnimatePresence>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


"use client";

import { useState, useMemo } from "react";
import {
    Truck, MapPin, Phone, Star, Filter, ArrowLeft,
    ChevronRight, CheckCircle2, Clock, AlertCircle, Search, Loader2,
    X, Sparkles, Navigation, IndianRupee, Award, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hireDeliveryBoy, updateDeliveryJobStatus } from "@/actions/delivery-job";
import { motion, AnimatePresence } from "framer-motion";
import { DASHBOARD_THEMES } from "@/data/DashboardData/constants";

export default function HireDeliveryClient({ order, initialBoys, deliveryCoords, userType = "farmer" }) {
    const router = useRouter();
    const [hiringId, setHiringId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [maxDistance, setMaxDistance] = useState(100);
    const [maxPrice, setMaxPrice] = useState(200);

    // Theme configuration based on userType from central data
    const isFarmer = userType === "farmer";
    const theme = DASHBOARD_THEMES[userType] || DASHBOARD_THEMES.farmer;

    // Track status locally for optimistic updates
    const [partners, setPartners] = useState(Array.isArray(initialBoys) ? initialBoys : []);

    const filteredBoys = useMemo(() => {
        if (!Array.isArray(partners)) return [];
        return partners.filter(boy => {
            if (!boy) return false;
            const matchesSearch = (boy.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (boy.vehicleType || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistance = (boy.distance || 0) <= maxDistance;
            const matchesPrice = (boy.pricePerKm || 0) <= maxPrice;
            return matchesSearch && matchesDistance && matchesPrice;
        });
    }, [partners, searchTerm, maxDistance, maxPrice]);

    const handleHireAction = async (boyId, distance) => {
        setHiringId(boyId);

        // Optimistic UI update
        setPartners(prev => prev.map(p =>
            p.id === boyId ? { ...p, hiringStatus: 'REQUESTED' } : p
        ));

        try {
            const res = await hireDeliveryBoy(order.id, boyId, distance);
            if (res.success) {
                toast.success("Hire request sent successfully!");
                // Small delay to let user see the status change
                router.refresh();
            } else {
                toast.error(res.error || "Failed to send hire request");
                // Rollback status
                setPartners(prev => prev.map(p =>
                    p.id === boyId ? { ...p, hiringStatus: null } : p
                ));
            }
        } catch (error) {
            toast.error("Something went wrong");
            // Rollback status
            setPartners(prev => prev.map(p =>
                p.id === boyId ? { ...p, hiringStatus: null } : p
            ));
        } finally {
            setHiringId(null);
        }
    };

    const handleRevokeAction = async (jobId, boyId) => {
        if (!jobId) return;
        setHiringId(boyId);

        try {
            const res = await updateDeliveryJobStatus(jobId, 'CANCELLED', 'Revoked by seller');
            if (res.success) {
                toast.success("Hire request revoked");
                // Optimistic UI update
                setPartners(prev => prev.map(p =>
                    p.id === boyId ? { ...p, hiringStatus: 'CANCELLED', hiringJobId: null } : p
                ));
                router.refresh();
            } else {
                toast.error(res.error || "Failed to revoke request");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setHiringId(null);
        }
    };

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
            {/* Subtle background pattern - no animation to prevent hydration issues */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                    backgroundSize: '100% 100%'
                }}
            />

            <div className="relative container mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8">
                    <div>
                        <Button variant="ghost" asChild className="mb-1 -ml-2 text-gray-500 hover:text-gray-900 h-8 text-[10px] uppercase font-black">
                            <Link href={`/${userType}-dashboard/manage-orders`}>
                                <ArrowLeft className="h-3 w-3 mr-2" /> Back to Orders
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Hire Delivery Partner</h1>
                        <div className="text-gray-500 flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase">
                            Order <Badge variant="secondary" className="font-mono text-[9px] px-2 py-0 bg-gray-100 text-gray-700">#{order.id.slice(-8).toUpperCase()}</Badge>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> {order.shippingAddress || "N/A"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-0 shadow-xl bg-white rounded-2xl sticky top-24 overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                            <CardHeader className="pb-4 pt-5">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900">
                                    <Filter className="h-4 w-4 text-emerald-600" /> Filter Partners
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Search Partner</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Name or vehicle..."
                                            className="pl-9 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-400 transition-all text-gray-900 placeholder:text-gray-400"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator className="bg-gray-100" />

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <Navigation className="h-3 w-3" /> Max Distance
                                        </label>
                                        <span className="text-sm font-bold text-emerald-600">{maxDistance} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={maxDistance}
                                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                                        <span>1 km</span>
                                        <span>100 km</span>
                                    </div>
                                </div>

                                <Separator className="bg-gray-100" />

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <IndianRupee className="h-3 w-3" /> Max Price/KM
                                        </label>
                                        <span className="text-sm font-bold text-emerald-600">₹{maxPrice}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="200"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                                        <span>₹1</span>
                                        <span>₹200</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                                        <div className="bg-blue-100 p-1.5 rounded-lg shrink-0">
                                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                                        </div>
                                        <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                                            Showing partners available near the delivery location. Estimated prices are based on per KM rates.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main List */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Buyer Summary - Fixed text visibility */}
                        <Card className={`${isFarmer ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} border-none shadow-xl mb-6 overflow-hidden relative rounded-2xl`}>
                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="absolute right-40 -top-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                            <CardContent className="p-5 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/25 backdrop-blur-sm p-3 rounded-2xl shadow-inner">
                                        <Truck className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/90 text-[10px] font-black uppercase tracking-widest">Delivery Destination</p>
                                        <p className="text-white text-lg font-black tracking-tighter line-clamp-1">
                                            {order.shippingAddress || order.buyerUser.farmerProfile?.city || order.buyerUser.agentProfile?.city || "Unknown Location"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <p className="text-white/90 text-[9px] font-black uppercase tracking-widest">Buyer Contact</p>
                                        <p className="text-white font-black text-sm flex items-center gap-2 justify-end">
                                            <Phone className="h-3 w-3" /> {order.buyerPhone || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Partner List */}
                        <AnimatePresence mode="popLayout">
                            {filteredBoys.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredBoys.map((boy, index) => (
                                        <motion.div
                                            key={boy.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="group relative border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white rounded-2xl overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-inner ${isFarmer
                                                                    ? 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200'
                                                                    }`}>
                                                                    {boy.name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <h3 className={`font-black text-slate-900 text-sm group-hover:text-emerald-600 transition-colors`}>{boy.name}</h3>
                                                                    <div className="flex items-center gap-1 text-[10px] text-amber-500">
                                                                        <Star className="h-3 w-3 fill-current" />
                                                                        <span className="font-black text-amber-600">4.8</span>
                                                                        <span className="text-gray-400 font-bold ml-1">(24 orders)</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge className={`text-[8px] font-black uppercase px-3 py-1 border-0 rounded-full shadow-sm ${boy.availability === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                                                                boy.availability === 'AVAILABLE_SOON' ? 'bg-indigo-100 text-indigo-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {(boy.availability || "AVAILABLE").replace('_', ' ')}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                                <p className="text-[8px] font-black text-gray-500 uppercase mb-1 tracking-widest">Vehicle</p>
                                                                <p className="text-xs font-black text-gray-900 capitalize">{boy.vehicleType}</p>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                                <p className="text-[8px] font-black text-gray-500 uppercase mb-1 tracking-widest">Pricing</p>
                                                                <p className="text-xs font-black text-gray-900">₹{boy.pricePerKm}/km</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className={`h-4 w-4 ${isFarmer ? 'text-emerald-600' : 'text-indigo-600'}`} />
                                                                <span className="text-[10px] font-bold text-gray-600">Dist: <span className="text-gray-900 font-black">{boy.distance} km</span></span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-tighter">Est. Cost</p>
                                                                <p className={`text-lg font-black ${isFarmer ? 'text-emerald-700' : 'text-indigo-700'}`}>₹{((boy.distance || 0) * (boy.pricePerKm || 0)).toFixed(0)}</p>
                                                            </div>
                                                        </div>

                                                        <div className="w-full">
                                                            {hiringId === boy.id ? (
                                                                <Button disabled className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gray-900 text-white shadow-lg shadow-gray-900/20">
                                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Transmitting...
                                                                </Button>
                                                            ) : boy.hiringStatus ? (
                                                                <div className={`flex items-center justify-between w-full h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                                                                    boy.hiringStatus === 'REQUESTED' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                                    boy.hiringStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                                    boy.hiringStatus === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                                }`}>
                                                                    <div className="flex items-center gap-2">
                                                                        {boy.hiringStatus === 'REQUESTED' && <Clock className="h-3.5 w-3.5" />}
                                                                        {boy.hiringStatus === 'ACCEPTED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                                        {boy.hiringStatus === 'REJECTED' && <X className="h-3.5 w-3.5" />}
                                                                        {(boy.hiringStatus || "").replace('_', ' ')}
                                                                    </div>
                                                                    {boy.hiringStatus === 'REQUESTED' && (
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost" 
                                                                            className="h-7 px-3 text-[9px] hover:bg-white hover:text-red-600 border border-amber-200 hover:border-red-200 rounded-lg transition-all font-black bg-amber-100/50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRevokeAction(boy.hiringJobId, boy.id);
                                                                            }}
                                                                        >
                                                                            Revoke
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => handleHireAction(boy.id, boy.distance)}
                                                                    className={`w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20`}
                                                                >
                                                                    <Sparkles className="mr-1.5 h-3 w-3" /> Request Hire <ChevronRight className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-200 text-center shadow-lg"
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="bg-gradient-to-br from-gray-100 to-gray-200 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"
                                    >
                                        <AlertCircle className="h-10 w-10 text-gray-400" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {partners.length === 0 ? "No Partners Found" : "No Matches Found"}
                                    </h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        {partners.length === 0 
                                            ? "We couldn't find any available delivery partners near this location. Ensure partners are online and approved." 
                                            : "We found partners near you, but none match your current distance or price filters. Try expanding your search."}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6 rounded-xl border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 text-gray-700 font-bold"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setMaxDistance(100);
                                            setMaxPrice(200);
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}