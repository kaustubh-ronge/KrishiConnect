// import React from 'react';
// import { Menu, Globe } from "lucide-react";
// import { navItems } from '@/data/AdminData/adminData';

// export default function AdminSidebar({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen, badgeCounts }) {
//     return (
//         <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 shadow-2xl sticky top-0 h-screen shrink-0 z-50 ${isSidebarOpen ? "w-60" : "w-20"}`}>
//             <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
//                 {isSidebarOpen ? (
//                     <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Globe className="h-4 w-4" /></div>
//                         <span className="font-black text-white text-lg uppercase tracking-tighter">Krishi Hub</span>
//                     </div>
//                 ) : <Globe className="h-6 w-6 text-indigo-500 mx-auto" />}
//                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><Menu className="h-5 w-5" /></button>
//             </div>

//             <div className="flex-grow p-3 space-y-1 overflow-hidden">
//                 {navItems.map((item) => {
//                     const badge = badgeCounts[item.badgeKey] || 0;
//                     return (
//                         <button
//                             key={item.id}
//                             onClick={() => setActiveView(item.id)}
//                             className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${activeView === item.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
//                         >
//                             <div className="flex items-center gap-3">
//                                 <item.icon className={`h-4 w-4 ${activeView === item.id ? "text-white" : item.color}`} />
//                                 {isSidebarOpen && <span className="font-bold">{item.label}</span>}
//                             </div>
//                             {isSidebarOpen && badge > 0 && <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
//                         </button>
//                     );
//                 })}
//             </div>
//         </aside>
//     );
// }