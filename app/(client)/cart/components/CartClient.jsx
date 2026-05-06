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
    ArrowLeft, ShieldCheck, Lock, Truck, CheckCircle2,
    MapPin, RotateCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
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

export default function CartClient({ initialCart, user }) {
    const router = useRouter();
    const { removeItem, updateQuantity, fetchCart } = useCartStore();

    // Use initial data for now (in production, sync with store state)
    const cartItems = initialCart?.items || [];
    const totalQuantity = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

    const [shippingName, setShippingName] = useState(user?.fullName || "");
    const [shippingPhone, setShippingPhone] = useState(user?.phone || "");
    const [shippingAddress, setShippingAddress] = useState(user?.address || "");
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");

    const [isPending, setIsPending] = useState(false);

    // --- Calculations ---
    const productSubtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.product.pricePerUnit), 0);
    const deliveryTotal = cartItems.reduce((acc, item) => {
        if (item.product.deliveryChargeType === 'per_unit') {
            return acc + (item.quantity * (item.product.deliveryCharge || 0));
        }
        return acc + (item.product.deliveryCharge || 0);
    }, 0);

    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    const platformFee = Math.round(cartItems.reduce((acc, item) => acc + (item.product.pricePerUnit * item.quantity * platformRateFor(item.product.pricePerUnit)), 0));
    const total = productSubtotal + deliveryTotal + platformFee;

    // --- Handlers ---
    const handleRemove = async (itemId) => {
        if (isPending) return;
        setIsPending(true);
        toast.promise(removeItem(itemId), {
            loading: "Removing item...",
            success: () => {
                setIsPending(false);
                router.refresh();
                return "Item removed";
            },
            error: () => {
                setIsPending(false);
                return "Failed to remove";
            }
        });
    };

    const handleUpdateQty = async (item, change) => {
        if (isPending) return;
        const newQty = item.quantity + change;
        const minQty = item.product.minOrderQuantity || 1;
        
        if (newQty < minQty) {
            toast.error(`Minimum order for ${item.product.productName} is ${minQty} ${item.product.unit}`);
            return;
        }

        if (change > 0 && item.product.availableStock < change) {
            toast.error(`Only ${item.product.availableStock} more available.`);
            return;
        }

        setIsPending(true);
        toast.promise(updateQuantity(item.id, newQty), {
            loading: "Updating quantity...",
            success: () => {
                setIsPending(false);
                router.refresh();
                return "Quantity updated";
            },
            error: () => {
                setIsPending(false);
                return "Failed to update";
            }
        });
    };

    const handleCheckout = async () => {
        if (isPending) return;
        if (!shippingName || !shippingPhone || !shippingAddress) {
            toast.error("Please fill all shipping details");
            return;
        }

        setIsPending(true);
        const checkoutId = toast.loading("Processing your order...");

        try {
            const initRes = await initiateCheckout({
                name: shippingName,
                phone: shippingPhone,
                address: shippingAddress,
                lat: user?.lat,
                lng: user?.lng,
                paymentMethod
            });

            if (!initRes.success) {
                toast.error(initRes.error || "Failed to start checkout", { id: checkoutId });
                setIsPending(false);
                return;
            }

            if (initRes.data.resumed) {
                toast.success("Resuming previous checkout session...", { 
                    id: checkoutId,
                    icon: <RotateCcw className="h-4 w-4 text-emerald-500" />
                });
            }

            if (initRes.data.isCod) {
                toast.success("Order Placed successfully (COD)!", { id: checkoutId });
                fetchCart();
                router.push('/my-orders');
                return;
            }

            // Online Payment Flow
            const { orderId, razorpayOrderId, amount } = initRes.data;
            const sdkLoaded = await loadRazorpay();
            if (!sdkLoaded) {
                toast.error("Razorpay SDK failed to load", { id: checkoutId });
                setIsPending(false);
                return;
            }

            toast.dismiss(checkoutId);

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount,
                currency: "INR",
                name: "KrishiConnect",
                description: "Produce Purchase",
                order_id: razorpayOrderId,
                method: { upi: true, netbanking: true, card: true },
                handler: async function (response) {
                    toast.loading("Verifying payment...", { id: "verify" });
                    const confirmRes = await confirmOrderPayment({ 
                        orderId, 
                        razorpayPaymentId: response.razorpay_payment_id, 
                        razorpayOrderId: response.razorpay_order_id, 
                        signature: response.razorpay_signature 
                    });

                    if (confirmRes.success) {
                        toast.success("Payment Verified! Order Confirmed.", { id: "verify" });
                        fetchCart();
                        router.push('/my-orders');
                    } else {
                        toast.error(confirmRes.error || 'Verification failed', { id: "verify" });
                        setIsPending(false);
                    }
                },
                modal: {
                    ondismiss: function() {
                        setIsPending(false);
                    }
                },
                prefill: {
                    name: user?.fullName || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: { color: "#16a34a" }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) {
            toast.error("Something went wrong", { id: checkoutId });
            setIsPending(false);
        }
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
                                <div className="grow p-5 flex flex-col justify-between">
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
                                                {(() => {
                                                    const deliveryForThis = item.product.deliveryChargeType === 'per_unit' ? (item.quantity * (item.product.deliveryCharge || 0)) : (item.product.deliveryCharge || 0);
                                                    const lineTotal = (item.quantity * item.product.pricePerUnit) + deliveryForThis;
                                                    return (
                                                        <>
                                                            <p className="font-bold text-xl text-gray-900">₹ {lineTotal.toLocaleString('en-IN')}</p>
                                                            <p className="text-xs text-gray-500">₹{item.product.pricePerUnit} / {item.product.unit}</p>
                                                            <p className="text-xs text-gray-500">{item.product.deliveryCharge ? (item.product.deliveryChargeType === 'per_unit' ? `Delivery: ₹${item.product.deliveryCharge} / ${item.product.unit}` : `Delivery (flat): ₹${item.product.deliveryCharge}`) : "Free Delivery"}</p>
                                                        </>
                                                    )
                                                })()}
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
                                                disabled={item.quantity <= (item.product.minOrderQuantity || 1)}
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
            <div className="lg:col-span-4 space-y-6">
                {/* Shipping Info Card */}
                <Card className="border-gray-200 shadow-sm rounded-xl bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" /> Shipping Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Recipient Name</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 rounded-lg border bg-gray-50 focus:bg-white transition-all text-sm"
                                value={shippingName}
                                onChange={(e) => setShippingName(e.target.value)}
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Contact Number</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 rounded-lg border bg-gray-50 focus:bg-white transition-all text-sm"
                                value={shippingPhone}
                                onChange={(e) => setShippingPhone(e.target.value)}
                                placeholder="Phone Number"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Delivery Address</label>
                            <textarea
                                className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white transition-all text-sm resize-none h-24"
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                placeholder="Complete address with pincode"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method Card */}
                <Card className="border-gray-200 shadow-sm rounded-xl bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-green-600" /> Payment Method
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div
                            onClick={() => setPaymentMethod("ONLINE")}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                                    {paymentMethod === 'ONLINE' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Online Payment</p>
                                    <p className="text-[10px] text-gray-500">Pay securely via UPI, Card, or Netbanking</p>
                                </div>
                            </div>
                            <ShieldCheck className={`h-5 w-5 ${paymentMethod === 'ONLINE' ? 'text-green-600' : 'text-gray-300'}`} />
                        </div>

                        <div
                            onClick={() => setPaymentMethod("COD")}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                                    {paymentMethod === 'COD' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Cash on Delivery</p>
                                    <p className="text-[10px] text-gray-500">Pay when you receive the produce</p>
                                </div>
                            </div>
                            <Truck className={`h-5 w-5 ${paymentMethod === 'COD' ? 'text-green-600' : 'text-gray-300'}`} />
                        </div>

                        {!user?.lat && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 flex gap-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span>Important: Your profile is missing location coordinates. Hiring a delivery partner might fail. Please update your location in your profile.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="sticky top-24 space-y-6">
                    <Card className="border-gray-200 shadow-lg overflow-hidden rounded-xl bg-white">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 pt-6 px-6">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Products ({totalQuantity} items)</span>
                                <span className="font-medium text-gray-900">₹ {productSubtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Delivery</span>
                                <span className="font-medium text-gray-900">₹ {deliveryTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Platform Fee</span>
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
                                disabled={cartItems.length === 0}
                                className="w-full bg-gray-900 hover:bg-black text-white h-14 text-lg font-bold shadow-xl shadow-gray-200 rounded-xl transition-all hover:scale-[1.02]"
                            >
                                {paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Pay'} <Lock className="ml-2 h-4 w-4" />
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2">
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                                {paymentMethod === 'COD' ? 'Secure Order Processing' : 'Secure SSL Payment via Razorpay'}
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