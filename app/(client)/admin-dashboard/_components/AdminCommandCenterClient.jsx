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
   ChevronLeft, ImageIcon, Trash2, ArrowRight,
   UserX, UserCheck2, RefreshCw, ShoppingBag,
   ListChecks, ClipboardEdit, StickyNote, Map as LucideMap,
   Zap,
   Star,
   Box,
   Store,
   XCircle,
   RotateCcw
} from "lucide-react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvUtils';
import { getExportableUsers, getExportableProducts, toggleUserStatus } from '@/actions/admin-advanced';
import { approveProfile, rejectProfile, bulkApproveProfiles } from '@/actions/admin';
import { AnimatePresence, motion } from 'framer-motion';
import PremiumLoader from '@/components/PremiumLoader';
import RoleBadge from './RoleBadge';
import FilterBar from './FilterBar';
import FilterDrawer from './FilterDrawer';
import { StatusBadge, WorkflowActionButton, AdminOverrideDialog, StatusFilter } from './WorkflowSystem';

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
   const [specialRequests, setSpecialRequests] = useState([]);
   const [isMediationModalOpen, setIsMediationModalOpen] = useState(false);
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
   const [pendingOverride, setPendingOverride] = useState(null);
   const [negotiatedFee, setNegotiatedFee] = useState("");
   const [adminQuantity, setAdminQuantity] = useState("");

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
   const [supportMessages, setSupportMessages] = useState([]);
   const [unreadSupportCount, setUnreadSupportCount] = useState(0);
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
   const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
   const [selectedMessage, setSelectedMessage] = useState(null);

   // Sorting & Filtering
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState("ALL");
   const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

   // Advanced Filters State
   const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
   const [advancedFilters, setAdvancedFilters] = useState({
      orderStatus: 'ALL',
      paymentStatus: 'ALL',
      payoutStatus: 'ALL',
      buyerRole: 'ALL',
      sellerRole: 'ALL',
      category: 'ALL',
      sellerType: 'ALL',
      stockStatus: 'ALL',
      securityStatus: 'ALL',
      minAmount: '',
      maxAmount: '',
   });

   const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

   useEffect(() => {
      setMounted(true);
      fetchInitialData();

      const interval = setInterval(() => {
         refreshData();
      }, 30000);
      return () => clearInterval(interval);
   }, []);

   // Lazy load data based on view
   useEffect(() => {
      if (!mounted) return;
      setStatusFilter("ALL"); // Ensure 'ALL' is default for every section
      if (['farmers', 'agents', 'delivery', 'catalog', 'logistics', 'reviews', 'support', 'disputes', 'orders', 'verifications', 'mediation'].includes(activeView)) {
         fetchDirectoryData(activeView);
      }
   }, [activeView, mounted]);

   useEffect(() => {
      if (mounted) fetchDirectoryData(activeView);
   }, [search, statusFilter, advancedFilters, currentPage, sortConfig]);

   const fetchInitialData = async () => {
      setIsLoading(true);
      try {
         const [resS, resO, resPR, resU] = await Promise.all([
            statsAction(),
            ordersAction(),
            getPendingAction(),
            import('@/actions/support').then(m => m.getUnreadSupportCount())
         ]);
         if (resS.success) setStats(resS.data || {});
         if (resO.success) setOrders(resO.data.orders || []);
         if (resPR.success) setPendingProfiles(resPR.data || []);
         if (resU.success) setUnreadSupportCount(resU.data || 0);
      } catch (err) { console.error("Initial load failed:", err); } finally { setIsLoading(false); }
   };

   const fetchDirectoryData = async (view) => {
      setIsLoading(true);
      try {
         const filterParams = {
            filters: {
               ...advancedFilters,
               search,
               status: statusFilter
            },
            sort: sortConfig,
            page: currentPage,
            limit: itemsPerPage
         };

         if (view === 'farmers') {
            const res = await getExportableUsers('farmer', filterParams);
            if (res.success) {
               setFarmers(res.data.users);
               setPagination({ total: res.data.total, totalPages: res.data.totalPages });
            }
         } else if (view === 'agents') {
            const res = await getExportableUsers('agent', filterParams);
            if (res.success) {
               setAgents(res.data.users);
               setPagination({ total: res.data.total, totalPages: res.data.totalPages });
            }
         } else if (view === 'delivery') {
            const res = await getExportableUsers('delivery', filterParams);
            if (res.success) {
               setDeliveryPartners(res.data.users);
               setPagination({ total: res.data.total, totalPages: res.data.totalPages });
            }
         } else if (view === 'catalog') {
            const res = await getExportableProducts(filterParams);
            if (res.success) {
               setProducts(res.data.products);
               setPagination({ total: res.data.total, totalPages: res.data.totalPages });
            }
         } else if (view === 'logistics') {
            const res = await deliveryJobsAction(filterParams);
            if (res.success) {
               setDeliveryJobs(res.data.jobs);
               setPagination({ total: res.data.total, totalPages: res.data.totalPages });
            }
         } else if (view === 'reviews') {
            const res = await reviewsAction(filterParams);
            if (res.success) setReviews(res.data);
         } else if (view === 'support') {
            const { getSupportMessages } = await import('@/actions/support');
            const res = await getSupportMessages(currentPage, search);
            if (res.success) {
               const fetchedMessages = res.data?.messages || res.data || [];
               setSupportMessages(Array.isArray(fetchedMessages) ? fetchedMessages : []);
               setPagination({ total: res.data?.total || 0, totalPages: res.data?.totalPages || 1 });
            }
         } else if (view === 'mediation') {
            const { getSpecialDeliveryRequests } = await import('@/actions/special-delivery');
            const res = await getSpecialDeliveryRequests();
            if (res.success) setSpecialRequests(res.data);
         } else if (view === 'orders' || view === 'disputes') {
            const params = {
               ...filterParams,
               filters: {
                  ...filterParams.filters,
                  ...(view === 'disputes' ? { disputeStatus: 'OPEN' } : {})
               }
            };
            const res = await ordersAction(params);
            if (res.success) {
               setOrders(res.data.orders || []);
               setPagination({ total: res.data.total || 0, totalPages: res.data.totalPages || 1 });
            }
         }
      } catch (err) {
         console.error(`Fetch ${view} failed:`, err);
      } finally {
         setIsLoading(false);
      }
   };

   const refreshData = async () => {
      if (['farmers', 'agents', 'delivery', 'catalog', 'logistics', 'reviews', 'support', 'disputes', 'orders', 'mediation'].includes(activeView)) {
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

   const getFilteredItems = () => {
      let items = [];
      if (activeView === 'verifications') items = Array.isArray(pendingProfiles) ? pendingProfiles : [];
      else if (activeView === 'farmers') items = Array.isArray(farmers) ? farmers : [];
      else if (activeView === 'agents') items = Array.isArray(agents) ? agents : [];
      else if (activeView === 'delivery') items = Array.isArray(deliveryPartners) ? deliveryPartners : [];
      else if (activeView === 'orders') items = Array.isArray(orders) ? orders : [];
      else if (activeView === 'disputes') items = Array.isArray(orders) ? orders : [];
      else if (activeView === 'catalog') items = Array.isArray(products) ? products : [];
      else if (activeView === 'logistics') items = Array.isArray(deliveryJobs) ? deliveryJobs : [];
      else if (activeView === 'reviews') items = Array.isArray(reviews) ? reviews : [];
      else if (activeView === 'support') items = Array.isArray(supportMessages) ? supportMessages : [];
      else if (activeView === 'mediation') items = Array.isArray(specialRequests) ? specialRequests : [];

      // Apply Status Filter
      if (statusFilter && statusFilter !== 'ALL') {
         items = items.filter(item => {
            const status = (item.status || item.orderStatus || item.payoutStatus || item.paymentStatus || item.approvalStatus || (item.isRead ? 'CLOSED' : 'OPEN'))?.toUpperCase();
            return status === statusFilter.toUpperCase();
         });
      }

      // Apply Search Filter
      if (search) {
         const s = search.toLowerCase();
         items = items.filter(item => 
            (item.name || item.displayName || item.buyerName || item.userName || item.productName || item.product?.productName || item.user?.name || "")
            .toLowerCase().includes(s)
         );
      }

      return items;
   };

   const getStatusOptions = () => {
      const options = {
         support: [
            { label: 'Open', value: 'OPEN' },
            { label: 'Closed', value: 'CLOSED' },
         ],
         orders: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Processing', value: 'PROCESSING' },
            { label: 'Shipped', value: 'SHIPPED' },
            { label: 'Delivered', value: 'DELIVERED' },
            { label: 'Cancelled', value: 'CANCELLED' },
         ],
         payouts: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Settled', value: 'SETTLED' },
         ],
         mediation: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
         ]
      };
      return options[activeView] || [];
   };

   const paginate = (items) => items;

   const openOrderAudit = async (orderId) => {
      setIsLoadingDetails(true);
      setIsOrderModalOpen(true);

      try {
         const order = Array.isArray(orders) ? orders.find(o => o.id === orderId) : null;
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

   const openSupportAudit = async (message) => {
      setSelectedMessage(message);
      setIsSupportModalOpen(true);
      if (!message.isRead) {
         const { markSupportMessageAsRead } = await import('@/actions/support');
         await markSupportMessageAsRead(message.id);
         refreshData();
      }
   };

   const handleCloseSupportTicket = async (id) => {
      const { deleteSupportMessage } = await import('@/actions/support');
      const toastId = toast.loading("Closing and archiving ticket...");
      const res = await deleteSupportMessage(id);
      if (res.success) {
         toast.success(res.message, { id: toastId });
         setIsSupportModalOpen(false);
         refreshData();
      } else {
         toast.error(res.error, { id: toastId });
      }
   };

   const disputes = useMemo(() => {
      if (!Array.isArray(orders)) return [];
      return orders.filter(o => o.disputeStatus === 'OPEN');
   }, [orders]);



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
      { id: 'mediation', label: 'Product Approval', icon: ShieldAlert, color: 'text-rose-600', badge: Array.isArray(specialRequests) ? specialRequests.filter(r => r.status === 'PENDING').length : 0 },
      { id: 'catalog', label: 'Product List', icon: Package, color: 'text-purple-500' },
      { id: 'reviews', label: 'User Reviews', icon: Star, color: 'text-yellow-500' },
      { id: 'support', label: 'Help & Support', icon: HelpCircle, color: 'text-rose-500', badge: unreadSupportCount },
      { id: 'finance', label: 'Money & Bank', icon: IndianRupee, color: 'text-emerald-600' },
   ];

   const Pagination = () => {
      const { total, totalPages } = pagination;
      if (total === 0) return null;

      return (
         <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 sticky bottom-0 z-20">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
               Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} records
            </p>
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
               >
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                     const pageNum = i + 1;
                     // Only show a few page numbers if there are many
                     if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                        if (Math.abs(pageNum - currentPage) === 3) return <span key={i} className="text-slate-300">...</span>;
                        return null;
                     }
                     return (
                        <Button
                           key={i}
                           variant={currentPage === pageNum ? "default" : "ghost"}
                           size="sm"
                           className={`h-8 w-8 p-0 rounded-lg text-[10px] font-black ${currentPage === pageNum ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                           onClick={() => setCurrentPage(pageNum)}
                        >
                           {pageNum}
                        </Button>
                     );
                  })}
               </div>
               <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
               >
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
         </div>
      );
   };

   return (
      <div className="flex h-screen overflow-hidden bg-slate-50 text-[13px] font-sans selection:bg-indigo-100 selection:text-indigo-900">
         <style>{CUSTOM_SCROLLBAR_CSS}</style>


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

            <div className="flex-grow overflow-y-auto custom-scrollbar relative">
               <AnimatePresence>
                  {isLoading && <PremiumLoader fullPage={false} message="Syncing Command Center..." />}
               </AnimatePresence>
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
                           <Card className="border-0 shadow-sm rounded-2xl bg-rose-500 p-6 border-t-4 border-rose-600">
                              <p className="text-[9px] font-black text-rose-100 uppercase tracking-widest mb-1">Blocked Accounts</p>
                              <h3 className="text-2xl font-black text-white tracking-tighter">{sNum(stats.users?.disabledCount)} Users</h3>
                              <p className="text-[9px] font-bold text-rose-100 mt-4 uppercase tracking-tighter">Access Restricted</p>
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
                              <Card className="rounded-[2rem] border-0 shadow-sm bg-white overflow-hidden flex flex-col">
                                 <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0"><h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><LucideHistory className="h-4 w-4 text-indigo-500" /> Recent Platform Activity</h4></div>
                                 <div className="flex-grow overflow-y-auto custom-scrollbar">
                                    <Table>
                                       <TableHeader className="bg-slate-50/50 text-[9px] uppercase font-black text-slate-400 h-10 border-slate-50 sticky top-0 z-10 backdrop-blur-md"><TableRow><TableHead className="pl-8">ORDER ID</TableHead><TableHead>MEMBER</TableHead><TableHead>TOTAL BILL</TableHead><TableHead>STATUS</TableHead><TableHead className="text-right pr-8">VIEW</TableHead></TableRow></TableHeader>
                                       <TableBody>
                                          {Array.isArray(orders) && orders.slice(0, 6).map((o, idx) => (
                                             <TableRow key={idx} className="h-16 border-slate-50 hover:bg-slate-50/50 group">
                                                <TableCell className="pl-8 font-black text-slate-900">#{o.id.slice(-6).toUpperCase()}</TableCell>
                                                <TableCell className="text-[11px] font-bold text-slate-600">{s(o.buyerName)}</TableCell>
                                                <TableCell className="font-black text-slate-900 text-xs">{"\u20B9"}{sNum(o.totalAmount).toLocaleString()}</TableCell>
                                                <TableCell><StatusBadge status={getFriendlyStatus(o.orderStatus)} type="orders" size="xs" /></TableCell>
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
                  {['verifications', 'disputes', 'orders', 'farmers', 'agents', 'delivery', 'catalog', 'logistics', 'reviews', 'support', 'mediation'].includes(activeView) && (
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
                              <div className="flex flex-col gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                                 <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{activeView.replace('_', ' ')} Management</h2>
                                       <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Enterprise oversight / {pagination.total} records found</p>
                                    </div>

                                    <FilterBar
                                       search={search}
                                       setSearch={setSearch}
                                       activeFilters={{
                                          ...advancedFilters,
                                          status: statusFilter
                                       }}
                                       onClearFilters={(key) => {
                                          if (!key) {
                                             setSearch("");
                                             setStatusFilter("ALL");
                                             setAdvancedFilters({
                                                orderStatus: 'ALL',
                                                paymentStatus: 'ALL',
                                                payoutStatus: 'ALL',
                                                buyerRole: 'ALL',
                                                sellerRole: 'ALL',
                                                category: 'ALL',
                                                sellerType: 'ALL',
                                                stockStatus: 'ALL',
                                                securityStatus: 'ALL',
                                                minAmount: '',
                                                maxAmount: '',
                                             });
                                          } else {
                                             if (key === 'status') setStatusFilter("ALL");
                                             else setAdvancedFilters(prev => ({ ...prev, [key]: 'ALL' }));
                                          }
                                       }}
                                       onOpenAdvanced={() => setIsFilterDrawerOpen(true)}
                                       onExport={activeView === 'farmers' ? () => downloadCSV(farmers, 'farmers_export') : undefined}
                                       statusOptions={getStatusOptions()}
                                       onStatusChange={setStatusFilter}
                                    />
                                 </div>
                              </div>

                              <FilterDrawer
                                 isOpen={isFilterDrawerOpen}
                                 onClose={() => setIsFilterDrawerOpen(false)}
                                 filters={advancedFilters}
                                 setFilters={setAdvancedFilters}
                                 onApply={() => setIsFilterDrawerOpen(false)}
                                 onReset={() => {
                                    setAdvancedFilters({
                                       orderStatus: 'ALL',
                                       paymentStatus: 'ALL',
                                       payoutStatus: 'ALL',
                                       buyerRole: 'ALL',
                                       sellerRole: 'ALL',
                                       category: 'ALL',
                                       sellerType: 'ALL',
                                       stockStatus: 'ALL',
                                       securityStatus: 'ALL',
                                       minAmount: '',
                                       maxAmount: '',
                                    });
                                 }}
                                 config={[
                                    {
                                       title: "Order & Payment",
                                       filters: [
                                          {
                                             key: 'orderStatus', label: 'Order Status', type: 'select', options: [
                                                { label: 'Processing', value: 'PROCESSING' },
                                                { label: 'Packed', value: 'PACKED' },
                                                { label: 'Shipped', value: 'SHIPPED' },
                                                { label: 'In Transit', value: 'IN_TRANSIT' },
                                                { label: 'Delivered', value: 'DELIVERED' },
                                                { label: 'Cancelled', value: 'CANCELLED' },
                                             ]
                                          },
                                          {
                                             key: 'paymentStatus', label: 'Payment Status', type: 'select', options: [
                                                { label: 'Paid', value: 'PAID' },
                                                { label: 'Pending', value: 'PENDING' },
                                             ]
                                          },
                                          {
                                             key: 'payoutStatus', label: 'Payout Status', type: 'select', options: [
                                                { label: 'Settled', value: 'SETTLED' },
                                                { label: 'Pending', value: 'PENDING' },
                                             ]
                                          }
                                       ]
                                    },
                                    {
                                       title: "Roles & Security",
                                       filters: [
                                          {
                                             key: 'buyerRole', label: 'Buyer Role', type: 'select', options: [
                                                { label: 'Farmer', value: 'farmer' },
                                                { label: 'Agent', value: 'agent' },
                                             ]
                                          },
                                          {
                                             key: 'sellerRole', label: 'Seller Role', type: 'select', options: [
                                                { label: 'Farmer', value: 'farmer' },
                                                { label: 'Agent', value: 'agent' },
                                             ]
                                          },
                                          {
                                             key: 'securityStatus', label: 'Security Status', type: 'select', options: [
                                                { label: 'Active', value: 'ACTIVE' },
                                                { label: 'Blocked', value: 'BLOCKED' },
                                             ]
                                          }
                                       ]
                                    }
                                 ]}
                              />
                           </div>
                        </div>

                        {/* ACTIVE FILTER TAGS */}
                        {(search || statusFilter !== 'ALL') && (
                           <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                              {search && (
                                 <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                    Search: {search}
                                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setSearch("")} />
                                 </Badge>
                              )}
                              {statusFilter !== 'ALL' && (
                                 <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                    Status: {statusFilter.replace('_', ' ')}
                                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setStatusFilter("ALL")} />
                                 </Badge>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 rounded-lg" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>Clear All Filters</Button>
                           </div>
                        )}

                        <Card className="rounded-[2rem] border-0 shadow-sm bg-white overflow-hidden flex flex-col">
                           <div className="flex-grow overflow-y-auto custom-scrollbar">
                              <Table>
                                 <TableHeader className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 h-12 border-slate-50 sticky top-0 z-20 backdrop-blur-md">
                                    <TableRow>
                                       {activeView === 'verifications' && <TableHead className="w-12 pl-6"></TableHead>}
                                       <TableHead className={activeView === 'verifications' ? "pl-2" : "pl-8"}>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'ORDER ID & BUYER' :
                                             activeView === 'logistics' ? 'DELIVERY BOY & ORDER' :
                                                activeView === 'reviews' ? 'REVIEWER & PRODUCT' :
                                                   activeView === 'support' ? 'SUPPORT USER' :
                                                      activeView === 'mediation' ? 'PRODUCT & USER' : 'IDENTITY & NAME'}
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
                                                   activeView === 'mediation' ? 'FEE/PRICE' : 'JOIN DATE'}
                                       </TableHead>
                                       <TableHead>
                                          {activeView === 'orders' || activeView === 'disputes' ? 'METHOD' :
                                             activeView === 'logistics' ? 'TIME ESTIMATE' :
                                                activeView === 'reviews' ? 'DATE' :
                                                   activeView === 'mediation' ? 'STATUS' : 'ACCOUNT STATE'}
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
                                                         activeView === 'support' ? 'bg-rose-50 text-rose-600 border-rose-100' : item.role === 'farmer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                   }`}>
                                                   {(item.productName || item.name || item.displayName || item.buyerName || item.userName || item.product?.productName)?.[0] || 'O'}
                                                </div>
                                                <div className="flex flex-col">
                                                   <div className="flex items-center gap-2">
                                                      <span className="font-black text-slate-900 text-sm leading-tight">
                                                         {activeView === 'logistics' ? item.deliveryBoy?.name :
                                                            activeView === 'reviews' ? item.user?.name :
                                                               activeView === 'mediation' ? item.product?.productName :
                                                                  s(item.productName || item.name || item.displayName || item.buyerName || item.userName)}
                                                      </span>
                                                      {activeView === 'orders' && <RoleBadge role={item.buyer?.role} />}
                                                      {(activeView === 'farmers' || activeView === 'agents' || activeView === 'delivery') && <RoleBadge role={item.role || activeView.slice(0, -1)} />}
                                                      {activeView === 'support' && <RoleBadge role={item.userRole} />}
                                                   </div>
                                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                      {activeView === 'orders' ? <>Bill: ₹{item.totalAmount}</> :
                                                         activeView === 'catalog' ? <>Price: ₹{item.pricePerUnit} / {item.unit}</> :
                                                            activeView === 'logistics' ? <>Order ID: #{item.orderId?.slice(-6).toUpperCase()}</> :
                                                               activeView === 'reviews' ? <>Product: {item.product?.productName}</> :
                                                                  activeView === 'mediation' ? <>User: {item.user?.name}</> :
                                                                     activeView === 'support' ? item.userEmail : `ID: #${(item.userId || item.id)?.slice(-6).toUpperCase()}`}
                                                   </span>
                                                </div>
                                             </div>
                                          </TableCell>
                                          <TableCell>
                                             <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                   {activeView === 'orders' || activeView === 'disputes' ? (
                                                      <div className="flex flex-wrap items-center gap-1.5">
                                                         <StatusBadge status={item.paymentStatus} type="payouts" size="xs" />
                                                         <StatusBadge status={item.payoutStatus} type="payouts" size="xs" />
                                                      </div>
                                                   ) : activeView === 'logistics' ? (
                                                      <div className="flex flex-col gap-1">
                                                         <div className="flex items-center gap-2">
                                                            <StatusBadge status={item.status} type="logistics" size="xs" />
                                                            <RoleBadge role="delivery" size="xs" />
                                                         </div>
                                                         {item.order?.buyer?.role && (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                               <span className="text-[7px] font-black text-slate-400 uppercase">Buyer:</span>
                                                               <RoleBadge role={item.order.buyer.role} size="xs" />
                                                            </div>
                                                         )}
                                                      </div>
                                                   ) : activeView === 'reviews' ? (
                                                      <div className="flex items-center gap-1">
                                                         {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`} />
                                                         ))}
                                                      </div>
                                                   ) : activeView === 'catalog' ? (
                                                      <div className="flex flex-col">
                                                         <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-900 leading-none">{s(item.sellerName)}</span>
                                                            <RoleBadge role={item.sellerType} />
                                                         </div>
                                                         <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-0 bg-indigo-50 text-indigo-700 rounded-md w-fit mt-1">Sold: {sNum(item.unitsSold)}</Badge>
                                                      </div>
                                                   ) : (
                                                      <>
                                                         <span className="text-[10px] font-black text-slate-900 leading-none">
                                                            {activeView === 'support' ? (item.type?.replace('_', ' ') || 'SUPPORT REQUEST') :
                                                               activeView === 'mediation' ? `₹${item.negotiatedFee || 0} Fee` :
                                                                  s(item.city || item.category || item.vehicleType)}
                                                         </span>
                                                         <div className="mt-1 flex items-center gap-2">
                                                            {activeView === 'support' && <StatusBadge status={item.isRead ? 'CLOSED' : 'OPEN'} type="support" size="xs" />}
                                                            {activeView === 'mediation' && <StatusBadge status={item.status} type="moderation" size="xs" />}
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                               {activeView === 'support' ? "" :
                                                                  activeView === 'mediation' ? `Base: ₹${item.product?.pricePerUnit}` :
                                                                     s(item.district)}
                                                            </span>
                                                         </div>
                                                      </>
                                                   )}
                                                </div>
                                             </div>
                                          </TableCell>
                                          <TableCell className="text-[10px] font-black text-slate-400 uppercase">{activeView === 'orders' || activeView === 'disputes' ? (
                                             <StatusBadge status={item.orderStatus} type="orders" size="xs" />
                                          ) : activeView === 'logistics' ? (
                                             <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 leading-none">{item.distance} KM</span>
                                                <span className="text-[9px] font-bold text-indigo-600 uppercase mt-0.5">₹{item.totalPrice}</span>
                                             </div>
                                          ) : activeView === 'catalog' ? (

                                             <span className="text-[10px] font-black text-slate-600">{s(item.category)}</span>
                                          ) : (
                                             item.createdAt && mounted ? new Date(item.createdAt).toLocaleDateString() : '—'
                                          )}</TableCell>
                                          <TableCell>{activeView === 'orders' || activeView === 'disputes' ? (
                                             <span className="text-[10px] font-black text-slate-600 uppercase">{item.paymentMethod}</span>
                                          ) : activeView === 'logistics' ? (
                                             <span className="text-[10px] font-black text-slate-600 uppercase">{item.estimatedTime || 'ASAP'}</span>
                                          ) : activeView === 'farmers' || activeView === 'agents' ? (
                                             <div className="flex flex-col gap-1.5 items-center">
                                                <div className="flex gap-1">
                                                   <StatusBadge status={item.sellingStatus || 'PENDING'} type="moderation" size="xs" />
                                                   <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md ${item.usagePurpose === 'buy_and_sell' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                      {item.usagePurpose === 'buy_and_sell' ? 'BUY & SELL' : 'BUY ONLY'}
                                                   </Badge>
                                                </div>
                                                <StatusBadge status={item.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'} type="support" size="xs" />
                                             </div>
                                          ) : activeView === 'mediation' ? (
                                             <div className="flex flex-col gap-1.5 items-center">
                                                <StatusBadge status={item.status} type="moderation" size="xs" />
                                                <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md ${item.inquirySent ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                   {item.inquirySent ? 'Message Sent' : 'No Message'}
                                                </Badge>
                                             </div>
                                          ) : (
                                             <div className="flex flex-col gap-1.5 items-center">
                                                {(activeView === 'support' || activeView === 'delivery') && (
                                                   <StatusBadge status={activeView === 'support' ? (item.userRole || 'USER') : (item.approvalStatus || 'PENDING')} type="moderation" size="xs" />
                                                )}
                                                <StatusBadge status={item.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'} type="support" size="xs" />
                                             </div>
                                          )}</TableCell>
                                          <TableCell className="pr-8 text-right">
                                             <div className="flex justify-end gap-2 transition-all">
                                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg bg-white border-slate-200 shadow-sm hover:border-indigo-600 hover:text-indigo-600" onClick={() => {
                                                   if (activeView === 'orders' || activeView === 'disputes') openOrderAudit(item.id);
                                                   else if (activeView === 'catalog') openProductAudit(item);
                                                   else if (activeView === 'support') openSupportAudit(item);
                                                   else if (activeView === 'mediation') {
                                                      setSelectedRequest(item);
                                                      setIsMediationModalOpen(true);
                                                      setNegotiatedFee(item.negotiatedFee || "");
                                                      setAdminQuantity(item.quantity || "");
                                                   }

                                                   else openProfileAudit(item);
                                                }}><Eye className="h-4 w-4 text-slate-400" /></Button>
                                                {activeView === 'orders' && (
                                                   <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteOrder(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                )}
                                                {activeView !== 'orders' && activeView !== 'mediation' && (
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
            </div>
         </main>

         {/* PRODUCT AUDIT MODAL */}
         <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
            <DialogContent className="sm:max-w-xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
               <div className="bg-purple-600 p-8 text-white relative">
                  <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full mb-3 tracking-widest">CATALOG AUDIT</Badge>
                  <DialogTitle className="text-3xl font-black tracking-tighter leading-none">{selectedProduct?.productName}</DialogTitle>
                  <p className="text-purple-100 font-bold mt-2 text-sm uppercase tracking-widest">ID: #{selectedProduct?.id?.slice(-8).toUpperCase()}</p>
               </div>
               <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50">
                  <div className="p-8 space-y-8">
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
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory & Delivery</h5>
                        <div className="p-6 bg-white border border-slate-100 rounded-3xl grid grid-cols-2 gap-4 shadow-sm">
                           <div><p className="text-[9px] font-black text-slate-400 uppercase">Available Stock</p><p className="text-xl font-black text-slate-900">{selectedProduct?.availableStock} {selectedProduct?.unit}</p></div>
                           <div><p className="text-[9px] font-black text-slate-400 uppercase">Max Delivery Range</p><p className="text-xl font-black text-indigo-600">{selectedProduct?.maxDeliveryRange ? `${selectedProduct.maxDeliveryRange} KM` : "Profile Default"}</p></div>
                           <div className="pt-2 border-t border-slate-50"><p className="text-[9px] font-black text-slate-400 uppercase">Listing State</p><Badge className={selectedProduct?.isDisabled ? "bg-rose-100 text-rose-600 border-0 text-[8px] font-black" : "bg-emerald-100 text-emerald-600 border-0 text-[8px] font-black"}>{selectedProduct?.isDisabled ? "DEACTIVATED" : "LIVE"}</Badge></div>
                        </div>
                     </div>
                  </div>
               </div>
               <DialogFooter className="p-6 bg-white border-t border-slate-100 shrink-0">
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
                           <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4 mb-8">
                              <h5 className="flex items-center gap-3 text-[10px] font-black text-rose-600 uppercase tracking-widest"><ShieldAlert className="h-5 w-5" /> Security Controls</h5>
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="text-sm font-black text-rose-900 leading-none">Account Access</p>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase mt-1">Status: {selectedProfile?.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'}</p>
                                 </div>
                                 <Button
                                    variant={selectedProfile?.user?.isDisabled ? "default" : "outline"}
                                    className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedProfile?.user?.isDisabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-rose-200 text-rose-600 hover:bg-rose-100'}`}
                                    onClick={() => handleToggleStatus(selectedProfile?.userId || selectedProfile?.id, selectedProfile?.displayName)}
                                 >
                                    {selectedProfile?.user?.isDisabled ? <><UserCheck2 className="mr-2 h-4 w-4" /> Re-Enable Account</> : <><UserX className="mr-2 h-4 w-4" /> Disable Account</>}
                                 </Button>
                              </div>
                           </div>
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
                                             <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl border border-white/20">
                                                   {sObj.name?.[0]}
                                                </div>
                                                <div>
                                                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Seller</p>
                                                   <div className="flex items-center gap-2">
                                                      <p className="text-lg font-black text-white tracking-tight">{sObj.name || 'Unknown Seller'}</p>
                                                      <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md shadow-sm ${sObj.isDisabled ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                         {sObj.isDisabled ? 'BLOCKED' : 'ACTIVE'}
                                                      </Badge>
                                                   </div>
                                                </div>
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

               <DialogFooter className="p-6 bg-white border-t border-slate-200 flex flex-col gap-6 shrink-0">
                  <div className="flex gap-6 w-full">
                     <Button variant="ghost" className="font-black text-[11px] text-slate-400 h-12 px-10 rounded-2xl uppercase tracking-widest" onClick={() => setIsOrderModalOpen(false)}>Close Ledger</Button>
                     <Button className="flex-grow h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-emerald-600/30 uppercase tracking-widest hover:bg-emerald-700 transition-all" onClick={() => { setIsOrderModalOpen(false); handleSettle(selectedOrder.id); }}>Release Final Funds</Button>
                  </div>
               </DialogFooter>
            </DialogContent>
         </Dialog>
         {/* SUPPORT MESSAGE MODAL */}
         <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
            <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
               <div className="bg-rose-600 p-8 text-white relative shrink-0">
                  <div className="flex items-center justify-between mb-4">
                     <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest">SUPPORT TICKET</Badge>
                     <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedMessage?.isRead ? 'bg-white/20' : 'bg-white animate-bounce text-rose-600'}`}>
                        {selectedMessage?.isRead ? 'ARCHIVED' : 'ACTION REQUIRED'}
                     </Badge>
                  </div>
                  <DialogTitle className="text-3xl font-black tracking-tighter leading-tight flex items-center gap-3">
                     <HelpCircle className="h-8 w-8" /> Support Request
                  </DialogTitle>
                  <p className="text-rose-100 font-bold mt-2 text-sm uppercase tracking-widest">From: {selectedMessage?.userName} ({selectedMessage?.userRole})</p>
               </div>
               <div className="p-8 space-y-8 bg-slate-50/50 flex-grow overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="h-4 w-4" /> Message Content</h5>
                        <span className="text-[10px] font-bold text-slate-400">{selectedMessage?.createdAt && new Date(selectedMessage.createdAt).toLocaleString()}</span>
                     </div>

                     {/* BEAUTIFIED MESSAGE BUBBLE */}
                     <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-rose-100 to-indigo-100 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <Card className="relative p-10 rounded-[2.5rem] border-0 bg-white shadow-sm overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5"><HelpCircle className="h-24 w-24 text-rose-600" /></div>
                           <p className="text-slate-700 leading-relaxed text-lg font-medium italic relative z-10">
                              "{selectedMessage?.message}"
                           </p>
                        </Card>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">User Contact</p>
                        <p className="text-sm font-black text-slate-900 truncate flex items-center gap-2">
                           <Phone className="h-3 w-3 text-indigo-500" /> {selectedMessage?.userPhone || "NOT PROVIDED"}
                        </p>
                     </div>
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inquiry Type</p>
                        <div>
                           <Badge className="bg-indigo-50 text-indigo-700 border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">{selectedMessage?.type}</Badge>
                        </div>
                     </div>
                  </div>

                  {selectedMessage?.userAddress && (
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <MapPin className="h-3 w-3" /> Registered Address
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{selectedMessage?.userAddress}</p>
                     </div>
                  )}
               </div>
               <DialogFooter className="p-6 bg-white border-t border-slate-200 flex gap-6 shrink-0">
                  <Button
                     variant="ghost"
                     className="flex-1 font-black text-[11px] text-rose-600 hover:bg-rose-50 h-12 rounded-2xl uppercase tracking-widest"
                     onClick={() => handleCloseSupportTicket(selectedMessage.id)}
                  >
                     <Trash2 className="h-4 w-4 mr-2" /> Close & Archive
                  </Button>
                  <Button className="flex-[2] h-12 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-rose-600/30 uppercase tracking-widest hover:bg-rose-700 transition-all" onClick={() => window.open(`mailto:${selectedMessage?.userEmail}?subject=Re: KrishiConnect Support Ticket`)}>
                     Reply via Email <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* SPECIAL DELIVERY MEDIATION MODAL */}
         <Dialog open={isMediationModalOpen} onOpenChange={setIsMediationModalOpen}>
            <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
               <div className="bg-amber-500 p-8 text-white relative shrink-0">
                  <div className="flex items-center justify-between mb-4">
                     <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest">LOGISTICS MEDIATION</Badge>
                     <div className="flex gap-2">
                        <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedRequest?.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-white text-amber-600 animate-pulse'}`}>
                           {selectedRequest?.status}
                        </Badge>
                        <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedRequest?.inquirySent ? 'bg-blue-400' : 'bg-slate-800/40 text-slate-300'}`}>
                           {selectedRequest?.inquirySent ? 'INQUIRY RECEIVED' : 'AWAITING MESSAGE'}
                        </Badge>
                     </div>
                  </div>
                  <DialogTitle className="text-3xl font-black tracking-tighter leading-tight flex items-center gap-3">
                     <ShieldAlert className="h-8 w-8" /> Product Approval
                  </DialogTitle>
                  <p className="text-amber-100 font-bold mt-2 text-sm uppercase tracking-widest">Product: {selectedRequest?.product?.productName}</p>
               </div>
               <div className="p-8 space-y-6 bg-slate-50/50 flex-grow overflow-y-auto custom-scrollbar">
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                     <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package className="h-4 w-4 text-indigo-500" /> Product Information</h5>
                        <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                           {selectedRequest?.quantity} {selectedRequest?.product?.unit} Requested
                        </Badge>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                           {selectedRequest?.product?.images?.[0] ? (
                              <img src={selectedRequest.product.images[0]} alt="Product" className="w-full h-full object-cover" />
                           ) : <Package className="h-8 w-8 text-slate-200" />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-lg font-black text-slate-900 truncate uppercase tracking-tighter">{selectedRequest?.product?.productName}</p>
                           <p className="text-xs text-slate-500 font-bold">Base Price: ₹{selectedRequest?.product?.pricePerUnit} / {selectedRequest?.product?.unit}</p>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* BUYER NODE */}
                     <div className="space-y-4">
                        <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><UserCircle2 className="h-5 w-5 text-indigo-500" /> Buyer Profile</h5>
                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">BN</div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-slate-900 truncate">{selectedRequest?.user?.name}</p>
                                    <RoleBadge role={selectedRequest?.userRole} size="xs" />
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 truncate">{selectedRequest?.user?.email}</p>
                              </div>
                           </div>
                           <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
                              <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2"><Phone className="h-3 w-3 text-indigo-500" /> {selectedRequest?.buyerPhone}</p>
                              <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed"><MapPin className="h-3 w-3 inline mr-1" /> {selectedRequest?.buyerAddress}</p>
                           </div>
                        </div>
                     </div>

                     {/* SELLER NODE */}
                     <div className="space-y-4">
                        <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Store className="h-5 w-5 text-emerald-500" /> Seller Profile</h5>
                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-sm">SN</div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-slate-900 truncate">{selectedRequest?.product?.farmer?.name || selectedRequest?.product?.agent?.name}</p>
                                    <RoleBadge role={selectedRequest?.product?.farmer ? 'farmer' : 'agent'} size="xs" />
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 truncate">{selectedRequest?.product?.agent?.companyName || "Verified Producer"}</p>
                              </div>
                           </div>
                           <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
                              <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2"><Phone className="h-3 w-3 text-emerald-500" /> {selectedRequest?.product?.farmer?.phone || selectedRequest?.product?.agent?.phone}</p>
                              <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed"><MapPin className="h-3 w-3 inline mr-1" /> {selectedRequest?.product?.farmer?.address || selectedRequest?.product?.agent?.address}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {!selectedRequest?.inquirySent && (
                     <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Buyer has not sent the required support message for this request yet.</p>
                     </div>
                  )}

                  <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-[2.5rem] space-y-6 shadow-inner">
                     <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Box className="h-5 w-5" /> Approved Quantity</h5>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] px-3 py-1 uppercase font-black rounded-lg">Requested: {selectedRequest?.quantity} {selectedRequest?.product?.unit}</Badge>
                           <Badge className="bg-blue-500 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg shadow-lg shadow-blue-500/20">Action: SET QTY</Badge>
                        </div>
                     </div>
                     <div className="relative">
                        <Box className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
                        <Input
                           type="number"
                           placeholder="0.00"
                           value={adminQuantity}
                           onChange={(e) => setAdminQuantity(e.target.value)}
                           className="pl-16 pr-24 h-20 bg-white border-4 border-blue-200 focus:border-blue-500 rounded-3xl text-3xl font-black tracking-tighter shadow-sm transition-all"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-blue-200">
                           {selectedRequest?.product?.unit || 'Units'}
                        </div>
                     </div>
                     <p className="text-[9px] text-blue-600/60 font-black text-center uppercase tracking-widest">This quantity is the MAXIMUM allowed for this approval.</p>
                  </div>

                  <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] space-y-6 shadow-inner">
                     <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Negotiated Fee (Per {selectedRequest?.product?.unit || 'Unit'})</h5>
                        <Badge className="bg-amber-500 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg shadow-lg shadow-amber-500/20">Action: SET FEE</Badge>
                     </div>
                     <div className="relative">
                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-600" />
                        <Input
                           type="number"
                           placeholder="0.00"
                           value={negotiatedFee}
                           onChange={(e) => setNegotiatedFee(e.target.value)}
                           className="pl-16 h-20 bg-white border-4 border-amber-200 focus:border-amber-500 rounded-3xl text-3xl font-black tracking-tighter shadow-sm transition-all"
                        />
                     </div>
                     <p className="text-[9px] text-amber-600/60 font-black text-center uppercase tracking-widest">This is a PER-{selectedRequest?.product?.unit?.toUpperCase() || 'UNIT'} fee. Total = Fee × Quantity.</p>
                  </div>
               </div>
               <DialogFooter className="p-8 bg-white border-t border-slate-200 flex flex-col gap-6 shrink-0">
                  <div className="flex gap-6">
                     <Button variant="ghost" className="flex-1 font-black text-[11px] text-slate-400 h-14 rounded-2xl uppercase tracking-widest hover:bg-slate-50" onClick={() => setIsMediationModalOpen(false)}>Back to Directory</Button>
                     <div className="flex-[2] flex gap-4">
                        <WorkflowActionButton
                           label="Reject Request"
                           icon={XCircle}
                           variant="outline"
                           className="flex-1 h-14 border-rose-200 text-rose-600"
                           isCompleted={selectedRequest?.status === 'REJECTED'}
                           completedLabel="Request Already Rejected"
                           onClick={async () => {
                              const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
                              const id = toast.loading("Rejecting request...");
                              await updateSpecialDeliveryStatus(selectedRequest.id, 'REJECTED');
                              toast.success("Request Rejected", { id });
                              setIsMediationModalOpen(false);
                              fetchDirectoryData('mediation');
                           }}
                        />
                        <WorkflowActionButton
                           label="Approve & Set Fee"
                           icon={ArrowRight}
                           className="flex-1 h-14 bg-amber-500 text-white shadow-amber-500/30"
                           isCompleted={selectedRequest?.status === 'APPROVED'}
                           completedLabel="Logistics Already Approved"
                           onClick={async () => {
                              const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
                              const id = toast.loading("Approving & Locking Logistics...");
                              await updateSpecialDeliveryStatus(selectedRequest.id, 'APPROVED', negotiatedFee, "", adminQuantity);
                              toast.success("Logistics Approved!", { id });
                              setIsMediationModalOpen(false);
                              fetchDirectoryData('mediation');
                           }}
                        />
                     </div>
                  </div>
                  {selectedRequest?.status !== 'PENDING' && (
                     <div className="flex justify-center">
                        <Button
                           variant="ghost"
                           className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 h-10 rounded-xl gap-2"
                           onClick={() => {
                              setPendingOverride({
                                 title: "Reopen Mediation Workflow",
                                 message: `You are about to reset this request for "${selectedRequest?.product?.productName}" back to PENDING. This will allow re-negotiation.`,
                                 action: async () => {
                                    const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
                                    await updateSpecialDeliveryStatus(selectedRequest.id, 'PENDING');
                                    toast.success("Workflow Reopened");
                                    setIsMediationModalOpen(false);
                                    fetchDirectoryData('mediation');
                                 }
                              });
                              setIsOverrideDialogOpen(true);
                           }}
                        >
                           <RotateCcw className="h-4 w-4" /> Reopen Mediation Workflow
                        </Button>
                     </div>
                  )}
               </DialogFooter>
            </DialogContent>
         </Dialog>
         <AdminOverrideDialog
            isOpen={isOverrideDialogOpen}
            onClose={() => setIsOverrideDialogOpen(false)}
            onConfirm={async () => {
               if (pendingOverride?.action) {
                  await pendingOverride.action();
               }
               setIsOverrideDialogOpen(false);
               setPendingOverride(null);
            }}
            title={pendingOverride?.title}
            message={pendingOverride?.message}
         />
      </div>
   );
}
