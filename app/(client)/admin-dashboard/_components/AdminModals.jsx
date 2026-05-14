// import React from 'react';
// import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from '@/components/ui/input';
// import {
//     Mail, Phone, MapPin, Fingerprint, TrendingUp, ShieldAlert, UserCheck2, UserX,
//     StickyNote, Banknote, UserCircle2, ClipboardEdit, ShoppingCart, ImageIcon,
//     AlertTriangle, Truck, HelpCircle, Trash2, ExternalLink, Package, Box, IndianRupee,
//     RotateCcw, XCircle, ArrowRight, Store, AlertCircle
// } from "lucide-react";
// import { s, sNum, getFriendlyStatus } from '@/data/AdminData/adminData';
// import { WorkflowActionButton } from './WorkflowSystem';
// import RoleBadge from './RoleBadge';
// import { toast } from 'sonner';

// export default function AdminModals({ states, setters, handlers }) {
//     const {
//         isProductModalOpen, selectedProduct, isProfileModalOpen, selectedProfile, adminNote,
//         isOrderModalOpen, selectedOrder, isLoadingDetails, isSupportModalOpen, selectedMessage,
//         isMediationModalOpen, selectedRequest, negotiatedFee, adminQuantity
//     } = states;

//     const {
//         setIsProductModalOpen, setIsProfileModalOpen, setAdminNote, setIsOrderModalOpen,
//         setIsSupportModalOpen, setIsMediationModalOpen, setNegotiatedFee, setAdminQuantity,
//         setPendingOverride, setIsOverrideDialogOpen
//     } = setters;

//     const {
//         handleToggleStatus, handleReject, handleApprove, handleSettle, handleCloseSupportTicket, fetchDirectoryData
//     } = handlers;

