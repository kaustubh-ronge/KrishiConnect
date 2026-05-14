// import React from 'react';
// import { Card } from '@/components/ui/card';
// import { Wallet, Banknote, TrendingUp } from "lucide-react";
// import { sNum } from '@/data/AdminData/adminData';

// export default function AdminFinance({ stats }) {
//     return (
//         <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
//                 <Card className="rounded-[3.5rem] border-0 shadow-xl bg-slate-950 text-white p-14 relative overflow-hidden group">
//                     <Wallet className="h-14 w-14 text-indigo-400 mb-10" />
//                     <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Platform Cash Flow</p>
//                     <h3 className="text-6xl font-black tracking-tighter">₹{sNum(stats.finance?.totalGMV).toLocaleString()}</h3>
//                     <p className="text-[11px] font-bold text-slate-600 mt-10 uppercase tracking-widest">Total Sales Ledger</p>
//                     <div className="absolute -bottom-20 -right-20 opacity-5"><Banknote className="h-[30rem] w-[30rem]" /></div>
//                 </Card>
//                 <div className="space-y-10">
//                     <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-10 border-t-[12px] border-emerald-600 flex flex-col justify-between">
//                         <div><p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Our Net Profit</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{sNum(stats.finance?.totalPlatformRevenue).toLocaleString()}</h3></div>
//                         <div className="mt-6 flex items-center gap-3 text-emerald-600 font-black text-lg"><TrendingUp className="h-6 w-6" /> Financial Integrity Confirmed</div>
//                     </Card>
//                     <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-10 border-t-[12px] border-indigo-600">
//                         <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Money Owed to Sellers</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{sNum(stats.finance?.pendingPayouts).toLocaleString()}</h3>
//                         <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-6">Awaiting Bank Transfer</p>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     );
// }