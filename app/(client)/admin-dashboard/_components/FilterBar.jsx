"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, RotateCcw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const FilterBar = ({
  search,
  setSearch,
  activeFilters = {},
  onClearFilters,
  onOpenAdvanced,
  filterConfig = [],
  onExport,
  isExporting = false,
  statusOptions = [],
  onStatusChange
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  const activeCount = Object.values(activeFilters).filter(v => v && v !== 'ALL' && v !== '').length;

  return (
    <div className="flex flex-col gap-4 w-full bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-slate-200 shadow-sm transition-all duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <Input
            placeholder="Universal Search..."
            className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Advanced Filter Toggle */}
          <Button
            variant="outline"
            onClick={onOpenAdvanced}
            className={cn(
              "h-12 px-6 rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2 transition-all",
              activeCount > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className={cn("h-4 w-4", activeCount > 0 && "fill-indigo-600")} />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-1 bg-indigo-600 text-white border-0 h-5 min-w-[20px] flex items-center justify-center p-0 rounded-full text-[10px]">
                {activeCount}
              </Badge>
            )}
          </Button>

          {/* Export Action */}
          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isExporting}
              className="h-12 px-6 rounded-2xl border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all"
            >
              <Download className={cn("h-4 w-4", isExporting && "animate-bounce")} />
              Export
            </Button>
          )}

           {/* Reset Action */}
           <Button
             variant="ghost"
             onClick={onClearFilters}
             className="h-12 px-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest gap-2"
           >
             <RotateCcw className="h-4 w-4" />
           </Button>
         </div>
       </div>

       {/* Quick Status Filter */}
       {statusOptions.length > 0 && (
         <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Quick Status:</span>
           <div className="flex gap-2">
             <button
               onClick={() => onStatusChange('ALL')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                 activeFilters.status === 'ALL' || !activeFilters.status
                   ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                   : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100 hover:text-slate-600'
               )}
             >
               All
             </button>
             {statusOptions.map((opt) => (
               <button
                 key={opt.value}
                 onClick={() => onStatusChange(opt.value)}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                   activeFilters.status === opt.value 
                     ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                     : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100 hover:text-slate-600'
                 )}
               >
                 {opt.label}
               </button>
             ))}
           </div>
         </div>
       )}

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === 'ALL' || value === '') return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="bg-indigo-50 text-indigo-700 border-indigo-100 pl-3 pr-1.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span className="opacity-60">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(value)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-indigo-200 rounded-lg transition-colors"
                  onClick={() => onClearFilters(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
