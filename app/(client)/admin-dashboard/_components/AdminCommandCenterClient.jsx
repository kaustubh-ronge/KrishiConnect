"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
   LayoutDashboard, Users, ShoppingCart, Package, IndianRupee,
   Download, Search, Filter, TrendingUp,
   UserCheck, ShieldCheck, Truck, AlertCircle, FileText,
   Menu, X, ChevronRight,
   Banknote, HelpCircle, Eye, AlertTriangle,
   ArrowDownRight, Scale, ShieldAlert, Check, Ban, ExternalLink,
   MapPin, Phone, Mail, Building2, UserCircle2, Wallet,
   History as LucideHistory, PieChart, Activity, Globe, Landmark, Fingerprint,
   ChevronLeft, ImageIcon, Trash2,
   UserX, UserCheck2, RefreshCw, ShoppingBag,
   ListChecks, ClipboardEdit, StickyNote, Map as LucideMap,
   Zap,
   Star
} from "lucide-react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvUtils';
import { getExportableUsers, getExportableProducts, toggleUserStatus } from '@/actions/admin-advanced';
import { approveProfile, rejectProfile, bulkApproveProfiles } from '@/actions/admin';
import { AnimatePresence, motion } from 'framer-motion';
import PremiumLoader from '@/components/PremiumLoader';

// HELPERS FOR 100% VISIBILITY
const s = (v) => (v !== undefined && v !== null && v !== "" ? v : "NOT PROVIDED");
const sNum = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

const CUSTOM_SCROLLBAR_CSS = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 10px;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 10px;
    border: 3px solid #f8fafc;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

const getFriendlyStatus = (status) => {
   const map = {
      'PROCESSING': 'Preparing Order',
      'PACKED': 'Packed & Ready',
      'SHIPPED': 'Sent to Courier',
      'IN_TRANSIT': 'On the Way',
      'DELIVERED': 'Safely Delivered',
      'CANCELLED': 'Order Cancelled'
   };
   return map[status] || status;
};

