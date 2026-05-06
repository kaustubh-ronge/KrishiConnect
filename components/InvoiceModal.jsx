"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, CheckCircle2, ShoppingBag, MapPin, Phone, User, Globe, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items.reduce((s, it) => {
    const deliveryAmount = it.deliveryChargeTypeAtPurchase === 'per_unit' ? (it.quantity * (it.deliveryChargeAtPurchase || 0)) : (it.deliveryChargeAtPurchase || 0);
    return s + (it.quantity * it.priceAtPurchase) + deliveryAmount;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
        {/* Decorative Top Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

        <div className="p-8 md:p-12 max-h-[85vh] overflow-y-auto" id="invoice-content">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">KrishiConnect</h1>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> www.krishiconnect.com</p>
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> support@krishiconnect.com</p>
              </div>
            </div>

            <div className="text-right space-y-2">
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Invoice</h2>
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-600">#{order.invoiceNumber || order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-400 font-medium">Issued: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-100 mb-10" />

          {/* Billing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Billed To</h3>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" /> {order.buyerName || "Valued Customer"}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> {order.shippingAddress}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-500" /> {order.buyerPhone}
                </p>
              </div>
            </div>

            <div className="space-y-4 md:text-right">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Info</h3>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-900">Method: {order.paymentMethod}</p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {order.paymentStatus === 'PAID' ? 'Payment Verified' : 'Payment Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Quantity</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Rate</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => {
                  const deliveryAmount = item.deliveryChargeTypeAtPurchase === 'per_unit' ? (item.quantity * (item.deliveryChargeAtPurchase || 0)) : (item.deliveryChargeAtPurchase || 0);
                  const lineTotal = (item.quantity * item.priceAtPurchase) + deliveryAmount;
                  return (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-bold text-gray-900 mb-1">{item.product.productName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            Seller: {item.sellerName || "KC Partner"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-gray-600">{item.quantity} {item.product.unit}</td>
                      <td className="px-6 py-5 text-right font-medium text-gray-600">₹{item.priceAtPurchase.toFixed(2)}</td>
                      <td className="px-6 py-5 text-right font-bold text-gray-900">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-12">
            <div className="w-full md:w-72 space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <div className="flex justify-between text-sm text-gray-500">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span className="font-medium">Platform Fee</span>
                <span className="font-bold text-gray-900">₹{order.platformFee.toFixed(2)}</span>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Total</span>
                <span className="text-2xl font-black text-emerald-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-white font-bold mb-2">Thank you for supporting Indian Agriculture.</p>
            <p className="text-slate-400 text-xs font-medium">This is a computer-generated invoice and does not require a physical signature.</p>
            <div className="mt-6 flex justify-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>KrishiConnect 2026</span>
              <span>•</span>
              <span>Safe & Secure</span>
              <span>•</span>
              <span>Farm to Fork</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-gray-500 hover:text-gray-900">
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl font-bold border-gray-200 shadow-sm">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-emerald-600/20">
              <Printer className="h-4 w-4 mr-2" /> Print Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
