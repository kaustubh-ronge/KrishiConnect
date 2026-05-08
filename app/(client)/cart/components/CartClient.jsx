"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { initiateCheckout, confirmOrderPayment, getUserPendingOrders, cancelPendingOrder } from '@/actions/orders';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,

    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Trash2, ShoppingBag, ArrowRight, IndianRupee, Minus, Plus,
    ArrowLeft, ShieldCheck, Lock, Truck, CheckCircle2,
    MapPin, RotateCcw, AlertCircle, X, CreditCard, Eye,
    Receipt, Package, Calendar, Clock,
    Sparkles, Navigation, Loader2
} from "lucide-react";


import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
    const [isMounted, setIsMounted] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState((initialCart?.items || []).map(it => it.id));

    const [pendingOrders, setPendingOrders] = useState([]);
    const [collisionOrder, setCollisionOrder] = useState(null);
    const [showCollisionModal, setShowCollisionModal] = useState(false);
    const [activeTab, setActiveTab] = useState("cart");
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);


    // Sync mounted state and fetch pending
    useEffect(() => {
        setIsMounted(true);
        fetchPending();
    }, []);

    useEffect(() => {
        console.log("[Cart] Client Component Mounted");
    }, []);

    const fetchPending = async () => {
        const res = await getUserPendingOrders();
        if (res.success) {
            setPendingOrders(res.data);
        }
    };

    // Use initial data for now (in production, sync with store state)
    const cartItems = initialCart?.items || [];
    const totalQuantity = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

    const [shippingName, setShippingName] = useState(user?.fullName || "");
    const [shippingPhone, setShippingPhone] = useState(user?.phone || "");
    const [shippingAddress, setShippingAddress] = useState(user?.address || "");
    const [lat, setLat] = useState(user?.lat || null);
    const [lng, setLng] = useState(user?.lng || null);
    const [isLocating, setIsLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");


    // --- Dynamic Calculations based on Selection ---
    const selectedItems = cartItems.filter(it => selectedItemIds.includes(it.id));

    const productSubtotal = selectedItems.reduce((acc, item) => {
        const price = item.product?.pricePerUnit || 0;
        return acc + (item.quantity * price);
    }, 0);

    const deliveryTotal = selectedItems.reduce((acc, item) => {
        if (!item.product) return acc;
        if (item.product.deliveryChargeType === 'per_unit') {
            return acc + (item.quantity * (item.product.deliveryCharge || 0));
        }
        return acc + (item.product.deliveryCharge || 0);
    }, 0);

    const platformRateFor = (price) => (price < 20 ? 0.01 : 0.02);
    const platformFee = Math.round(selectedItems.reduce((acc, item) => {
        const price = item.product?.pricePerUnit || 0;
        return acc + (price * item.quantity * platformRateFor(price));
    }, 0));
    const total = productSubtotal + deliveryTotal + platformFee;

    const toggleSelect = (itemId) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItemIds.length === cartItems.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(cartItems.map(it => it.id));
        }
    };

    // Prevent hydration errors by not rendering until mounted
    if (!isMounted) return <div className="min-h-screen bg-gray-50/50" />;

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

    const openPendingDetails = (order) => {
        setSelectedPendingOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const newLat = pos.coords.latitude;
                const newLng = pos.coords.longitude;
                setLat(newLat);
                setLng(newLng);

                try {
                    // Reverse geocoding using Nominatim (OpenStreetMap)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setShippingAddress(data.display_name);
                        toast.success("Location detected!");
                    }
                } catch (err) {
                    console.error("Reverse geocoding failed:", err);
                    toast.success("Location pinned (Address could not be fetched)");
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                toast.error("Could not get your location. Please check permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };


    const handleCheckout = async (resumeId = null, isFresh = false) => {
        if (isPending) return;
        if (!shippingName || !shippingPhone || !shippingAddress) {
            toast.error("Please fill all shipping details");
            return;
        }

        setIsPending(true);
        const checkoutId = toast.loading(isFresh ? "Creating fresh order..." : "Processing your order...");

        try {
            console.log("[Cart] Sending initiateCheckout with:", {
                addressData: {
                    name: shippingName,
                    phone: shippingPhone,
                    address: shippingAddress,
                    paymentMethod
                },
                selectedItemIds,
                forceFresh: isFresh,
                forceResumeId: resumeId
            });

            const initRes = await initiateCheckout({
                addressData: {
                    name: shippingName,
                    phone: shippingPhone,
                    address: shippingAddress,
                    lat: lat,
                    lng: lng,
                    paymentMethod
                },
                selectedItemIds,
                forceFresh: isFresh,
                forceResumeId: resumeId
            });

            console.log("[Cart] Server Raw Response:", initRes);

            console.log("[Cart] Checkout Response Parsed:", { 
                success: initRes?.success, 
                isCollision: initRes?.data?.isCollision, 
                resumeId, 
                isFresh 
            });

            if (!initRes.success) {
                toast.error(initRes.error || "Failed to start checkout", { id: checkoutId });
                setIsPending(false);
                return;
            }

            // --- Choice Logic ---
            const isCollision = !!initRes.data.isCollision;
            
            // We only show the modal if it's a collision AND we aren't already trying to resume it
            // CRITICAL: If resumeId is present, we NEVER show the modal, even if the server says collision.
            console.log("[Cart] Is Collision:", isCollision, "ResumeId:", resumeId);
            
            if (isCollision && !resumeId && !isFresh) {
                console.log("[Checkout] Collision detected - showing modal");
                toast.dismiss(checkoutId);
                setCollisionOrder(initRes.data);
                setShowCollisionModal(true);
                setIsPending(false);
                return;
            } else {
                console.log("[Checkout] Bypassing/Closing modal. Success Path.");
                setShowCollisionModal(false);
            }

            if ((initRes.data.resumed || resumeId) && !isFresh) {
                toast.success("Resuming payment session...", {
                    id: checkoutId,
                    icon: <RotateCcw className="h-4 w-4 text-emerald-500" />
                });
            } else if (isFresh) {
                toast.success("Fresh order created!", { id: checkoutId });
            }


            if (initRes.data.isCod) {
                toast.success("Order Placed successfully (COD)!", { id: checkoutId });
                fetchCart();
                fetchPending();
                router.push('/my-orders');
                return;
            }

            // Online Payment Flow
            const { orderId, razorpayOrderId, amount } = initRes.data;
            await processRazorpayPayment(orderId, razorpayOrderId, amount, checkoutId);
        } catch (err) {
            console.error("[Checkout] CRITICAL CLIENT ERROR:", err);
            toast.error(`Something went wrong: ${err.message || "Unknown error"}`, { id: checkoutId });
            setIsPending(false);
        }
    };

    const processRazorpayPayment = async (orderId, razorpayOrderId, amount, toastId) => {
        console.log("[Razorpay] Initiating payment with:", { orderId, razorpayOrderId, amount });
        
        if (!razorpayOrderId || !amount || !orderId) {
            console.error("[Razorpay] Missing data:", { orderId, razorpayOrderId, amount });
            toast.error("Invalid payment session. Please try again.", { id: toastId });
            setIsPending(false);
            return;
        }

        const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!rzpKey) {
            console.error("[Razorpay] NEXT_PUBLIC_RAZORPAY_KEY_ID is missing!");
            toast.error("Payment system configuration error", { id: toastId });
            setIsPending(false);
            return;
        }

        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded) {
            toast.error("Razorpay SDK failed to load", { id: toastId });
            setIsPending(false);
            return;
        }

        toast.dismiss(toastId);

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
                    fetchPending();
                    router.push('/my-orders');
                } else {
                    toast.error(confirmRes.error || 'Verification failed', { id: "verify" });
                    setIsPending(false);
                }
            },
            modal: {
                ondismiss: function () {
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
    };

    const handleCancelOrder = async (orderId) => {
        setIsPending(true);
        const res = await cancelPendingOrder(orderId);
        if (res.success) {
            toast.success(res.message);
            fetchPending();
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setIsPending(false);
    };

    const handleResumeOrder = async (order) => {
        if (!order) {
            console.error("[Cart] Attempted to resume null order");
            return;
        }
        
        const targetId = order.id || order.orderId;
        console.log("[Cart] Resuming order. Routing through handleCheckout. ID:", targetId);

        if (!targetId) {
            console.error("[Cart] Could not find ID in order object:", order);
            toast.error("Failed to identify order to resume");
            return;
        }

        setIsPending(true);
        setIsDetailsModalOpen(false);
        setShowCollisionModal(false); 
        
        // We always route through handleCheckout to get the latest server state
        // and ensure the Razorpay session is correctly initialized.
        setIsPending(false); 
        await handleCheckout(targetId);
    };

    // --- TABBED UI RENDER ---
    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="container mx-auto px-4 py-12 max-w-7xl">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
                        <div className="space-y-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none"
                            >
                                Krishi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Connect</span>
                            </motion.h1>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Logistics & Marketplace</p>
                        </div>

                        <TabsList className="bg-slate-200/50 backdrop-blur-md p-1.5 rounded-[2rem] h-16 border border-white/50 shadow-inner">
                            <TabsTrigger value="cart" className="rounded-[1.5rem] px-10 h-full data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-emerald-600 font-black uppercase text-[10px] tracking-widest transition-all duration-500">
                                <ShoppingBag className="h-4 w-4 mr-2" /> Shopping Cart
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-[1.5rem] px-10 h-full data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-amber-600 font-black uppercase text-[10px] tracking-widest transition-all duration-500 relative">
                                <Clock className="h-4 w-4 mr-2" /> Recoveries {pendingOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-[10px] font-black text-white shadow-lg ring-4 ring-slate-50">
                                        {pendingOrders.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="cart" className="m-0 focus-visible:ring-0">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag className="h-10 w-10 text-slate-300" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Your cart is empty</h2>
                                <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Looks like you haven't added anything to your cart yet.</p>
                                <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-900/10">
                                    <Link href="/marketplace">Explore Marketplace</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
                                {/* Left: Cart Items */}
                                <div className="xl:col-span-2 space-y-6">
                                    <AnimatePresence mode="popLayout">
                                        {cartItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-sm transition-all duration-300 ${!selectedItemIds.includes(item.id) ? 'opacity-40 grayscale-[0.5] scale-[0.98] border-dashed bg-slate-50/50' : 'hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItemIds.includes(item.id)}
                                                            onChange={() => toggleSelect(item.id)}
                                                            className="w-6 h-6 rounded-lg accent-emerald-600 cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                                                        {item.product?.images?.[0] ? (
                                                            <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="h-10 w-10" /></div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="text-xl font-black text-slate-900 truncate uppercase tracking-tight">{item.product?.productName || "Product"}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                                                                        {item.product?.sellerType === 'farmer' ? item.product?.farmer?.name : (item.product?.agent?.companyName || item.product?.agent?.name)}
                                                                    </Badge>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="text-slate-500 text-xs font-bold uppercase">{item.product?.category || "Category"}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemove(item.id)}
                                                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </div>

                                                        <div className="flex items-end justify-between mt-6">
                                                            <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100 shadow-inner">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                                                                    onClick={() => handleUpdateQty(item, -1)}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <span className="w-12 text-center font-black text-slate-900">{item.quantity}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm text-emerald-600"
                                                                    onClick={() => handleUpdateQty(item, 1)}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                                                                <p className="text-2xl font-black text-slate-900">₹{(item.quantity * (item.product?.pricePerUnit || 0)).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Right: Order Summary */}
                                <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden sticky top-8">
                                    <CardHeader className="p-10 pb-6 border-b border-slate-50">
                                        <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-10 space-y-8">
                                        {/* Shipping Info */}
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><MapPin className="h-4 w-4 text-emerald-600" /></div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shipping Details</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Receiver Name"
                                                    value={shippingName}
                                                    onChange={(e) => setShippingName(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Phone Number"
                                                    value={shippingPhone}
                                                    onChange={(e) => setShippingPhone(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none"
                                                />
                                                <div className="relative">
                                                    <textarea
                                                        placeholder="Full Address"
                                                        value={shippingAddress}
                                                        onChange={(e) => setShippingAddress(e.target.value)}
                                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold transition-all outline-none min-h-[120px] resize-none pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleUseCurrentLocation}
                                                        disabled={isLocating}
                                                        className="absolute right-3 top-3 h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-100 hover:border-emerald-200 text-emerald-600 shadow-sm"
                                                        title="Use Current Location"
                                                    >
                                                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Methods */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center"><CreditCard className="h-4 w-4 text-indigo-600" /></div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Strategy</h4>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <div
                                                    onClick={() => setPaymentMethod("ONLINE")}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${paymentMethod === 'ONLINE' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'ONLINE' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                                                <ShieldCheck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Pay Online</p>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure & Instant</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'}`}>
                                                            {paymentMethod === 'ONLINE' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </div>
                                                    {paymentMethod === 'ONLINE' && <motion.div layoutId="pay-glow" className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-transparent" />}
                                                </div>

                                                <div
                                                    onClick={() => setPaymentMethod("COD")}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${paymentMethod === 'COD' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === 'COD' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                                                                <Truck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Cash on Delivery</p>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pay at your doorstep</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                                            {paymentMethod === 'COD' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-4">
                                            <div className="flex justify-between text-slate-500 font-bold text-sm">
                                                <span className="uppercase tracking-widest text-[10px]">Product Subtotal</span>
                                                <span className="text-slate-900 font-black">₹{productSubtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 font-bold text-sm">
                                                <span className="uppercase tracking-widest text-[10px]">Delivery Logistics</span>
                                                <span className="text-slate-900 font-black">₹{deliveryTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 font-bold text-sm">
                                                <span className="uppercase tracking-widest text-[10px]">Platform Protocol</span>
                                                <span className="text-slate-900 font-black">₹{platformFee.toLocaleString()}</span>
                                            </div>

                                            <div className="pt-6 border-t-2 border-dashed border-slate-100">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Total Payable</p>
                                                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter">₹{total.toLocaleString()}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className="bg-slate-900 text-[10px] font-black tracking-widest uppercase py-1 px-3">
                                                            {selectedItemIds.length} Items
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-10 pt-0">
                                        <Button
                                            onClick={() => handleCheckout()}
                                            disabled={isPending || selectedItemIds.length === 0}
                                            className={`w-full rounded-[2rem] h-20 text-lg font-black uppercase tracking-widest transition-all shadow-2xl group relative overflow-hidden ${paymentMethod === 'COD' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                                        >
                                            {isPending ? (
                                                <span className="flex items-center justify-center gap-3 relative z-10 text-white">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-3 relative z-10 text-white">
                                                    {paymentMethod === 'COD' ? 'Confirm Order' : 'Initialize Payment'}
                                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                                </span>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="m-0 focus-visible:ring-0">
                        {pendingOrders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-10 w-10 text-slate-300" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">No Pending Orders</h2>
                                <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">All your orders are either paid or you haven't started any yet.</p>
                                <Button asChild variant="outline" className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs transition-all border-slate-200" onClick={() => setActiveTab('cart')}>
                                    Return to Cart
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <AnimatePresence>
                                    {pendingOrders.map(order => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden hover:shadow-2xl transition-all group">
                                                <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pending Payment</p>
                                                        <h3 className="text-lg font-black tracking-tight">ORD #{order.id.slice(-6).toUpperCase()}</h3>
                                                    </div>
                                                    <Clock className="h-6 w-6 opacity-40 group-hover:rotate-12 transition-transform" />
                                                </div>
                                                <CardContent className="p-8">
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
                                                                <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{(order?.totalAmount || 0).toLocaleString('en-IN')}</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Variety</p>
                                                                <p className="text-lg font-black text-slate-900">{(order?.items?.length || 0)} {(order?.items?.length === 1 ? 'Item' : 'Items')}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Items Preview</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {order?.items?.slice(0, 3).map((it, idx) => (
                                                                    <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-100 text-slate-600 font-bold py-1">
                                                                        {it?.product?.productName || "Product"}
                                                                    </Badge>
                                                                ))}
                                                                {(order?.items?.length || 0) > 3 && (
                                                                    <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-400 font-bold">
                                                                        +{(order?.items?.length || 0) - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="px-8 pb-8 pt-0 grid grid-cols-2 gap-3">
                                                    <Button
                                                        onClick={() => handleResumeOrder(order)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-14 uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/10 transition-all"
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-2" /> Resume
                                                    </Button>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => openPendingDetails(order)}
                                                            className="flex-1 rounded-2xl h-14 border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="flex-1 rounded-2xl h-14 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Pending Order Details Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 border-0 bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-10 text-white relative overflow-hidden shrink-0">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
                            <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white font-black px-4 py-2 rounded-full mb-4 uppercase tracking-widest text-[10px]">
                                ORD #{selectedPendingOrder?.id.slice(-8).toUpperCase()}
                            </Badge>
                            <DialogTitle className="text-4xl font-black tracking-tight uppercase">Order Details</DialogTitle>
                            <p className="text-amber-50 font-bold mt-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Initiated on {selectedPendingOrder ? new Date(selectedPendingOrder.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                            </p>
                        </motion.div>
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Receipt className="h-40 w-40 rotate-12" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {selectedPendingOrder && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-slate-50 rounded-[2rem] border-2 border-slate-100 p-8 shadow-inner">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-500" /> Shipping Destination
                                        </h4>
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{selectedPendingOrder.shippingName || "Buyer"}</p>
                                            <p className="font-bold text-slate-500 leading-relaxed">
                                                {selectedPendingOrder.shippingAddress}
                                            </p>
                                            <p className="text-emerald-600 font-black mt-2 flex items-center gap-2">
                                                <RotateCcw className="h-4 w-4" /> {selectedPendingOrder.shippingPhone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                        <div className="relative z-10">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-emerald-400" /> Total Payment
                                            </h4>
                                            <p className="text-5xl font-black tracking-tighter">₹{selectedPendingOrder.totalAmount.toLocaleString('en-IN')}</p>
                                        </div>
                                        <Badge className="bg-amber-500 text-white border-0 font-black uppercase text-[10px] self-start mt-6 px-4 py-1.5">Awaiting Checkout</Badge>
                                        <div className="absolute -right-4 -bottom-4 opacity-10">
                                            <Sparkles className="h-32 w-32" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShoppingBag className="h-4 w-4 text-amber-500" /> Items in this Order
                                    </h4>
                                    <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 divide-y divide-slate-50 shadow-sm overflow-hidden">
                                        {selectedPendingOrder?.items?.map((item) => (
                                            <div key={item.id} className="flex items-center gap-6 p-6 hover:bg-slate-50/50 transition-colors">
                                                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 relative">
                                                    {item.product?.images?.[0] ? (
                                                        <Image src={item.product.images[0]} alt={item.product.productName || "Product"} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100"><Package className="h-8 w-8 text-slate-300" /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-black text-slate-900 text-lg uppercase tracking-tight truncate">{item.product?.productName || "Product"}</h5>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-black text-[10px] uppercase">
                                                            {item.quantity} {item.product?.unit || "Units"}
                                                        </Badge>
                                                        <span className="text-slate-300 font-bold">×</span>
                                                        <span className="text-slate-500 font-black">₹{(item.priceAtPurchase || item.product?.pricePerUnit || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-slate-900">₹{(item.quantity * (item.priceAtPurchase || item.product?.pricePerUnit || 0)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                        <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)} className="flex-1 rounded-2xl h-16 font-black text-slate-500 hover:bg-white hover:text-slate-900 uppercase tracking-widest text-[10px] transition-all">Close</Button>
                                        <Button
                                            disabled={isPending}
                                            onClick={() => handleResumeOrder(selectedPendingOrder)}
                                            className="flex-[2] rounded-[1.5rem] h-16 font-black bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                                        >
                                            {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CreditCard className="h-5 w-5 mr-3" />}
                                            Complete Payment Now
                                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- COLLISION MODAL --- */}
            <AlertDialog open={showCollisionModal} onOpenChange={setShowCollisionModal}>
                <AlertDialogContent className="rounded-2xl border-amber-200">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <RotateCcw className="h-6 w-6 text-amber-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold">Pending Payment Found</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            You already have a pending order for these exact items and quantities.
                            Would you like to resume that payment or start a completely fresh order?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel
                            onClick={async () => {
                                if (collisionOrder) {
                                    await handleCancelOrder(collisionOrder.id);
                                    handleCheckout(null, true); // Force fresh!
                                }
                            }}
                            className="rounded-xl border-gray-300"
                        >
                            Start Fresh (Cancels Old)
                        </AlertDialogCancel>
                        <Button
                            disabled={isPending}
                            onClick={() => {
                                console.log("[Cart] Resume Button Clicked in Modal");
                                if (collisionOrder) {
                                    handleResumeOrder(collisionOrder);
                                } else {
                                    console.error("[Cart] No collisionOrder found in state!");
                                }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/10 px-6"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Resume Payment
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}