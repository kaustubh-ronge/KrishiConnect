
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { 
//   Package, Calendar, Download, AlertTriangle, 
//   Star, Truck, CheckCircle2, MapPin, Clock, ArrowRight
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { toast } from "sonner";
// import { motion, AnimatePresence } from "framer-motion";
// import { createDispute } from "@/actions/disputes";
// import { downloadInvoice } from "@/lib/invoiceUtils";

// export default function EnhancedOrdersClient({ initialOrders }) {
//   const router = useRouter();
  
//   // Dispute State
//   const [isDisputeOpen, setIsDisputeOpen] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [disputeReason, setDisputeReason] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const getStatusStyle = (status) => {
//     switch (status) {
//       case "DELIVERED": return "bg-green-100 text-green-700 border-green-200";
//       case "SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
//       case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
//       case "PROCESSING": return "bg-amber-100 text-amber-800 border-amber-200";
//       default: return "bg-gray-100 text-gray-700 border-gray-200";
//     }
//   };

//   const handleDownload = (order) => {
//     try {
//         toast.info("Generating Invoice PDF...");
//         downloadInvoice(order);
//     } catch (e) {
//         console.error(e);
//         toast.error("Failed to generate PDF");
//     }
//   };

//   // Opens the modal
//   const openDisputeModal = (order) => {
//     setSelectedOrder(order);
//     setDisputeReason("");
//     setIsDisputeOpen(true);
//   };

//   const handleSubmitDispute = async () => {
//     if (!disputeReason.trim()) {
//         toast.error("Please enter a reason.");
//         return;
//     }

//     setIsSubmitting(true);
//     const formData = new FormData();
//     formData.append("orderId", selectedOrder.id);
//     formData.append("reason", disputeReason);

//     const res = await createDispute(formData);
    
//     if (res.success) {
//         toast.success("Dispute Submitted", { description: "We will review your issue shortly." });
//         setIsDisputeOpen(false);
//         router.refresh();
//     } else {
//         toast.error("Failed", { description: res.error });
//     }
//     setIsSubmitting(false);
//   };

//   if (!initialOrders || initialOrders.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
//         <motion.div 
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-white"
//         >
//             <div className="bg-green-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
//                 <Package className="h-10 w-10 text-green-600" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
//             <p className="text-gray-500 max-w-sm mb-8">Your purchase history will appear here once you make your first order.</p>
//             <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-12 text-base shadow-lg shadow-green-600/20">
//                 <Link href="/marketplace">
//                     Browse Marketplace <ArrowRight className="ml-2 h-4 w-4"/>
//                 </Link>
//             </Button>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-12 max-w-5xl">
//       <div className="flex items-end justify-between mb-10">
//          <div>
//             <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
//             <p className="text-gray-500 mt-2 text-lg">Track and manage your purchase history</p>
//          </div>
//       </div>

//       <div className="space-y-8">
//         <AnimatePresence>
//         {initialOrders.map((order, index) => (
//           <motion.div 
//             key={order.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: index * 0.05 }}
//           >
//             <Card className="overflow-hidden border border-gray-200/60 shadow-md hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-2xl group">
               
//                <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex flex-wrap gap-6 justify-between items-center">
//                   <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
//                       <div>
//                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Date Placed</p>
//                           <p className="text-gray-900 font-semibold flex items-center gap-2">
//                              <Calendar className="h-4 w-4 text-gray-400" /> 
//                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//                           </p>
//                       </div>
//                       <div>
//                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Amount</p>
//                           <p className="text-gray-900 font-bold text-base">₹{order.totalAmount.toLocaleString('en-IN')}</p>
//                       </div>
//                       <div className="hidden sm:block">
//                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Order ID</p>
//                           <p className="text-gray-600 font-mono text-sm tracking-wide">#{order.id.slice(-8).toUpperCase()}</p>
//                       </div>
//                   </div>
                  
//                   <div className="flex items-center gap-3">
//                       <Button 
//                         variant="outline" 
//                         size="sm" 
//                         onClick={() => handleDownload(order)} 
//                         className="h-9 border-gray-200 text-gray-600 hover:bg-white hover:text-green-600 hover:border-green-200 transition-colors"
//                       >
//                           <Download className="h-4 w-4 mr-2" /> Invoice
//                       </Button>
//                       <Badge className={`${getStatusStyle(order.orderStatus)} px-3 py-1 text-xs font-semibold rounded-full border shadow-none`}>
//                           {order.orderStatus}
//                       </Badge>
//                   </div>
//                </div>

//                <CardContent className="p-0">
//                   {order.items.map((item, i) => (
//                       <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-6 ${i !== order.items.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/30 transition-colors`}>
//                           <div className="relative h-24 w-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
//                              {item.product.images?.[0] ? (
//                                 <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
//                              ) : (
//                                 <div className="flex items-center justify-center h-full"><Package className="h-8 w-8 text-gray-300" /></div>
//                              )}
//                           </div>

//                           <div className="flex-grow flex flex-col justify-center">
//                               <div className="flex justify-between items-start">
//                                   <div>
//                                      <h3 className="font-bold text-lg text-gray-900">{item.product.productName}</h3>
//                                      <div className="flex items-center gap-2 mt-1">
//                                          <Badge variant="outline" className="text-[10px] text-gray-500 bg-gray-50 border-gray-200 px-2 py-0 h-5">
//                                             {item.product.sellerType}
//                                          </Badge>
//                                          <p className="text-sm text-gray-500">
//                                             {item.product.sellerType === 'farmer' ? item.product.farmer?.name : item.product.agent?.companyName}
//                                          </p>
//                                      </div>
//                                   </div>
//                                   <div className="text-right">
//                                       <p className="font-semibold text-gray-900 text-lg">₹{item.priceAtPurchase}</p>
//                                       <p className="text-xs text-gray-500">per {item.product.unit}</p>
//                                   </div>
//                               </div>
                              
//                               <div className="flex items-center justify-between mt-4">
//                                  <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-md inline-block">
//                                      Qty: {item.quantity} {item.product.unit}
//                                  </div>
//                                  <div className="text-sm font-bold text-green-700">
//                                      Total: ₹{(item.quantity * item.priceAtPurchase).toLocaleString('en-IN')}
//                                  </div>
//                               </div>
//                           </div>
//                       </div>
//                   ))}
//                </CardContent>

//                {order.orderStatus !== 'CANCELLED' && (
//                    <CardFooter className="bg-white px-6 py-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
//                        <div className="flex items-center text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-full">
//                           <Truck className="h-3.5 w-3.5 mr-2 text-blue-500" />
//                           <span>Updates will be sent to your registered phone number</span>
//                        </div>
                       
//                        <div className="flex gap-3">
//                            {order.orderStatus === 'DELIVERED' && (
//                                 <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm h-9">
//                                     <Link href={`/my-orders/review/${order.id}?productId=${order.items[0]?.productId}`}>
//                                         <Star className="h-3.5 w-3.5 mr-2" /> Write Review
//                                     </Link>
//                                 </Button>
//                            )}
                           
//                            {/* Only show "Report Issue" if no dispute exists */}
//                            {!order.disputeStatus && (
//                                <Button 
//                                     variant="outline" 
//                                     size="sm" 
//                                     className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-9"
//                                     onClick={() => openDisputeModal(order)}
//                                >
//                                   <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Report Issue
//                                </Button>
//                            )}

//                            {order.disputeStatus === 'OPEN' && (
//                                <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1.5">
//                                    Dispute Under Review
//                                </Badge>
//                            )}
//                        </div>
//                    </CardFooter>
//                )}
//             </Card>
//           </motion.div>
//         ))}
//         </AnimatePresence>
//       </div>

//       <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
//         <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
//           <DialogHeader>
//             <div className="flex items-center gap-3 mb-2">
//                 <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
//                 <DialogTitle className="text-xl font-bold text-gray-900">Report an Issue</DialogTitle>
//             </div>
//             <DialogDescription className="text-gray-500">
//               We are sorry you faced an issue with Order #{selectedOrder?.id.slice(-6).toUpperCase()}. Please describe the problem below.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="grid gap-5 py-4">
//              <div className="space-y-2">
//                 <Label className="text-gray-700 font-semibold">What went wrong?</Label>
//                 <Textarea 
//                     placeholder="E.g., Wrong item received, Quality issues, Item damaged..." 
//                     value={disputeReason}
//                     onChange={(e) => setDisputeReason(e.target.value)}
//                     className="min-h-[120px] resize-none bg-gray-50 border-gray-200 focus:bg-white transition-all"
//                 />
//              </div>
//              <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 border border-amber-100 flex gap-2 items-start">
//                  <div className="mt-0.5"><Clock className="h-4 w-4" /></div>
//                  <p>Opening a dispute will alert our admin team. We typically review cases within 24 hours.</p>
//              </div>
//           </div>

//           <DialogFooter>
//             <Button variant="ghost" onClick={() => setIsDisputeOpen(false)}>Cancel</Button>
//             <Button onClick={handleSubmitDispute} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
//                 {isSubmitting ? "Submitting..." : "Submit Report"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Package, Calendar, Download, AlertTriangle, 
  Star, Truck, CheckCircle2, MapPin, Clock, ArrowRight, X, ChevronRight, ClipboardList
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createDispute } from "@/actions/disputes";
import { downloadInvoice } from "@/lib/invoiceUtils";

