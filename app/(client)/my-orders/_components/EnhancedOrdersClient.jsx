
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Package, Calendar, Download, AlertTriangle,
    Star, Truck, CheckCircle2, MapPin, Clock, ArrowRight, ClipboardList,
    ShoppingBag, Sparkles, Zap, Receipt, PackageCheck,
    ChevronRight, Filter, Search, Eye, Shield, Award,
    Navigation, Layers, Gift, Leaf, ShoppingCart, TrendingUp,
    Heart, Share2, RotateCcw, Crown, Gem, Flame,
    IndianRupee, Target, LayoutGrid, List
} from "lucide-react";
import {
    Table as ShadcnTable,
    TableBody as ShadcnTableBody,
    TableCell as ShadcnTableCell,
    TableHead as ShadcnTableHead,
    TableHeader as ShadcnTableHeader,
    TableRow as ShadcnTableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createDispute } from "@/actions/disputes";
import { downloadInvoice } from "@/lib/invoiceUtils";
import dynamic from "next/dynamic";

const TrackingMap = dynamic(() => import("@/components/LeafletTrackingMap"), { ssr: false });

const TRACKING_STEPS = [
    { id: 'PROCESSING', label: 'Confirmed', icon: CheckCircle2, gradient: "from-amber-400 to-orange-500" },
    { id: 'PACKED', label: 'Packed', icon: Package, gradient: "from-blue-400 to-cyan-500" },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck, gradient: "from-indigo-400 to-blue-500" },
    { id: 'IN_TRANSIT', label: 'Moving', icon: Navigation, gradient: "from-purple-400 to-violet-500" },
    { id: 'DELIVERED', label: 'Delivered', icon: Gift, gradient: "from-emerald-400 to-green-500" }
];