//     return (
//         <>
//             {/* PRODUCT AUDIT MODAL */}
//             <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
//                 <DialogContent className="sm:max-w-xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
//                     <div className="bg-purple-600 p-8 text-white relative">
//                         <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full mb-3 tracking-widest">CATALOG AUDIT</Badge>
//                         <DialogTitle className="text-3xl font-black tracking-tighter leading-none">{selectedProduct?.productName}</DialogTitle>
//                         <p className="text-purple-100 font-bold mt-2 text-sm uppercase tracking-widest">ID: #{selectedProduct?.id?.slice(-8).toUpperCase()}</p>
//                     </div>
//                     <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50">
//                         <div className="p-8 space-y-8">
//                             <div className="grid grid-cols-2 gap-6">
//                                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Market Price</p><p className="text-2xl font-black text-slate-900">₹{selectedProduct?.pricePerUnit}<span className="text-xs text-slate-400 ml-1">/{selectedProduct?.unit}</span></p></div>
//                                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Units Sold</p><p className="text-2xl font-black text-indigo-600">{sNum(selectedProduct?.unitsSold)} <span className="text-xs text-slate-400">total</span></p></div>
//                             </div>
//                             <div className="space-y-4">
//                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Node Information</h5>
//                                 <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
//                                     <div className="flex items-center gap-4">
//                                         <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-indigo-400">SN</div>
//                                         <div><p className="text-lg font-black leading-none">{selectedProduct?.sellerName}</p><p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Verified Marketplace Seller</p></div>
//                                     </div>
//                                     <Badge className="bg-indigo-600 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg">TRUSTED</Badge>
//                                 </div>
//                             </div>
//                             <div className="space-y-4">
//                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory & Delivery</h5>
//                                 <div className="p-6 bg-white border border-slate-100 rounded-3xl grid grid-cols-2 gap-4 shadow-sm">
//                                     <div><p className="text-[9px] font-black text-slate-400 uppercase">Available Stock</p><p className="text-xl font-black text-slate-900">{selectedProduct?.availableStock} {selectedProduct?.unit}</p></div>
//                                     <div><p className="text-[9px] font-black text-slate-400 uppercase">Max Delivery Range</p><p className="text-xl font-black text-indigo-600">{selectedProduct?.maxDeliveryRange ? `${selectedProduct.maxDeliveryRange} KM` : "Profile Default"}</p></div>
//                                     <div className="pt-2 border-t border-slate-50"><p className="text-[9px] font-black text-slate-400 uppercase">Listing State</p><Badge className={selectedProduct?.isDisabled ? "bg-rose-100 text-rose-600 border-0 text-[8px] font-black" : "bg-emerald-100 text-emerald-600 border-0 text-[8px] font-black"}>{selectedProduct?.isDisabled ? "DEACTIVATED" : "LIVE"}</Badge></div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <DialogFooter className="p-6 bg-white border-t border-slate-100 shrink-0">
//                         <Button className="w-full h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest" onClick={() => setIsProductModalOpen(false)}>Audit Complete</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* PROFILE AUDIT MODAL */}
//             <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
//                 <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
//                     <div className={`p-8 text-white shrink-0 ${selectedProfile?.role === 'farmer' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
//                         <div className="flex justify-between items-start relative z-10">
//                             <div className="space-y-3">
//                                 <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest mb-1">SECURITY CLEARANCE</Badge>
//                                 <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{s(selectedProfile?.displayName)}</DialogTitle>
//                                 <div className="flex items-center gap-4 text-white/70 font-bold text-xs"><Mail className="h-3.5 w-3.5" /> {selectedProfile?.user?.email} | <Phone className="h-3.5 w-3.5" /> {s(selectedProfile?.phone)}</div>
//                             </div>
//                             <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-2xl font-black">{selectedProfile?.displayName?.[0]}</div>
//                         </div>
//                     </div>
//                     <Tabs defaultValue="identity" className="flex-grow flex flex-col overflow-hidden">
//                         <div className="px-8 bg-slate-50 border-b border-slate-200 shrink-0">
//                             <TabsList className="bg-transparent h-12 gap-8">
//                                 <TabsTrigger value="identity" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Member Info</TabsTrigger>
//                                 <TabsTrigger value="performance" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Performance</TabsTrigger>
//                                 <TabsTrigger value="documents" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-indigo-600">Documents</TabsTrigger>
//                                 <TabsTrigger value="admin" className="h-full bg-transparent border-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-none shadow-none text-slate-400 data-[state=active]:text-rose-600">Admin Notes</TabsTrigger>
//                             </TabsList>
//                         </div>
//                         <div className="flex-grow overflow-y-auto custom-scrollbar bg-white">
//                             <div className="p-8">
//                                 <TabsContent value="identity" className="m-0 space-y-10 animate-in fade-in duration-300 pr-2">
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
//                                         <div className="space-y-4">
//                                             <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin className="h-5 w-5 text-rose-500" /> Physical Address</h5>
//                                             <div className="space-y-4">
//                                                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-900 font-bold text-sm shadow-inner leading-relaxed">{s(selectedProfile?.address)}, {s(selectedProfile?.city)}, {s(selectedProfile?.district)}</div>
//                                                 {(selectedProfile?.lat && selectedProfile?.lng) && <Button variant="outline" className="h-12 w-full rounded-2xl border-slate-200 font-black text-rose-600 text-[10px] gap-2 uppercase tracking-widest hover:bg-rose-50" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedProfile.lat},${selectedProfile.lng}`)}><LucideMap className="h-4 w-4" /> Open Maps</Button>}
//                                             </div>
//                                         </div>
//                                         <div className="space-y-4">
//                                             <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Fingerprint className="h-5 w-5 text-indigo-500" /> Verification Meta</h5>
//                                             <div className="space-y-4 font-black text-[9px] text-slate-900">
//                                                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-inner"><span className="text-[8px] text-slate-400 uppercase tracking-widest">Aadhar UID</span><span className="text-xl tracking-[0.2em] font-mono uppercase text-slate-900">{s(selectedProfile?.aadharNumber)}</span></div>
//                                                 <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col gap-1"><span className="text-[8px] text-indigo-400 uppercase tracking-widest">Platform Role</span><span className="text-xl font-black uppercase text-indigo-900">{selectedProfile?.role}</span></div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </TabsContent>

//                                 <TabsContent value="performance" className="m-0 space-y-8 animate-in fade-in duration-300 pr-2">
//                                     <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><TrendingUp className="h-7 w-7 text-indigo-600" /> Performance Analytics</h5>
//                                     <div className="grid grid-cols-2 gap-6">
//                                         {(selectedProfile?.role === 'farmer' || selectedProfile?.role === 'agent') ? (
//                                             <>
//                                                 <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Total Units Sold</p><p className="text-4xl font-black text-emerald-900">{sNum(selectedProfile?.unitsSold)} <span className="text-xs">QTY</span></p></div>
//                                                 <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 shadow-sm"><p className="text-[10px] font-black text-blue-600 uppercase mb-2">Purchase History</p><p className="text-4xl font-black text-blue-900">{sNum(selectedProfile?.purchasedCount)} <span className="text-xs">Orders</span></p></div>
//                                                 <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm"><p className="text-[10px] font-black text-amber-600 uppercase mb-2">Active Listings</p><p className="text-4xl font-black text-amber-900">{sNum(selectedProfile?.listingsCount)} <span className="text-xs">Live</span></p></div>
//                                                 <div className="p-8 bg-purple-50 rounded-[2rem] border border-purple-100 shadow-sm"><p className="text-[10px] font-black text-purple-600 uppercase mb-2">Profile Usage</p><Badge className="bg-purple-600 text-white border-0 text-[10px] px-4 py-1 uppercase font-black rounded-lg mt-2">{selectedProfile?.usagePurpose === 'buy_and_sell' ? 'BUY & SELL' : 'BUY ONLY'}</Badge></div>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm"><p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Total Deliveries</p><p className="text-4xl font-black text-indigo-900">{sNum(selectedProfile?.totalDeliveries)} <span className="text-xs">Success</span></p></div>
//                                                 <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-sm"><p className="text-[10px] font-black text-rose-600 uppercase mb-2">Active Jobs</p><p className="text-4xl font-black text-rose-900">{sNum(selectedProfile?.activeJobs)} <span className="text-xs">Current</span></p></div>
//                                             </>
//                                         )}
//                                     </div>
//                                 </TabsContent>

