// import React from 'react';
// import { Card } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from '@/components/ui/button';
// import { Eye, Activity, History as LucideHistory } from "lucide-react";
// import { s, sNum, getFriendlyStatus } from '@/data/AdminData/adminData';
// import { StatusBadge } from './WorkflowSystem';

// export default function AdminDashboard({ stats, orders, pendingProfiles, logs, openOrderAudit }) {
//     return (
//         <div className="space-y-10 animate-in fade-in duration-500">
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
//                 <Card className="border-0 shadow-sm rounded-2xl bg-white p-6 border-t-4 border-emerald-500">
//                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
//                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{"\u20B9"}{sNum(stats.finance?.totalGMV).toLocaleString()}</h3>
//                     <p className="text-[9px] font-bold text-slate-400 mt-4">Platform Volume</p>
//                 </Card>
//                 <Card className="border-0 shadow-sm rounded-2xl bg-white p-6 border-t-4 border-indigo-500">
//                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Platform Fees</p>
//                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{"\u20B9"}{sNum(stats.finance?.totalPlatformRevenue).toLocaleString()}</h3>
//                     <div className="text-[9px] text-emerald-600 font-black mt-4 uppercase">Direct Profit</div>
//                 </Card>
//                 <Card className="border-0 shadow-sm rounded-2xl bg-rose-500 p-6 border-t-4 border-rose-600">
//                     <p className="text-[9px] font-black text-rose-100 uppercase tracking-widest mb-1">Blocked Accounts</p>
//                     <h3 className="text-2xl font-black text-white tracking-tighter">{sNum(stats.users?.disabledCount)} Users</h3>
//                     <p className="text-[9px] font-bold text-rose-100 mt-4 uppercase tracking-tighter">Access Restricted</p>
//                 </Card>
//                 <Card className="border-0 shadow-sm rounded-2xl bg-indigo-300 p-6">
//                     <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Verified Score</p>
//                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.users?.profileCompleteness}%</h3>
//                     <p className="text-[9px] font-bold text-slate-900 mt-4 uppercase">Platform Trust</p>
//                 </Card>
//                 <Card className="border-0 shadow-sm rounded-2xl bg-slate-900 text-white p-6">
//                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Catalog</p>
//                     <h3 className="text-2xl font-black text-white tracking-tighter">{stats.products?.totalProducts} Items</h3>
//                     <p className="text-[9px] font-black text-indigo-400 mt-4 uppercase tracking-widest">Marketplace Live</p>
//                 </Card>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//                 <div className="xl:col-span-2 space-y-8">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <Card className="rounded-[2.5rem] border-0 shadow-sm bg-white p-10 flex flex-col justify-center">
//                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Admin Summary</p>
//                             <h3 className="text-xl font-black text-slate-900">Platform is Healthy.</h3>
//                             <div className="flex items-center gap-3 mt-6"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-black text-emerald-600 uppercase">System Integrity Audit: Pass</span></div>
//                         </Card>
//                         <div className="grid grid-cols-2 gap-6">
//                             <Card className="rounded-3xl border-0 shadow-sm bg-emerald-50 p-6 flex flex-col justify-center"><p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Approved Sellers</p><h4 className="text-2xl font-black text-emerald-900">{sNum(stats.users?.farmerCount + stats.users?.agentCount)}</h4></Card>
//                             <Card className="rounded-3xl border-0 shadow-sm bg-rose-50 p-6 flex flex-col justify-center"><p className="text-[9px] font-black text-rose-600 uppercase mb-2">Pending Verify</p><h4 className="text-2xl font-black text-rose-900">{pendingProfiles.length}</h4></Card>
//                         </div>
//                     </div>
//                     <Card className="rounded-[2rem] border-0 shadow-sm bg-white overflow-hidden flex flex-col">
//                         <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0"><h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><LucideHistory className="h-4 w-4 text-indigo-500" /> Recent Platform Activity</h4></div>
//                         <div className="flex-grow overflow-y-auto custom-scrollbar">
//                             <Table>
//                                 <TableHeader className="bg-slate-50/50 text-[9px] uppercase font-black text-slate-400 h-10 border-slate-50 sticky top-0 z-10 backdrop-blur-md"><TableRow><TableHead className="pl-8">ORDER ID</TableHead><TableHead>MEMBER</TableHead><TableHead>TOTAL BILL</TableHead><TableHead>STATUS</TableHead><TableHead className="text-right pr-8">VIEW</TableHead></TableRow></TableHeader>
//                                 <TableBody>
//                                     {Array.isArray(orders) && orders.slice(0, 6).map((o, idx) => (
//                                         <TableRow key={idx} className="h-16 border-slate-50 hover:bg-slate-50/50 group">
//                                             <TableCell className="pl-8 font-black text-slate-900">#{o.id.slice(-6).toUpperCase()}</TableCell>
//                                             <TableCell className="text-[11px] font-bold text-slate-600">{s(o.buyerName)}</TableCell>
//                                             <TableCell className="font-black text-slate-900 text-xs">{"\u20B9"}{sNum(o.totalAmount).toLocaleString()}</TableCell>
//                                             <TableCell><StatusBadge status={getFriendlyStatus(o.orderStatus)} type="orders" size="xs" /></TableCell>
//                                             <TableCell className="text-right pr-8"><Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openOrderAudit(o.id)}><Eye className="h-4 w-4 text-slate-400" /></Button></TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </Card>
//                 </div>

//                 <Card className="rounded-[2.5rem] border-0 shadow-sm bg-white p-8 h-fit flex flex-col max-h-[500px]">
//                     <h4 className="text-[11px] font-black mb-10 flex items-center gap-3 uppercase tracking-widest shrink-0"><Activity className="h-5 w-5 text-indigo-600" /> Internal Action Log</h4>
//                     <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4 flex-grow">
//                         {logs.length === 0 ? <p className="text-[10px] text-slate-400 italic text-center py-20 uppercase font-black">No Recent Records.</p> : logs.map((l, i) => (
//                             <div key={i} className="flex items-start gap-4 border-l-2 border-indigo-100 pl-4 py-1 relative">
//                                 <div className="absolute -left-1.5 top-2 w-2 h-2 bg-indigo-600 rounded-full" />
//                                 <div className="flex-grow">
//                                     <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{l.action}</p>
//                                     <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-tight">{l.detail}</p>
//                                 </div>
//                                 <span className="text-[8px] font-bold text-slate-300">{l.time}</span>
//                             </div>
//                         ))}
//                     </div>
//                 </Card>
//             </div>
//         </div>
//     );
// }