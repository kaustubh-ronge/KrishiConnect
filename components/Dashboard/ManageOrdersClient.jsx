
"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Package, Truck, Eye, User, Phone, Edit3, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, MapPin, Clock, Calendar,
  ArrowRight, ShoppingBag, Receipt, AlertCircle, Sparkles,
  Star, Zap, TrendingUp, Layers, IndianRupee, Target,
  LayoutGrid, List, Filter, MessageCircle, Navigation,
  Award, Crown, Shield, Heart, BarChart3, Flame,
  Box, Gift, Search, RotateCcw,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatePresence, motion } from "framer-motion";
import { updateOrderStatus, resendSelfDeliveryOtp } from "@/actions/order-tracking";
import { resendDeliveryOtp } from "@/actions/delivery-job";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_OPTIONS, DASHBOARD_THEMES, getStatusBadgeConfig } from "@/data/DashboardData/constants";

const STATUS_TRANSITIONS = {
  'PROCESSING': ['PACKED', 'CANCELLED'],
  'PACKED': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['IN_TRANSIT', 'CANCELLED'],
  'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': []
};

export default function ManageOrdersClient({ initialOrders, userType, total, hasMore, currentPage }) {

  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const theme = DASHBOARD_THEMES[userType] || DASHBOARD_THEMES.farmer;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [updateMethod, setUpdateMethod] = useState("");
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [resendingOtp, setResendingOtp] = useState(null); // stores orderId/jobId
  const [markingPaymentId, setMarkingPaymentId] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Sync orders with props when initialOrders changes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateStatus = async (formData) => {

    const status = formData.get('status');
    if (status === 'SHIPPED' || status === 'DELIVERED') {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        formData.append('lat', position.coords.latitude.toString());
        formData.append('lng', position.coords.longitude.toString());
      } catch (err) {
        console.warn("Location capture failed, proceeding without coordinates:", err);
      }
    }

    startTransition(async () => {
      const res = await updateOrderStatus(formData);

      if (res.success) {
        // Optimistic Update
        const updatedStatus = formData.get('status');
        const updatedOrderId = formData.get('orderId');
        
        setOrders(prev => prev.map(o => 
          o.id === updatedOrderId ? { ...o, orderStatus: updatedStatus } : o
        ));

        toast.success(res.message, {
          icon: <CheckCircle2 className="h-5 w-5" />,
          className: "bg-green-50 border-green-200"
        });
        setIsUpdateDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error, {
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    });
  };

  const handleResendSelfOtp = async (orderId) => {
    setResendingOtp(orderId);
    const res = await resendSelfDeliveryOtp(orderId);
    if (res.success) {
      toast.success("OTP Resent to Buyer!", {
        icon: <CheckCircle2 className="h-5 w-5" />,
        className: "bg-green-50 border-green-200"
      });
    } else {
      toast.error(res.error, {
        icon: <AlertCircle className="h-5 w-5" />
      });
    }
    setResendingOtp(null);
  };

  const handleResendPartnerOtp = async (jobId) => {
    setResendingOtp(jobId);
    const res = await resendDeliveryOtp(jobId);
    if (res.success) {
      toast.success("OTP Resent to Buyer!", {
        icon: <CheckCircle2 className="h-5 w-5" />,
        className: "bg-green-50 border-green-200"
      });
    } else {
      toast.error(res.error, {
        icon: <AlertCircle className="h-5 w-5" />
      });
    }
    setResendingOtp(null);
  };

  const openUpdateDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setUpdateMethod("");
    setUpdatePaymentStatus("");
    setOtpValue("");
    setIsUpdateDialogOpen(true);
  };

  const openViewDialog = (order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const openHireDialog = (orderId) => {
    startTransition(() => {
      router.push(`/${userType}-dashboard/manage-orders/hire/${orderId}`);
    });
  };

  const getStatusBadge = (status) => {
    const config = getStatusBadgeConfig(status, 'order');
    return (
      <Badge className={`${config.color} shadow-sm font-semibold px-4 py-2 rounded-full border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getBuyerName = (order) => {
    if (order.buyerUser.farmerProfile?.name) return order.buyerUser.farmerProfile.name;
    if (order.buyerUser.agentProfile?.name) return order.buyerUser.agentProfile.name;
    return order.buyerUser.name || order.buyerUser.email;
  };

  const getBuyerPhone = (order) => {
    if (order.buyerUser.farmerProfile?.phone) return order.buyerUser.farmerProfile.phone;
    if (order.buyerUser.agentProfile?.phone) return order.buyerUser.agentProfile.phone;
    return order.buyerPhone || 'N/A';
  };

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(o => o.orderStatus === filterStatus);

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/40 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 180, 0], y: [0, -90, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-emerald-200/25 to-green-300/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -140, 0], y: [0, 100, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-[650px] h-[650px] bg-gradient-to-tr from-blue-200/25 to-indigo-300/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-gradient-to-r from-amber-200/15 to-pink-200/15 rounded-full blur-3xl"
        />

        {/* Floating particles */}
        {mounted && [...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `linear-gradient(135deg, ${['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][i % 4]}, ${['#059669', '#2563eb', '#7c3aed', '#d97706'][i % 4]})`,
            }}
            animate={{
              y: [0, -25, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.4, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-4 py-12 max-w-7xl">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-1.5 w-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" />
                <span className="text-emerald-600 text-sm font-bold uppercase tracking-wider">Order Management</span>
              </motion.div>
              <h1 className="text-5xl font-black text-gray-900">
                Manage <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Orders</span>
              </h1>
              <p className="text-gray-500 text-lg">Track and update order status in real-time</p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-3">
              {[
                { label: "Total", value: orders.length, icon: Layers, gradient: "from-emerald-400 to-green-500", bg: "bg-emerald-50", text: "text-emerald-700" },
                { label: "Active", value: activeOrders, icon: Zap, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-700" },
                { label: "Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: TrendingUp, gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-700" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="hidden md:block"
                >
                  <div className={`${stat.bg} rounded-2xl p-4 text-center min-w-[110px] shadow-lg border border-gray-100`}>
                    <stat.icon className={`h-5 w-5 mx-auto mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Filters & View Toggle */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 border border-gray-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: "All Orders", icon: Layers },
                { id: "PROCESSING", label: "Processing", icon: Clock },
                { id: "SHIPPED", label: "Shipped", icon: Truck },
                { id: "DELIVERED", label: "Delivered", icon: CheckCircle2 }
              ].map((f) => (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterStatus(f.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${filterStatus === f.id
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("table")}
                className={`rounded-xl ${viewMode === "table" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-500"}`}
              >
                <LayoutGrid className="h-4 w-4 mr-2" /> Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("cards")}
                className={`rounded-xl ${viewMode === "cards" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-gray-500"}`}
              >
                <List className="h-4 w-4 mr-2" /> Cards
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed border-gray-300 bg-white/60 backdrop-blur-xl rounded-3xl">
              <CardContent className="text-center py-20">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg"
                >
                  <Package className="h-12 w-12 text-emerald-500" />
                </motion.div>
                <h3 className="text-3xl font-black text-gray-900 mb-3">No Orders Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-lg">Orders will appear when customers purchase your products.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === "table" ? (
          /* Table View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <TableHead className="py-5 pl-8 font-black text-xs uppercase tracking-wider text-gray-500">Order ID</TableHead>
                    <TableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Timeline</TableHead>
                    <TableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Buyer</TableHead>
                    <TableHead className="py-5 font-black text-xs uppercase tracking-wider text-gray-500">Item Preview</TableHead>
                    <TableHead className="py-5 text-center font-black text-xs uppercase tracking-wider text-gray-500">Status</TableHead>
                    <TableHead className="py-5 text-right font-black text-xs uppercase tracking-wider text-gray-500">Revenue</TableHead>
                    <TableHead className="py-5 pr-8 text-right font-black text-xs uppercase tracking-wider text-gray-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group cursor-pointer hover:bg-emerald-50/30 transition-all border-b border-gray-50"
                      onClick={() => openViewDialog(order)}
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                            #{(order.id || "").slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Order Node</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-gray-900">
                            {mounted ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {mounted ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center font-black text-emerald-600 text-sm shadow-sm group-hover:scale-110 transition-transform">
                            {getBuyerName(order)?.[0] || 'B'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{getBuyerName(order)}</p>
                            <p className="text-xs text-gray-400 font-medium">{getBuyerPhone(order)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
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
                              {order.items?.[0]?.product?.productName || 'Order Item'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {order.items?.length > 1 ? `+${order.items.length - 1} more` : 'Single Item'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {getStatusBadge(order.orderStatus)}
                          {order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID' && (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mt-1">Paid Online</span>
                          )}
                          {order.paymentStatus === 'PENDING' && (
                            <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[9px] font-bold border-amber-200 text-amber-600 bg-amber-50/50">
                              UNPAID
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-gray-900">₹{mounted ? order.totalAmount.toLocaleString('en-IN') : '---'}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Bill</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 pr-8 text-right">
                        <div className="flex justify-end gap-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 rounded-xl border-2 border-gray-200 shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              onClick={(e) => { e.stopPropagation(); openViewDialog(order); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PENDING'}
                              className={`h-10 w-10 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all ${theme.text} hover:bg-slate-50 disabled:opacity-30`}
                              onClick={(e) => { e.stopPropagation(); openUpdateDialog(order); }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => openViewDialog(order)}
                className="group cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500" />
                  <div className="relative bg-white/80 backdrop-blur-xl border-2 border-gray-100 rounded-2xl p-6 group-hover:border-emerald-200 transition-all shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-mono text-xs font-bold text-gray-400">#{(order.id || "").slice(-8).toUpperCase()}</span>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center font-black text-emerald-600">
                        {getBuyerName(order)?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{getBuyerName(order)}</p>
                        <p className="text-sm text-gray-500">{getBuyerPhone(order)}</p>
                        {order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID' && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                            <ShieldCheck className="h-3 w-3" /> Paid Online
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Total Amount</p>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-black text-gray-900">₹{mounted ? order.totalAmount.toLocaleString('en-IN') : '---'}</p>
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

        {/* Pagination */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 shadow-lg">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> of <span className="font-bold text-gray-900">{total}</span> orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => router.push(`/${userType}-dashboard/manage-orders?page=${currentPage - 1}`)}
                  className="rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-semibold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => router.push(`/${userType}-dashboard/manage-orders?page=${currentPage + 1}`)}
                  className="rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-semibold"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Update Dialog - Premium */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Edit3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Update Order Status</DialogTitle>
                <DialogDescription className="text-green-50 font-medium mt-1">Keep your buyer informed about the progress.</DialogDescription>
              </div>
            </div>
          </div>

          {selectedOrder && (
            <form action={handleUpdateStatus} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
              <input type="hidden" name="orderId" value={selectedOrder.id} />

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" /> Order Status *
                </Label>
                <Select name="status" required defaultValue={selectedOrder.orderStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-200 bg-gray-50 font-semibold text-lg hover:border-emerald-300 transition-all">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                    <SelectItem value={selectedOrder.orderStatus} className="py-3 font-semibold opacity-50">
                      {ORDER_STATUS_OPTIONS.find(o => o.value === selectedOrder.orderStatus)?.label} (Current)
                    </SelectItem>
                    {ORDER_STATUS_OPTIONS.map(option => {
                      const isValidTransition = STATUS_TRANSITIONS[selectedOrder.orderStatus]?.includes(option.value);
                      const isCurrent = option.value === selectedOrder.orderStatus;
                      if (isCurrent) return null;

                      return (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={!isValidTransition}
                          className={`py-3 font-semibold focus:bg-emerald-50 focus:text-emerald-700 ${!isValidTransition ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {option.label} {!isValidTransition && " (Invalid)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence mode="wait">
                {newStatus === "DELIVERED" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 p-8 bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 rounded-3xl border-2 border-emerald-100 shadow-inner"
                  >
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-500" /> Payment Method *
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'ONLINE', label: 'Online', icon: CreditCard, desc: 'Digital Payment' },
                            { id: 'COD', label: 'Cash/COD', icon: IndianRupee, desc: 'Hand-to-hand' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setUpdateMethod(m.id)}
                              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${updateMethod === m.id
                                ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/10'
                                : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50'
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${updateMethod === m.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'
                                }`}>
                                <m.icon className="h-5 w-5" />
                              </div>
                              <p className={`font-black text-sm ${updateMethod === m.id ? 'text-emerald-900' : 'text-gray-900'}`}>{m.label}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{m.desc}</p>
                              <input type="hidden" name="paymentMethod" value={updateMethod} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Payment Status *
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'PAID', label: 'Paid', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500' },
                            { id: 'PENDING', label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500' }
                          ].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setUpdatePaymentStatus(s.id)}
                              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${updatePaymentStatus === s.id
                                ? `border-${s.id === 'PAID' ? 'emerald' : 'amber'}-500 bg-${s.id === 'PAID' ? 'emerald' : 'amber'}-50 shadow-md`
                                : 'border-gray-100 bg-white hover:bg-gray-50'
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${updatePaymentStatus === s.id ? `${s.bg} text-white` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                }`}>
                                <s.icon className="h-5 w-5" />
                              </div>
                              <p className={`font-black text-sm ${updatePaymentStatus === s.id ? `text-${s.id === 'PAID' ? 'emerald' : 'amber'}-900` : 'text-gray-900'}`}>{s.label}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Confirmation</p>
                              <input type="hidden" name="paymentStatus" value={updatePaymentStatus} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-4 pt-4 transition-all duration-500 ${(!updateMethod || !updatePaymentStatus) ? 'opacity-30 pointer-events-none filter blur-[2px]' : 'opacity-100'}`}>
                      <div className="flex items-center justify-between">
                        <Label className="text-emerald-900 font-black flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" /> Delivery OTP (6 Digits) *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={resendingOtp === selectedOrder.id}
                          onClick={() => handleResendSelfOtp(selectedOrder.id)}
                          className="h-8 text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg"
                        >
                          {resendingOtp === selectedOrder.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                          Resend OTP
                        </Button>
                      </div>
                      <Input
                        id="otp"
                        name="otp"
                        placeholder="000000"
                        maxLength={6}
                        required
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                        disabled={!updateMethod || !updatePaymentStatus}
                        className="text-center text-5xl font-black tracking-[1.5rem] h-24 rounded-2xl bg-white border-2 border-emerald-200 focus:border-emerald-500 shadow-inner"
                      />
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider text-center">Verification required for delivery completion</p>
                    </div>
                  </motion.div>
                )}

                {(newStatus === "PACKED" || newStatus === "SHIPPED" || newStatus === "IN_TRANSIT") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200"
                  >
                    {[
                      { name: "transportProvider", label: "Transport Provider", placeholder: "e.g. Delhivery, BlueDart" },
                      { name: "vehicleNumber", label: "Vehicle Number", placeholder: "e.g. MH 12 AB 1234" },
                      { name: "driverName", label: "Driver Name", placeholder: "Driver's full name" },
                      { name: "driverPhone", label: "Driver Phone", placeholder: "Mobile number" },
                      { name: "estimatedDelivery", label: "Est. Delivery Date", type: "date", placeholder: "" },
                      { name: "currentLocation", label: "Current Location", placeholder: "e.g. Mumbai Warehouse" }
                    ].map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{field.label}</Label>
                        <Input
                          name={field.name}
                          type={field.type || "text"}
                          placeholder={field.placeholder}
                          className="h-12 rounded-xl bg-white border-2 border-indigo-100 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-500" /> Update Notes
                </Label>
                <Textarea id="notes" name="notes" placeholder="E.g., Package is ready for pickup..." rows={3}
                  className="rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-emerald-500 transition-all resize-none font-medium" />
              </div>

              {/* Recovery Actions: Resend OTP */}
              {(selectedOrder.orderStatus === 'SHIPPED' || selectedOrder.orderStatus === 'IN_TRANSIT') && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2">
                  {/* Self Delivery Resend */}
                  {!selectedOrder.deliveryJobs?.some(j => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status)) ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resendingOtp === selectedOrder.id}
                      className="w-full rounded-2xl h-12 border-2 border-gray-100 hover:border-emerald-300 font-bold flex items-center gap-2"
                      onClick={() => handleResendSelfOtp(selectedOrder.id)}
                    >
                      {resendingOtp === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Resend OTP to Buyer
                    </Button>
                  ) : (
                    /* Partner Delivery Resend */
                    (() => {
                      const activeJob = selectedOrder.deliveryJobs?.find(j => ['PICKED_UP', 'IN_TRANSIT'].includes(j.status));
                      if (activeJob) {
                        return (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={resendingOtp === activeJob.id}
                            className="w-full rounded-2xl h-12 border-2 border-gray-100 hover:border-blue-300 font-bold flex items-center gap-2"
                            onClick={() => handleResendPartnerOtp(activeJob.id)}
                          >
                            {resendingOtp === activeJob.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            Resend Partner Delivery OTP
                          </Button>
                        );
                      }
                      return null;
                    })()
                  )}
                  <p className="text-[10px] text-gray-400 text-center mt-2 uppercase font-black tracking-widest">Security Recovery Action</p>
                </motion.div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={isPending}
                  className="flex-1 rounded-2xl h-14 font-bold border-2 border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || (newStatus === "DELIVERED" && selectedOrder.deliveryJobs?.some(j => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status)))}
                  className="flex-1 rounded-2xl h-14 font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-xl shadow-emerald-500/25 transition-all">
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Update Status
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog - Premium */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden rounded-3xl border-0 shadow-2xl p-0 flex flex-col bg-white">
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 text-white relative overflow-hidden shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white font-bold px-4 py-2 rounded-full">
                  #{selectedOrder?.id.slice(-8).toUpperCase()}
                </Badge>
                {selectedOrder && getStatusBadge(selectedOrder.orderStatus)}
              </div>
              <DialogTitle className="text-4xl font-black mb-1">Order Details</DialogTitle>
              <DialogDescription className="text-green-50 font-medium">
                Placed on {selectedOrder && mounted ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
              </DialogDescription>
            </motion.div>
            <Package className="absolute -right-10 -bottom-10 h-64 w-64 text-white/10 rotate-12" />
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-white to-gray-50/50">
            {selectedOrder && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-500" /> Buyer Information
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-2xl shadow-inner">
                        {getBuyerName(selectedOrder)?.[0]}
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-900">{getBuyerName(selectedOrder)}</p>
                        <p className="text-sm font-semibold text-gray-500">{getBuyerPhone(selectedOrder)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="font-medium">{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-2xl">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-emerald-400" /> Payment Details
                    </h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <Badge className={`border-0 font-bold uppercase text-xs mb-3 ${selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {selectedOrder.paymentMethod === 'ONLINE' && selectedOrder.paymentStatus === 'PAID' ? 'PAID ONLINE' : selectedOrder.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'}
                        </Badge>
                        <p className="text-3xl font-black">₹{mounted ? selectedOrder.totalAmount.toLocaleString('en-IN') : '---'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Method</p>
                        <p className="font-bold uppercase">{selectedOrder.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-amber-500" /> Ordered Items
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-5 p-4 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 shrink-0 relative group">
                          {item.product?.images?.[0] ? (
                            <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-lg font-black text-gray-900">{item.product.productName}</h5>
                          <p className="text-sm font-bold text-gray-500">
                            {item.quantity} {item.product.unit} × ₹{mounted ? item.priceAtPurchase.toLocaleString('en-IN') : '---'}
                          </p>
                        </div>
                        <p className="text-xl font-black text-emerald-600">₹{mounted ? (item.quantity * item.priceAtPurchase).toLocaleString('en-IN') : '---'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.tracking && selectedOrder.tracking.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-500" /> Tracking History
                    </h4>
                    <div className="space-y-4">
                      {selectedOrder.tracking.slice().reverse().map((track, i) => (
                        <div key={track.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <CheckCircle2 className={`h-5 w-5 mt-0.5 ${i === 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
                          <div>
                            <p className="text-gray-900 font-bold">{track.status}</p>
                            <p className="text-gray-500 text-sm">{mounted ? new Date(track.createdAt).toLocaleString('en-IN') : '---'}</p>
                            {track.notes && <p className="text-gray-600 text-sm mt-1 bg-gray-50 p-2 rounded-lg">{track.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 shrink-0">
            <Button
              variant="ghost"
              onClick={() => setIsViewDialogOpen(false)}
              className="rounded-2xl font-bold text-gray-500 hover:text-gray-900"
            >
              Back
            </Button>

            {selectedOrder && selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED' && (
              <div className="flex-grow flex gap-4">
                <Button
                  onClick={() => { setIsViewDialogOpen(false); openUpdateDialog(selectedOrder); }}
                  className="flex-grow rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25"
                >
                  <Edit3 className="h-5 w-5 mr-2" /> Update Status
                </Button>

                {(!selectedOrder.deliveryJobs || selectedOrder.deliveryJobs.length === 0 || selectedOrder.deliveryJobs.every(j => j.status === 'REJECTED' || j.status === 'CANCELLED')) && (
                  <div className="flex-grow flex flex-col gap-1">
                    <Button
                      onClick={() => { setIsViewDialogOpen(false); openHireDialog(selectedOrder.id); }}
                      disabled={isPending || (selectedOrder.paymentMethod === 'ONLINE' && selectedOrder.paymentStatus === 'PENDING') || selectedOrder.orderStatus !== 'PROCESSING'}
                      className="w-full rounded-2xl font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/25 disabled:opacity-30"
                    >
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Truck className="h-5 w-5 mr-2" />} 
                      Hire Courier
                    </Button>
                    {selectedOrder.paymentMethod === 'ONLINE' && selectedOrder.paymentStatus === 'PENDING' && (
                      <p className="text-[9px] text-amber-600 font-bold text-center px-2">Awaiting online payment confirmation</p>
                    )}
                    {selectedOrder.orderStatus !== 'PROCESSING' && (
                      <p className="text-[9px] text-red-600 font-bold text-center px-2">Self-delivery in progress (cannot hire)</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedOrder && (selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CANCELLED') && (
              <div className="flex-grow flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-gray-400 font-bold uppercase text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Finalized
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}