//                                 <TabsContent value="documents" className="m-0 space-y-12 animate-in fade-in duration-300 pr-2">
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
//                                         {['aadharFront', 'aadharBack', 'licenseImage'].map((field, i) => (
//                                             selectedProfile?.[field] && (
//                                                 <div key={i} className="space-y-4">
//                                                     <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</p>
//                                                     <div className="aspect-[1.6/1] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group relative shadow-inner">
//                                                         <img src={selectedProfile[field]} alt={field} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
//                                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
//                                                             <Button variant="secondary" className="h-12 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl" onClick={() => window.open(selectedProfile[field])}>View Full Doc</Button>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             )
//                                         ))}
//                                     </div>
//                                 </TabsContent>

//                                 <TabsContent value="admin" className="m-0 space-y-8 animate-in fade-in duration-300 pr-2">
//                                     <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4 mb-8">
//                                         <h5 className="flex items-center gap-3 text-[10px] font-black text-rose-600 uppercase tracking-widest"><ShieldAlert className="h-5 w-5" /> Security Controls</h5>
//                                         <div className="flex items-center justify-between">
//                                             <div>
//                                                 <p className="text-sm font-black text-rose-900 leading-none">Account Access</p>
//                                                 <p className="text-[10px] font-bold text-rose-400 uppercase mt-1">Status: {selectedProfile?.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'}</p>
//                                             </div>
//                                             <Button
//                                                 variant={selectedProfile?.user?.isDisabled ? "default" : "outline"}
//                                                 className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedProfile?.user?.isDisabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-rose-200 text-rose-600 hover:bg-rose-100'}`}
//                                                 onClick={() => handleToggleStatus(selectedProfile?.userId || selectedProfile?.id, selectedProfile?.displayName)}
//                                             >
//                                                 {selectedProfile?.user?.isDisabled ? <><UserCheck2 className="mr-2 h-4 w-4" /> Re-Enable Account</> : <><UserX className="mr-2 h-4 w-4" /> Disable Account</>}
//                                             </Button>
//                                         </div>
//                                     </div>
//                                     <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><StickyNote className="h-7 w-7 text-rose-500" /> Internal Notes</h5>
//                                     <Textarea placeholder="Type internal justification or notes here..." className="h-48 rounded-3xl border-slate-200 p-8 font-bold text-slate-700 bg-slate-50 shadow-inner focus:ring-rose-500 focus:border-rose-500" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
//                                     <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">Confidential: Visible to admin team only.</p>
//                                 </TabsContent>
//                             </div>
//                         </div>
//                     </Tabs>
//                     <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex gap-6 shrink-0">
//                         <Button variant="outline" className="h-12 px-10 rounded-2xl font-black text-rose-600 border-rose-200 hover:bg-rose-50 text-[10px] uppercase tracking-widest transition-all" onClick={() => { setIsProfileModalOpen(false); handleReject(selectedProfile?.userId, selectedProfile?.role, selectedProfile?.displayName); }}>Reject Application</Button>
//                         <Button className="flex-grow h-12 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/20 uppercase tracking-widest hover:bg-emerald-700 transition-all" onClick={() => { setIsProfileModalOpen(false); handleApprove(selectedProfile?.userId, selectedProfile?.role, selectedProfile?.displayName); }}>Verify & Approve Member</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* ORDER AUDIT MODAL */}
//             <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
//                 <DialogContent className="sm:max-w-4xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[85vh] flex flex-col custom-scrollbar">
//                     <div className="bg-slate-950 p-8 text-white shrink-0">
//                         <div className="flex items-center justify-between">
//                             <div className="space-y-2">
//                                 <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[9px] font-black uppercase px-4 py-1 rounded-full mb-2 tracking-widest shadow-inner">TRANSACTION AUDIT</Badge>
//                                 <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-1">Order: #{selectedOrder?.id?.slice(-12).toUpperCase()}</DialogTitle>
//                                 <div className="flex items-center gap-4 mt-3"><Badge className="bg-indigo-600 text-white border-0 text-[10px] px-4 py-1.5 uppercase font-black rounded-full tracking-[0.1em] shadow-lg shadow-indigo-500/20">{getFriendlyStatus(selectedOrder?.orderStatus)}</Badge></div>
//                             </div>
//                             <div className="text-right">
//                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ledger Value</p>
//                                 <p className="text-4xl font-black text-white tracking-tighter">₹{sNum(selectedOrder?.totalAmount).toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50">
//                         <div className="p-8 space-y-10">
//                             {isLoadingDetails ? <div className="py-40 text-center text-xs font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Running Ledger Audit...</div> : selectedOrder && (
//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
//                                     <div className="space-y-10">
//                                         <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><UserCircle2 className="h-7 w-7 text-indigo-600" /> Buyer Node</h5>
//                                         <Card className="rounded-3xl border-0 bg-white p-8 space-y-6 shadow-xl shadow-slate-200/50">
//                                             <div className="flex items-center gap-5">
//                                                 <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">BN</div>
//                                                 <div className="flex flex-col">
//                                                     <div className="flex items-center gap-2">
//                                                         <span className="text-2xl font-black text-slate-900 leading-tight">{selectedOrder.buyerName}</span>
//                                                         <RoleBadge role={selectedOrder.buyerRole} />
//                                                     </div>
//                                                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedOrder.buyerEmail}</span>
//                                                 </div>
//                                             </div>
//                                             <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-8">
//                                                 <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Contact Node</p><p className="text-sm font-black text-slate-700">{selectedOrder.buyerPhone}</p></div>
//                                                 <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Delivery Target</p><p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-relaxed">{selectedOrder.shippingAddress}</p></div>
//                                             </div>
//                                         </Card>
//                                         <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><ClipboardEdit className="h-7 w-7 text-indigo-600" /> Financial Breakdown</h5>
//                                         <Card className="rounded-3xl border-0 bg-white p-8 space-y-8 shadow-xl shadow-slate-200/50">
//                                             <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Seller Payment</span><span className="text-xl font-black text-slate-900">₹{sNum(selectedOrder.sellerAmount)}</span></div>
//                                             <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Delivery Fee</span><span className="text-xl font-black text-slate-900">₹{sNum(selectedOrder.deliveryFee)}</span></div>
//                                             <div className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400 uppercase">Platform Profit</span><span className="text-xl font-black text-indigo-600">₹{sNum(selectedOrder.platformFee)}</span></div>
//                                             <div className="pt-8 border-t border-slate-100 flex justify-between items-center"><span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Verified Ledger</span><Badge className="bg-emerald-500 text-white border-0 text-[10px] px-4 py-1.5 font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 tracking-widest">100% Correct</Badge></div>
//                                         </Card>
//                                         <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><ShoppingCart className="h-7 w-7 text-purple-600" /> Purchased Items</h5>
//                                         <div className="space-y-6">
//                                             {selectedOrder.items?.map((it, idx) => (
//                                                 <div key={idx} className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
//                                                     <div className="flex items-center gap-6">
//                                                         <div className="w-20 h-20 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center shadow-inner">
//                                                             {it.image ? <img src={it.image} alt={it.productName} className="w-full h-full object-cover" /> : <ImageIcon className="h-8 w-8 text-slate-300" />}
//                                                         </div>
//                                                         <div className="flex flex-col">
//                                                             <span className="text-xl font-black text-slate-900 tracking-tight">{it.productName}</span>
//                                                             <div className="flex items-center gap-2 mt-1">
//                                                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{it.quantity} {it.unit} sold</span>
//                                                                 {it.deliveryChargeAtPurchase > 0 && (
//                                                                     <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] px-2 py-0.5 font-black uppercase rounded-md">
//                                                                         + Delivery: ₹{it.deliveryChargeAtPurchase}/{it.unit}
//                                                                     </Badge>
//                                                                 )}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                     <div className="space-y-10">
//                                         <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><Banknote className="h-7 w-7 text-emerald-600" /> Payout Intelligence</h5>
//                                         <div className="space-y-8">
//                                             {selectedOrder.sellers?.map((sObj, sIdx) => (
//                                                 <Card key={sIdx} className="rounded-[3rem] border-0 bg-slate-950 text-white p-10 shadow-2xl relative overflow-hidden group">
//                                                     <div className="relative z-10 space-y-8">
//                                                         <div className="flex justify-between items-start">
//                                                             <div className="flex items-center gap-4">
//                                                                 <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl border border-white/20">
//                                                                     {sObj.name?.[0]}
//                                                                 </div>
//                                                                 <div>
//                                                                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Seller</p>
//                                                                     <div className="flex items-center gap-2">
//                                                                         <p className="text-lg font-black text-white tracking-tight">{sObj.name || 'Unknown Seller'}</p>
//                                                                         <RoleBadge role={sObj.role} size="xs" />
//                                                                         <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md shadow-sm ${sObj.isDisabled ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
//                                                                             {sObj.isDisabled ? 'BLOCKED' : 'ACTIVE'}
//                                                                         </Badge>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                             <div className="text-right">
//                                                                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Payout Share</p>
//                                                                 <p className="text-2xl font-black text-white tracking-tighter">₹{sObj.totalEarned?.toLocaleString() || '0'}</p>
//                                                             </div>
//                                                         </div>
//                                                         {!sObj.bankDetails?.accountNumber ? (
//                                                             <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
//                                                                 <AlertTriangle className="h-6 w-6 text-rose-500" />
//                                                                 <div>
//                                                                     <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">Security Alert</p>
//                                                                     <p className="text-[10px] text-rose-400 font-bold mt-2 leading-relaxed">No verified bank account found. Funds locked until profile update.</p>
//                                                                 </div>
//                                                                 <Button size="sm" variant="secondary" className="ml-auto h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => window.open(`tel:${sObj.phone}`)}>Call Node</Button>
//                                                             </div>
//                                                         ) : (
//                                                             <div>
//                                                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verified Ledger Node</p>
//                                                                 <p className="text-2xl font-mono font-black text-white tracking-[0.2em] bg-white/5 p-4 rounded-xl shadow-inner border border-white/5">{sObj.bankDetails.accountNumber}</p>
//                                                             </div>
//                                                         )}
//                                                         <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
//                                                             <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Bank Branch</p><p className="text-sm font-black text-indigo-400 uppercase">{sObj.bankDetails?.bankName || 'NOT SET'}</p></div>
//                                                             <div><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">IFSC Routing</p><p className="text-sm font-black text-emerald-400 uppercase font-mono">{sObj.bankDetails?.ifscCode || 'NOT SET'}</p></div>
//                                                         </div>
//                                                     </div>
//                                                     <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-all duration-700"><Banknote className="h-64 w-64" /></div>
//                                                 </Card>
//                                             ))}
//                                         </div>

