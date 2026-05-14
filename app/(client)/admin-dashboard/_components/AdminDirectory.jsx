// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { ShieldCheck, ListChecks, X, Eye, Trash2, UserCheck2, UserX, ChevronLeft, ChevronRight, Star } from "lucide-react";
// import { s, sNum, getFriendlyStatus, navItems } from '@/data/AdminData/adminData';
// import { downloadCSV } from '@/lib/csvUtils';
// import RoleBadge from './RoleBadge';
// import FilterBar from './FilterBar';
// import FilterDrawer from './FilterDrawer';
// import { StatusBadge } from './WorkflowSystem';

// export default function AdminDirectory({ states, setters, handlers, data }) {
//     const { activeView, selectedIds, pagination, search, advancedFilters, statusFilter, isFilterDrawerOpen, currentPage, itemsPerPage, mounted } = states;
//     const { setSelectedIds, setSearch, setAdvancedFilters, setStatusFilter, setIsFilterDrawerOpen, setCurrentPage, setSelectedRequest, setIsMediationModalOpen, setNegotiatedFee, setAdminQuantity } = setters;
//     const { handleBulkApprove, getStatusOptions, getFilteredItems, paginate, openOrderAudit, openProductAudit, openSupportAudit, openProfileAudit, handleDeleteOrder, handleToggleStatus } = handlers;
//     const { farmers, deliveryPartners } = data;

//     const items = paginate(getFilteredItems());

//     const PaginationComponent = () => {
//         const { total, totalPages } = pagination;
//         if (total === 0) return null;

