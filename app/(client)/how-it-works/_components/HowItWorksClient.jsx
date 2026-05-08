"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  ArrowRight,
  Search,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksClient() {
  const steps = [
    {
      title: "Step 1: Join & Verify",
      desc: "Create an account as a Farmer, Agent, or Delivery Partner. Farmers and Agents undergo a quick verification for a secure trading environment.",
      icon: UserPlus,
      color: "bg-blue-500",
      details: ["Aadhar verification", "Role selection", "Profile setup"]
    },
    {
      title: "Step 2: List or Browse",
      desc: "Both Farmers and Agents list their harvest with prices and images. Both then browse the marketplace using advanced filters for location, category, and freshness.",
      icon: Search,
      color: "bg-green-500",
      details: ["High-quality listings", "Smart filters", "Direct communication"]
    },
    {
      title: "Step 3: Secure Order",
      desc: "Place an order using Online Payment or COD. Our system ensures atomicity and protects against double-spending or stock leaks.",
      icon: CreditCard,
      color: "bg-purple-500",
      details: ["Atomic transactions", "Payment protection", "Instant notification"]
    },
    {
      title: "Step 4: Fulfillment",
      desc: "Farmers and Agent can hire verified delivery partners. Both parties use secure OTP verification at pickup and drop-off to ensure zero-loss delivery.",
      icon: Truck,
      color: "bg-orange-500",
      details: ["OTP verification", "Real-time tracking", "Direct logistics"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-black text-gray-900 mb-6">How <span className="text-green-600">KrishiConnect</span> Works</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We've simplified the agricultural supply chain into four easy steps. 
              Transparent, secure, and built for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col md:flex-row items-center gap-12 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className={`inline-flex p-4 rounded-3xl ${step.color} text-white shadow-2xl mb-6`}>
                    <step.icon className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">{step.desc}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {step.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 relative">
                   <div className={`absolute inset-0 ${step.color} opacity-5 blur-3xl rounded-full`} />
                   <div className="relative bg-white p-2 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 h-[350px] flex items-center justify-center">
                         <step.icon className={`h-32 w-32 ${step.color.replace('bg-', 'text-')} opacity-20`} />
                         <span className="absolute text-8xl font-black text-gray-100 pointer-events-none">0{idx + 1}</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
         <div className="container mx-auto px-4">
            <motion.div 
               whileHover={{ scale: 1.02 }}
               className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-green-600/30 overflow-hidden relative"
            >
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Grow with Us?</h2>
                  <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
                     Join thousands of farmers and agents who are already transforming 
                     their businesses on KrishiConnect.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link className='cursor-pointer' href={'/'}>
                     <button className="cursor-pointer h-16 px-10 bg-white text-green-700 font-bold rounded-2xl shadow-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                        Get Started Free <ArrowRight className="h-5 w-5" />
                     </button>
                     </Link>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
    </div>
  );
}