//                                         <h5 className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest"><Truck className="h-7 w-7 text-indigo-400" /> Logistics Status</h5>
//                                         {(!selectedOrder.deliveryPartners || selectedOrder.deliveryPartners.length === 0) ? (
//                                             <div className="p-12 bg-slate-100 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center">
//                                                 <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
//                                                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Awaiting Logistics Node</p>
//                                                 <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">This order is in the seller's queue.<br />No delivery partner assigned yet.</p>
//                                             </div>
//                                         ) : selectedOrder.deliveryPartners.map((dp, idx) => (
//                                             <div key={idx} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-500">
//                                                 <div className="flex items-center gap-6">
//                                                     <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">DP</div>
//                                                     <div className="flex flex-col">
//                                                         <span className="text-xl font-black text-slate-900 tracking-tight">{dp.partnerName}</span>
//                                                         <div className="flex items-center gap-2 mt-2">
//                                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Payout:</span>
//                                                             {dp.partnerPaymentReceived ? <Badge className="bg-emerald-500 text-white border-0 text-[8px] px-3 py-1 font-black uppercase tracking-widest">VERIFIED PAID</Badge> : <Badge className="bg-amber-500 text-white border-0 text-[8px] px-3 py-1 font-black uppercase tracking-widest">PENDING</Badge>}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div className="text-right">
//                                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee</p>
//                                                     <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{dp.totalPrice}</span>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                     <DialogFooter className="p-6 bg-white border-t border-slate-200 flex flex-col gap-6 shrink-0">
//                         <div className="flex gap-6 w-full">
//                             <Button variant="ghost" className="font-black text-[11px] text-slate-400 h-12 px-10 rounded-2xl uppercase tracking-widest" onClick={() => setIsOrderModalOpen(false)}>Close Ledger</Button>
//                             <Button className="flex-grow h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-emerald-600/30 uppercase tracking-widest hover:bg-emerald-700 transition-all" onClick={() => { setIsOrderModalOpen(false); handleSettle(selectedOrder.id); }}>Release Final Funds</Button>
//                         </div>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//             {/* SUPPORT MESSAGE MODAL */}
//             <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
//                 <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
//                     <div className="bg-rose-600 p-8 text-white relative shrink-0">
//                         <div className="flex items-center justify-between mb-4">
//                             <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest">SUPPORT TICKET</Badge>
//                             <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedMessage?.isRead ? 'bg-white/20' : 'bg-white animate-bounce text-rose-600'}`}>
//                                 {selectedMessage?.isRead ? 'ARCHIVED' : 'ACTION REQUIRED'}
//                             </Badge>
//                         </div>
//                         <DialogTitle className="text-3xl font-black tracking-tighter leading-tight flex items-center gap-3">
//                             <HelpCircle className="h-8 w-8" /> Support Request
//                         </DialogTitle>
//                         <p className="text-rose-100 font-bold mt-2 text-sm uppercase tracking-widest">From: {selectedMessage?.userName} ({selectedMessage?.userRole})</p>
//                     </div>
//                     <div className="p-8 space-y-8 bg-slate-50/50 flex-grow overflow-y-auto custom-scrollbar">
//                         <div className="space-y-4">
//                             <div className="flex items-center justify-between">
//                                 <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="h-4 w-4" /> Message Content</h5>
//                                 <span className="text-[10px] font-bold text-slate-400">{selectedMessage?.createdAt && new Date(selectedMessage.createdAt).toLocaleString()}</span>
//                             </div>

