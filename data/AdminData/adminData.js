// import {
//     LayoutDashboard, Users, Package, IndianRupee,
//     HelpCircle, ShieldCheck, Truck, Scale, ShieldAlert, Star,
//     Building2, Zap, ShoppingBag
// } from "lucide-react";

// export const s = (v) => (v !== undefined && v !== null && v !== "" ? v : "NOT PROVIDED");
// export const sNum = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

// export const CUSTOM_SCROLLBAR_CSS = `
//   .custom-scrollbar::-webkit-scrollbar {
//     width: 12px;
//     height: 12px;
// }
//   .custom-scrollbar::-webkit-scrollbar-track {
//     background: #f8fafc;
//     border-radius: 10px;
//     box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
// }
//   .custom-scrollbar::-webkit-scrollbar-thumb {
//     background: #94a3b8;
//     border-radius: 10px;
//     border: 3px solid #f8fafc;
// }
//   .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//     background: #64748b;
// }
// `;

// export const getFriendlyStatus = (status) => {
//     const map = {
//         'PROCESSING': 'Preparing Order',
//         'PACKED': 'Packed & Ready',
//         'SHIPPED': 'Sent to Courier',
//         'IN_TRANSIT': 'On the Way',
//         'DELIVERED': 'Safely Delivered',
//         'CANCELLED': 'Order Cancelled'
//     };
//     return map[status] || status;
// };

// // We use `badgeKey` to dynamically pull counts in the UI component
// export const navItems = [
//     { id: 'dashboard', label: 'Main Board', icon: LayoutDashboard, color: 'text-indigo-500' },
//     { id: 'verifications', label: 'Verify Members', icon: ShieldCheck, color: 'text-emerald-500', badgeKey: 'pendingProfiles' },
//     { id: 'disputes', label: 'Problems / Help', icon: Scale, color: 'text-rose-500', badgeKey: 'disputes' },
//     { id: 'orders', label: 'Sales & Deliveries', icon: ShoppingBag, color: 'text-blue-500' },
//     { id: 'farmers', label: 'Farmers List', icon: Users, color: 'text-emerald-500' },
//     { id: 'agents', label: 'Agents List', icon: Building2, color: 'text-amber-500' },
//     { id: 'delivery', label: 'Delivery Boys', icon: Truck, color: 'text-slate-400' },
//     { id: 'logistics', label: 'Live Logistics', icon: Zap, color: 'text-amber-500' },
//     { id: 'mediation', label: 'Product Approval', icon: ShieldAlert, color: 'text-rose-600', badgeKey: 'specialRequests' },
//     { id: 'catalog', label: 'Product List', icon: Package, color: 'text-purple-500' },
//     { id: 'reviews', label: 'User Reviews', icon: Star, color: 'text-yellow-500' },
//     { id: 'support', label: 'Help & Support', icon: HelpCircle, color: 'text-rose-500', badgeKey: 'unreadSupportCount' },
//     { id: 'finance', label: 'Money & Bank', icon: IndianRupee, color: 'text-emerald-600' },
// ];