// Tracking Steps Definition
const TRACKING_STEPS = [
  { id: 'PROCESSING', label: 'Order Placed', icon: ClipboardList },
  { id: 'PACKED', label: 'Packed', icon: Package },
  { id: 'SHIPPED', label: 'Shipped', icon: Truck },
  { id: 'IN_TRANSIT', label: 'In Transit', icon: MapPin },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
];

export default function EnhancedOrdersClient({ initialOrders }) {
  const router = useRouter();
  
  // State
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Status Color
  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED": return "bg-green-100 text-green-700 border-green-200";
      case "SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_TRANSIT": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      case "PROCESSING": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // --- Handlers ---
  const handleDownload = (order) => {
    try {
        toast.info("Generating Invoice PDF...");
        downloadInvoice(order);
    } catch (e) {
        console.error(e);
        toast.error("Failed to generate PDF");
    }
  };

  const openDisputeModal = (order) => {
    setSelectedOrder(order);
    setDisputeReason("");
    setIsDisputeOpen(true);
  };

  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    setIsTrackingOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
        toast.error("Please enter a reason.");
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("orderId", selectedOrder.id);
    formData.append("reason", disputeReason);

    const res = await createDispute(formData);
    
    if (res.success) {
        toast.success("Dispute Submitted", { description: "We will review your issue shortly." });
        setIsDisputeOpen(false);
        router.refresh();
    } else {
        toast.error("Failed", { description: res.error });
    }
    setIsSubmitting(false);
  };

  // --- Helper to calculate active step index ---
  const getCurrentStepIndex = (status) => {
      const idx = TRACKING_STEPS.findIndex(step => step.id === status);
      return idx === -1 ? 0 : idx;
  };

  if (!initialOrders || initialOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-white"
        >
            <div className="bg-green-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-500 max-w-sm mb-8">Your purchase history will appear here once you make your first order.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-12 text-base shadow-lg shadow-green-600/20">
                <Link href="/marketplace">
                    Browse Marketplace <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-end justify-between mb-10">
         <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
            <p className="text-gray-500 mt-2 text-lg">Track and manage your purchase history</p>
         </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
        {initialOrders.map((order, index) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden border border-gray-200/60 shadow-md hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-2xl group">
               
               {/* Order Header */}
               <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex flex-wrap gap-6 justify-between items-center">
                  <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
                      <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Date Placed</p>
                          <p className="text-gray-900 font-semibold flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-gray-400" /> 
                             {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                      </div>
                      <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                          <p className="text-gray-900 font-bold text-base">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="hidden sm:block">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Order ID</p>
                          <p className="text-gray-600 font-mono text-sm tracking-wide">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(order)} 
                        className="h-9 border-gray-200 text-gray-600 hover:bg-white hover:text-green-600 hover:border-green-200 transition-colors"
                      >
                          <Download className="h-4 w-4 mr-2" /> Invoice
                      </Button>
                      <Badge className={`${getStatusStyle(order.orderStatus)} px-3 py-1 text-xs font-semibold rounded-full border shadow-none`}>
                          {order.orderStatus}
                      </Badge>
                  </div>
               </div>

               {/* Order Items */}
               <CardContent className="p-0">
                  {order.items.map((item, i) => (
                      <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-6 ${i !== order.items.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/30 transition-colors`}>
                          <div className="relative h-24 w-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                             {item.product.images?.[0] ? (
                                <Image src={item.product.images[0]} alt={item.product.productName} fill className="object-cover" />
                             ) : (
                                <div className="flex items-center justify-center h-full"><Package className="h-8 w-8 text-gray-300" /></div>
                             )}
                          </div>

                          <div className="flex-grow flex flex-col justify-center">
                              <div className="flex justify-between items-start">
                                  <div>
                                     <h3 className="font-bold text-lg text-gray-900">{item.product.productName}</h3>
                                     <div className="flex items-center gap-2 mt-1">
                                         <Badge variant="outline" className="text-[10px] text-gray-500 bg-gray-50 border-gray-200 px-2 py-0 h-5">
                                            {item.product.sellerType}
                                         </Badge>
                                         <p className="text-sm text-gray-500">
                                            {item.product.sellerType === 'farmer' ? item.product.farmer?.name : item.product.agent?.companyName}
                                         </p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-semibold text-gray-900 text-lg">₹{item.priceAtPurchase}</p>
                                      <p className="text-xs text-gray-500">per {item.product.unit}</p>
                                  </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-4">
                                 <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-md inline-block">
                                     Qty: {item.quantity} {item.product.unit}
                                 </div>
                                 <div className="text-sm font-bold text-green-700">
                                     Total: ₹{(item.quantity * item.priceAtPurchase).toLocaleString('en-IN')}
                                 </div>
                              </div>
                          </div>
                      </div>
                  ))}
               </CardContent>

               {/* Footer (Track & Dispute) */}
               {order.orderStatus !== 'CANCELLED' && (
                   <CardFooter className="bg-white px-6 py-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
                       
                       {/* Track Order Button - Opens Timeline */}
                       <Button 
                         onClick={() => openTrackingModal(order)}
                         variant="secondary"
                         size="sm"
                         className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 h-9 font-medium"
                       >
                          <Truck className="h-4 w-4 mr-2" /> Track Package
                       </Button>
                       
                       <div className="flex gap-3">
                           {/* Review Button */}
                           {order.orderStatus === 'DELIVERED' && (
                                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm h-9">
                                    <Link href={`/my-orders/review/${order.id}?productId=${order.items[0]?.productId}`}>
                                        <Star className="h-3.5 w-3.5 mr-2" /> Write Review
                                    </Link>
                                </Button>
                           )}
                           
                           {/* Dispute Button */}
                           {!order.disputeStatus && (
                               <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-9"
                                    onClick={() => openDisputeModal(order)}
                               >
                                  <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Report Issue
                               </Button>
                           )}

                           {order.disputeStatus === 'OPEN' && (
                               <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1.5">
                                   Dispute Under Review
                               </Badge>
                           )}
                       </div>
                   </CardFooter>
               )}
            </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* --- TRACKING MODAL --- */}
      <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
           <div className="p-6 bg-white border-b border-gray-100 sticky top-0 z-10">
               <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Truck className="h-5 w-5 text-blue-600" /> Tracking Status
                    </DialogTitle>
                    <DialogDescription>
                        Order #{selectedOrder?.id.slice(-8).toUpperCase()}
                    </DialogDescription>
               </DialogHeader>
           </div>
           
           <div className="p-8 bg-gray-50/50">
               {selectedOrder && (
                   <div className="space-y-8">
                       {/* 1. Visual Stepper */}
                       <div className="relative flex justify-between items-center px-2">
                           {/* Connecting Line */}
                           <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
                           <div 
                                className="absolute top-4 left-4 h-0.5 bg-green-500 -z-10 transition-all duration-500" 
                                style={{ width: `${(getCurrentStepIndex(selectedOrder.orderStatus) / (TRACKING_STEPS.length - 1)) * 100}%` }}
                           ></div>

                           {TRACKING_STEPS.map((step, index) => {
                               const isActive = index <= getCurrentStepIndex(selectedOrder.orderStatus);
                               const isCurrent = index === getCurrentStepIndex(selectedOrder.orderStatus);
                               
                               return (
                                   <div key={step.id} className="flex flex-col items-center gap-2">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400'}`}>
                                           <step.icon className="h-4 w-4" />
                                       </div>
                                       <span className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                                           {step.label}
                                       </span>
                                   </div>
                               );
                           })}
                       </div>

                       {/* 2. Detailed History List */}
                       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                           <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                               <Clock className="h-4 w-4 text-gray-400" /> Timeline History
                           </h4>
                           
                           {selectedOrder.tracking && selectedOrder.tracking.length > 0 ? (
                               <div className="space-y-6 relative pl-4 border-l-2 border-gray-100 ml-2">
                                   {selectedOrder.tracking.slice().reverse().map((track, i) => (
                                       <div key={track.id} className="relative pl-6">
                                            {/* Dot */}
                                            <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ring-1 ring-gray-200 ${i === 0 ? 'bg-green-500 ring-green-200' : 'bg-gray-300'}`}></span>
                                            
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {TRACKING_STEPS.find(s => s.id === track.status)?.label || track.status}
                                                </p>
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {new Date(track.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            {track.notes && (
                                                <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md border border-gray-100">
                                                    {track.notes}
                                                </p>
                                            )}
                                            
                                            {/* Logistics Details Badge */}
                                            {track.transportProvider && (
                                                <div className="mt-2 flex gap-2">
                                                    <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-100 font-normal">
                                                        Courier: {track.transportProvider}
                                                    </Badge>
                                                    {track.vehicleNumber && (
                                                        <Badge variant="outline" className="text-[10px] text-gray-600 bg-gray-50 border-gray-200 font-normal">
                                                            Vehicle: {track.vehicleNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                                   
                                   {/* Initial Placed Event */}
                                   <div className="relative pl-6 pt-2">
                                        <span className="absolute -left-[21px] top-2 h-3 w-3 rounded-full bg-gray-300 border-2 border-white ring-1 ring-gray-200"></span>
                                        <p className="font-semibold text-gray-500 text-sm">Order Placed</p>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                                        </span>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-center py-6 text-gray-400 text-sm">
                                   No tracking updates yet.
                               </div>
                           )}
                       </div>
                   </div>
               )}
           </div>

           <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
               <Button onClick={() => setIsTrackingOpen(false)}>Close</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                <DialogTitle className="text-xl font-bold text-gray-900">Report an Issue</DialogTitle>
            </div>
            <DialogDescription className="text-gray-500">
              We are sorry you faced an issue with Order #{selectedOrder?.id.slice(-6).toUpperCase()}. Please describe the problem below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
             <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">What went wrong?</Label>
                <Textarea 
                    placeholder="E.g., Wrong item received, Quality issues, Item damaged..." 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="min-h-[120px] resize-none bg-gray-50 border-gray-200 focus:bg-white transition-all"
                />
             </div>
             <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 border border-amber-100 flex gap-2 items-start">
                 <div className="mt-0.5"><Clock className="h-4 w-4" /></div>
                 <p>Opening a dispute will alert our admin team. We typically review cases within 24 hours.</p>
             </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDisputeOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitDispute} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}