//                             {/* BEAUTIFIED MESSAGE BUBBLE */}
//                             <div className="relative group">
//                                 <div className="absolute -inset-1 bg-gradient-to-r from-rose-100 to-indigo-100 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
//                                 <Card className="relative p-10 rounded-[2.5rem] border-0 bg-white shadow-sm overflow-hidden">
//                                     <div className="absolute top-0 right-0 p-4 opacity-5"><HelpCircle className="h-24 w-24 text-rose-600" /></div>
//                                     <p className="text-slate-700 leading-relaxed text-lg font-medium italic relative z-10">
//                                         "{selectedMessage?.message}"
//                                     </p>
//                                 </Card>
//                             </div>
//                         </div>

//                         <div className="grid grid-cols-2 gap-6">
//                             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
//                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">User Contact</p>
//                                 <p className="text-sm font-black text-slate-900 truncate flex items-center gap-2">
//                                     <Phone className="h-3 w-3 text-indigo-500" /> {selectedMessage?.userPhone || "NOT PROVIDED"}
//                                 </p>
//                             </div>
//                             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
//                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inquiry Type</p>
//                                 <div>
//                                     <Badge className="bg-indigo-50 text-indigo-700 border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">{selectedMessage?.type}</Badge>
//                                 </div>
//                             </div>
//                         </div>

