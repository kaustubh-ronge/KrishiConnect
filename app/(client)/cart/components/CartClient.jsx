"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { initiateCheckout, confirmOrderPayment } from '@/actions/orders';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, ShoppingBag, ArrowRight, IndianRupee, Minus, Plus, 
  ArrowLeft, ShieldCheck, Lock, Truck, CheckCircle2 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

// Helper to load Razorpay SDK dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartClient({ initialCart }) {
  const router = useRouter();
    const { removeItem, updateQuantity, fetchCart } = useCartStore(); 
    const { isSignedIn, user } = useUser();
  
    // Use initial data for now (in production, sync with store state)
    const cartItems = initialCart?.items || [];
    const totalQuantity = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

  // --- Calculations ---
  // 1. Subtotal: Sum of (Price * Quantity) for all items
  const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.product.pricePerUnit), 0);
  
  // 2. Platform Fee (Your Commission - e.g., 5%)
  const platformFee = Math.round(subtotal * 0.05); 
  
  // 3. Final Total (Subtotal + Platform Fee only)
  const total = subtotal + platformFee;

  // --- Handlers ---
  const handleRemove = async (itemId) => {
    toast.promise(removeItem(itemId), {
        loading: "Removing item...",
        success: "Item removed",
        error: "Failed to remove"
    });
    router.refresh();
  };

  const handleUpdateQty = async (item, change) => {
    const newQty = item.quantity + change;
    if (newQty < 1) return; 
    
    // Check stock limit (Optimistic)
    if (change > 0 && item.product.availableStock < change) {
        toast.error(`Only ${item.product.availableStock} more available.`);
        return;
    }
    
    await updateQuantity(item.id, newQty); 
    router.refresh();
  };

    const handleCheckout = async () => {
    const res = await loadRazorpay();
    if (!res) {
      toast.error("Razorpay SDK failed to load. Check your connection.");
      return;
    }

        // Create Order on server (DB + Razorpay Order) and get razorpayOrderId
        const initRes = await initiateCheckout();
        if (!initRes.success) {
            toast.error(initRes.error || "Failed to start checkout");
            return;
        }

        const { orderId, razorpayOrderId, amount } = initRes.data;

        const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add this to your .env.local
    amount: amount, // Amount in paise returned by server
      currency: "INR",
      name: "KrishiConnect",
      description: "Produce Purchase",
      image: "https://your-logo-url.com/logo.png", // Optional
    order_id: razorpayOrderId,
    method: { upi: true, netbanking: true, card: true }, // Restrict to only these 3
    handler: async function (response) {
        // Success Callback
        toast.success("Payment Successful!", {
            description: `Transaction ID: ${response.razorpay_payment_id}`
        });
                // Confirm order payment: call server action to validate and clear cart
                const confirmRes = await confirmOrderPayment({ orderId, razorpayPaymentId: response.razorpay_payment_id, razorpayOrderId: response.razorpay_order_id, signature: response.razorpay_signature });
                if (confirmRes.success) {
                    fetchCart(); // update UI
                    router.push('/my-orders');
                } else {
                    toast.error(confirmRes.error || 'Failed to confirm payment');
                }
      },
            prefill: {
                name: user?.fullName || user?.firstName || "", 
                email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "",
                contact: user?.phoneNumbers?.[0]?.phoneNumber || ""
            },
      theme: {
        color: "#16a34a"
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // --- Empty State ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
        >
            <div className="bg-green-50 p-6 rounded-full inline-block mb-2 shadow-inner">
                <ShoppingBag className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
            <p className="text-gray-500 max-w-md mx-auto text-base">
                Looks like you haven't added any produce yet. Explore the marketplace to find fresh stock.
            </p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg shadow-lg shadow-green-600/20 rounded-xl">
                <Link href="/marketplace">
                   Browse Marketplace <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </motion.div>
      </div>
    );
  }

  // --- Main Cart UI ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                Shopping Cart 
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {totalQuantity} items
                </span>
            </h1>
        </div>
        
        {/* --- ADD MORE ITEMS BUTTON --- */}
        <Button variant="outline" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-green-600 h-10 rounded-lg transition-colors">
            <Link href="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" /> Add More Items
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT: Cart Items (Span 8) --- */}
        <div className="lg:col-span-8 space-y-4">
           <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                key={item.id} 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="flex flex-col sm:flex-row overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl group bg-white">
                    
                    {/* Product Image */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-100 shrink-0">
                        {item.product.images?.[0] ? (
                            <Image 
                                src={item.product.images[0]} 
                                alt={item.product.productName} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">{item.product.productName}</h3>
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                        Sold by: <span className="font-medium text-gray-700 capitalize bg-gray-100 px-2 py-0.5 rounded text-xs">{item.product.sellerType}</span>
                                    </p>
                                    <p className="text-sm text-green-600 mt-1 font-medium flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> In Stock
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl text-gray-900">₹ {(item.quantity * item.product.pricePerUnit).toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-gray-500">₹{item.product.pricePerUnit} / {item.product.unit}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mt-4 gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-none rounded-l-lg hover:bg-gray-100 text-gray-600"
                                    onClick={() => handleUpdateQty(item, -1)}
                                    disabled={item.quantity <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-12 text-center font-semibold text-sm border-x border-gray-300 h-9 flex items-center justify-center bg-white text-gray-900">
                                    {item.quantity}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-none rounded-r-lg hover:bg-gray-100 text-gray-600"
                                    onClick={() => handleUpdateQty(item, 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Remove Button */}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemove(item.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </Button>
                        </div>
                    </div>
                </Card>
              </motion.div>
            ))}
           </AnimatePresence>
        </div>

        {/* --- RIGHT: Checkout Sidebar (Span 4) --- */}
        <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
                <Card className="border-gray-200 shadow-lg overflow-hidden rounded-xl bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 pt-6 px-6">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Order Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>Subtotal ({totalQuantity} items)</span>
                            <span className="font-medium text-gray-900">₹ {subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>Platform Fee (5%)</span>
                            <span className="font-medium text-gray-900">₹ {platformFee.toLocaleString('en-IN')}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between items-end pt-2">
                            <span className="text-lg font-bold text-gray-900">Total Payable</span>
                            <span className="text-2xl font-extrabold text-green-700">₹ {total.toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                        <Button 
                            onClick={handleCheckout}
                            className="w-full bg-gray-900 hover:bg-black text-white h-14 text-lg font-bold shadow-xl shadow-gray-200 rounded-xl transition-all hover:scale-[1.02]"
                        >
                            Proceed to Pay <Lock className="ml-2 h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            Secure SSL Payment via Razorpay
                        </div>
                    </CardFooter>
                </Card>

                {/* Trust Badges */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span>Verified Transport</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                         <ShieldCheck className="h-4 w-4 text-green-500" />
                         <span>Buyer Protection</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}