export default function EnhancedOrdersClient({ initialOrders }) {
    const router = useRouter();
    const [isDisputeOpen, setIsDisputeOpen] = useState(false);
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [disputeReason, setDisputeReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");

    const filteredOrders = initialOrders?.filter(order => {
        if (activeFilter === "all") return true;
        if (activeFilter === "active") return !['DELIVERED', 'CANCELLED'].includes(order.orderStatus);
        if (activeFilter === "delivered") return order.orderStatus === 'DELIVERED';
        if (activeFilter === "cancelled") return order.orderStatus === 'CANCELLED';
        return true;
    })?.filter(order => {
        if (!searchTerm) return true;
        return order.items.some(item =>
            item.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleDownload = (order) => {
        try {
            toast.success("Invoice downloaded!", { icon: <Receipt className="h-5 w-5" /> });
            downloadInvoice(order);
        } catch {
            toast.error("Failed to generate PDF");
        }
    };

    const openDisputeModal = (order) => {
        setSelectedOrder(order);
        setDisputeReason("");
        setIsDisputeOpen(true);
    };

    const openTrackingModal = (order) => {
        setSelectedOrder(order);
        setIsTrackingOpen(true);
    };

    const openViewModal = (order) => {
        setSelectedOrder(order);
        setIsViewOpen(true);
    };

    const handleSubmitDispute = async () => {
        if (!disputeReason.trim()) {
            toast.error("Please describe the issue");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("orderId", selectedOrder.id);
        formData.append("reason", disputeReason);
        const res = await createDispute(formData);
        if (res.success) {
            toast.success("Dispute filed successfully");
            setIsDisputeOpen(false);
            router.refresh();
        } else {
            toast.error("Failed", { description: res.error });
        }
        setIsSubmitting(false);
    };

    const getCurrentStepIndex = (status) => {
        return TRACKING_STEPS.findIndex(step => step.id === status);
    };

    if (!initialOrders || initialOrders.length === 0) {
        return (
            <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: `linear-gradient(135deg, ${['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][i % 4]}, ${['#059669', '#2563eb', '#7c3aed', '#d97706'][i % 4]})`,
                            }}
                            animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.3, 0.8] }}
                            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="relative z-10 w-full max-w-lg mx-4"
                >
                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-gray-200/30 p-10 text-center">
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="inline-flex mb-8"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                <ShoppingBag className="h-12 w-12 text-white" />
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3">No Orders Yet</h2>
                        <p className="text-gray-500 text-lg mb-8">Start shopping to see your orders here!</p>
                        <Button asChild className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl px-8 h-14 font-bold shadow-xl shadow-emerald-500/25 transition-all">
                            <Link href="/marketplace">Explore Marketplace <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 150, 0], y: [0, -80, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/20 to-green-300/15 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, -120, 0], y: [0, 90, 0] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-40 -left-40 w-[700px] h-[700px] bg-gradient-to-tr from-blue-200/20 to-indigo-300/15 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-1.5 w-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" />
                                <span className="text-emerald-600 text-sm font-bold uppercase tracking-wider">Order History</span>
                            </div>
                            <h1 className="text-5xl font-black text-gray-900">
                                My <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Orders</span>
                            </h1>
                            <p className="text-gray-500 text-lg">Track and manage your purchases</p>
                        </div>

                        <div className="flex gap-3">
                            {[
                                { label: "Total", value: initialOrders.length, icon: Layers, bg: "bg-emerald-50", text: "text-emerald-700" },
                                { label: "Delivered", value: initialOrders.filter(o => o.orderStatus === 'DELIVERED').length, icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700" },
                                { label: "Active", value: initialOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length, icon: Zap, bg: "bg-blue-50", text: "text-blue-700" }
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="hidden md:block"
                                >
                                    <div className={`${stat.bg} rounded-2xl p-4 text-center min-w-[100px] shadow-lg border border-gray-100`}>
                                        <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.text}`} />
                                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                        <p className="text-xs font-semibold text-gray-600 uppercase">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-2 flex-wrap bg-white/70 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200 shadow-lg">
                            {[
                                { id: "all", label: "All", icon: Layers },
                                { id: "active", label: "Active", icon: Zap },
                                { id: "delivered", label: "Delivered", icon: CheckCircle2 },
                                { id: "cancelled", label: "Cancelled", icon: AlertTriangle }
                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveFilter(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeFilter === tab.id
                                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                                        : "text-gray-600 hover:bg-white"
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </motion.button>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-full text-sm w-full sm:w-64 focus:border-emerald-400 transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex gap-1 bg-white/70 backdrop-blur-xl rounded-2xl p-1 border border-gray-200">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode("table")}
                                    className={`rounded-xl ${viewMode === "table" ? "bg-emerald-50 text-emerald-700" : "text-gray-500"}`}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode("cards")}
                                    className={`rounded-xl ${viewMode === "cards" ? "bg-emerald-50 text-emerald-700" : "text-gray-500"}`}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                {viewMode === "table" ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="rounded-3xl border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                            <ShadcnTable>
                                <ShadcnTableHeader>
                                    <ShadcnTableRow className="hover:bg-transparent border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                        <ShadcnTableHead className="py-5 pl-8 font-black text-xs uppercase tracking-wider text-gray-500">Order ID</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Date & Time</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Seller</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Product</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 text-center font-black text-xs uppercase tracking-wider text-gray-500">Status</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 text-right font-black text-xs uppercase tracking-wider text-gray-500">Amount</ShadcnTableHead>
                                        <ShadcnTableHead className="py-5 pr-8 text-right font-black text-xs uppercase tracking-wider text-gray-500">Actions</ShadcnTableHead>
                                    </ShadcnTableRow>
                                </ShadcnTableHeader>
                                <ShadcnTableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredOrders?.length === 0 ? (
                                            <ShadcnTableRow>
                                                <ShadcnTableCell colSpan={7} className="h-40 text-center text-gray-400 font-medium">
                                                    <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                                    No orders found
                                                </ShadcnTableCell>
                                            </ShadcnTableRow>
                                        ) : (
                                            filteredOrders?.map((order) => (
                                                <ShadcnTableRow
                                                    key={order.id}
                                                    className="group cursor-pointer hover:bg-emerald-50/30 transition-all border-b border-gray-50"
                                                    onClick={() => openViewModal(order)}
                                                >
                                                    <ShadcnTableCell className="py-5 pl-8">
                                                        <span className="font-mono font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                                                            #{(order.id || "").slice(-8).toUpperCase()}
                                                        </span>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-medium">
                                                                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center font-black text-emerald-600 text-xs shadow-sm">
                                                                {order.items?.[0]?.product?.sellerType?.[0]?.toUpperCase() || 'S'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">
                                                                    {order.items?.[0]?.product?.sellerType === 'farmer'
                                                                        ? order.items[0].product.farmer?.name
                                                                        : order.items[0]?.product?.agent?.companyName || 'Seller'}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {order.items?.[0]?.product?.farmer?.city || order.items?.[0]?.product?.agent?.city || 'India'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {order.items?.[0]?.product?.images?.[0] ? (
                                                                    <img src={order.items[0].product.images[0]} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="h-4 w-4 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700 truncate max-w-[140px]">
                                                                    {order.items?.[0]?.product?.productName || 'Product'}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 font-medium">
                                                                    Qty: {order.items?.[0]?.quantity} {order.items?.[0]?.product?.unit}
                                                                    {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <Badge className={`px-3 py-1 rounded-full text-[10px] font-black border-0 ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                                                                order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                                    order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {order.orderStatus}
                                                            </Badge>
                                                            {order.paymentStatus === 'PENDING' && (
                                                                <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[9px] font-bold border-amber-200 text-amber-600 bg-amber-50/50">
                                                                    UNPAID
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5 text-right">
                                                        <span className="text-lg font-black text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                                                    </ShadcnTableCell>
                                                    <ShadcnTableCell className="py-5 pr-8 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600" onClick={(e) => { e.stopPropagation(); openViewModal(order); }}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </motion.div>
                                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); handleDownload(order); }}>
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </motion.div>
                                                            {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-purple-50 hover:text-purple-600" onClick={(e) => { e.stopPropagation(); openTrackingModal(order); }}>
                                                                        <MapPin className="h-4 w-4" />
                                                                    </Button>
                                                                </motion.div>
                                                            )}
                                                            {order.orderStatus === 'DELIVERED' && (
                                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-amber-50 hover:text-amber-600" asChild onClick={(e) => e.stopPropagation()}>
                                                                        <Link href={`/my-orders/review/${order.id}?productId=${order.items[0]?.productId}`}>
                                                                            <Star className="h-4 w-4" />
                                                                        </Link>
                                                                    </Button>
                                                                </motion.div>
                                                            )}
                                                            {(() => {
                                                                if (order.disputeStatus) {
                                                                    return (
                                                                        <div className="h-9 w-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl" title="Dispute Open">
                                                                            <Shield className="h-4 w-4" />
                                                                        </div>
                                                                    );
                                                                }

                                                                const isDelivered = order.orderStatus === 'DELIVERED';
                                                                const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : (isDelivered ? new Date(order.updatedAt) : null);
                                                                const isWithin48h = !deliveredAt || (new Date() - deliveredAt) / (1000 * 60 * 60) <= 48;

                                                                if (isDelivered && isWithin48h) {
                                                                    return (
                                                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); openDisputeModal(order); }}>
                                                                                <AlertTriangle className="h-4 w-4" />
                                                                            </Button>
                                                                        </motion.div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    </ShadcnTableCell>
                                                </ShadcnTableRow>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </ShadcnTableBody>
                            </ShadcnTable>
                        </Card>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrders?.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -5 }}
                                onClick={() => openViewModal(order)}
                                className="group cursor-pointer"
                            >
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500" />
                                    <div className="relative bg-white/80 backdrop-blur-xl border-2 border-gray-100 rounded-2xl p-6 group-hover:border-emerald-200 transition-all shadow-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="font-mono text-xs font-bold text-gray-400">#{(order.id || "").slice(-8).toUpperCase()}</span>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Badge className={`px-3 py-1 rounded-full text-[10px] font-black border-0 ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {order.orderStatus}
                                                </Badge>
                                                {order.paymentStatus === 'PENDING' && (
                                                    <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[9px] font-bold border-amber-200 text-amber-600 bg-amber-50/50">
                                                        UNPAID
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center font-black text-emerald-600">
                                                {order.items?.[0]?.product?.sellerType?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 truncate">
                                                    {order.items?.[0]?.product?.sellerType === 'farmer'
                                                        ? order.items[0].product.farmer?.name
                                                        : order.items[0]?.product?.agent?.companyName || 'Seller'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="text-xs text-gray-400 font-bold uppercase">Amount</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-2xl font-black text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                        <Button size="icon" className="h-10 w-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all">
                                                            <Eye className="h-5 w-5" />
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[750px] p-0 border-0 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-8 text-white relative overflow-hidden shrink-0">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
                            <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white font-bold px-4 py-2 rounded-full mb-3">
                                #{selectedOrder?.id.slice(-8).toUpperCase()}
                            </Badge>
                            <h2 className="text-3xl font-black">Order Summary</h2>
                            <p className="text-green-50 font-medium mt-1">
                                Placed on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </motion.div>
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <PackageCheck className="h-40 w-40 rotate-12" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-white to-gray-50/50 custom-scrollbar">
                        {selectedOrder && (
                            <>
                                {/* Status Timeline */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-500" /> Delivery Address
                                        </h4>
                                        <p className="font-bold text-gray-900 leading-relaxed">
                                            {selectedOrder.shippingAddress || "No address provided"}
                                        </p>
                                        {selectedOrder.lat && (
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="text-[10px] border-gray-200">Lat: {selectedOrder.lat.toFixed(4)}</Badge>
                                                <Badge variant="outline" className="text-[10px] border-gray-200">Lng: {selectedOrder.lng.toFixed(4)}</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-emerald-400" /> Order Total
                                            </h4>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <Badge className="bg-emerald-500 text-white border-0 font-bold uppercase text-[10px] mb-3">Paid via {selectedOrder.paymentMethod}</Badge>
                                                    <p className="text-4xl font-black">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10">
                                            <Sparkles className="h-24 w-24" />
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingBag className="h-4 w-4 text-amber-500" /> Purchased Items
                                    </h4>
                                    <div className="bg-white rounded-2xl border-2 border-gray-100 divide-y divide-gray-50 shadow-sm">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-5 p-5 hover:bg-gray-50/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-gray-200 overflow-hidden shrink-0 relative shadow-inner">
                                                    {item.product?.images?.[0] ? (
                                                        <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package className="h-8 w-8 text-gray-300" /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-black text-gray-900 text-lg truncate">{item.product.productName}</h5>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge variant="outline" className="bg-white border-gray-200 text-gray-600 font-bold">
                                                            {item.quantity} {item.product.unit}
                                                        </Badge>
                                                        <span className="text-gray-400 text-sm font-medium">×</span>
                                                        <span className="text-gray-600 font-bold">₹{item.priceAtPurchase.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-emerald-600">₹{(item.quantity * item.priceAtPurchase).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Seller Info */}
                                <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-emerald-600 border border-emerald-100">
                                            {selectedOrder.items?.[0]?.product?.sellerType?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sold By</p>
                                            <p className="font-bold text-gray-900">
                                                {selectedOrder.items?.[0]?.product?.sellerType === 'farmer'
                                                    ? selectedOrder.items[0].product.farmer?.name
                                                    : selectedOrder.items[0]?.product?.agent?.companyName || 'Verified Seller'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-white" asChild>
                                        <Link href={`/profile/${selectedOrder.items?.[0]?.product?.farmerId || selectedOrder.items?.[0]?.product?.agentId}`}>
                                            Visit Profile
                                        </Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t-2 border-gray-100 flex gap-4 shrink-0">
                        <Button variant="ghost" onClick={() => setIsViewOpen(false)} className="flex-1 rounded-2xl h-14 font-black text-gray-500 hover:bg-gray-100 uppercase tracking-widest text-xs transition-all">Close</Button>
                        {selectedOrder?.orderStatus !== 'CANCELLED' && selectedOrder?.orderStatus !== 'DELIVERED' && (
                            <Button onClick={() => { setIsViewOpen(false); openTrackingModal(selectedOrder); }} className="flex-[2] rounded-2xl h-14 font-black bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                                <Navigation className="h-5 w-5 mr-3" /> Track My Order
                            </Button>
                        )}
                        {selectedOrder?.orderStatus === 'DELIVERED' && (
                            <Button onClick={() => handleDownload(selectedOrder)} className="flex-[2] rounded-2xl h-14 font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                                <Download className="h-5 w-5 mr-3" /> Download Invoice
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tracking Dialog */}
            <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
                <DialogContent className="sm:max-w-[650px] p-0 border-0 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                <Truck className="h-7 w-7" /> Live Tracking
                            </DialogTitle>
                            <DialogDescription className="text-green-50">Order #{selectedOrder?.id.slice(-8).toUpperCase()}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {selectedOrder && (
                            <>
                                <div className="h-[300px] bg-gray-100">
                                    <TrackingMap
                                        buyerLoc={{ lat: selectedOrder.lat, lng: selectedOrder.lng }}
                                        sellerLoc={selectedOrder.items[0]?.product?.farmer ? { lat: selectedOrder.items[0].product.farmer.lat, lng: selectedOrder.items[0].product.farmer.lng } : { lat: selectedOrder.items[0]?.product?.agent?.lat, lng: selectedOrder.items[0]?.product?.agent?.lng }}
                                        deliveryLoc={selectedOrder.deliveryJobs?.[0]?.currentLat ? { lat: selectedOrder.deliveryJobs[0].currentLat, lng: selectedOrder.deliveryJobs[0].currentLng } : null}
                                    />
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="relative flex justify-between">
                                        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                                        <motion.div
                                            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(getCurrentStepIndex(selectedOrder.orderStatus) / (TRACKING_STEPS.length - 1)) * 100}%` }}
                                        />
                                        {TRACKING_STEPS.map((step, idx) => {
                                            const isActive = idx <= getCurrentStepIndex(selectedOrder.orderStatus);
                                            return (
                                                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg` : 'bg-gray-100 text-gray-400'}`}>
                                                        <step.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t shrink-0">
                        <Button onClick={() => setIsTrackingOpen(false)} variant="outline" className="w-full rounded-2xl h-12 font-bold">Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 border-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                <AlertTriangle className="h-7 w-7" /> Report Issue
                            </DialogTitle>
                            <DialogDescription className="text-red-50">We'll resolve within 24-48 hours</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-gray-700">Describe the problem</Label>
                            <Textarea
                                placeholder="What went wrong with your order?"
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="min-h-[140px] bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-red-400"
                            />
                        </div>
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3">
                            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-800 font-medium">We'll contact you via registered phone number.</p>
                        </div>
                    </div>
                    <div className="p-8 pt-0 flex gap-3">
                        <Button variant="outline" onClick={() => setIsDisputeOpen(false)} className="flex-1 rounded-2xl h-14 font-bold">Cancel</Button>
                        <Button onClick={handleSubmitDispute} disabled={isSubmitting} className="flex-1 rounded-2xl h-14 font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg">
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}