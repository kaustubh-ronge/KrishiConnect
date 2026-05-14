"use client";

import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Filter, RotateCcw, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onReset,
  config = []
}) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full p-0 border-0 bg-white shadow-2xl rounded-l-[2.5rem] flex flex-col overflow-hidden">
        <div className="bg-slate-900 p-8 text-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <SheetTitle className="text-2xl font-black text-white tracking-tighter">Advanced Filters</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <SheetDescription className="text-slate-400 font-medium">
            Fine-tune your data view with precision controls.
          </SheetDescription>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-8">
          {config.map((section, idx) => (
            <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.title}</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {section.filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      {filter.label}
                      {filters[filter.key] && filters[filter.key] !== 'ALL' && (
                        <Check className="h-3 w-3 text-emerald-500" />
                      )}
                    </Label>
                    
                    {filter.type === 'select' ? (
                      <Select 
                        value={filters[filter.key] || 'ALL'} 
                        onValueChange={(val) => handleFilterChange(filter.key, val)}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-medium focus:ring-indigo-500/20">
                          <SelectValue placeholder={`Select ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          <SelectItem value="ALL" className="font-bold">Show All</SelectItem>
                          {filter.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={filter.type || 'text'}
                        placeholder={filter.placeholder}
                        value={filters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-medium focus:ring-indigo-500/20"
                      />
                    )}
                  </div>
                ))}
              </div>
              {idx < config.length - 1 && <Separator className="mt-8 bg-slate-100" />}
            </div>
          ))}
        </div>

        <SheetFooter className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 sm:flex-row flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex-1 h-12 rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest gap-2 bg-white hover:bg-slate-100 transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button 
            onClick={onApply}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
