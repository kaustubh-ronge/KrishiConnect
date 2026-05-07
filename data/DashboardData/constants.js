/**
 * Centralized constants and static data for the KrishiConnect Dashboard
 */

export const ORDER_STATUS_OPTIONS = [
  { value: 'PROCESSING', label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PACKED', label: 'Packed', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' }
];

export const DELIVERY_STATUS_OPTIONS = [
  { value: 'REQUESTED', label: 'Requested', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'PICKED_UP', label: 'Picked Up', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'IN_TRANSIT', label: 'In Transit', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-600 text-white border-green-600' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-slate-100 text-slate-700 border-slate-200' }
];

export const VEHICLE_TYPES = [
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'BIKE', label: 'Motorbike' },
  { value: 'THREE_WHEELER', label: 'Auto/Three Wheeler' },
  { value: 'MINI_TRUCK', label: 'Mini Truck (Tata Ace, etc.)' },
  { value: 'TRUCK', label: 'Truck' }
];

export const USER_ROLES = {
  FARMER: 'farmer',
  AGENT: 'agent',
  DELIVERY: 'delivery',
  ADMIN: 'admin'
};

export const DASHBOARD_THEMES = {
  farmer: {
    primary: "green",
    bg: "bg-green-100",
    lightBg: "bg-green-50",
    text: "text-green-600",
    darkText: "text-green-700",
    hover: "hover:bg-green-700",
    accent: "bg-green-600",
    border: "border-green-100",
    accentClass: "accent-green-600"
  },
  agent: {
    primary: "blue",
    bg: "bg-blue-100",
    lightBg: "bg-blue-50",
    text: "text-blue-600",
    darkText: "text-blue-700",
    hover: "hover:bg-blue-700",
    accent: "bg-blue-600",
    border: "border-blue-100",
    accentClass: "accent-blue-600"
  }
};

export const getStatusBadgeConfig = (status, type = 'order') => {
  const options = type === 'order' ? ORDER_STATUS_OPTIONS : DELIVERY_STATUS_OPTIONS;
  return options.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-700' };
};
