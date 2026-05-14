// import React from 'react';
// import { Search, Download, RefreshCw } from "lucide-react";
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { navItems } from '@/data/AdminData/adminData';

// export default function AdminHeader({ activeView, search, setSearch, handleGlobalExport, refreshData, isLoading }) {
//     return (
//         <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
//             <div className="flex items-center gap-3">
//                 <div className="w-1 h-5 bg-indigo-600 rounded-full" />
//                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{navItems.find(i => i.id === activeView)?.label}</h3>
//             </div>
//             <div className="flex items-center gap-4">
//                 <div className="relative">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
//                     <Input placeholder="Search records..." className="pl-9 h-9 w-64 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold" value={search} onChange={e => setSearch(e.target.value)} />
//                 </div>
//                 <Button variant="outline" size="sm" className="h-9 rounded-xl font-black border-slate-200 gap-2 bg-white" onClick={handleGlobalExport}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
//                 <Button variant="outline" size="sm" className="h-9 rounded-xl font-black border-slate-200 gap-2 bg-white" onClick={refreshData} disabled={isLoading}><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh</Button>
//             </div>
//         </header>
//     );
// }