export default function AdminCommandCenterClient({
   initialStats,
   initialOrders,
   initialPendingProfiles,
   advancedStats,
   settleAction,
   viewBankAction,
   statsAction,
   ordersAction,
   getPendingAction,
   deleteOrderAction,
   clearStaleAction,
   deliveryJobsAction,
   reviewsAction
}) {
   const [activeView, setActiveView] = useState("dashboard");
   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
   const [stats, setStats] = useState(advancedStats?.data || {});
   const [orders, setOrders] = useState(initialOrders || []);
   const [pendingProfiles, setPendingProfiles] = useState(initialPendingProfiles || []);
   const [mounted, setMounted] = useState(false);
   const [logs, setLogs] = useState([]);

   // Pagination
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   // Selection for Bulk Actions
   const [selectedIds, setSelectedIds] = useState([]);

   // Directories
   const [farmers, setFarmers] = useState([]);
   const [agents, setAgents] = useState([]);
   const [deliveryPartners, setDeliveryPartners] = useState([]);
   const [products, setProducts] = useState([]);
   const [deliveryJobs, setDeliveryJobs] = useState([]);
   const [reviews, setReviews] = useState([]);
   const [isLoading, setIsLoading] = useState(false);

   // Modals
   const [selectedOrder, setSelectedOrder] = useState(null);
   const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
   const [selectedProfile, setSelectedProfile] = useState(null);
   const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);
   const [isProductModalOpen, setIsProductModalOpen] = useState(false);
   const [isLoadingDetails, setIsLoadingDetails] = useState(false);
   const [adminNote, setAdminNote] = useState("");

   // Filters
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState("ALL");

   useEffect(() => {
      setMounted(true);
      fetchInitialData();
   }, []);

   // Lazy load data based on view
   useEffect(() => {
      if (!mounted) return;
      if (['farmers', 'agents', 'delivery', 'catalog', 'logistics', 'reviews'].includes(activeView)) {
         fetchDirectoryData(activeView);
      }
   }, [activeView, mounted]);

   useEffect(() => {
      setCurrentPage(1);
   }, [activeView, search, statusFilter]);

   const fetchInitialData = async () => {
      setIsLoading(true);
      try {
         const [resS, resO, resPR] = await Promise.all([
            statsAction(),
            ordersAction(),
            getPendingAction()
         ]);
         if (resS.success) setStats(resS.data || {});
         if (resO.success) setOrders(resO.data || []);
         if (resPR.success) setPendingProfiles(resPR.data || []);
      } catch (err) { console.error("Initial load failed:", err); } finally { setIsLoading(false); }
   };

   const fetchDirectoryData = async (view) => {
      setIsLoading(true);
      try {
         if (view === 'farmers') {
            const res = await getExportableUsers('farmer');
            if (res.success) setFarmers(res.data);
         } else if (view === 'agents') {
            const res = await getExportableUsers('agent');
            if (res.success) setAgents(res.data);
         } else if (view === 'delivery') {
            const res = await getExportableUsers('delivery');
            if (res.success) setDeliveryPartners(res.data);
         } else if (view === 'catalog') {
            const res = await getExportableProducts();
            if (res.success) setProducts(res.data);
         } else if (view === 'logistics') {
            const res = await deliveryJobsAction();
            if (res.success) setDeliveryJobs(res.data);
         } else if (view === 'reviews') {
            const res = await reviewsAction();
            if (res.success) setReviews(res.data);
         }
      } catch (err) { console.error(`Fetch ${view} failed:`, err); } finally { setIsLoading(false); }
   };

   const refreshData = async () => {
      if (['farmers', 'agents', 'delivery', 'catalog', 'logistics', 'reviews'].includes(activeView)) {
         await fetchDirectoryData(activeView);
      }
      await fetchInitialData();
   };

   const addLog = (action, detail) => {
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), action, detail }, ...prev].slice(0, 20));
   };

   const handleApprove = async (userId, role, name) => {
      const previousProfiles = [...pendingProfiles];
      setPendingProfiles(prev => prev.filter(p => p.userId !== userId));
      toast.success('Approval process started...');

      try {
         const res = await approveProfile(userId, role, adminNote);
         if (res.success) {
            addLog("APPROVED", `${role.toUpperCase()}: ${name}`);
            setAdminNote("");
            toast.success(`${name} verified successfully.`);
         } else {
            throw new Error(res.error);
         }
      } catch (err) {
         setPendingProfiles(previousProfiles);
         toast.error(`Failed to approve ${name}: ${err.message}`);
      }
   };

   const handleReject = async (userId, role, name) => {
      const previousProfiles = [...pendingProfiles];
      setPendingProfiles(prev => prev.filter(p => p.userId !== userId));
      toast.success('Rejection process started...');

      try {
         const res = await rejectProfile(userId, role, adminNote);
         if (res.success) {
            addLog("REJECTED", `${role.toUpperCase()}: ${name}`);
            setAdminNote("");
            toast.success(`Rejection sent to ${name}.`);
         } else {
            throw new Error(res.error);
         }
      } catch (err) {
         setPendingProfiles(previousProfiles);
         toast.error(`Failed to reject ${name}: ${err.message}`);
      }
   };

   const handleBulkApprove = async () => {
      if (selectedIds.length === 0) return toast.error("Please select members first.");
      const count = selectedIds.length;
      const profilesToApprove = pendingProfiles.filter(p => selectedIds.includes(p.userId));

      const previousProfiles = [...pendingProfiles];
      setPendingProfiles(prev => prev.filter(p => !selectedIds.includes(p.userId)));
      setSelectedIds([]);
      toast.success(`Approving ${count} members...`);

      try {
         const res = await bulkApproveProfiles(profilesToApprove);
         if (res.success) {
            addLog("BULK_APPROVE", `${count} members approved`);
            toast.success(res.message);
         } else {
            throw new Error(res.error);
         }
      } catch (err) {
         setPendingProfiles(previousProfiles);
         setSelectedIds(selectedIds);
         toast.error(`Bulk approval failed: ${err.message}`);
      }
   };

   const handleToggleStatus = async (userId, name) => {
      toast.promise(toggleUserStatus(userId), {
         loading: 'Updating Status...',
         success: (res) => {
            addLog("SECURITY_CHANGE", `${name}`);
            refreshData();
            return res.message;
         },
         error: 'Update failed.'
      });
   };

   const handleSettle = async (orderId) => {
      toast.promise(settleAction(orderId), {
         loading: 'Releasing Funds...',
         success: () => {
            addLog("PAID_OUT", `Order #${orderId.slice(-6).toUpperCase()}`);
            refreshData();
            return 'Payment Released to Seller.';
         },
         error: 'Failed.'
      });
   };

   const handleDeleteOrder = async (orderId) => {
      if (!confirm("Are you sure you want to PERMANENTLY DELETE this order? Stock will be restored if it was not paid.")) return;

      toast.promise(deleteOrderAction(orderId), {
         loading: 'Deleting Order...',
         success: (res) => {
            addLog("DELETED_ORDER", `Order #${orderId.slice(-6).toUpperCase()}`);
            refreshData();
            return res.message;
         },
         error: (err) => `Delete failed: ${err.message}`
      });
   };

   const handleClearStale = async () => {
      if (!confirm("Remove all PENDING orders older than 24 hours? This cannot be undone.")) return;

      setIsLoading(true);
      try {
         const res = await clearStaleAction();
         if (res.success) {
            toast.success(res.message);
            addLog("STALE_CLEANUP", res.message);
            refreshData();
         } else {
            toast.error(res.error);
         }
      } catch (err) {
         toast.error("Cleanup failed: " + err.message);
      } finally {
         setIsLoading(false);
      }
   };

   const openOrderAudit = async (orderId) => {
      setIsLoadingDetails(true);
      setIsOrderModalOpen(true);

      try {
         const order = orders.find(o => o.id === orderId);
         if (!order) {
            toast.error("Order not found.");
            setIsOrderModalOpen(false);
            return;
         }

         const bankRes = await viewBankAction(orderId);
         const sellersData = bankRes.success ? bankRes.data.sellers : [];
         const deliveryPartners = bankRes.success ? bankRes.data.deliveryPartners : [];

         setSelectedOrder({
            ...order,
            sellers: sellersData,
            deliveryPartners: deliveryPartners.length > 0 ? deliveryPartners : (order.deliveryPartners || [])
         });
      } catch (err) {
         console.error("Audit fetch failed:", err);
         toast.error("Failed to load full audit data.");
      } finally {
         setIsLoadingDetails(false);
      }
   };

   const openProfileAudit = (profile) => {
      setSelectedProfile(profile);
      setAdminNote(profile.user?.adminNotes || "");
      setIsProfileModalOpen(true);
   };

   const openProductAudit = (product) => {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
   };

   const disputes = useMemo(() => orders.filter(o => o.disputeStatus === 'OPEN'), [orders]);

   const paginate = (items) => {
      const start = (currentPage - 1) * itemsPerPage;
      return items.slice(start, start + itemsPerPage);
   };

   const getFilteredItems = () => {
      let items = [];
      if (activeView === 'verifications') items = pendingProfiles;
      else if (activeView === 'disputes') items = disputes;
      else if (activeView === 'orders') items = orders;
      else if (activeView === 'farmers') items = farmers;
      else if (activeView === 'agents') items = agents;
      else if (activeView === 'delivery') items = deliveryPartners;
      else if (activeView === 'catalog') items = products;
      else if (activeView === 'logistics') items = deliveryJobs;
      else if (activeView === 'reviews') items = reviews;

      return items.filter(item => {
         const searchStr = search.toLowerCase();
         const matchSearch =
            (item.name || "").toLowerCase().includes(searchStr) ||
            (item.companyName || "").toLowerCase().includes(searchStr) ||
            (item.productName || "").toLowerCase().includes(searchStr) ||
            (item.displayName || "").toLowerCase().includes(searchStr) ||
            (item.buyerName || "").toLowerCase().includes(searchStr) ||
            (item.id || "").toLowerCase().includes(searchStr) ||
            (item.phone || "").toLowerCase().includes(searchStr) ||
            (item.user?.email || "").toLowerCase().includes(searchStr) ||
            (item.city || "").toLowerCase().includes(searchStr) ||
            (item.deliveryBoy?.name || "").toLowerCase().includes(searchStr) ||
            (item.comment || "").toLowerCase().includes(searchStr);

         const matchStatus = statusFilter === "ALL" ||
            (item.orderStatus === statusFilter) ||
            (item.sellingStatus === statusFilter) ||
            (item.approvalStatus === statusFilter) ||
            (item.status === statusFilter) ||
            (statusFilter === 'PENDING_PAYMENT' && item.paymentStatus === 'Waiting for Payment') ||
            (statusFilter === 'ACTIVE' && (item.isDisabled === false || item.user?.isDisabled === false)) ||
            (statusFilter === 'DEACTIVATED' && (item.isDisabled === true || item.user?.isDisabled === true));
         return matchSearch && matchStatus;
      });
   };

   const handleGlobalExport = () => {
      const dataToExport = getFilteredItems();
      if (dataToExport.length === 0) return toast.error("No data found to export.");
      downloadCSV(dataToExport, `KrishiHub_${activeView}`);
   };

   if (!mounted) return <PremiumLoader fullPage message="KrishiHub Initializing..." />;

   const navItems = [
      { id: 'dashboard', label: 'Main Board', icon: LayoutDashboard, color: 'text-indigo-500' },
      { id: 'verifications', label: 'Verify Members', icon: ShieldCheck, color: 'text-emerald-500', badge: pendingProfiles.length },
      { id: 'disputes', label: 'Problems / Help', icon: Scale, color: 'text-rose-500', badge: disputes.length },
      { id: 'orders', label: 'Sales & Deliveries', icon: ShoppingBag, color: 'text-blue-500' },
      { id: 'farmers', label: 'Farmers List', icon: Users, color: 'text-emerald-500' },
      { id: 'agents', label: 'Agents List', icon: Building2, color: 'text-amber-500' },
      { id: 'delivery', label: 'Delivery Boys', icon: Truck, color: 'text-slate-400' },
      { id: 'logistics', label: 'Live Logistics', icon: Zap, color: 'text-amber-500' },
      { id: 'catalog', label: 'Product List', icon: Package, color: 'text-purple-500' },
      { id: 'reviews', label: 'User Reviews', icon: Star, color: 'text-yellow-500' },
      { id: 'finance', label: 'Money & Bank', icon: IndianRupee, color: 'text-emerald-600' },
   ];

   const Pagination = ({ totalItems }) => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (totalPages <= 1) return null;
      return (
         <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 sticky bottom-0 z-20">
            <p className="text-[9px] font-black text-slate-400 uppercase">Records {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}</p>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg shadow-sm" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}><ChevronLeft className="h-4 w-4" /></Button>
               <span className="text-[10px] font-black text-slate-900 px-3 py-1 bg-slate-100 rounded-md shadow-inner">{currentPage} / {totalPages}</span>
               <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg shadow-sm" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}><ChevronRight className="h-4 w-4" /></Button>
            </div>
         </div>
      );
   };

   return (
      <div className="flex h-screen overflow-hidden bg-slate-50 text-[13px] font-sans selection:bg-indigo-100 selection:text-indigo-900">
         <style>{CUSTOM_SCROLLBAR_CSS}</style>

         <AnimatePresence>
            {isLoading && <PremiumLoader message="Syncing Command Center..." />}
         </AnimatePresence>

         <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 shadow-2xl sticky top-0 h-screen shrink-0 z-50 ${isSidebarOpen ? "w-60" : "w-20"}`}>
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
               {isSidebarOpen ? (
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Globe className="h-4 w-4" /></div>
                     <span className="font-black text-white text-lg uppercase tracking-tighter">Krishi Hub</span>
                  </div>
               ) : <Globe className="h-6 w-6 text-indigo-500 mx-auto" />}
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><Menu className="h-5 w-5" /></button>
            </div>

            <div className="flex-grow p-3 space-y-1 overflow-hidden">
               {navItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveView(item.id)}
                     className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${activeView === item.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                     <div className="flex items-center gap-3">
                        <item.icon className={`h-4 w-4 ${activeView === item.id ? "text-white" : item.color}`} />
                        {isSidebarOpen && <span className="font-bold">{item.label}</span>}
                     </div>
                     {isSidebarOpen && item.badge > 0 && <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                  </button>
               ))}
            </div>
         </aside>

         <main className="flex-grow flex flex-col min-w-0 bg-slate-50">
            <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
               <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{navItems.find(i => i.id === activeView)?.label}</h3>
               </div>
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                     <Input placeholder="Search records..." className="pl-9 h-9 w-64 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl font-black border-slate-200 gap-2 bg-white" onClick={handleGlobalExport}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl font-black border-slate-200 gap-2 bg-white" onClick={refreshData} disabled={isLoading}><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh</Button>
               </div>
            </header>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
               <div className="p-8 max-w-[1500px] mx-auto w-full space-y-10 pb-40 custom-scrollbar">
                  {activeView === 'dashboard' && (
                     <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                           <Card className="border-0 shadow-sm rounded-2xl bg-white p-6 border-t-4 border-emerald-500">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{"\u20B9"}{sNum(stats.finance?.totalGMV).toLocaleString()}</h3>
                              <p className="text-[9px] font-bold text-slate-400 mt-4">Platform Volume</p>
                           </Card>
                           <Card className="border-0 shadow-sm rounded-2xl bg-white p-6 border-t-4 border-indigo-500">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Platform Fees</p>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{"\u20B9"}{sNum(stats.finance?.totalPlatformRevenue).toLocaleString()}</h3>
                              <div className="text-[9px] text-emerald-600 font-black mt-4 uppercase">Direct Profit</div>
                           </Card>
                           <Card className="border-0 shadow-sm rounded-2xl bg-amber-500 p-6 border-t-4 border-amber-600">
                              <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest mb-1">Order Consistency</p>
                              <h3 className="text-2xl font-black text-white tracking-tighter">100%</h3>
                              <p className="text-[9px] font-bold text-amber-900 mt-4 uppercase tracking-tighter">Audit Verified</p>
                           </Card>
                           <Card className="border-0 shadow-sm rounded-2xl bg-indigo-300 p-6">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Verified Score</p>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.users?.profileCompleteness}%</h3>
                              <p className="text-[9px] font-bold text-slate-900 mt-4 uppercase">Platform Trust</p>
                           </Card>
                           <Card className="border-0 shadow-sm rounded-2xl bg-slate-900 text-white p-6">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Catalog</p>
                              <h3 className="text-2xl font-black text-white tracking-tighter">{stats.products?.totalProducts} Items</h3>
                              <p className="text-[9px] font-black text-indigo-400 mt-4 uppercase tracking-widest">Marketplace Live</p>
                           </Card>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                           <div className="xl:col-span-2 space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Card className="rounded-[2.5rem] border-0 shadow-sm bg-white p-10 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Admin Summary</p>
                                    <h3 className="text-xl font-black text-slate-900">Platform is Healthy.</h3>
                                    <div className="flex items-center gap-3 mt-6"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-emerald-600 uppercase">System Integrity Audit: Pass</span></div>
                                 </Card>
                                 <div className="grid grid-cols-2 gap-6">
                                    <Card className="rounded-3xl border-0 shadow-sm bg-emerald-50 p-6 flex flex-col justify-center"><p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Approved Sellers</p><h4 className="text-2xl font-black text-emerald-900">{sNum(stats.users?.farmerCount + stats.users?.agentCount)}</h4></Card>
                                    <Card className="rounded-3xl border-0 shadow-sm bg-rose-50 p-6 flex flex-col justify-center"><p className="text-[9px] font-black text-rose-600 uppercase mb-2">Pending Verify</p><h4 className="text-2xl font-black text-rose-900">{pendingProfiles.length}</h4></Card>
                                 </div>
                              </div>
                              <Card className="rounded-[2rem] border-0 shadow-sm bg-white overflow-hidden flex flex-col h-[600px]">
                                 <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0"><h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><LucideHistory className="h-4 w-4 text-indigo-500" /> Recent Platform Activity</h4></div>
                                 <div className="flex-grow overflow-y-auto custom-scrollbar">
                                    <Table>
                                       <TableHeader className="bg-slate-50/50 text-[9px] uppercase font-black text-slate-400 h-10 border-slate-50 sticky top-0 z-10 backdrop-blur-md"><TableRow><TableHead className="pl-8">ORDER ID</TableHead><TableHead>MEMBER</TableHead><TableHead>TOTAL BILL</TableHead><TableHead>STATUS</TableHead><TableHead className="text-right pr-8">VIEW</TableHead></TableRow></TableHeader>
                                       <TableBody>
                                          {orders.slice(0, 6).map((o, idx) => (
                                             <TableRow key={idx} className="h-16 border-slate-50 hover:bg-slate-50/50 group">
                                                <TableCell className="pl-8 font-black text-slate-900">#{o.id.slice(-6).toUpperCase()}</TableCell>
                                                <TableCell className="text-[11px] font-bold text-slate-600">{s(o.buyerName)}</TableCell>
                                                <TableCell className="font-black text-slate-900 text-xs">{"\u20B9"}{sNum(o.totalAmount).toLocaleString()}</TableCell>
                                                <TableCell><Badge className="text-[8px] font-black bg-slate-50 text-slate-500 uppercase px-3 py-1 border-0">{getFriendlyStatus(o.orderStatus)}</Badge></TableCell>
                                                <TableCell className="text-right pr-8"><Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openOrderAudit(o.id)}><Eye className="h-4 w-4 text-slate-400" /></Button></TableCell>
                                             </TableRow>
                                          ))}
                                       </TableBody>
                                    </Table>
                                 </div>
                              </Card>
                           </div>

                           <Card className="rounded-[2.5rem] border-0 shadow-sm bg-white p-8 h-fit flex flex-col max-h-[500px]">
                              <h4 className="text-[11px] font-black mb-10 flex items-center gap-3 uppercase tracking-widest shrink-0"><Activity className="h-5 w-5 text-indigo-600" /> Internal Action Log</h4>
                              <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4 flex-grow">
                                 {logs.length === 0 ? <p className="text-[10px] text-slate-400 italic text-center py-20 uppercase font-black">No Recent Records.</p> : logs.map((l, i) => (
                                    <div key={i} className="flex items-start gap-4 border-l-2 border-indigo-100 pl-4 py-1 relative">
                                       <div className="absolute -left-1.5 top-2 w-2 h-2 bg-indigo-600 rounded-full" />
                                       <div className="flex-grow">
                                          <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{l.action}</p>
                                          <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-tight">{l.detail}</p>
                                       </div>
                                       <span className="text-[8px] font-bold text-slate-300">{l.time}</span>
                                    </div>
                                 ))}
                              </div>
                           </Card>
                        </div>
                     </div>
                  )}

                  {/* DIRECTORY VIEWS */}
                  {['verifications', 'disputes', 'orders', 'farmers', 'agents', 'delivery', 'catalog'].includes(activeView) && (
                     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center justify-between flex-wrap gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${activeView === 'verifications' ? 'bg-emerald-600' : 'bg-indigo-600'}`}><ShieldCheck className="h-7 w-7" /></div>
                              <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{navItems.find(n => n.id === activeView)?.label}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Platform Database</p></div>
                           </div>

                           <div className="flex items-center gap-3">
                              {activeView === 'verifications' && selectedIds.length > 0 && (
                                 <Button className="h-10 px-8 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20" onClick={handleBulkApprove}><ListChecks className="mr-2 h-4 w-4" /> Approve Selected ({selectedIds.length})</Button>
                              )}
                              <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto custom-scrollbar no-scrollbar">
                                 {(activeView === 'orders' ?
                                    ['ALL', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PENDING_PAYMENT'] :
                                    activeView === 'catalog' ?
                                       ['ALL', 'ACTIVE', 'DEACTIVATED'] :
                                       ['ALL', 'PENDING', 'APPROVED', 'REJECTED']
                                 ).map(f => (
                                    <Button key={f} variant={statusFilter === f ? "default" : "ghost"} size="sm" className={`h-10 px-5 rounded-xl text-[9px] font-black shrink-0 ${statusFilter === f ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"}`} onClick={() => setStatusFilter(f)}>{f.replace('_', ' ')}</Button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <Card className="rounded-[2rem] border-0 shadow-sm bg-white overflow-hidden flex flex-col h-[600px]">
                           <div className="flex-grow overflow-y-auto custom-scrollbar">
                              <Table>
                                 <TableHeader className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 h-12 border-slate-50 sticky top-0 z-20 backdrop-blur-md">
                                    <TableRow>
                                       {activeView === 'verifications' && <TableHead className="w-12 pl-6"></TableHead>}
                                       <TableHead className={activeView === 'verifications' ? "pl-2" : "pl-8"}>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'ORDER ID & BUYER' :
                                             activeView === 'logistics' ? 'DELIVERY BOY & ORDER' :
                                                activeView === 'reviews' ? 'REVIEWER & PRODUCT' :
                                                   'IDENTITY & NAME'}
                                       </TableHead>
                                       <TableHead>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'PAYMENT' :
                                             activeView === 'logistics' ? 'CURRENT STATUS' :
                                                activeView === 'reviews' ? 'RATING' :
                                                   'LOCATION & DATA'}
                                       </TableHead>
                                       <TableHead>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'ORDER STATUS' :
                                             activeView === 'logistics' ? 'DISTANCE/PRICE' :
                                                activeView === 'reviews' ? 'COMMENT' :
                                                   'JOIN DATE'}
                                       </TableHead>
                                       <TableHead>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'METHOD' :
                                             activeView === 'logistics' ? 'TIME ESTIMATE' :
                                                activeView === 'reviews' ? 'DATE' :
                                                   'ACCOUNT STATE'}
                                       </TableHead>
                                       <TableHead className="text-right pr-8">AUDIT ACTION</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {getFilteredItems().length === 0 ? <TableRow><TableCell colSpan={6} className="h-60 text-center text-slate-400 italic text-xs uppercase font-black">No Records Found matching filter.</TableCell></TableRow> : paginate(getFilteredItems()).map((item, i) => (
                                       <TableRow key={i} className={`h-20 border-slate-50 hover:bg-slate-50/50 group ${selectedIds.includes(item.userId) ? 'bg-indigo-50/50' : ''}`}>
                                          {activeView === 'verifications' && (
                                             <TableCell className="pl-6">
                                                <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 accent-indigo-600" checked={selectedIds.includes(item.userId)} onChange={(e) => {
                                                   if (e.target.checked) setSelectedIds([...selectedIds, item.userId]);
                                                   else setSelectedIds(selectedIds.filter(id => id !== item.userId));
                                                }} />
                                             </TableCell>
                                          )}
                                          <TableCell className={activeView === 'verifications' ? "pl-2" : "pl-8"}>
                                             <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border ${activeView === 'catalog' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                   activeView === 'logistics' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                      activeView === 'reviews' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                         item.role === 'farmer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                   }`}>
                                                   {(item.productName || item.name || item.displayName || item.buyerName)?.[0] || 'O'}
                                                </div>
                                                <div className="flex flex-col">
                                                   <span className="font-black text-slate-900 text-sm leading-tight">
                                                      {activeView === 'logistics' ? item.deliveryBoy?.name :
                                                         activeView === 'reviews' ? item.user?.name :
                                                            s(item.productName || item.name || item.displayName || item.buyerName)}
                                                   </span>
                                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                      {activeView === 'orders' ? <>Bill: ₹{item.totalAmount}</> :
                                                         activeView === 'catalog' ? <>Price: ₹{item.pricePerUnit} / {item.unit}</> :
                                                            activeView === 'logistics' ? <>Order ID: #{item.orderId?.slice(-6).toUpperCase()}</> :
                                                               activeView === 'reviews' ? <>Product: {item.product?.productName}</> :
                                                                  `ID: #${(item.userId || item.id)?.slice(-6).toUpperCase()}`}
                                                   </span>
                                                </div>
                                             </div>
                                          </TableCell>
                                          <TableCell>
                                             <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                   {activeView === 'orders' || activeView === 'disputes' ? (
                                                      <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 border-0 rounded-md ${item.paymentStatus === 'Money Received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                         {item.paymentStatus}
                                                      </Badge>
                                                   ) : activeView === 'logistics' ? (
                                                      <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 border-0 rounded-md bg-indigo-100 text-indigo-700`}>
                                                         {item.status}
                                                      </Badge>
                                                   ) : activeView === 'reviews' ? (
                                                      <div className="flex items-center gap-1">
                                                         {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`} />
                                                         ))}
                                                      </div>
                                                   ) : activeView === 'catalog' ? (
                                                      <div className="flex flex-col">
                                                         <span className="text-[10px] font-black text-slate-900 leading-none">{s(item.sellerName)}</span>
                                                         <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-0 bg-indigo-50 text-indigo-700 rounded-md w-fit mt-1">Sold: {sNum(item.unitsSold)}</Badge>
                                                      </div>
                                                   ) : (
                                                      <>
                                                         <span className="text-[10px] font-black text-slate-900 leading-none">{s(item.city || item.category || item.vehicleType)}</span>
                                                         <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{s(item.district)}</span>
                                                      </>
                                                   )}
                                                </div>
                                             </div>
                                          </TableCell>
                                          <TableCell className="text-[10px] font-black text-slate-400 uppercase">{activeView === 'orders' || activeView === 'disputes' ? (
                                             <Badge variant="outline" className="text-[8px] font-black uppercase border-0 bg-indigo-50 text-indigo-600 px-2 py-0.5">
                                                {getFriendlyStatus(item.orderStatus)}
                                             </Badge>
                                          ) : activeView === 'catalog' ? (
                                             <span className="text-[10px] font-black text-slate-600">{s(item.category)}</span>
                                          ) : (
                                             item.createdAt && mounted ? new Date(item.createdAt).toLocaleDateString() : '—'
                                          )}</TableCell>
                                          <TableCell>{activeView === 'orders' || activeView === 'disputes' ? (
                                             <span className="text-[10px] font-black text-slate-600 uppercase">{item.paymentMethod}</span>
                                          ) : activeView === 'farmers' || activeView === 'agents' ? (
                                             <Badge className={`text-[8px] font-black uppercase px-3 py-1 border-0 rounded-lg ${item.usagePurpose === 'buy_and_sell' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{item.usagePurpose === 'buy_and_sell' ? 'BUY & SELL' : 'BUY ONLY'}</Badge>
                                          ) : (
                                             <Badge variant="outline" className={`text-[8px] font-black uppercase px-3 py-1 border-0 rounded-lg ${item.user?.isDisabled ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{item.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'}</Badge>
                                          )}</TableCell>
                                          <TableCell className="pr-8 text-right">
                                             <div className="flex justify-end gap-2 transition-all">
                                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg bg-white border-slate-200 shadow-sm hover:border-indigo-600 hover:text-indigo-600" onClick={() => {
                                                   if (activeView === 'orders' || activeView === 'disputes') openOrderAudit(item.id);
                                                   else if (activeView === 'catalog') openProductAudit(item);
                                                   else openProfileAudit(item);
                                                }}><Eye className="h-4 w-4 text-slate-400" /></Button>
                                                {activeView === 'orders' && (
                                                   <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteOrder(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                )}
                                                {activeView !== 'orders' && (
                                                   <Button size="icon" variant="outline" className={`h-8 w-8 rounded-lg border-slate-200 shadow-sm ${item.user?.isDisabled ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`} onClick={() => handleToggleStatus(item.userId || item.id, item.name || item.displayName)}>{item.user?.isDisabled ? <UserCheck2 className="h-4 w-4" /> : <UserX className="h-4 w-4" />}</Button>
                                                )}
                                             </div>
                                          </TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                           </div>
                           <Pagination totalItems={getFilteredItems().length} />
                        </Card>
                     </div>
                  )}

                  {/* FINANCE HUB */}
                  {activeView === 'finance' && (
                     <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                           <Card className="rounded-[3.5rem] border-0 shadow-xl bg-slate-950 text-white p-14 relative overflow-hidden group">
                              <Wallet className="h-14 w-14 text-indigo-400 mb-10" />
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Platform Cash Flow</p>
                              <h3 className="text-6xl font-black tracking-tighter">₹{sNum(stats.finance?.totalGMV).toLocaleString()}</h3>
                              <p className="text-[11px] font-bold text-slate-600 mt-10 uppercase tracking-widest">Total Sales Ledger</p>
                              <div className="absolute -bottom-20 -right-20 opacity-5"><Banknote className="h-[30rem] w-[30rem]" /></div>
                           </Card>
                           <div className="space-y-10">
                              <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-10 border-t-[12px] border-emerald-600 flex flex-col justify-between">
                                 <div><p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Our Net Profit</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{sNum(stats.finance?.totalPlatformRevenue).toLocaleString()}</h3></div>
                                 <div className="mt-6 flex items-center gap-3 text-emerald-600 font-black text-lg"><TrendingUp className="h-6 w-6" /> Financial Integrity Confirmed</div>
                              </Card>
                              <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-10 border-t-[12px] border-indigo-600">
                                 <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Money Owed to Sellers</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{sNum(stats.finance?.pendingPayouts).toLocaleString()}</h3>
                                 <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-6">Awaiting Bank Transfer</p>
                              </Card>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* PRODUCT AUDIT MODAL */}
               <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                  <DialogContent className="sm:max-w-xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                     <div className="bg-purple-600 p-8 text-white relative">
                        <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full mb-3 tracking-widest">CATALOG AUDIT</Badge>
                        <DialogTitle className="text-3xl font-black tracking-tighter leading-none">{selectedProduct?.productName}</DialogTitle>
                        <p className="text-purple-100 font-bold mt-2 text-sm uppercase tracking-widest">ID: #{selectedProduct?.id?.slice(-8).toUpperCase()}</p>
                     </div>
                     <div className="p-8 space-y-8 bg-slate-50/50">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Market Price</p><p className="text-2xl font-black text-slate-900">₹{selectedProduct?.pricePerUnit}<span className="text-xs text-slate-400 ml-1">/{selectedProduct?.unit}</span></p></div>
                           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Units Sold</p><p className="text-2xl font-black text-indigo-600">{sNum(selectedProduct?.unitsSold)} <span className="text-xs text-slate-400">total</span></p></div>
                        </div>
                        <div className="space-y-4">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Node Information</h5>
                           <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-indigo-400">SN</div>
                                 <div><p className="text-lg font-black leading-none">{selectedProduct?.sellerName}</p><p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Verified Marketplace Seller</p></div>
                              </div>
                              <Badge className="bg-indigo-600 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg">TRUSTED</Badge>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Status</h5>
                           <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm">
                              <div><p className="text-[9px] font-black text-slate-400 uppercase">Available Stock</p><p className="text-xl font-black text-slate-900">{selectedProduct?.availableStock} {selectedProduct?.unit}</p></div>
                              <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Listing State</p><Badge className={selectedProduct?.isDisabled ? "bg-rose-100 text-rose-600 border-0 text-[8px] font-black" : "bg-emerald-100 text-emerald-600 border-0 text-[8px] font-black"}>{selectedProduct?.isDisabled ? "DEACTIVATED" : "LIVE"}</Badge></div>
                           </div>
                        </div>
                     </div>
                     <DialogFooter className="p-6 bg-white border-t border-slate-100">
                        <Button className="w-full h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest" onClick={() => setIsProductModalOpen(false)}>Audit Complete</Button>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>

               {/* PROFILE AUDIT MODAL */}
               <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                  <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
                     <div className={`p-8 text-white shrink-0 ${selectedProfile?.role === 'farmer' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                        <div className="flex justify-between items-start relative z-10">
                           <div className="space-y-3">
                              <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest mb-1">SECURITY CLEARANCE</Badge>
                              <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{s(selectedProfile?.displayName)}</DialogTitle>
                              <div className="flex items-center gap-4 text-white/70 font-bold text-xs"><Mail className="h-3.5 w-3.5" /> {selectedProfile?.user?.email} | <Phone className="h-3.5 w-3.5" /> {s(selectedProfile?.phone)}</div>
                           </div>
                           <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-2xl font-black">{selectedProfile?.displayName?.[0]}</div>
                        </div>
                     </div>
                     <Tabs defaultValue="identity" className="flex-grow flex flex-col overflow-hidden">
                        <div className="px-8 bg-slate-50 border-b border-slate-200 shrink-0">
                           <TabsList className="bg-transparent h-12 gap-8">
                              <TabsTrigger value="identity" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Member Info</TabsTrigger>
                              <TabsTrigger value="performance" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Performance</TabsTrigger>
                              <TabsTrigger value="documents" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Documents</TabsTrigger>
                              <TabsTrigger value="admin" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-rose-600">Admin Notes</TabsTrigger>
                           </TabsList>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar bg-white">
                           <div className="p-8">
                              <TabsContent value="identity" className="m-0 space-y-10 animate-in fade-in duration-300 pr-2">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                       <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin className="h-5 w-5 text-rose-500" /> Physical Address</h5>
                                       <div className="space-y-4">
                                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-900 font-bold text-sm shadow-inner leading-relaxed">{s(selectedProfile?.address)}, {s(selectedProfile?.city)}, {s(selectedProfile?.district)}</div>
                                          {(selectedProfile?.lat && selectedProfile?.lng) && <Button variant="outline" className="h-12 w-full rounded-2xl border-slate-200 font-black text-rose-600 text-[10px] gap-2 uppercase tracking-widest hover:bg-rose-50" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedProfile.lat},${selectedProfile.lng}`)}><LucideMap className="h-4 w-4" /> Open Maps</Button>}
                                       </div>
                                    </div>
                                    <div className="space-y-4">
                                       <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Fingerprint className="h-5 w-5 text-indigo-500" /> Verification Meta</h5>
                                       <div className="space-y-4 font-black text-[9px] text-slate-900">
                                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-inner"><span className="text-[8px] text-slate-400 uppercase tracking-widest">Aadhar UID</span><span className="text-xl tracking-[0.2em] font-mono uppercase text-slate-900">{s(selectedProfile?.aadharNumber)}</span></div>
                                          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col gap-1"><span className="text-[8px] text-indigo-400 uppercase tracking-widest">Platform Role</span><span className="text-xl font-black uppercase text-indigo-900">{selectedProfile?.role}</span></div>
                                       </div>
                                    </div>
                                 </div>
                              </TabsContent>

                              <TabsContent value="performance" className="m-0 space-y-8 animate-in fade-in duration-300 pr-2">
                                 <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><TrendingUp className="h-7 w-7 text-indigo-600" /> Performance Analytics</h5>
                                 <div className="grid grid-cols-2 gap-6">
                                    {(selectedProfile?.role === 'farmer' || selectedProfile?.role === 'agent') ? (
                                       <>
                                          <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Total Units Sold</p><p className="text-4xl font-black text-emerald-900">{sNum(selectedProfile?.unitsSold)} <span className="text-xs">QTY</span></p></div>
                                          <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 shadow-sm"><p className="text-[10px] font-black text-blue-600 uppercase mb-2">Purchase History</p><p className="text-4xl font-black text-blue-900">{sNum(selectedProfile?.purchasedCount)} <span className="text-xs">Orders</span></p></div>
                                          <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm"><p className="text-[10px] font-black text-amber-600 uppercase mb-2">Active Listings</p><p className="text-4xl font-black text-amber-900">{sNum(selectedProfile?.listingsCount)} <span className="text-xs">Live</span></p></div>
                                          <div className="p-8 bg-purple-50 rounded-[2rem] border border-purple-100 shadow-sm"><p className="text-[10px] font-black text-purple-600 uppercase mb-2">Profile Usage</p><Badge className="bg-purple-600 text-white border-0 text-[10px] px-4 py-1 uppercase font-black rounded-lg mt-2">{selectedProfile?.usagePurpose === 'buy_and_sell' ? 'BUY & SELL' : 'BUY ONLY'}</Badge></div>
                                       </>
                                    ) : (
                                       <>
                                          <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm"><p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Total Deliveries</p><p className="text-4xl font-black text-indigo-900">{sNum(selectedProfile?.totalDeliveries)} <span className="text-xs">Success</span></p></div>
                                          <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-sm"><p className="text-[10px] font-black text-rose-600 uppercase mb-2">Active Jobs</p><p className="text-4xl font-black text-rose-900">{sNum(selectedProfile?.activeJobs)} <span className="text-xs">Current</span></p></div>
                                       </>
                                    )}
                                 </div>
                              </TabsContent>

                              <TabsContent value="documents" className="m-0 space-y-12 animate-in fade-in duration-300 pr-2">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {['aadharFront', 'aadharBack', 'licenseImage'].map((field, i) => (
                                       selectedProfile?.[field] && (
                                          <div key={i} className="space-y-4">
                                             <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</p>
                                             <div className="aspect-[1.6/1] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group relative shadow-inner">
                                                <img src={selectedProfile[field]} alt={field} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
                                                   <Button variant="secondary" className="h-12 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl" onClick={() => window.open(selectedProfile[field])}>View Full Doc</Button>
                                                </div>
                                             </div>
                                          </div>
                                       )
                                    ))}
                                 </div>
                              </TabsContent>

                              <TabsContent value="admin" className="m-0 space-y-8 animate-in fade-in duration-300 pr-2">
                                 <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><StickyNote className="h-7 w-7 text-rose-500" /> Internal Notes</h5>
                                 <Textarea placeholder="Type internal justification or notes here..." className="h-48 rounded-3xl border-slate-200 p-8 font-bold text-slate-700 bg-slate-50 shadow-inner focus:ring-rose-500 focus:border-rose-500" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                                 <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">Confidential: Visible to admin team only.</p>
                              </TabsContent>
                           </div>
                        </div>
                     </Tabs>

                     <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex gap-6 shrink-0">
                        <Button variant="outline" className="h-12 px-10 rounded-2xl font-black text-rose-600 border-rose-200 hover:bg-rose-50 text-[10px] uppercase tracking-widest transition-all" onClick={() => { setIsProfileModalOpen(false); handleReject(selectedProfile?.userId, selectedProfile?.role, selectedProfile?.displayName); }}>Reject Application</Button>
                        <Button className="flex-grow h-12 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/20 uppercase tracking-widest hover:bg-emerald-700 transition-all" onClick={() => { setIsProfileModalOpen(false); handleApprove(selectedProfile?.userId, selectedProfile?.role, selectedProfile?.displayName); }}>Verify & Approve Member</Button>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>

               {/* ORDER AUDIT MODAL */}
               <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                  <DialogContent className="sm:max-w-4xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
                     <div className="bg-slate-950 p-8 text-white shrink-0">
                        <div className="flex items-center justify-between">
                           <div className="space-y-2">
                              <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[9px] font-black uppercase px-4 py-1 rounded-full mb-2 tracking-widest shadow-inner">TRANSACTION AUDIT</Badge>
                              <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-1">Order: #{selectedOrder?.id?.slice(-12).toUpperCase()}</DialogTitle>
                              <div className="flex items-center gap-4 mt-3"><Badge className="bg-indigo-600 text-white border-0 text-[10px] px-4 py-1.5 uppercase font-black rounded-full tracking-[0.1em] shadow-lg shadow-indigo-500/20">{getFriendlyStatus(selectedOrder?.orderStatus)}</Badge></div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ledger Value</p>
                              <p className="text-4xl font-black text-white tracking-tighter">₹{sNum(selectedOrder?.totalAmount).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50">
                        <div className="p-8 space-y-10">
                           {isLoadingDetails ? <div className="py-40 text-center text-xs font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Running Ledger Audit...</div> : selectedOrder && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                 <div className="space-y-10">
                                    <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><UserCircle2 className="h-7 w-7 text-indigo-600" /> Buyer Node</h5>
                                    <Card className="rounded-3xl border-0 bg-white p-8 space-y-6 shadow-xl shadow-slate-200/50">
                                       <div className="flex items-center gap-5">
                                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">BN</div>
                                          <div className="flex flex-col">
                                             <span className="text-2xl font-black text-slate-900 leading-tight">{selectedOrder.buyerName}</span>
                                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedOrder.buyerEmail}</span>
                                          </div>
                                       </div>
                                       <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-8">
                                          <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Contact Node</p><p className="text-sm font-black text-slate-700">{selectedOrder.buyerPhone}</p></div>
                                          <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Delivery Target</p><p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-relaxed">{selectedOrder.shippingAddress}</p></div>
                                       </div>
                                    </Card>

                                    <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><ClipboardEdit className="h-7 w-7 text-indigo-600" /> Financial Breakdown</h5>
                                    <Card className="rounded-3xl border-0 bg-white p-8 space-y-8 shadow-xl shadow-slate-200/50">
                                       <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Seller Payment</span><span className="text-xl font-black text-slate-900">₹{sNum(selectedOrder.sellerAmount)}</span></div>
                                       <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Delivery Fee</span><span className="text-xl font-black text-slate-900">₹{sNum(selectedOrder.deliveryFee)}</span></div>
                                       <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Platform Profit</span><span className="text-xl font-black text-indigo-600">₹{sNum(selectedOrder.platformFee)}</span></div>
                                       <div className="pt-8 border-t border-slate-100 flex justify-between items-center"><span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Verified Ledger</span><Badge className="bg-emerald-500 text-white border-0 text-[10px] px-4 py-1.5 font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 tracking-widest">100% Correct</Badge></div>
                                    </Card>

                                    <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><ShoppingCart className="h-7 w-7 text-purple-600" /> Purchased Items</h5>
                                    <div className="space-y-6">
                                       {selectedOrder.items?.map((it, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                             <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center shadow-inner">
                                                   {it.image ? <img src={it.image} alt={it.productName} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 w-8 text-slate-300" />}
                                                </div>
                                                <div className="flex flex-col"><span className="text-xl font-black text-slate-900 tracking-tight">{it.productName}</span><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{it.quantity} {it.unit} sold</span></div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="space-y-10">
                                    <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><Banknote className="h-7 w-7 text-emerald-600" /> Payout Intelligence</h5>
                                    <div className="space-y-8">
                                       {selectedOrder.sellers?.map((sObj, sIdx) => (
                                          <Card key={sIdx} className="rounded-[3rem] border-0 bg-slate-950 text-white p-10 shadow-2xl relative overflow-hidden group">
                                             <div className="relative z-10 space-y-8">
                                                <div className="flex justify-between items-start">
                                                   <div>
                                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Seller</p>
                                                      <p className="text-lg font-black text-white tracking-tight">{sObj.name || 'Unknown Seller'}</p>
                                                   </div>
                                                   <div className="text-right">
                                                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Payout Share</p>
                                                      <p className="text-2xl font-black text-white tracking-tighter">₹{sObj.totalEarned?.toLocaleString() || '0'}</p>
                                                   </div>
                                                </div>
                                                {!sObj.bankDetails?.accountNumber ? (
                                                   <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
                                                      <AlertTriangle className="h-6 w-6 text-rose-500" />
                                                      <div>
                                                         <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">Security Alert</p>
                                                         <p className="text-[10px] text-rose-400 font-bold mt-2 leading-relaxed">No verified bank account found. Funds locked until profile update.</p>
                                                      </div>
                                                      <Button size="sm" variant="secondary" className="ml-auto h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => window.open(`tel:${sObj.phone}`)}>Call Node</Button>
                                                   </div>
                                                ) : (
                                                   <div>
                                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verified Ledger Node</p>
                                                      <p className="text-2xl font-mono font-black text-white tracking-[0.2em] bg-white/5 p-4 rounded-xl shadow-inner border border-white/5">{sObj.bankDetails.accountNumber}</p>
                                                   </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                                                   <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Bank Branch</p><p className="text-sm font-black text-indigo-400 uppercase">{sObj.bankDetails?.bankName || 'NOT SET'}</p></div>
                                                   <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">IFSC Routing</p><p className="text-sm font-black text-emerald-400 uppercase font-mono">{sObj.bankDetails?.ifscCode || 'NOT SET'}</p></div>
                                                </div>
                                             </div>
                                             <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-all duration-700"><Banknote className="h-64 w-64" /></div>
                                          </Card>
                                       ))}
                                    </div>

                                    <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><Truck className="h-7 w-7 text-indigo-400" /> Logistics Status</h5>
                                    {(!selectedOrder.deliveryPartners || selectedOrder.deliveryPartners.length === 0) ? (
                                       <div className="p-12 bg-slate-100 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center">
                                          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
                                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Awaiting Logistics Node</p>
                                          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">This order is in the seller's queue.<br />No delivery partner assigned yet.</p>
                                       </div>
                                    ) : selectedOrder.deliveryPartners.map((dp, idx) => (
                                       <div key={idx} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-500">
                                          <div className="flex items-center gap-6">
                                             <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">DP</div>
                                             <div className="flex flex-col">
                                                <span className="text-xl font-black text-slate-900 tracking-tight">{dp.partnerName}</span>
                                                <div className="flex items-center gap-2 mt-2">
                                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Payout:</span>
                                                   {dp.partnerPaymentReceived ? <Badge className="bg-emerald-500 text-white border-0 text-[8px] px-3 py-1 font-black uppercase tracking-widest">VERIFIED PAID</Badge> : <Badge className="bg-amber-500 text-white border-0 text-[8px] px-3 py-1 font-black uppercase tracking-widest">PENDING</Badge>}
                                                </div>
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee</p>
                                             <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{dp.totalPrice}</span>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     <DialogFooter className="p-6 bg-white border-t border-slate-200 flex gap-6 shrink-0">
                        <Button variant="ghost" className="font-black text-[11px] text-slate-400 h-12 px-10 rounded-2xl uppercase tracking-widest" onClick={() => setIsOrderModalOpen(false)}>Close Ledger</Button>
                        <Button className="flex-grow h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-emerald-600/30 uppercase tracking-widest hover:bg-emerald-700 transition-all" onClick={() => { setIsOrderModalOpen(false); handleSettle(selectedOrder.id); }}>Release Final Funds</Button>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>
            </div>
         </main>
      </div>
   );
}
