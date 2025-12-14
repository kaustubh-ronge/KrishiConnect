"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import { useRef } from "react";

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-900">Invoice</span>
            <span className="text-sm font-normal text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
          </DialogTitle>
          <DialogDescription>
            Date: {new Date(order.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4" id="invoice-content">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full flex items-center gap-2 border border-green-200">
               <CheckCircle2 className="h-5 w-5" />
               <span className="font-medium">Payment Successful</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Delivery</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const deliveryAmount = item.deliveryChargeTypeAtPurchase === 'per_unit' ? (item.quantity * (item.deliveryChargeAtPurchase || 0)) : (item.deliveryChargeAtPurchase || 0);
                  const lineTotal = (item.quantity * item.priceAtPurchase) + deliveryAmount;
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{item.product.productName}</td>
                      <td className="px-4 py-3 text-gray-500">
                          {item.product.sellerType === 'farmer' 
                             ? item.product.farmer?.name 
                             : item.product.agent?.companyName || item.product.agent?.name}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity} {item.product.unit}</td>
                      <td className="px-4 py-3 text-right">₹{item.priceAtPurchase.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">₹{deliveryAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/2 space-y-2">
               {/* Compute subtotal explicitly from items */}
               <div className="flex justify-between text-gray-600">
                 <span>Subtotal</span>
                 <span>₹{order.items.reduce((s, it) => {
                   const deliveryAmount = it.deliveryChargeTypeAtPurchase === 'per_unit' ? (it.quantity * (it.deliveryChargeAtPurchase || 0)) : (it.deliveryChargeAtPurchase || 0);
                   return s + (it.quantity * it.priceAtPurchase) + deliveryAmount;
                 }, 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-gray-600">
                 <span>Platform Fee</span>
                 <span>₹{order.platformFee}</span>
               </div>
               <Separator />
               <div className="flex justify-between text-lg font-bold text-gray-900">
                 <span>Total Paid</span>
                 <span>₹{order.totalAmount}</span>
               </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
            <p>Thank you for using KrishiConnect.</p>
            <p>Order ID: {order.id}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 print:hidden">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePrint} className="bg-gray-900 text-white hover:bg-gray-800">
                <Printer className="h-4 w-4 mr-2" /> Print Invoice
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}