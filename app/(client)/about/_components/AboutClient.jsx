"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, ShieldCheck, TrendingUp, Users, Globe } from 'lucide-react';
import Image from 'next/image';

export default function AboutClient() {
  const stats = [
    { label: "Farmers Joined", value: "10,000+", icon: Sprout, color: "text-green-600" },
    { label: "Orders Delivered", value: "50,000+", icon: ShieldCheck, color: "text-blue-600" },
    { label: "Districts Covered", value: "100+", icon: Globe, color: "text-emerald-600" },
    { label: "Active Agents", value: "500+", icon: Users, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Our Mission to <span className="text-green-600">Empower</span> Farmers
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              KrishiConnect is more than a marketplace. It's a movement to bring transparency,
              fairness, and efficiency to the Indian agricultural supply chain.
            </p>
          </motion.div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50"
              >
                <div className={`inline-flex p-3 rounded-2xl bg-gray-50 mb-4 ${stat.color}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Why We Started</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Traditional supply chains often leave farmers with minimal profits while
                consumers pay high prices. KrishiConnect was born from the need to bridge
                this gap by connecting farmers directly with agents and delivery partners.
              </p>
              <div className="space-y-4">
                {[
                  "Direct Farm-to-Agent communication",
                  "Transparent pricing with no hidden fees",
                  "Verified delivery partners for safe transport",
                  "Real-time tracking for every order"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]"
            >
              <Image
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800"
                alt="Farmers working"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
                <blockquote className="text-2xl font-medium text-white italic">
                  "Growing the future together by making agriculture sustainable and profitable."
                </blockquote>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
