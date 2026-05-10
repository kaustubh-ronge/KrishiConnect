"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Zap, ShieldCheck, Leaf } from 'lucide-react';

export default function PremiumLoader({ message = "Processing...", fullPage = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-12 text-center relative">
      <div className="relative mb-12">
        {/* Advanced Rotating Rings */}
        <motion.div
          className="w-32 h-32 rounded-full border-[1px] border-indigo-500/10 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-t-2 border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Glow Core */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-20 h-20 bg-indigo-600/20 rounded-full blur-2xl" />
        </motion.div>

        {/* Center Branding Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-indigo-600 drop-shadow-lg"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Globe className="h-12 w-12" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] leading-none">
            {message}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Integrity Verification</p>
        </div>

        <div className="flex items-center justify-center gap-8 py-4 px-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Node</span>
           </div>
           <div className="w-px h-4 bg-slate-200" />
           <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fast Sync</span>
           </div>
        </div>
      </motion.div>

      {/* Modern Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-500/30 rounded-full"
            initial={{ 
              x: "50%", 
              y: "50%", 
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: `${50 + (Math.random() - 0.5) * 60}%`, 
              y: `${50 + (Math.random() - 0.5) * 60}%`, 
              opacity: [0, 0.4, 0],
              scale: [0, 1.2, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity, 
              delay: i * 0.2 
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={`${fullPage ? "fixed inset-0 z-[9999]" : "absolute inset-0 z-50 bg-white"} flex items-center justify-center`}>
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ type: "spring", damping: 20 }}
      >
        {content}
      </motion.div>
    </div>
  );
}