//                         {selectedMessage?.userAddress && (
//                             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1">
//                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
//                                     <MapPin className="h-3 w-3" /> Registered Address
//                                 </p>
//                                 <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{selectedMessage?.userAddress}</p>
//                             </div>
//                         )}
//                     </div>
//                     <DialogFooter className="p-6 bg-white border-t border-slate-200 flex gap-6 shrink-0">
//                         <Button
//                             variant="ghost"
//                             className="flex-1 font-black text-[11px] text-rose-600 hover:bg-rose-50 h-12 rounded-2xl uppercase tracking-widest"
//                             onClick={() => handleCloseSupportTicket(selectedMessage.id)}
//                         >
//                             <Trash2 className="h-4 w-4 mr-2" /> Close & Archive
//                         </Button>
//                         <Button className="flex-[2] h-12 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-rose-600/30 uppercase tracking-widest hover:bg-rose-700 transition-all" onClick={() => window.open(`mailto:${selectedMessage?.userEmail}?subject=Re: KrishiConnect Support Ticket`)}>
//                             Reply via Email <ExternalLink className="ml-2 h-4 w-4" />
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* SPECIAL DELIVERY MEDIATION MODAL */}
//             <Dialog open={isMediationModalOpen} onOpenChange={setIsMediationModalOpen}>
//                 <DialogContent className="sm:max-w-2xl p-0 border-0 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
//                     <div className="bg-amber-500 p-8 text-white relative shrink-0">
//                         <div className="flex items-center justify-between mb-4">
//                             <Badge className="bg-white/10 text-white border-0 text-[8px] font-black uppercase px-4 py-1 rounded-full tracking-widest">LOGISTICS MEDIATION</Badge>
//                             <div className="flex gap-2">
//                                 <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedRequest?.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-white text-amber-600 animate-pulse'}`}>
//                                     {selectedRequest?.status}
//                                 </Badge>
//                                 <Badge className={`text-[8px] font-black uppercase px-4 py-1 border-0 rounded-full ${selectedRequest?.inquirySent ? 'bg-blue-400' : 'bg-slate-800/40 text-slate-300'}`}>
//                                     {selectedRequest?.inquirySent ? 'INQUIRY RECEIVED' : 'AWAITING MESSAGE'}
//                                 </Badge>
//                             </div>
//                         </div>
//                         <DialogTitle className="text-3xl font-black tracking-tighter leading-tight flex items-center gap-3">
//                             <ShieldAlert className="h-8 w-8" /> Product Approval
//                         </DialogTitle>
//                         <p className="text-amber-100 font-bold mt-2 text-sm uppercase tracking-widest">Product: {selectedRequest?.product?.productName}</p>
//                     </div>
//                     <div className="p-8 space-y-6 bg-slate-50/50 flex-grow overflow-y-auto custom-scrollbar">
//                         <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm space-y-4">
//                             <div className="flex items-center justify-between">
//                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package className="h-4 w-4 text-indigo-500" /> Product Information</h5>
//                                 <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
//                                     {selectedRequest?.quantity} {selectedRequest?.product?.unit} Requested
//                                 </Badge>
//                             </div>
//                             <div className="flex items-center gap-4">
//                                 <div className="w-16 h-16 bg-white rounded-2xl border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
//                                     {selectedRequest?.product?.images?.[0] ? (
//                                         <img src={selectedRequest.product.images[0]} alt="Product" className="w-full h-full object-cover" />
//                                     ) : <Package className="h-8 w-8 text-slate-200" />}
//                                 </div>
//                                 <div className="min-w-0">
//                                     <p className="text-lg font-black text-slate-900 truncate uppercase tracking-tighter">{selectedRequest?.product?.productName}</p>
//                                     <p className="text-xs text-slate-500 font-bold">Base Price: ₹{selectedRequest?.product?.pricePerUnit} / {selectedRequest?.product?.unit}</p>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                             {/* BUYER NODE */}
//                             <div className="space-y-4">
//                                 <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><UserCircle2 className="h-5 w-5 text-indigo-500" /> Buyer Profile</h5>
//                                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
//                                     <div className="flex items-center gap-4">
//                                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">BN</div>
//                                         <div className="min-w-0">
//                                             <div className="flex items-center gap-2">
//                                                 <p className="text-sm font-black text-slate-900 truncate">{selectedRequest?.user?.name}</p>
//                                                 <RoleBadge role={selectedRequest?.userRole} size="xs" />
//                                             </div>
//                                             <p className="text-[10px] font-bold text-slate-400 truncate">{selectedRequest?.user?.email}</p>
//                                         </div>
//                                     </div>
//                                     <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
//                                         <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2"><Phone className="h-3 w-3 text-indigo-500" /> {selectedRequest?.buyerPhone}</p>
//                                         <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed"><MapPin className="h-3 w-3 inline mr-1" /> {selectedRequest?.buyerAddress}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* SELLER NODE */}
//                             <div className="space-y-4">
//                                 <h5 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Store className="h-5 w-5 text-emerald-500" /> Seller Profile</h5>
//                                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
//                                     <div className="flex items-center gap-4">
//                                         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-sm">SN</div>
//                                         <div className="min-w-0">
//                                             <div className="flex items-center gap-2">
//                                                 <p className="text-sm font-black text-slate-900 truncate">{selectedRequest?.product?.farmer?.name || selectedRequest?.product?.agent?.name}</p>
//                                                 <RoleBadge role={selectedRequest?.product?.farmer ? 'farmer' : 'agent'} size="xs" />
//                                             </div>
//                                             <p className="text-[10px] font-bold text-slate-400 truncate">{selectedRequest?.product?.agent?.companyName || "Verified Producer"}</p>
//                                         </div>
//                                     </div>
//                                     <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
//                                         <p className="text-[10px] font-bold text-slate-700 flex items-center gap-2"><Phone className="h-3 w-3 text-emerald-500" /> {selectedRequest?.product?.farmer?.phone || selectedRequest?.product?.agent?.phone}</p>
//                                         <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed"><MapPin className="h-3 w-3 inline mr-1" /> {selectedRequest?.product?.farmer?.address || selectedRequest?.product?.agent?.address}</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {!selectedRequest?.inquirySent && (
//                             <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
//                                 <AlertCircle className="h-5 w-5 text-rose-600" />
//                                 <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Buyer has not sent the required support message for this request yet.</p>
//                             </div>
//                         )}