//         return (
//             <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 sticky bottom-0 z-20">
//                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
//                     Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} records
//                 </p>
//                 <div className="flex items-center gap-2">
//                     <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
//                         <ChevronLeft className="h-4 w-4" />
//                     </Button>
//                     <div className="flex items-center gap-1">
//                         {[...Array(totalPages)].map((_, i) => {
//                             const pageNum = i + 1;
//                             if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
//                                 if (Math.abs(pageNum - currentPage) === 3) return <span key={i} className="text-slate-300">...</span>;
//                                 return null;
//                             }
//                             return (
//                                 <Button key={i} variant={currentPage === pageNum ? "default" : "ghost"} size="sm" className={`h-8 w-8 p-0 rounded-lg text-[10px] font-black ${currentPage === pageNum ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`} onClick={() => setCurrentPage(pageNum)}>
//                                     {pageNum}
//                                 </Button>
//                             );
//                         })}
//                     </div>
//                     <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
//                         <ChevronRight className="h-4 w-4" />
//                     </Button>
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
//             <div className="flex items-center justify-between flex-wrap gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
//                 <div className="flex items-center gap-6">
//                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${activeView === 'verifications' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
//                         {React.createElement(navItems.find(n => n.id === activeView)?.icon || ShieldCheck, { className: "h-7 w-7" })}
//                     </div>
//                     <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{navItems.find(n => n.id === activeView)?.label}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Platform Database</p></div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                     {activeView === 'verifications' && selectedIds.length > 0 && (
//                         <Button className="h-10 px-8 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20" onClick={handleBulkApprove}><ListChecks className="mr-2 h-4 w-4" /> Approve Selected ({selectedIds.length})</Button>
//                     )}
//                     <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
//                         <div className="flex flex-wrap items-center justify-between gap-4">
//                             <FilterBar
//                                 search={search}
//                                 setSearch={setSearch}
//                                 activeFilters={{ ...advancedFilters, status: statusFilter }}
//                                 onClearFilters={(key) => {
//                                     if (!key) {
//                                         setSearch(""); setStatusFilter("ALL");
//                                         setAdvancedFilters({
//                                             orderStatus: 'ALL', paymentStatus: 'ALL', payoutStatus: 'ALL', buyerRole: 'ALL', sellerRole: 'ALL', category: 'ALL', sellerType: 'ALL', stockStatus: 'ALL', securityStatus: 'ALL', deliveryPartnerId: 'ALL', minAmount: '', maxAmount: ''
//                                         });
//                                     } else {
//                                         if (key === 'status') setStatusFilter("ALL");
//                                         else setAdvancedFilters(prev => ({ ...prev, [key]: 'ALL' }));
//                                     }
//                                 }}
//                                 onOpenAdvanced={() => setIsFilterDrawerOpen(true)}
//                                 onExport={activeView === 'farmers' ? () => downloadCSV(farmers, 'farmers_export') : undefined}
//                                 statusOptions={getStatusOptions()}
//                                 onStatusChange={setStatusFilter}
//                             />
//                         </div>
//                     </div>
//                     <FilterDrawer
//                         isOpen={isFilterDrawerOpen}
//                         onClose={() => setIsFilterDrawerOpen(false)}
//                         filters={advancedFilters}
//                         setFilters={setAdvancedFilters}
//                         onApply={() => setIsFilterDrawerOpen(false)}
//                         onReset={() => {
//                             setAdvancedFilters({
//                                 orderStatus: 'ALL', paymentStatus: 'ALL', payoutStatus: 'ALL', buyerRole: 'ALL', sellerRole: 'ALL', category: 'ALL', sellerType: 'ALL', stockStatus: 'ALL', securityStatus: 'ALL', deliveryPartnerId: 'ALL', minAmount: '', maxAmount: ''
//                             });
//                         }}
//                         config={[
//                             {
//                                 title: "Order & Payment",
//                                 filters: [
//                                     { key: 'orderStatus', label: 'Order Status', type: 'select', options: [{ label: 'Processing', value: 'PROCESSING' }, { label: 'Packed', value: 'PACKED' }, { label: 'Shipped', value: 'SHIPPED' }, { label: 'In Transit', value: 'IN_TRANSIT' }, { label: 'Delivered', value: 'DELIVERED' }, { label: 'Cancelled', value: 'CANCELLED' }] },
//                                     { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: [{ label: 'Paid', value: 'PAID' }, { label: 'Pending', value: 'PENDING' }] },
//                                     { key: 'payoutStatus', label: 'Payout Status', type: 'select', options: [{ label: 'Settled', value: 'SETTLED' }, { label: 'Pending', value: 'PENDING' }] }
//                                 ]
//                             },
//                             {
//                                 title: "Logistics & Partners",
//                                 filters: [{ key: 'deliveryPartnerId', label: 'Delivery Partner', type: 'select', options: (deliveryPartners || []).map(dp => ({ label: dp.name || dp.displayName || dp.user?.name || 'Unknown', value: dp.userId || dp.id })) }]
//                             },
//                             {
//                                 title: "Roles & Security",
//                                 filters: [
//                                     { key: 'buyerRole', label: 'Buyer Role', type: 'select', options: [{ label: 'Farmer', value: 'farmer' }, { label: 'Agent', value: 'agent' }] },
//                                     { key: 'sellerRole', label: 'Seller Role', type: 'select', options: [{ label: 'Farmer', value: 'farmer' }, { label: 'Agent', value: 'agent' }] },
//                                     { key: 'securityStatus', label: 'Security Status', type: 'select', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Blocked', value: 'BLOCKED' }] }
//                                 ]
//                             }
//                         ]}
//                     />
//                 </div>
//             </div>

//             {(search || statusFilter !== 'ALL') && (
//                 <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
//                     {search && (
//                         <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
//                             Search: {search} <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setSearch("")} />
//                         </Badge>
//                     )}
//                     {statusFilter !== 'ALL' && (
//                         <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
//                             Status: {statusFilter.replace('_', ' ')} <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setStatusFilter("ALL")} />
//                         </Badge>
//                     )}
//                     <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 rounded-lg" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>Clear All Filters</Button>
//                 </div>
//             )}

