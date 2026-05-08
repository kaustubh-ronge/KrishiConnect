"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Truck, MapPin, Phone, Star, Filter, ArrowLeft,
    ChevronRight, CheckCircle2, Clock, AlertCircle, Search, Loader2,
    X, Sparkles, Navigation, IndianRupee, Award, Shield,
    ArrowUpRight, ArrowDownRight, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hireDeliveryBoy, updateDeliveryJobStatus, getAvailableDeliveryBoys } from "@/actions/delivery-job";
import { motion, AnimatePresence } from "framer-motion";
import { DASHBOARD_THEMES } from "@/data/DashboardData/constants";

export default function HireDeliveryClient({ 
    order, 
    initialBoys, 
    deliveryCoords, 
    sellerCoords,
    sellerRange = 100,
    orderDistance = 0,
    userType = "farmer" 
}) {
    const router = useRouter();
    const [hiringId, setHiringId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [maxDistance, setMaxDistance] = useState(100);
    const [maxPrice, setMaxPrice] = useState(200);
    const [activeTab, setActiveTab] = useState("near_seller"); // "near_seller" or "near_buyer"
    const [isLoading, setIsLoading] = useState(false);

    // Theme configuration
    const isFarmer = userType === "farmer";
    const theme = DASHBOARD_THEMES[userType] || DASHBOARD_THEMES.farmer;

    // Track status locally
    const [partners, setPartners] = useState(Array.isArray(initialBoys) ? initialBoys : []);

    // Effect to fetch partners based on active tab
    useEffect(() => {
        const fetchPartners = async () => {
            setIsLoading(true);
            try {
                // If near_seller: Search centered at sellerCoords, but still calculate total trip to buyer
                // If near_buyer: Search centered at deliveryCoords (buyer)
                const refLat = activeTab === "near_seller" ? sellerCoords.lat : deliveryCoords.lat;
                const refLng = activeTab === "near_seller" ? sellerCoords.lng : deliveryCoords.lng;
                
                const res = await getAvailableDeliveryBoys(
                    deliveryCoords.lat, 
                    deliveryCoords.lng, 
                    order.id, 
                    sellerCoords.lat, 
                    sellerCoords.lng
                );
                
                if (res.success) {
                    setPartners(res.data);
                }
            } catch (err) {
                console.error("Fetch failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPartners();
    }, [activeTab, deliveryCoords, sellerCoords, order.id]);

    const sortedBoys = useMemo(() => {
        if (!Array.isArray(partners)) return [];
        
        const filtered = partners.filter(boy => {
            if (!boy) return false;
            const matchesSearch = (boy.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (boy.vehicleType || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistance = (boy.distance || 0) <= maxDistance;
            const matchesPrice = (boy.pricePerKm || 0) <= maxPrice;
            return matchesSearch && matchesDistance && matchesPrice;
        });

        // Sort based on active tab
        return [...filtered].sort((a, b) => {
            if (activeTab === "near_seller") {
                return (a.pickupDistance - b.pickupDistance);
            } else {
                return (a.boyToBuyerDistance - b.boyToBuyerDistance);
            }
        });
    }, [partners, searchTerm, maxDistance, maxPrice, activeTab]);

    const handleHireAction = async (boyId, distance) => {
        setHiringId(boyId);
        setPartners(prev => prev.map(p =>
            p.id === boyId ? { ...p, hiringStatus: 'REQUESTED' } : p
        ));

        try {
            const res = await hireDeliveryBoy(order.id, boyId, distance);
            if (res.success) {
                toast.success("Hire request sent successfully!");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to send hire request");
                setPartners(prev => prev.map(p =>
                    p.id === boyId ? { ...p, hiringStatus: null } : p
                ));
            }
        } catch (error) {
            toast.error("Something went wrong");
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
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)',
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
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Hire Logistics Partner</h1>
                        <div className="text-slate-400 flex items-center gap-2 mt-0.5 text-[10px] font-bold uppercase">
                            Order <Badge variant="secondary" className="font-mono text-[9px] px-2 py-0">#{order.id.slice(-8).toUpperCase()}</Badge>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3 text-emerald-500" /> Total Collected: ₹{order.deliveryCharge || 0}
                            </span>
                            {orderDistance > sellerRange && (
                                <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-black uppercase">Manual Negotiation Required</Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Filters & Tabs Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Search Mode Tabs */}
                        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden p-1">
                            <div className="grid grid-cols-2 gap-1">
                                <button 
                                    onClick={() => setActiveTab("near_seller")}
                                    className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all ${activeTab === "near_seller" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
                                >
                                    <MapPin className="h-5 w-5 mb-1" />
                                    <span className="text-[10px] font-black uppercase">Near Farm</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab("near_buyer")}
                                    className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all ${activeTab === "near_buyer" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
                                >
                                    <Navigation className="h-5 w-5 mb-1" />
                                    <span className="text-[10px] font-black uppercase">Near Buyer</span>
                                </button>
                            </div>
                        </Card>

                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
                            <CardHeader className="pb-4 pt-5">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-emerald-600" /> Logistics Search
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Partner Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Name or vehicle..."
                                            className="pl-9 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-400 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Max Range</label>
                                        <span className="text-sm font-bold text-slate-900">{maxDistance} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="500"
                                        value={maxDistance}
                                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                <div className="pt-4">
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                                        <div className="bg-amber-100 p-1.5 rounded-lg shrink-0">
                                            <Info className="h-3.5 w-3.5 text-amber-600" />
                                        </div>
                                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                                            {activeTab === "near_seller" 
                                                ? "Searching for partners who can reach your farm quickly." 
                                                : "Searching for partners near the destination who might take this as a return trip."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main List */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Logistics Summary */}
                        <Card className={`${theme.bg} text-white border-none shadow-xl mb-6 overflow-hidden relative rounded-3xl`}>
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                            <CardContent className="p-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                                        <Truck className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Delivery Trip Summary</p>
                                        <h3 className="text-xl font-black tracking-tighter">
                                            From: <span className="text-white/80">{order.items[0]?.product?.farmer?.farmerProfile?.city || order.items[0]?.product?.agent?.agentProfile?.city || "Farm"}</span>
                                            <ChevronRight className="inline h-4 w-4 mx-2 text-white/50" />
                                            To: <span className="text-white/80">{order.shippingAddress?.split(',')[0] || "Buyer"}</span>
                                        </h3>
                                    </div>
                                </div>
                                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 text-center min-w-[150px]">
                                    <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">Fee Collected</p>
                                    <p className="text-2xl font-black">₹{order.deliveryCharge || 0}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Partner List */}
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase text-slate-400">Scanning Logistics Network...</p>
                                </div>
                            ) : sortedBoys.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sortedBoys.map((boy, index) => {
                                        const estCost = boy.distance * (boy.pricePerKm || 0);
                                        const profit = (order.deliveryCharge || 0) - estCost;
                                        const isLoss = profit < 0;
                                        const isBestMatch = index === 0;

                                        return (
                                            <motion.div
                                                key={boy.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="relative"
                                            >
                                                {isBestMatch && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 py-1 px-4 shadow-lg font-black text-[9px] uppercase tracking-tighter flex items-center gap-1.5 animate-bounce">
                                                            <Sparkles className="h-3 w-3" /> Recommended Node
                                                        </Badge>
                                                    </div>
                                                )}
                                                <Card className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                                                    <CardContent className="p-0">
                                                        <div className="p-6">
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`h-14 w-14 rounded-2xl ${isFarmer ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center font-black text-lg uppercase shadow-inner border border-current/10`}>
                                                                        {boy.name?.[0]}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-black text-slate-900 text-base">{boy.name}</h3>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200">{boy.vehicleType}</Badge>
                                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Badge className={`text-[8px] font-black uppercase px-3 py-1 border-0 rounded-lg shadow-sm ${boy.availability === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                    {boy.availability.replace('_', ' ')}
                                                                </Badge>
                                                            </div>

                                                            {/* Logistics Math Box */}
                                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Job Trip</p>
                                                                    <p className="text-sm font-black text-slate-900">{boy.distance} km</p>
                                                                    <p className="text-[8px] font-bold text-indigo-600 mt-0.5">
                                                                        {activeTab === "near_seller" 
                                                                            ? `+${boy.pickupDistance}km to farm` 
                                                                            : `${boy.boyToBuyerDistance}km from buyer`}
                                                                    </p>
                                                                </div>
                                                                <div className={`p-4 rounded-2xl border ${isLoss ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                                    <p className={`text-[8px] font-black uppercase mb-1 tracking-widest ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                        {isLoss ? 'Estimated Loss' : 'Estimated Profit'}
                                                                    </p>
                                                                    <p className={`text-sm font-black flex items-center gap-1 ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                                        {isLoss ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                                        ₹{Math.abs(profit).toFixed(0)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white mb-6 shadow-xl">
                                                                <div>
                                                                    <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Partner Payout</p>
                                                                    <p className="text-xl font-black tracking-tighter">₹{estCost.toFixed(0)}</p>
                                                                </div>
                                                                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                                    <IndianRupee className="h-5 w-5 text-indigo-400" />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {boy.hiringStatus === 'REQUESTED' && (
                                                                    <Button 
                                                                        variant="outline" 
                                                                        className="flex-1 h-12 rounded-2xl text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-[10px] uppercase"
                                                                        onClick={() => handleRevokeAction(boy.hiringJobId, boy.id)}
                                                                        disabled={hiringId === boy.id}
                                                                    >
                                                                        Revoke Request
                                                                    </Button>
                                                                )}
                                                                
                                                                <Button
                                                                    onClick={() => handleHireAction(boy.id, boy.distance)}
                                                                    disabled={hiringId === boy.id || (boy.hiringStatus && boy.hiringStatus !== 'REJECTED' && boy.hiringStatus !== 'CANCELLED')}
                                                                    className={`flex-[2] h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                                                        boy.hiringStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100' :
                                                                        boy.hiringStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
                                                                        'bg-slate-950 hover:bg-black text-white shadow-xl shadow-slate-950/20'
                                                                    }`}
                                                                >
                                                                    {hiringId === boy.id ? (
                                                                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Processing...</>
                                                                    ) : boy.hiringStatus ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <CheckCircle2 className="h-4 w-4" /> {boy.hiringStatus}
                                                                        </span>
                                                                    ) : (
                                                                        <>Confirm Hire Request <ChevronRight className="ml-1 h-4 w-4" /></>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-20 border-2 border-dashed border-gray-100 text-center shadow-lg"
                                >
                                    <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <Truck className="h-12 w-12 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">No Partners in Range</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto text-xs font-medium">
                                        Try increasing your search radius or switching tabs to find partners near the destination.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-8 rounded-2xl h-12 px-10 border-2 font-black uppercase text-[10px]"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setMaxDistance(500);
                                        }}
                                    >
                                        Expand Search
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