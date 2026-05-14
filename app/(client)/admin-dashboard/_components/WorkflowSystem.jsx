import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
   CheckCircle2, 
   Clock, 
   XCircle, 
   AlertTriangle, 
   Package, 
   Truck, 
   CreditCard, 
   MessageSquare, 
   ShieldCheck,
   RotateCcw,
   History
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Enterprise-grade StatusBadge system
 * Handles multiple workflow domains with consistent styling
 */
export const StatusBadge = ({ status, type = 'general', size = 'sm' }) => {
   const config = {
      security: {
         ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ShieldCheck },
         BLOCKED: { label: 'Blocked', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
         SUSPENDED: { label: 'Suspended', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
      },
      orders: {
         PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
         PROCESSING: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: RotateCcw },
         PACKED: { label: 'Packed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package },
         SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
         IN_TRANSIT: { label: 'In Transit', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Truck },
         DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
         PAID: { label: 'Paid', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CreditCard },
         COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
         CANCELLED: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
         REFUNDED: { label: 'Refunded', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: History },
      },
      logistics: {
         PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
         IN_TRANSIT: { label: 'In Transit', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
         DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
         FAILED: { label: 'Failed', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
         DELAYED: { label: 'Delayed', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
      },
      payouts: {
         PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
         PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RotateCcw },
         SETTLED: { label: 'Settled', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
         FAILED: { label: 'Failed', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
         PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      },
      moderation: {
         PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
         APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ShieldCheck },
         REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
         FLAGGED: { label: 'Flagged', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
         ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Package },
      },
      support: {
         OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: MessageSquare },
         PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
         RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
         CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
         ESCALATED: { label: 'Escalated', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle },
      }
   };

   const domain = config[type] || {};
   const normalizedStatus = status?.toUpperCase() || 'UNKNOWN';
   const style = domain[normalizedStatus] || { label: status, color: 'bg-slate-100 text-slate-600', icon: Package };
   
   const Icon = style.icon;

   return (
      <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm font-black uppercase tracking-tighter ${style.color} ${size === 'xs' ? 'text-[8px]' : 'text-[10px]'}`}>
         <Icon className={`${size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}`} />
         {style.label}
      </Badge>
   );
};

/**
 * Intelligent ActionButton that handles workflow states
 */
export const WorkflowActionButton = ({ 
   label, 
   onClick, 
   icon: Icon, 
   isCompleted = false, 
   completedLabel = "Already Completed",
   variant = "default",
   className = "",
   isLoading = false
}) => {
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <span>
                  <Button
                     onClick={onClick}
                     disabled={isCompleted || isLoading}
                     variant={variant}
                     className={`gap-2 font-black uppercase tracking-widest text-[10px] h-11 rounded-2xl transition-all active:scale-95 ${className} ${isCompleted ? 'opacity-50 grayscale cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : ''}`}
                  >
                     {isLoading ? (
                        <RotateCcw className="h-4 w-4 animate-spin" />
                     ) : (
                        <Icon className="h-4 w-4" />
                     )}
                     {label}
                  </Button>
               </span>
            </TooltipTrigger>
            {isCompleted && (
               <TooltipContent className="bg-slate-900 text-white border-0 font-black text-[10px] uppercase p-3 rounded-xl shadow-2xl">
                  <p>{completedLabel}</p>
               </TooltipContent>
            )}
         </Tooltip>
      </TooltipProvider>
   );
};

/**
 * Reopen/Recovery Dialog wrapper
 */
export const AdminOverrideDialog = ({ isOpen, onClose, onConfirm, title, message, actionLabel = "Confirm Override" }) => {
   return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm transition-all ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 scale-in-center">
            <div className="bg-indigo-600 p-8 text-white">
               <RotateCcw className="h-10 w-10 mb-4" />
               <h3 className="text-2xl font-black tracking-tighter uppercase">{title || "Administrative Override"}</h3>
               <p className="text-indigo-100 text-xs font-bold mt-2 uppercase tracking-widest">{message || "You are about to reopen a finalized workflow."}</p>
            </div>
            <div className="p-8 space-y-6">
               <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Actions performed during an override are recorded in the security audit log. Please ensure this recovery is authorized.
               </p>
               <div className="flex gap-4">
                  <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase text-slate-400" onClick={onClose}>Cancel</Button>
                  <Button className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-indigo-600/20" onClick={onConfirm}>{actionLabel}</Button>
               </div>
            </div>
         </div>
      </div>
   );
};

/**
 * Status Filter Component for sidebars/headers
 */
export const StatusFilter = ({ options, activeStatus, onChange, type = 'general' }) => {
   return (
      <div className="flex flex-wrap gap-2">
         {options.map((opt) => (
            <button
               key={opt}
               onClick={() => onChange(opt)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                  activeStatus === opt 
                     ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                     : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100 hover:text-slate-600'
               }`}
            >
               {opt}
            </button>
         ))}
      </div>
   );
};