//             <div className="bg-white rounded-[2rem] border-0 shadow-sm overflow-hidden flex flex-col">
//                 <div className="flex-grow overflow-y-auto custom-scrollbar">
//                     <Table>
//                         <TableHeader className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 h-12 border-slate-50 sticky top-0 z-20 backdrop-blur-md">
//                             <TableRow>
//                                 {activeView === 'verifications' && <TableHead className="w-12 pl-6"></TableHead>}
//                                 <TableHead className={activeView === 'verifications' ? "pl-2" : "pl-8"}>
//                                     {activeView === 'orders' || activeView === 'disputes' ? 'ORDER ID & BUYER' :
//                                         activeView === 'logistics' ? 'DELIVERY BOY & ORDER' :
//                                             activeView === 'reviews' ? 'REVIEWER & PRODUCT' :
//                                                 activeView === 'support' ? 'SUPPORT USER' :
//                                                     activeView === 'mediation' ? 'PRODUCT & USER' : 'IDENTITY & NAME'}
//                                 </TableHead>
//                                 <TableHead>
//                                     {activeView === 'orders' || activeView === 'disputes' ? 'PAYMENT' :
//                                         activeView === 'logistics' ? 'CURRENT STATUS' :
//                                             activeView === 'reviews' ? 'RATING' : 'LOCATION & DATA'}
//                                 </TableHead>
//                                 <TableHead>
//                                     {activeView === 'orders' || activeView === 'disputes' ? 'ORDER STATUS' :
//                                         activeView === 'logistics' ? 'DISTANCE/PRICE' :
//                                             activeView === 'reviews' ? 'COMMENT' :
//                                                 activeView === 'mediation' ? 'FEE/PRICE' : 'JOIN DATE'}
//                                 </TableHead>
//                                 <TableHead>
//                                     {activeView === 'orders' || activeView === 'disputes' ? 'METHOD' :
//                                         activeView === 'logistics' ? 'TIME ESTIMATE' :
//                                             activeView === 'reviews' ? 'DATE' :
//                                                 activeView === 'mediation' ? 'STATUS' : 'ACCOUNT STATE'}
//                                 </TableHead>
//                                 <TableHead className="text-right pr-8">AUDIT ACTION</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {items.length === 0 ? <TableRow><TableCell colSpan={6} className="h-60 text-center text-slate-400 italic text-xs uppercase font-black">No Records Found matching filter.</TableCell></TableRow> : items.map((item, i) => (
//                                 <TableRow key={i} className={`h-20 border-slate-50 hover:bg-slate-50/50 group ${selectedIds.includes(item.userId) ? 'bg-indigo-50/50' : ''}`}>
//                                     {activeView === 'verifications' && (
//                                         <TableCell className="pl-6">
//                                             <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 accent-indigo-600" checked={selectedIds.includes(item.userId)} onChange={(e) => {
//                                                 if (e.target.checked) setSelectedIds([...selectedIds, item.userId]);
//                                                 else setSelectedIds(selectedIds.filter(id => id !== item.userId));
//                                             }} />
//                                         </TableCell>
//                                     )}
//                                     <TableCell className={activeView === 'verifications' ? "pl-2" : "pl-8"}>
//                                         <div className="flex items-center gap-4">
//                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border ${activeView === 'catalog' ? 'bg-purple-50 text-purple-600 border-purple-100' :
//                                                 activeView === 'logistics' ? 'bg-amber-50 text-amber-600 border-amber-100' :
//                                                     activeView === 'reviews' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
//                                                         activeView === 'support' ? 'bg-rose-50 text-rose-600 border-rose-100' : item.role === 'farmer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
//                                                             'bg-indigo-50 text-indigo-600 border-indigo-100'
//                                                 }`}>
//                                                 {(item.productName || item.name || item.displayName || item.buyerName || item.userName || item.product?.productName)?.[0] || 'O'}
//                                             </div>
//                                             <div className="flex flex-col">
//                                                 <div className="flex items-center gap-2">
//                                                     <span className="font-black text-slate-900 text-sm leading-tight">
//                                                         {activeView === 'logistics' ? item.deliveryBoy?.name :
//                                                             activeView === 'reviews' ? item.user?.name :
//                                                                 activeView === 'mediation' ? item.product?.productName :
//                                                                     s(item.productName || item.name || item.displayName || item.buyerName || item.userName)}
//                                                     </span>
//                                                     {activeView === 'orders' && <RoleBadge role={item.buyerRole} />}
//                                                     {(activeView === 'farmers' || activeView === 'agents' || activeView === 'delivery') && <RoleBadge role={item.role || activeView.slice(0, -1)} />}
//                                                     {activeView === 'support' && <RoleBadge role={item.userRole} />}
//                                                 </div>
//                                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
//                                                     {activeView === 'orders' ? <>Bill: ₹{item.totalAmount}</> :
//                                                         activeView === 'catalog' ? <>Price: ₹{item.pricePerUnit} / {item.unit}</> :
//                                                             activeView === 'logistics' ? <>Order ID: #{item.orderId?.slice(-6).toUpperCase()}</> :
//                                                                 activeView === 'reviews' ? <>Product: {item.product?.productName}</> :
//                                                                     activeView === 'mediation' ? <>User: {item.user?.name}</> :
//                                                                         activeView === 'support' ? item.userEmail : `ID: #${(item.userId || item.id)?.slice(-6).toUpperCase()}`}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </TableCell>
//                                     <TableCell>
//                                         <div className="flex items-center gap-3">
//                                             <div className="flex flex-col">
//                                                 {activeView === 'orders' || activeView === 'disputes' ? (
//                                                     <div className="flex flex-wrap items-center gap-1.5">
//                                                         <StatusBadge status={item.paymentStatus} type="payouts" size="xs" />
//                                                         <StatusBadge status={item.payoutStatus} type="payouts" size="xs" />
//                                                     </div>
//                                                 ) : activeView === 'logistics' ? (
//                                                     <div className="flex flex-col gap-1">
//                                                         <div className="flex items-center gap-2">
//                                                             <StatusBadge status={item.status} type="logistics" size="xs" />
//                                                             <RoleBadge role="delivery" size="xs" />
//                                                         </div>
//                                                         {item.order?.buyerUser?.role && (
//                                                             <div className="flex items-center gap-1.5 mt-1">
//                                                                 <span className="text-[7px] font-black text-slate-400 uppercase">Buyer:</span>
//                                                                 <RoleBadge role={item.order.buyerUser.role} size="xs" />
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 ) : activeView === 'reviews' ? (
//                                                     <div className="flex items-center gap-1">
//                                                         {[...Array(5)].map((_, i) => (
//                                                             <Star key={i} className={`h-3 w-3 ${i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`} />
//                                                         ))}
//                                                     </div>
//                                                 ) : activeView === 'catalog' ? (
//                                                     <div className="flex flex-col">
//                                                         <div className="flex items-center gap-2">
//                                                             <span className="text-[10px] font-black text-slate-900 leading-none">{s(item.sellerName)}</span>
//                                                             <RoleBadge role={item.sellerType} />
//                                                         </div>
//                                                         <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-0 bg-indigo-50 text-indigo-700 rounded-md w-fit mt-1">Sold: {sNum(item.unitsSold)}</Badge>
//                                                     </div>
//                                                 ) : (
//                                                     <>
//                                                         <span className="text-[10px] font-black text-slate-900 leading-none">
//                                                             {activeView === 'support' ? (item.type?.replace('_', ' ') || 'SUPPORT REQUEST') :
//                                                                 activeView === 'mediation' ? `₹${item.negotiatedFee || 0} Fee` :
//                                                                     s(item.city || item.category || item.vehicleType)}
//                                                         </span>
//                                                         <div className="mt-1 flex items-center gap-2">
//                                                             {activeView === 'support' && <StatusBadge status={item.isRead ? 'CLOSED' : 'OPEN'} type="support" size="xs" />}
//                                                             {activeView === 'mediation' && <StatusBadge status={item.status} type="moderation" size="xs" />}
//                                                             <span className="text-[9px] font-bold text-slate-400 uppercase">
//                                                                 {activeView === 'support' ? "" :
//                                                                     activeView === 'mediation' ? `Base: ₹${item.product?.pricePerUnit}` :
//                                                                         s(item.district)}
//                                                             </span>
//                                                         </div>
//                                                     </>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </TableCell>
//                                     <TableCell className="text-[10px] font-black text-slate-400 uppercase">
//                                         {activeView === 'orders' || activeView === 'disputes' ? (
//                                             <StatusBadge status={item.orderStatus} type="orders" size="xs" />
//                                         ) : activeView === 'logistics' ? (
//                                             <div className="flex flex-col">
//                                                 <span className="text-[10px] font-black text-slate-900 leading-none">{item.distance} KM</span>
//                                                 <span className="text-[9px] font-bold text-indigo-600 uppercase mt-0.5">₹{item.totalPrice}</span>
//                                             </div>
//                                         ) : activeView === 'catalog' ? (
//                                             <span className="text-[10px] font-black text-slate-600">{s(item.category)}</span>
//                                         ) : (
//                                             item.createdAt && mounted ? new Date(item.createdAt).toLocaleDateString() : '—'
//                                         )}
//                                     </TableCell>
//                                     <TableCell>
//                                         {activeView === 'orders' || activeView === 'disputes' ? (
//                                             <span className="text-[10px] font-black text-slate-600 uppercase">{item.paymentMethod}</span>
//                                         ) : activeView === 'logistics' ? (
//                                             <span className="text-[10px] font-black text-slate-600 uppercase">{item.estimatedTime || 'ASAP'}</span>
//                                         ) : activeView === 'farmers' || activeView === 'agents' ? (
//                                             <div className="flex flex-col gap-1.5 items-center">
//                                                 <div className="flex gap-1">
//                                                     <StatusBadge status={item.sellingStatus || 'PENDING'} type="moderation" size="xs" />
//                                                     <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md ${item.usagePurpose === 'buy_and_sell' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
//                                                         {item.usagePurpose === 'buy_and_sell' ? 'BUY & SELL' : 'BUY ONLY'}
//                                                     </Badge>
//                                                 </div>
//                                                 <StatusBadge status={item.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'} type="security" size="xs" />
//                                             </div>
//                                         ) : activeView === 'mediation' ? (
//                                             <div className="flex flex-col gap-1.5 items-center">
//                                                 <StatusBadge status={item.status} type="moderation" size="xs" />
//                                                 <Badge className={`text-[7px] font-black uppercase px-2 py-0.5 border-0 rounded-md ${item.inquirySent ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
//                                                     {item.inquirySent ? 'Message Sent' : 'No Message'}
//                                                 </Badge>
//                                             </div>
//                                         ) : (
//                                             <div className="flex flex-col gap-1.5 items-center">
//                                                 {(activeView === 'support' || activeView === 'delivery') && (
//                                                     <StatusBadge status={activeView === 'support' ? (item.userRole || 'USER') : (item.approvalStatus || 'PENDING')} type="moderation" size="xs" />
//                                                 )}
//                                                 <StatusBadge status={item.user?.isDisabled ? 'BLOCKED' : 'ACTIVE'} type="security" size="xs" />
//                                             </div>
//                                         )}
//                                     </TableCell>
//                                     <TableCell className="pr-8 text-right">
//                                         <div className="flex justify-end gap-2 transition-all">
//                                             <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg bg-white border-slate-200 shadow-sm hover:border-indigo-600 hover:text-indigo-600" onClick={() => {
//                                                 if (activeView === 'orders' || activeView === 'disputes') openOrderAudit(item.id);
//                                                 else if (activeView === 'catalog') openProductAudit(item);
//                                                 else if (activeView === 'support') openSupportAudit(item);
//                                                 else if (activeView === 'mediation') {
//                                                     setSelectedRequest(item);
//                                                     setIsMediationModalOpen(true);
//                                                     setNegotiatedFee(item.negotiatedFee || "");
//                                                     setAdminQuantity(item.quantity || "");
//                                                 }
//                                                 else openProfileAudit(item);
//                                             }}><Eye className="h-4 w-4 text-slate-400" /></Button>
//                                             {activeView === 'orders' && (
//                                                 <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteOrder(item.id)}><Trash2 className="h-4 w-4" /></Button>
//                                             )}
//                                             {activeView !== 'orders' && activeView !== 'mediation' && (
//                                                 <Button size="icon" variant="outline" className={`h-8 w-8 rounded-lg border-slate-200 shadow-sm ${item.user?.isDisabled ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`} onClick={() => handleToggleStatus(item.userId || item.id, item.name || item.displayName)}>
//                                                     {item.user?.isDisabled ? <UserCheck2 className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
//                                                 </Button>
//                                             )}
//                                         </div>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </div>
//                 <PaginationComponent />
//             </div>
//         </div>
//     );
// }