"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { initiateCheckout, confirmOrderPayment, getUserPendingOrders, cancelPendingOrder, calculateDynamicDeliveryFee } from '@/actions/orders';
import { createSpecialDeliveryRequest, getUserSpecialDeliveryRequests } from '@/actions/special-delivery';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,

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
    Sparkles, Navigation, Loader2,
    ShieldAlert, MessageCircle, MessageSquare, Ban
} from "lucide-react";


import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import InquiryModal from "@/app/(client)/marketplace/_components/InquiryModal";

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

const CountdownTimer = ({ expiryDate, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft("Expired");
                if (onExpire) onExpire();
                return;
            }

            const mins = Math.floor(diff / 1000 / 60);
            const secs = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryDate, onExpire]);

    return <span>{timeLeft}</span>;
};

export default function CartClient({ initialCart, user, initialUnserviceableIds = [], initialSpecialRequests = [] }) {
    const router = useRouter();
    const { cartItems: storeCartItems, removeItem, updateQuantity, fetchCart } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(
        (initialCart?.items || [])
            .filter(it => {
                const isUnserviceable = initialUnserviceableIds.includes(it.id);
                const isApproved = initialSpecialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
                return !(isUnserviceable && !isApproved);
            })
            .map(it => it.id)
    );

    useEffect(() => {
        // Sync server-side cart data to store on mount
        if (initialCart?.items) {
            useCartStore.setState({
                cartItems: initialCart.items,
                cartCount: initialCart.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
            });
        }
        fetchCart();
    }, []);

    const [pendingOrders, setPendingOrders] = useState([]);
    const [collisionOrder, setCollisionOrder] = useState(null);
    const [showCollisionModal, setShowCollisionModal] = useState(false);
    const [activeTab, setActiveTab] = useState("cart");
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isSpecialApprovalModalOpen, setIsSpecialApprovalModalOpen] = useState(false);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [inquiryProduct, setInquiryProduct] = useState(null);
    const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
    const [initialGraceLoading, setInitialGraceLoading] = useState(true);
    const [isInquiryForSpecialDelivery, setIsInquiryForSpecialDelivery] = useState(false);
    const [specialDeliveryQuantity, setSpecialDeliveryQuantity] = useState("");
    const [specialDeliverySellerId, setSpecialDeliverySellerId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialGraceLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);
    const [currentPage, setCurrentPage] = useState(1);
    const [specialRequests, setSpecialRequests] = useState(initialSpecialRequests);
    const ordersPerPage = 3;


    // Sync mounted state and fetch pending
    useEffect(() => {
        setIsMounted(true);
        fetchPending();
    }, []);

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPending();
        }
    }, [activeTab]);

    const fetchPending = async () => {
        const res = await getUserPendingOrders();
        if (res.success) {
            setPendingOrders(res.data);
        }
        const reqRes = await getUserSpecialDeliveryRequests();
        if (reqRes.success) {
            setSpecialRequests(reqRes.data);
        }
    };

    // Use store items if available, fallback to initial prop
    const cartItems = storeCartItems.length > 0 ? storeCartItems : (initialCart?.items || []);
    const totalQuantity = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

    const [shippingName, setShippingName] = useState(user?.fullName || "");
    const [shippingPhone, setShippingPhone] = useState(user?.phone || "");
    const [shippingAddress, setShippingAddress] = useState(user?.address || "");
    const [lat, setLat] = useState(user?.lat || null);
    const [lng, setLng] = useState(user?.lng || null);
    const [isLocating, setIsLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("ONLINE");


    // --- Dynamic Calculations based on Selection ---
    const selectedPending = pendingOrders.filter(o => selectedItemIds.includes(o.id));
    const pendingProductIds = new Set(selectedPending.flatMap(o => o.items.map(it => it.productId)));

    // Active items: Only count those NOT already covered by a selected pending order
    const selectedActiveItems = cartItems.filter(it =>
        selectedItemIds.includes(it.id) && !pendingProductIds.has(it.productId)
    );

    const activeSubtotal = selectedActiveItems.reduce((acc, item) => {
        const price = item.product?.pricePerUnit || 0;
        return acc + (item.quantity * price);
    }, 0);

    const pendingItemsSubtotal = selectedPending.reduce((acc, order) => {
        return acc + order.items.reduce((sum, it) => sum + (it.quantity * (it.priceAtPurchase || 0)), 0);
    }, 0);

    const productSubtotal = activeSubtotal + pendingItemsSubtotal;

    const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);
    const [isCalculatingFee, setIsCalculatingFee] = useState(false);
    const [unserviceableIds, setUnserviceableIds] = useState(initialUnserviceableIds);

    // 1. Fetch dynamic fee for SELECTED items ONLY
    useEffect(() => {
        const updateSelectionFee = async () => {
            if (lat && lng && selectedItemIds.length > 0) {
                setIsCalculatingFee(true);
                const res = await calculateDynamicDeliveryFee(selectedItemIds, lat, lng);
                if (res.success) {
                    setDynamicDeliveryFee(res.fee || 0);
                }
                setIsCalculatingFee(false);
            } else {
                setDynamicDeliveryFee(0);
            }
        };
        updateSelectionFee();
    }, [selectedItemIds, lat, lng]);

    // 2. Identify ALL unserviceable items in the cart for grayscaling
    // This ONLY runs when the cart items or location change
    useEffect(() => {
        const updateUnserviceableList = async () => {
            if (lat && lng && cartItems.length > 0) {
                const allItemIds = cartItems.map(it => it.id);
                const resAll = await calculateDynamicDeliveryFee(allItemIds, lat, lng);
                if (resAll.success) {
                    setUnserviceableIds(resAll.unserviceableIds || []);
                }
            }
        };
        updateUnserviceableList();
    }, [cartItems.length, lat, lng]);

    // 2.1 Auto-deselect unserviceable items that are not approved
    useEffect(() => {
        if (unserviceableIds.length > 0) {
            setSelectedItemIds(prev => prev.filter(id => {
                const item = cartItems.find(it => it.id === id);
                if (!item) return true;
                const isUnserviceable = unserviceableIds.includes(item.id);
                const isApproved = specialRequests.some(r => r.productId === item.product.id && r.status === 'APPROVED');
                return !(isUnserviceable && !isApproved);
            }));
        }
    }, [unserviceableIds, specialRequests]);

    // Derived state: Categorize items for UI
    const rejectedItems = cartItems.filter(it =>
        specialRequests.some(r => r.productId === it.product.id && r.status === 'REJECTED')
    );
    const approvedItems = cartItems.filter(it =>
        specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED')
    );

    // Items that are out of range but NOT approved
    const unserviceableWaitlist = cartItems.filter(it =>
        unserviceableIds.includes(it.id) &&
        !specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED')
    );

    // Derived state: Is any SELECTED item currently blocking checkout?
    // We only care about selected items that are unserviceable AND not approved
    const selectedUnserviceableItems = cartItems.filter(it =>
        selectedItemIds.includes(it.id) &&
        unserviceableIds.includes(it.id) &&
        !specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED')
    );

    const isOutOfRange = selectedUnserviceableItems.length > 0;

    // We don't want hasRejectedRequest to refer to SELECTED items, but ANY items in cart
    // to show the "Rejected" warning section
    const hasRejectedInCart = rejectedItems.length > 0;

    // effectiveIsOutOfRange means "Checkout is blocked because of selection"
    const effectiveIsOutOfRange = isOutOfRange;

    // Final calculations
    const activeDeliveryTotal = selectedActiveItems.reduce((acc, item) => {
        if (!item.product) return acc;
        if (item.product.deliveryChargeType === 'per_unit') {
            return acc + (item.quantity * (item.product.deliveryCharge || 0));
        }
        return acc + (item.product.deliveryCharge || 0);
    }, 0);

    const pendingDeliveryTotal = selectedPending.reduce((acc, order) => acc + (order.deliveryFee || 0), 0);

    const deliveryTotal = (lat && lng) ? dynamicDeliveryFee : (activeDeliveryTotal + pendingDeliveryTotal);

    const isOnline = paymentMethod === "ONLINE";
    let platformFee = 0;
    if (productSubtotal > 100) {
        const rate = isOnline ? 0.03 : 0.015;
        platformFee = Math.round(productSubtotal * rate);
    }
    const total = productSubtotal + deliveryTotal + platformFee;

    const toggleSelect = (id) => {
        setSelectedItemIds(prev => {
            const isCurrentlySelected = prev.includes(id);
            const item = cartItems.find(it => it.id === id);
            const isRejected = specialRequests.some(r => r.productId === item?.product?.id && r.status === 'REJECTED');
            const isApproved = specialRequests.some(r => r.productId === item?.product?.id && r.status === 'APPROVED');

            if (!isCurrentlySelected) {
                if (isRejected) {
                    toast.error("This item was rejected by admin. It will be removed soon.", {
                        icon: <Ban className="h-4 w-4 text-rose-500" />
                    });
                    return prev;
                }

                const isUnserviceable = unserviceableIds.includes(id);
                if (isUnserviceable && !isApproved) {
                    toast.error("This item is out of range. Request mediation or deselect it.", {
                        icon: <ShieldAlert className="h-4 w-4 text-amber-500" />
                    });
                    return prev;
                }
            }

            let newSelection = isCurrentlySelected
                ? prev.filter(prevId => prevId !== id)
                : [...prev, id];

            // If this ID is a pending order, also try to toggle its cart items for collision detection
            const order = pendingOrders.find(o => o.id === id);
            if (order) {
                const cartItemIdsInOrder = order.items
                    .map(it => cartItems.find(ci => ci.productId === it.productId)?.id)
                    .filter(Boolean);

                if (isCurrentlySelected) {
                    // Deselect associated cart items too
                    newSelection = newSelection.filter(prevId => !cartItemIdsInOrder.includes(prevId));
                } else {
                    // Select associated cart items too
                    newSelection = [...new Set([...newSelection, ...cartItemIdsInOrder])];
                }
            }

            return newSelection;
        });
    };

    const toggleSelectAll = () => {
        const selectableItems = cartItems.filter(it => {
            const isRejected = specialRequests.some(r => r.productId === it.product.id && r.status === 'REJECTED');
            const isUnserviceable = unserviceableIds.includes(it.id);
            const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');

            // Allow selecting if NOT rejected AND NOT unserviceable (unless approved)
            return !isRejected && !(isUnserviceable && !isApproved);
        });

        if (selectedItemIds.length === selectableItems.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(selectableItems.map(it => it.id));
        }
    };

    // Prevent hydration errors and "flash" of enabled items
    if (!isMounted || initialGraceLoading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 rounded-[2.5rem] border-4 border-emerald-100 border-t-emerald-600 shadow-2xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                        <ShoppingBag className="h-8 w-8 animate-bounce" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Analyzing Marketplace Logistics</h2>
                <p className="text-slate-500 font-bold max-w-xs leading-relaxed">Please wait while we verify delivery ranges for all items in your cart...</p>
                <div className="mt-8 flex gap-2">
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-2 h-2 rounded-full bg-emerald-500"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // --- Handlers ---
    const handleRemove = async (itemId) => {
        // No more isPending lock for removal, trust optimistic store
        try {
            await removeItem(itemId);
        } catch (err) {
            // Silently fail or use a generic toast if needed, but avoid logging sensitive err objects to browser
        }
    };

    const handleUpdateQty = async (item, change) => {
        // --- QUANTITY LOCK FOR SPECIAL DELIVERY ---
        const activeApproval = specialRequests?.find(r => r.productId === item.productId && r.status === 'APPROVED' && !r.isConsumed);
        if (activeApproval) {
            toast.error("Quantity is locked for approved special delivery.", {
                description: `This product is locked at ${activeApproval.quantity} ${activeApproval.unit || item.product.unit} as per mediation.`
            });
            return;
        }

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

        // Call store update - it's already optimistic and handles errors internally
        updateQuantity(item.id, newQty);
    };

    const handleRequestForSingleItem = (item) => {
        const sellerId = item.product.farmerId || item.product.agentId;
        if (!sellerId) {
            toast.error("Seller information missing. Please refresh and try again.");
            return;
        }

        setInquiryProduct(item.product);
        setIsInquiryForSpecialDelivery(true);
        setSpecialDeliveryQuantity(item.quantity);
        setSpecialDeliverySellerId(sellerId);
        setIsInquiryOpen(true);
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
                    toast.success("Location pinned (Address could not be fetched)");
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                toast.error("Could not get your location. Please check permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };


    const handleCheckout = async (resumeId = null, isFresh = false) => {
        if (isPending) return;

        // If no explicit resumeId is passed, check if we have a selected pending order
        let effectiveResumeId = resumeId;
        if (!effectiveResumeId && selectedItemIds.length > 0) {
            // Check if any selected ID belongs to a pending order
            const selectedPending = pendingOrders.find(o => selectedItemIds.includes(o.id));
            if (selectedPending) {
                effectiveResumeId = selectedPending.id;
            }
        }

        if (!shippingName || !shippingPhone || !shippingAddress) {
            toast.error("Please fill in all shipping details.");
            return;
        }

        if (isOutOfRange) {
            toast.error("Please deselect out-of-range items to proceed.");
            return;
        }

        // Standard Order Flow
        setIsPending(true);
        const checkoutId = toast.loading(isFresh ? "Creating fresh order..." : "Processing your order...");

        try {

            const initRes = await initiateCheckout({
                addressData: {
                    name: shippingName,
                    phone: shippingPhone,
                    address: shippingAddress,
                    lat: lat,
                    lng: lng,
                    paymentMethod
                },
                selectedItemIds: selectedItemIds,
                forceFresh: isFresh,
                // Only pass forceResumeId if it was explicitly passed (from the resume button in modal)
                forceResumeId: resumeId
            });

            if (!initRes.success) {
                toast.error(initRes.error || "Failed to start checkout", { id: checkoutId });
                setIsPending(false);
                return;
            }

            // --- Choice Logic ---
            const isCollision = !!initRes.data.isCollision;

            if (isCollision && !resumeId && !isFresh) {
                toast.dismiss(checkoutId);
                setCollisionOrder(initRes.data);
                setShowCollisionModal(true);
                setIsPending(false);
                return;
            } else {
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


            if (initRes.data.isSpecialDelivery) {
                toast.success("Approval Requested!", {
                    id: checkoutId,
                    description: "Order is out of range. Admin will approve after logistics negotiation.",
                    icon: <ShieldCheck className="h-5 w-5 text-amber-500" />
                });
                // We DON'T redirect or remove from cart for special delivery anymore.
                // fetchCart(); // Keep in cart
                fetchPending(); // This fetches the pending orders (but we filter them out in UI)
                setIsPending(false);
                return;
            }

            if (initRes.data.isCod) {
                toast.success("Order Placed successfully (COD)!", { id: checkoutId });
                // Explicitly clear the store items to prevent persistence issues
                selectedItemIds.forEach(id => useCartStore.getState().removeItem(id));
                fetchCart();
                fetchPending();
                router.push('/my-orders');
                return;
            }

            // Online Payment Flow
            const { orderId, razorpayOrderId, amount } = initRes.data;
            await processRazorpayPayment(orderId, razorpayOrderId, amount, checkoutId);
        } catch (err) {
            toast.error(`Something went wrong: ${err.message || "Unknown error"}`, { id: checkoutId });
            setIsPending(false);
        }
    };

    const processRazorpayPayment = async (orderId, razorpayOrderId, amount, toastId) => {

        if (!razorpayOrderId || !amount || !orderId) {
            toast.error("Invalid payment session. Please try again.", { id: toastId });
            setIsPending(false);
            return;
        }

        const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!rzpKey) {
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
            return;
        }

        const targetId = order.id || order.orderId;

        if (!targetId) {
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

                    <TabsContent value="pending" className="m-0 focus-visible:ring-0">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Recoveries</h2>
                                    <p className="text-sm font-medium text-slate-500">Resume your unfinished checkouts from here.</p>
                                </div>
                            </div>

                            {pendingOrders.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Clock className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">No pending orders</h2>
                                    <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">All your orders are either paid or you haven't started any yet.</p>
                                    <Button asChild variant="outline" className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs transition-all border-slate-200 shadow-sm hover:shadow-md" onClick={() => setActiveTab('cart')}>
                                        Return to Cart
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid gap-8">
                                        {pendingOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage).map((order) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group"
                                            >
                                                <div className="p-8">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-500 ${order.isSpecialDelivery ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                                                                {order.isSpecialDelivery ? <ShieldAlert className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                                                        {order.isSpecialDelivery ? 'Special Delivery' : 'Recovery Order'}
                                                                    </h3>
                                                                    <Badge className={`${order.isSpecialDelivery ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'} border-0 font-bold px-3`}>
                                                                        {order.adminApprovalStatus === 'PENDING' ? 'Awaiting Approval' : 'Ready to Pay'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">ID: #{order.id.slice(-8).toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-left md:text-right">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount.toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 mb-8">
                                                        {(() => {
                                                            // Merge duplicate products in the same order for cleaner display
                                                            const mergedItems = order.items.reduce((acc, item) => {
                                                                const existing = acc.find(i => i.productId === item.productId);
                                                                if (existing) {
                                                                    existing.quantity += item.quantity;
                                                                    return acc;
                                                                }
                                                                return [...acc, { ...item }];
                                                            }, []);

                                                            return mergedItems.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0">
                                                                        {item.product?.images?.[0] ? (
                                                                            <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="h-6 w-6" /></div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-black text-slate-900 uppercase text-sm truncate">{item.product?.productName}</h4>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-xs font-bold text-slate-500 uppercase">{item.quantity} {item.product?.unit}</span>
                                                                            <span className="text-slate-300 text-[10px]">•</span>
                                                                            <span className="text-xs font-bold text-emerald-600 uppercase">₹{item.priceAtPurchase}/unit</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        {order.adminApprovalStatus === 'PENDING' && order.isSpecialDelivery ? (
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 md:flex-none rounded-2xl h-14 px-8 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-black uppercase tracking-widest text-xs gap-3"
                                                                onClick={() => {
                                                                    setInquiryProduct(order.items[0]?.product);
                                                                    setIsInquiryOpen(true);
                                                                }}
                                                            >
                                                                <MessageCircle className="h-5 w-5" /> Chat with Admin
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                className="flex-1 md:flex-none rounded-2xl h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-slate-900/10"
                                                                onClick={() => handleResumeOrder(order)}
                                                            >
                                                                <RotateCcw className="h-5 w-5" /> Resume Order
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 md:flex-none rounded-2xl h-14 px-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-xs gap-3"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" /> Cancel Order
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 md:flex-none rounded-2xl h-14 px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-black uppercase tracking-widest text-xs gap-3"
                                                            onClick={() => openPendingDetails(order)}
                                                        >
                                                            <Eye className="h-5 w-5" /> View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {pendingOrders.length > ordersPerPage && (
                                        <div className="flex justify-center items-center gap-4 py-8">
                                            <Button
                                                variant="outline"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                className="rounded-xl h-12 w-12 p-0 border-slate-200"
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs">
                                                Page {currentPage} of {Math.ceil(pendingOrders.length / ordersPerPage)}
                                            </span>
                                            <Button
                                                variant="outline"
                                                disabled={currentPage === Math.ceil(pendingOrders.length / ordersPerPage)}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="rounded-xl h-12 w-12 p-0 border-slate-200"
                                            >
                                                <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

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
                                <div className="xl:col-span-2 space-y-10">
                                    {/* --- ACTIVE & SERVICEABLE ITEMS --- */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 px-4">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"><ShoppingBag className="h-5 w-5" /></div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Your Items</h3>
                                        </div>
                                        <AnimatePresence mode="popLayout">
                                            {cartItems.map((item) => {
                                                const isUnserviceable = unserviceableIds.includes(item.id);
                                                const activeRequest = specialRequests.find(r => r.productId === item.productId);
                                                const isRejected = activeRequest?.status === 'REJECTED';
                                                const isApproved = activeRequest?.status === 'APPROVED';
                                                const isPendingReq = activeRequest?.status === 'PENDING';

                                                if (isRejected) return null;

                                                const isDisabled = isUnserviceable && !isApproved;

                                                return (
                                                    <motion.div
                                                        key={item.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        onClick={() => toggleSelect(item.id)}
                                                        className={`p-6 bg-white border rounded-[2rem] shadow-sm transition-all duration-300 relative overflow-hidden ${isDisabled ? 'grayscale-[0.8] opacity-70 border-amber-100 bg-amber-50/10 cursor-pointer' : selectedItemIds.includes(item.id) ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50/30 shadow-xl scale-[1.01]' : 'border-slate-100 hover:border-slate-200 hover:shadow-md cursor-pointer'}`}
                                                    >
                                                        {selectedItemIds.includes(item.id) && (
                                                            <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center">
                                                                <div className="bg-emerald-500 text-white p-1 rounded-bl-2xl shadow-lg">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isApproved && (
                                                            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm"><Truck className="h-4 w-4 text-emerald-600" /></div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Special Delivery Approved</p>
                                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Extra Logistics Fee: ₹{activeRequest.negotiatedFee}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge className="bg-emerald-600 text-white border-0 text-[8px] font-black uppercase">READY</Badge>
                                                                    <button 
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            const { deleteSpecialDeliveryRequest } = await import('@/actions/special-delivery');
                                                                            const res = await deleteSpecialDeliveryRequest(activeRequest.id);
                                                                            if (res.success) toast.success("Mediation cleared. Quantity unlocked.");
                                                                        }}
                                                                        className="text-[8px] font-black text-rose-500 uppercase hover:underline"
                                                                    >
                                                                        Cancel & Re-request
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isPendingReq && (
                                                            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm"><Clock className="h-4 w-4 text-indigo-600" /></div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800">Mediation in Progress</p>
                                                                        <p className="text-[9px] font-bold text-indigo-500 uppercase">Admin reviewing your distance request...</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge className="bg-indigo-600 text-white border-0 text-[8px] font-black uppercase">PENDING</Badge>
                                                                    <button 
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            const { deleteSpecialDeliveryRequest } = await import('@/actions/special-delivery');
                                                                            const res = await deleteSpecialDeliveryRequest(activeRequest.id);
                                                                            if (res.success) toast.success("Mediation cancelled. You can now change quantity and re-request.");
                                                                        }}
                                                                        className="text-[8px] font-black text-rose-500 uppercase hover:underline"
                                                                    >
                                                                        Cancel Request
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isUnserviceable && !activeRequest && (
                                                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm"><ShieldAlert className="h-4 w-4 text-amber-600" /></div>
                                                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-tight">Out of Delivery Range</p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={isPending}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRequestForSingleItem(item);
                                                                    }}
                                                                    className="h-9 rounded-xl bg-amber-600 border-amber-600 text-white hover:bg-amber-700 font-black text-[9px] uppercase gap-2 px-4 shadow-lg shadow-amber-600/20"
                                                                >
                                                                    <MessageSquare className="h-3.5 w-3.5" /> Request Mediation
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={isDisabled}
                                                                    checked={selectedItemIds.includes(item.id)}
                                                                    onChange={() => toggleSelect(item.id)}
                                                                    className={`w-6 h-6 rounded-lg accent-emerald-600 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                                />
                                                            </div>

                                                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
                                                                {item.product?.images?.[0] ? (
                                                                    <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><Package className="h-10 w-10" /></div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="text-xl font-black text-slate-900 truncate uppercase tracking-tight leading-none mb-1">{item.product?.productName || "Product"}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-tighter">
                                                                                {item.product?.sellerType === 'farmer' ? '👨‍🌾 Farmer' : '🏢 Agent'}
                                                                            </span>
                                                                            <span className="text-slate-300 font-bold">•</span>
                                                                            <span className="text-slate-400 text-[10px] font-bold uppercase">{item.product?.category || "Category"}</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                                                        className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                </div>

                                                                <div className="flex items-end justify-between mt-6">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Quantity ({item.product?.unit || 'Units'})</p>
                                                                        <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                                            <Button variant="ghost" size="icon" disabled={isApproved} className="h-9 w-9 rounded-none hover:bg-slate-50 border-r border-slate-50" onClick={() => handleUpdateQty(item, -1)}><Minus className="h-3 w-3" /></Button>
                                                                            <span className="w-10 text-center font-black text-slate-900 text-sm">{item.quantity}</span>
                                                                            <Button variant="ghost" size="icon" disabled={isApproved} className="h-9 w-9 rounded-none hover:bg-slate-50 border-l border-slate-50 text-emerald-600" onClick={() => handleUpdateQty(item, 1)}><Plus className="h-3 w-3" /></Button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xl font-black text-slate-900 tracking-tighter">₹{(item.quantity * (item.product?.pricePerUnit || 0)).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {/* --- REJECTED / BLOCKED ITEMS --- */}
                                    {hasRejectedInCart && (
                                        <div className="space-y-6 pt-10 border-t-2 border-slate-100 border-dashed">
                                            <div className="flex items-center justify-between px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm"><Ban className="h-5 w-5" /></div>
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Rejected Logistics</h3>
                                                </div>
                                                <Badge variant="outline" className="border-rose-200 text-rose-600 font-black text-[9px] uppercase animate-pulse bg-rose-50 px-3 py-1">Auto-Removal Active</Badge>
                                            </div>

                                            <AnimatePresence mode="popLayout">
                                                {cartItems.filter(it => specialRequests.some(r => r.productId === it.productId && r.status === 'REJECTED')).map((item) => {
                                                    const request = specialRequests.find(r => r.productId === item.productId);
                                                    const rejectedAt = new Date(request?.rejectedAt || Date.now());
                                                    const removalTime = new Date(rejectedAt.getTime() + 60 * 60 * 1000);

                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="p-6 bg-white border-2 border-rose-100 rounded-[2rem] shadow-sm relative overflow-hidden group"
                                                        >
                                                            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0"><ShieldAlert className="h-4 w-4 text-rose-600" /></div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-800">Admin Declined Logistics Request</p>
                                                                            <p className="text-[11px] font-medium text-rose-600 leading-tight italic">"{request?.adminNotes || 'Request does not meet delivery criteria.'}"</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Clearing In</p>
                                                                        <div className="px-3 py-1 bg-white rounded-lg border border-rose-100 font-black text-[10px] text-rose-700 shadow-sm">
                                                                            <CountdownTimer expiryDate={removalTime} onExpire={() => router.refresh()} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 pt-4 border-t border-rose-100 flex items-center justify-between">
                                                                    <p className="text-[9px] font-bold text-rose-500 uppercase">You can re-request mediation with a better offer.</p>
                                                                    <Button
                                                                        variant="link"
                                                                        className="h-auto p-0 text-rose-700 font-black uppercase text-[9px] hover:text-rose-900"
                                                                        onClick={() => handleRequestForSingleItem(item)}
                                                                    >
                                                                        <RotateCcw className="h-3 w-3 mr-1" /> Re-Request Mediation
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6 opacity-60">
                                                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                                                                    {item.product?.images?.[0] ? (
                                                                        <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="h-8 w-8" /></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight">{item.product?.productName}</h3>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">₹{(item.product?.pricePerUnit || 0).toLocaleString()} / {item.product?.unit}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}

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
                                                <div className="flex items-center gap-2">
                                                    {isCalculatingFee && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
                                                    <span className={`text-slate-900 font-black ${isCalculatingFee ? 'opacity-50' : ''}`}>₹{(deliveryTotal || 0).toLocaleString()}</span>
                                                    {deliveryTotal > productSubtotal && productSubtotal > 0 && (
                                                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[8px] font-black py-0 px-1">Long Distance</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {deliveryTotal > productSubtotal && productSubtotal > 0 && (
                                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
                                                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                                    <p className="text-[10px] text-rose-700 font-bold leading-tight">
                                                        Logistics cost exceeds product value due to extreme distance. Consider finding a local seller to save on shipping.
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-slate-500 font-bold text-sm">
                                                <div>
                                                    <span className="uppercase tracking-widest text-[10px]">Platform Protocol</span>
                                                    <p className="text-[8px] text-slate-400 font-medium">
                                                        {platformFee > 0 ? (paymentMethod === 'ONLINE' ? "(Includes 3% Online Fee)" : "(Includes 1.5% COD Fee)") : "(Free for orders under ₹100)"}
                                                    </p>
                                                </div>
                                                <span className="text-slate-900 font-black">₹{platformFee.toLocaleString()}</span>
                                            </div>

                                            {isOutOfRange && (
                                                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-[1.5rem] space-y-2 animate-pulse shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                                                        <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Special Delivery Mode</h5>
                                                    </div>
                                                    <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                                                        Some items are out of standard delivery range. Please deselect them to proceed with the rest of your order.
                                                    </p>
                                                </div>
                                            )}

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
                                    <CardFooter className="p-10 pt-0 flex flex-col gap-4">
                                        <Button
                                            disabled={isPending || selectedItemIds.length === 0 || effectiveIsOutOfRange}
                                            onClick={() => handleCheckout()}
                                            className={`w-full rounded-[2rem] h-20 font-black transition-all relative overflow-hidden group shadow-2xl ${effectiveIsOutOfRange ? 'bg-amber-100 text-amber-600 cursor-not-allowed border-2 border-amber-200 shadow-amber-900/5' : 'bg-slate-900 text-white hover:scale-[1.02] active:scale-95 shadow-slate-900/20'}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-400/10 to-emerald-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <span className="relative flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em]">
                                                {isPending ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : effectiveIsOutOfRange ? (
                                                    <>
                                                        <ShieldAlert className="h-6 w-6" />
                                                        Selection Unserviceable
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-6 w-6" />
                                                        Initiate Checkout
                                                    </>
                                                )}
                                            </span>
                                        </Button>

                                        {effectiveIsOutOfRange && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center text-[11px] font-black text-amber-600 uppercase tracking-widest px-8 leading-relaxed"
                                            >
                                                Please deselect the out of range orders to initiate checkout
                                            </motion.p>
                                        )}
                                    </CardFooter>
                                </Card>
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
                                        {(() => {
                                            const mergedItems = selectedPendingOrder?.items?.reduce((acc, item) => {
                                                const existing = acc.find(i => i.productId === item.productId);
                                                if (existing) {
                                                    existing.quantity += item.quantity;
                                                    return acc;
                                                }
                                                return [...acc, { ...item }];
                                            }, []) || [];

                                            return mergedItems.map((item) => (
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
                                            ));
                                        })()}
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
                                if (collisionOrder) {
                                    handleResumeOrder(collisionOrder);
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

            {inquiryProduct && (
                <InquiryModal
                    isOpen={isInquiryOpen}
                    onClose={() => {
                        setIsInquiryOpen(false);
                        setInquiryProduct(null);
                        setIsInquiryForSpecialDelivery(false);
                        setSpecialDeliveryQuantity("");
                        setSpecialDeliverySellerId(null);
                    }}
                    product={inquiryProduct}
                    onSuccess={fetchPending}
                    isSpecialDelivery={isInquiryForSpecialDelivery}
                    quantityRequested={specialDeliveryQuantity}
                    sellerId={specialDeliverySellerId}
                />
            )}
        </div>
    );
}