//                         <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-[2.5rem] space-y-6 shadow-inner">
//                             <div className="flex items-center justify-between">
//                                 <h5 className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Box className="h-5 w-5" /> Approved Quantity</h5>
//                                 <div className="flex items-center gap-2">
//                                     <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] px-3 py-1 uppercase font-black rounded-lg">Requested: {selectedRequest?.quantity} {selectedRequest?.product?.unit}</Badge>
//                                     <Badge className="bg-blue-500 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg shadow-lg shadow-blue-500/20">Action: SET QTY</Badge>
//                                 </div>
//                             </div>
//                             <div className="relative">
//                                 <Box className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
//                                 <Input
//                                     type="number"
//                                     placeholder="0.00"
//                                     value={adminQuantity}
//                                     onChange={(e) => setAdminQuantity(e.target.value)}
//                                     className="pl-16 pr-24 h-20 bg-white border-4 border-blue-200 focus:border-blue-500 rounded-3xl text-3xl font-black tracking-tighter shadow-sm transition-all"
//                                 />
//                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-blue-200">
//                                     {selectedRequest?.product?.unit || 'Units'}
//                                 </div>
//                             </div>
//                             <p className="text-[9px] text-blue-600/60 font-black text-center uppercase tracking-widest">This quantity is the MAXIMUM allowed for this approval.</p>
//                         </div>

