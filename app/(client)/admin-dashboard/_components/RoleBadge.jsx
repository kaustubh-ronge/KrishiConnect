"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, ShieldCheck, Tractor, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoleBadge = ({ role, className, showIcon = true }) => {
    const isFarmer = role?.toLowerCase() === 'farmer';
    const isAgent = role?.toLowerCase() === 'agent';
    const isDelivery = role?.toLowerCase() === 'delivery';

    if (!isFarmer && !isAgent && !isDelivery) return null;

    return (
        <Badge
            variant="outline"
            className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all hover:scale-105 select-none",
                isFarmer ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    isAgent ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        "bg-amber-50 text-amber-700 border-amber-200",
                className
            )}
        >
            <div className="flex items-center gap-1.5">
                {showIcon && (
                    <>
                        {isFarmer && <Tractor className="h-3 w-3" />}
                        {isAgent && <Building2 className="h-3 w-3" />}
                        {isDelivery && <ShieldCheck className="h-3 w-3" />}
                    </>
                )}
                {role?.toUpperCase()}
            </div>
        </Badge>
    );
};

export default RoleBadge;
