
"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Banknote,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle2,
  Search,
  Building2,
  ArrowUpRight,
  UserCheck,
  ShoppingBag,
  Activity,
  XCircle,
  CreditCard,
  Truck,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const CUSTOM_SCROLLBAR_CSS = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    border: 2px solid #f1f5f9;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

export default function AdminDashboardClient({
  initialStats = null,
  initialOrders = [],
  settleAction,
  viewBankAction,
  statsAction,
  ordersAction,
  initialPendingProfiles = [],
  approveAction,
  rejectAction,
  getPendingAction
}) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [pendingProfiles, setPendingProfiles] = useState(initialPendingProfiles);
  const [loadingId, setLoadingId] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Bank Details Modal State
  const [bankDetails, setBankDetails] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- REAL-TIME POLLING ---
  // Poll for updates every 10 seconds to ensure data is "immediate" without refresh
  useEffect(() => {
    const refreshData = async () => {
      try {
        // Fetch stats, orders, and pending profiles in parallel
        const [s, o, p] = await Promise.all([
          statsAction ? statsAction() : null,
          ordersAction ? ordersAction() : null,
          getPendingAction ? getPendingAction() : null
        ]);

        if (s?.success) setStats(s.data);
        if (o?.success) setOrders(o.data);
        if (p?.success) setPendingProfiles(p.data);
      } catch (err) {
        console.error("Dashboard auto-refresh failed:", err);
      }
    };

    const intervalId = setInterval(refreshData, 10000);
    return () => clearInterval(intervalId);
  }, [statsAction, ordersAction, getPendingAction]);

  // --- ACTIONS ---
  async function handleSettle(orderId) {
    if (!settleAction) return toast.error('Action not available');
    setLoadingId(orderId);

    try {
      const res = await settleAction(orderId);
      if (!res || !res.success) throw new Error(res?.error || 'Failed to settle');

      toast.success('Payout marked as settled');

      if (statsAction) {
        const s = await statsAction();
        if (s?.success) setStats(s.data);
      }
      if (ordersAction) {
        const o = await ordersAction();
        if (o?.success) setOrders(o.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleViewBank(orderId) {
    if (!viewBankAction) return toast.error('Action not available');
    setLoadingId(`bank-${orderId}`);

    try {
      const res = await viewBankAction(orderId);
      if (!res || !res.success) throw new Error(res?.error || 'Failed to fetch details');

      setBankDetails(res.data);
      setIsBankModalOpen(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleApproveProfile(userId, role) {
    if (!approveAction) return toast.error('Action not available');
    if (loadingId) return; // Prevent concurrent clicks
    
    setLoadingId(`approve-${userId}`);
    const previous = pendingProfiles;

    try {
      // Optimistic update: filter out the approved profile immediately
      setPendingProfiles(prev => prev.filter(p => p.userId !== userId));

      const res = await approveAction(userId, role);
      if (!res || !res.success) {
        setPendingProfiles(previous); // Rollback on failure
        throw new Error(res?.error || 'Failed to approve');
      }

      toast.success('Profile approved for selling!');

      // Refresh in background if needed
      if (getPendingAction) {
        getPendingAction().then(p => {
          if (p?.success) setPendingProfiles(p.data);
        });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRejectProfile(userId, role) {
    if (!rejectAction) return toast.error('Action not available');
    if (loadingId) return;

    setLoadingId(`reject-${userId}`);
    const previous = pendingProfiles;

    try {
      setPendingProfiles(prev => prev.filter(p => p.userId !== userId));

      const res = await rejectAction(userId, role);
      if (!res || !res.success) {
        setPendingProfiles(previous);
        throw new Error(res?.error || 'Failed to reject');
      }

      toast.success('Profile request rejected.');

      if (getPendingAction) {
        getPendingAction().then(p => {
          if (p?.success) setPendingProfiles(p.data);
        });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  // --- HELPERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm';
      case 'SETTLED': return 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm';
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden pb-20 font-sans">
      <style>{CUSTOM_SCROLLBAR_CSS}</style>

      {/* --- BEAUTIFUL ANIMATED BACKGROUND --- */}
      <div className="absolute top-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-slate-50 to-transparent pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-blue-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-40 -left-20 w-[20rem] h-[20rem] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 p-6 md:p-10 space-y-10 max-w-[1400px] mx-auto">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm">Admin Control Center</h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Monitor platform operations, settle payouts, and approve new seller requests.</p>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          {/* BEAUTIFIED TABS */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <TabsList className="inline-flex w-full max-w-lg h-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-xl p-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white mb-10">
              <TabsTrigger value="overview" className="h-full w-full rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300">
                <Activity className="h-4 w-4 mr-2 hidden sm:inline" /> Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="h-full w-full rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300">
                <ShoppingBag className="h-4 w-4 mr-2 hidden sm:inline" /> Orders
              </TabsTrigger>
              <TabsTrigger value="approvals" className="relative h-full w-full rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300">
                <UserCheck className="h-4 w-4 mr-2 hidden sm:inline" /> Approvals
                {pendingProfiles.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md ring-2 ring-white">
                    {pendingProfiles.length}
                  </motion.span>
                )}
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* OVERVIEW TAB - CARDS UNTOUCHED AS REQUESTED */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total GMV</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalGMV)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Gross Merchandise Value</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
                  <Banknote className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalPlatformRevenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total earnings from fees</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayouts)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Due to sellers</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/disputes'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Disputes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.openDisputes || 0}</div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    Needs attention
                    <ArrowUpRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ORDERS TAB - BEAUTIFIED */}
          <TabsContent value="orders" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-white/50">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shadow-sm">
                      <Search className="h-5 w-5" />
                    </div>
                    Recent Orders
                  </h2>
                </div>
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                          <TableHead className="w-[120px] font-bold text-slate-500 uppercase text-xs tracking-wider py-5 pl-8">Order ID</TableHead>
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5">Buyer Details</TableHead>
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5">Financials</TableHead>
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5">Status</TableHead>
                          <TableHead className="text-right font-bold text-slate-500 uppercase text-xs tracking-wider py-5 pr-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center text-slate-500 font-medium text-lg">
                              No orders found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          orders.map((o) => (
                            <TableRow key={o.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 group">
                              <TableCell className="align-top py-6 pl-8">
                                <span className="font-black text-slate-900 text-sm">#{o.id.slice(-6).toUpperCase()}</span>
                                <div className="text-xs text-slate-500 font-semibold mt-1.5">
                                  {isClient ? new Date(o.createdAt).toLocaleDateString() : "..."}
                                </div>
                              </TableCell>

                              <TableCell className="align-top py-6">
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-slate-900 text-sm">{o.buyer?.name || "Unknown"}</span>
                                  <span className="text-xs text-slate-500 font-medium">{o.buyer?.email}</span>
                                  <span className="text-xs text-slate-500 font-medium">{o.buyer?.phone}</span>
                                </div>
                              </TableCell>

                              <TableCell className="align-top py-6">
                                <div className="space-y-2 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-100 inline-block min-w-[220px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total:</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(o.totalAmount)}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Fee:</span>
                                    <span className="text-emerald-600 font-bold">+{formatCurrency(o.platformFee)}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1.5">
                                    <span className="text-slate-700 font-black text-xs uppercase tracking-wider">Seller:</span>
                                    <span className="font-black text-slate-900 text-base">{formatCurrency(o.sellerAmount)}</span>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="align-top py-6 space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 w-12 tracking-widest">Pay</span>
                                  <Badge variant="outline" className={`px-3 py-1 font-bold uppercase tracking-wider text-[10px] ${getStatusColor(o.paymentStatus)}`}>
                                    {o.paymentStatus}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 w-12 tracking-widest">Payout</span>
                                  <Badge variant="outline" className={`px-3 py-1 font-bold uppercase tracking-wider text-[10px] ${getStatusColor(o.payoutStatus)}`}>
                                    {o.payoutStatus}
                                  </Badge>
                                </div>
                              </TableCell>

                              <TableCell className="text-right align-top py-6 pr-8">
                                <div className="flex flex-col gap-2.5 items-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 gap-2 w-[150px] justify-start border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                    onClick={() => handleViewBank(o.id)}
                                    disabled={loadingId === `bank-${o.id}`}
                                  >
                                    {loadingId === `bank-${o.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                                    Bank Details
                                  </Button>

                                  {o.payoutStatus !== 'SETTLED' && (
                                    <Button
                                      size="sm"
                                      className="h-10 gap-2 w-[150px] justify-start bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold transition-all hover:-translate-y-0.5"
                                      onClick={() => handleSettle(o.id)}
                                      disabled={loadingId === o.id || o.paymentStatus !== 'PAID'}
                                    >
                                      {loadingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                      Mark Settled
                                    </Button>
                                  )}

                                  {o.payoutStatus === 'SETTLED' && (
                                    <div className="flex items-center justify-start gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 px-4 h-10 w-[150px] rounded-lg border border-indigo-100 shadow-sm">
                                      <CheckCircle2 className="h-4 w-4" /> Settled
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* APPROVALS TAB - BEAUTIFIED */}
          <TabsContent value="approvals" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-white/50">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-100/50 text-amber-600 shadow-sm">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    Pending Selling Requests
                  </h2>
                </div>
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5 pl-8">User Details</TableHead>
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5">Role</TableHead>
                          <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider py-5">Requested On</TableHead>
                          <TableHead className="text-right font-bold text-slate-500 uppercase text-xs tracking-wider py-5 pr-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingProfiles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-40 text-center text-slate-500 font-medium text-lg">
                              No pending requests. All caught up! 🎉
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingProfiles.map((p) => (
                            <TableRow key={p.userId} className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0 group">
                              <TableCell className="align-middle py-6 pl-8">
                                <div className="flex flex-col gap-1">
                                  <span className="font-extrabold text-slate-900 text-base">{p.name || p.companyName || p.farmName}</span>
                                  <span className="text-xs text-slate-500 font-medium">{p.user?.email}</span>
                                  <span className="text-xs text-slate-500 font-medium">{p.phone}</span>
                                  {p.role === 'delivery' && (
                                    <div className="mt-2 grid grid-cols-1 gap-1 border-t pt-2 border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Details</span>
                                      <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                        <Truck className="h-3 w-3" /> {p.vehicleType} • {p.vehicleNumber}
                                      </span>
                                      <span className="text-xs text-slate-600 font-semibold">DL: {p.licenseNumber}</span>
                                      <span className="text-xs text-slate-600 font-semibold">Aadhar: {p.aadharNumber}</span>
                                    </div>
                                  )}
                                  <div className="mt-3 flex gap-2">
                                    {(p.aadharFront || p.aadharBack || p.licenseImage) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                                        onClick={() => {
                                          setSelectedDocs(p);
                                          setIsDocsModalOpen(true);
                                        }}
                                      >
                                        <Eye className="h-3 w-3" /> View Documents
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-middle py-6">
                                <Badge variant="outline" className="capitalize bg-slate-100 text-slate-700 border-none px-3 py-1 shadow-sm font-bold tracking-wide">
                                  {p.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-middle py-6 text-sm text-slate-600 font-semibold">
                                {isClient ? new Date(p.updatedAt).toLocaleDateString() : "..."}
                              </TableCell>
                              <TableCell className="text-right align-middle py-6 pr-8">
                                <div className="flex justify-end gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold shadow-sm transition-all"
                                    onClick={() => handleRejectProfile(p.userId, p.role)}
                                    disabled={loadingId === `reject-${p.userId}` || loadingId === `approve-${p.userId}`}
                                  >
                                    {loadingId === `reject-${p.userId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-10 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all hover:-translate-y-0.5"
                                    onClick={() => handleApproveProfile(p.userId, p.role)}
                                    disabled={loadingId === `approve-${p.userId}` || loadingId === `reject-${p.userId}`}
                                  >
                                    {loadingId === `approve-${p.userId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Approve
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* BANK DETAILS DIALOG - BEAUTIFIED */}
        <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
          <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2rem] overflow-hidden max-h-[95vh] flex flex-col custom-scrollbar">
            <DialogHeader className="px-10 pt-10 pb-6 border-b border-slate-100 bg-slate-50/50 m-0 shrink-0">
              <DialogTitle className="flex items-center gap-4 text-3xl font-black text-slate-900 tracking-tight">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm">
                  <CreditCard className="h-8 w-8" />
                </div>
                Seller Settlement Hub
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-bold pt-3 text-base">
                Review and verify banking nodes for all participants in this order.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow bg-slate-50/20 custom-scrollbar">
              <div className="p-10 space-y-8 custom-scrollbar">
              {bankDetails?.sellers?.map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-5 hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300 group-hover:bg-indigo-400 transition-colors duration-300"></div>

                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight">{item.productName}</p>
                      <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 border-none px-2.5 py-0.5">
                        {item.sellerType}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-sm">
                    {item.sellerProfile ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Account Name</span>
                          <span className="font-extrabold text-slate-900">{item.sellerProfile.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Bank Name</span>
                          <span className="font-extrabold text-slate-900">{item.sellerProfile.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Account No</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 tracking-wider">
                            {item.sellerProfile.accountNumber || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">IFSC Code</span>
                          <span className="font-mono font-bold text-slate-800 tracking-wider">{item.sellerProfile.ifscCode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100 border-dashed">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">UPI ID</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60 tracking-wider">
                            {item.sellerProfile.upiId || 'N/A'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-rose-700 bg-rose-50 border border-rose-200/60 p-4 rounded-xl text-sm font-bold">
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                        No bank details linked for this seller.
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Delivery Partners Section */}
              {bankDetails?.deliveryPartners?.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Delivery Partners</h4>
                  {bankDetails.deliveryPartners.map((partner, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/30 shadow-sm space-y-5 hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400"></div>

                      <div className="flex justify-between items-start pb-4 border-b border-indigo-100/50">
                        <div>
                          <p className="font-black text-slate-900 text-lg tracking-tight">{partner.partnerName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-700 border-none px-2.5 py-0.5">
                              Delivery Partner
                            </Badge>
                            {partner.partnerPaymentReceived ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold px-2.5 py-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Partner Verified Receipt
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] uppercase font-bold px-2.5 py-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Awaiting Receipt Verification
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payout Amount</p>
                          <p className="text-xl font-black text-indigo-600">₹{partner.totalPrice?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Bank Name</span>
                          <span className="font-extrabold text-slate-900">{partner.bankDetails.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Account No</span>
                          <span className="font-mono font-bold text-slate-800 bg-white/50 px-2 py-1 rounded-md border border-indigo-100 tracking-wider">
                            {partner.bankDetails.accountNumber || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">IFSC Code</span>
                          <span className="font-mono font-bold text-slate-800 tracking-wider">{partner.bankDetails.ifscCode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-indigo-100/50 border-dashed">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">UPI ID</span>
                          <span className="font-mono font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200/60 tracking-wider">
                            {partner.bankDetails.upiId || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </ScrollArea>

            <div className="px-10 py-6 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <Button variant="outline" onClick={() => setIsBankModalOpen(false)} className="font-black text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-14 px-10 rounded-2xl shadow-sm transition-all text-base uppercase tracking-widest">Close Transaction Window</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DOCUMENTS MODAL */}
        <Dialog open={isDocsModalOpen} onOpenChange={setIsDocsModalOpen}>
          <DialogContent className="sm:max-w-5xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[95vh] flex flex-col custom-scrollbar">
            <DialogHeader className="px-10 pt-10 pb-6 border-b border-slate-100 bg-slate-50/50 m-0 shrink-0">
              <DialogTitle className="flex items-center gap-4 text-3xl font-black text-slate-900 tracking-tight">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm">
                  <Shield className="h-8 w-8" />
                </div>
                Member Security Verification
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-bold pt-3 text-base">
                Verifying legal documents for <span className="text-indigo-600 underline">{selectedDocs?.name || selectedDocs?.farmName || selectedDocs?.companyName}</span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow bg-white custom-scrollbar">
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 custom-scrollbar">
              {selectedDocs?.aadharFront && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Aadhar Front</p>
                  <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    <img src={selectedDocs.aadharFront} alt="Aadhar Front" className="w-full h-full object-contain bg-slate-100" />
                  </div>
                </div>
              )}
              {selectedDocs?.aadharBack && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Aadhar Back</p>
                  <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    <img src={selectedDocs.aadharBack} alt="Aadhar Back" className="w-full h-full object-contain bg-slate-100" />
                  </div>
                </div>
              )}
              {selectedDocs?.licenseImage && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Driving License</p>
                  <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                    <img src={selectedDocs.licenseImage} alt="License" className="w-full h-full object-contain bg-slate-100" />
                  </div>
                </div>
              )}

              {!selectedDocs?.aadharFront && !selectedDocs?.aadharBack && !selectedDocs?.licenseImage && (
                <div className="md:col-span-2 py-10 text-center text-slate-400">
                  No image documents uploaded for this profile.
                </div>
              )}
              </div>
            </ScrollArea>

            <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <Button onClick={() => setIsDocsModalOpen(false)} className="h-14 px-12 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">Close Verification</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}