//                         <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] space-y-6 shadow-inner">
//                             <div className="flex items-center justify-between">
//                                 <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Negotiated Fee (Per {selectedRequest?.product?.unit || 'Unit'})</h5>
//                                 <Badge className="bg-amber-500 text-white border-0 text-[8px] px-3 py-1 uppercase font-black rounded-lg shadow-lg shadow-amber-500/20">Action: SET FEE</Badge>
//                             </div>
//                             <div className="relative">
//                                 <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-600" />
//                                 <Input
//                                     type="number"
//                                     placeholder="0.00"
//                                     value={negotiatedFee}
//                                     onChange={(e) => setNegotiatedFee(e.target.value)}
//                                     className="pl-16 h-20 bg-white border-4 border-amber-200 focus:border-amber-500 rounded-3xl text-3xl font-black tracking-tighter shadow-sm transition-all"
//                                 />
//                             </div>
//                             <p className="text-[9px] text-amber-600/60 font-black text-center uppercase tracking-widest">This is a PER-{selectedRequest?.product?.unit?.toUpperCase() || 'UNIT'} fee. Total = Fee × Quantity.</p>
//                         </div>
//                     </div>
//                     <DialogFooter className="p-8 bg-white border-t border-slate-200 flex gap-6 shrink-0">
//                         <Button variant="ghost" className="flex-1 font-black text-[11px] text-slate-400 h-14 rounded-2xl uppercase tracking-widest hover:bg-slate-50" onClick={() => setIsMediationModalOpen(false)}>Back to Directory</Button>
//                         <div className="flex-[2] flex gap-4">
//                             <WorkflowActionButton
//                                 label="Reject Request"
//                                 icon={XCircle}
//                                 variant="outline"
//                                 className="flex-1 h-14 border-rose-200 text-rose-600"
//                                 isCompleted={selectedRequest?.status === 'REJECTED'}
//                                 completedLabel="Request Already Rejected"
//                                 onClick={async () => {
//                                     const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
//                                     const id = toast.loading("Rejecting request...");
//                                     await updateSpecialDeliveryStatus(selectedRequest.id, 'REJECTED');
//                                     toast.success("Request Rejected", { id });
//                                     setIsMediationModalOpen(false);
//                                     fetchDirectoryData('mediation');
//                                 }}
//                             />
//                             <WorkflowActionButton
//                                 label="Approve & Set Fee"
//                                 icon={ArrowRight}
//                                 className="flex-1 h-14 bg-amber-500 text-white shadow-amber-500/30"
//                                 isCompleted={selectedRequest?.status === 'APPROVED'}
//                                 completedLabel="Logistics Already Approved"
//                                 onClick={async () => {
//                                     const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
//                                     const id = toast.loading("Approving & Locking Logistics...");
//                                     await updateSpecialDeliveryStatus(selectedRequest.id, 'APPROVED', negotiatedFee, "", adminQuantity);
//                                     toast.success("Logistics Approved!", { id });
//                                     setIsMediationModalOpen(false);
//                                     fetchDirectoryData('mediation');
//                                 }}
//                             />
//                         </div>
//                     </DialogFooter>
//                     {selectedRequest?.status !== 'PENDING' && (
//                         <div className="flex justify-center p-4 border-t border-slate-100">
//                             <Button
//                                 variant="ghost"
//                                 className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 h-10 rounded-xl gap-2"
//                                 onClick={() => {
//                                     setPendingOverride({
//                                         title: "Reopen Mediation Workflow",
//                                         message: `You are about to reset this request for "${selectedRequest?.product?.productName}" back to PENDING. This will allow re-negotiation.`,
//                                         action: async () => {
//                                             const { updateSpecialDeliveryStatus } = await import('@/actions/special-delivery');
//                                             await updateSpecialDeliveryStatus(selectedRequest.id, 'PENDING');
//                                             toast.success("Workflow Reopened");
//                                             setIsMediationModalOpen(false);
//                                             fetchDirectoryData('mediation');
//                                         }
//                                     });
//                                     setIsOverrideDialogOpen(true);
//                                 }}
//                             >
//                                 <RotateCcw className="h-4 w-4" /> Reopen Mediation Workflow
//                             </Button>
//                         </div>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </>
//     );
// }