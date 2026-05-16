"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDeliveryProfile, updateDeliveryProfile, toggleOnlineStatus } from '@/actions/delivery-profile';
import { updateDeliveryJobStatus, completeDeliveryWithOtp, updateLiveLocation, markPartnerPaymentReceived, resendDeliveryOtp } from '@/actions/delivery-job';
import { useFetch } from '@/hooks/use-fetch';
import ImageUpload from '@/components/ImageUpload';
import { z } from 'zod';
import { deliverySchema } from '@/lib/zodSchema';
import {
  ChevronRight, ChevronLeft, MapPin, Truck, IndianRupee, Navigation, Clock, User, Phone, CheckCircle2,
  Settings, Power, Package, Calendar, BarChart3, Star, ArrowUpRight, TrendingUp,
  Zap, Shield, Award, Crown, Sparkles, Heart, Target, Layers, Gift,
  MessageCircle, AlertCircle, RotateCcw, Search, Filter, X, Loader2, ShieldCheck,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import LocationPicker from '@/components/LocationPicker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DeliveryDashboardClient({
  user,
  profileExists: initialProfileExists,
  initialJobs = [],
  total,
  hasMore,
  currentPage,
  lifetimeEarnings = 0
}) {
  const router = useRouter();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const jobs = initialJobs;
  const [onlineStatus, setOnlineStatus] = useState(user?.deliveryProfile?.isOnline ?? false);
  const [approvalStatus, setApprovalStatus] = useState(user?.deliveryProfile?.approvalStatus ?? 'PENDING');
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [currentJobId, setCurrentJobId] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryPaymentStatus, setDeliveryPaymentStatus] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const lastLocationUpdate = useRef(0);
  const [formStep, setFormStep] = useState(1);
  const [formProgress, setFormProgress] = useState(25);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("IN");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [radius, setRadius] = useState("10");
  const [pricePerKm, setPricePerKm] = useState("5");
  const [aadharFront, setAadharFront] = useState("");
  const [aadharBack, setAadharBack] = useState("");
  const [licenseImage, setLicenseImage] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resendingJobId, setResendingJobId] = useState(null);
  const [statusUpdatingJobId, setStatusUpdatingJobId] = useState(null);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);
  const [isMarkingPaymentId, setIsMarkingPaymentId] = useState(null);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    if (!initialProfileExists) {
      setIsDialogOpen(true);
    }
    if (window.location.hash === '#location') {
      setIsDialogOpen(true);
      setFormStep(3);
    }
    if (initialProfileExists && user?.deliveryProfile) {
      const p = user.deliveryProfile;
      setName(p.name || user.name || "");
      setPhone(p.phone || "");
      setAadharNumber(p.aadharNumber || "");
      setAddress(p.address || "");
      setCountry(p.country || "IN");
      setStateCode(p.state || "");
      setCity(p.city || "");
      setPincode(p.pincode || "");
      setLat(p.lat || 20.5937);
      setLng(p.lng || 78.9629);
      setVehicleType(p.vehicleType || "");
      setVehicleNumber(p.vehicleNumber || "");
      setLicenseNumber(p.licenseNumber || "");
      setRadius(p.radius?.toString() || "10");
      setPricePerKm(p.pricePerKm?.toString() || "5");
      setAadharFront(p.aadharFront || "");
      setAadharBack(p.aadharBack || "");
      setLicenseImage(p.licenseImage || "");
      setUpiId(p.upiId || "");
      setBankName(p.bankName || "");
      setIfscCode(p.ifscCode || "");
      setAccountNumber(p.accountNumber || "");
    }
  }, [initialProfileExists, user]);

  // Live GPS tracking with 30-second throttle
  useEffect(() => {
    if (!mounted) return;
    const activeJob = jobs.find(j => j.status === 'PICKED_UP' || j.status === 'IN_TRANSIT');
    if (!activeJob) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        // Throttle to once every 30 seconds
        if (now - lastLocationUpdate.current < 30000) return;

        const { latitude, longitude } = position.coords;
        await updateLiveLocation(activeJob.id, latitude, longitude);
        lastLocationUpdate.current = now;
      },
      (error) => console.error("Geolocation error:", error.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [jobs, mounted]);

  const { execute: submitProfile, isLoading: isPending } = useFetch(
    profileExists ? updateDeliveryProfile : createDeliveryProfile
  );

  const handleProfileSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    formData.set('phone', phone);
    formData.set('aadharNumber', aadharNumber);
    formData.set('address', address);
    formData.set('country', country);
    formData.set('state', stateCode);
    formData.set('city', city);
    formData.set('pincode', pincode);
    formData.set('lat', lat.toString());
    formData.set('lng', lng.toString());
    formData.set('vehicleType', vehicleType);
    formData.set('vehicleNumber', vehicleNumber);
    formData.set('licenseNumber', licenseNumber);
    formData.set('licenseImage', licenseImage);
    formData.set('aadharFront', aadharFront);
    formData.set('aadharBack', aadharBack);
    formData.set('radius', radius);
    formData.set('pricePerKm', pricePerKm);
    formData.set('upiId', upiId);
    formData.set('bankName', bankName);
    formData.set('ifscCode', ifscCode);
    formData.set('accountNumber', accountNumber);

    try {
      deliverySchema.parse(Object.fromEntries(formData.entries()));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || error.errors || [];
        if (issues.length > 0) {
          toast.error(issues[0].message);
        } else {
          toast.error("Validation failed. Please check your inputs.");
        }
        return;
      }
      toast.error("An unexpected validation error occurred.");
      return;
    }

    const result = await submitProfile(formData);
    if (result?.success) {
      setIsDialogOpen(false);
      setProfileExists(true);
      toast.success(profileExists ? "Profile Saved!" : "Registration Complete!");
    }
  };

  const handleJobStatus = async (jobId, status) => {
    if (status === 'DELIVERED') {
      setCurrentJobId(jobId);
      setIsOtpDialogOpen(true);
      return;
    }

    setStatusUpdatingJobId(jobId);
    let lat = null;
    let lng = null;

    if (status === 'PICKED_UP') {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 5000, maximumAge: 0
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn("Location capture failed:", err);
      }
    }

    const res = await updateDeliveryJobStatus(jobId, status, "", lat, lng);
    if (res.success) {
      toast.success(`Status updated to ${status}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setStatusUpdatingJobId(null);
  };

  const handleToggleOnline = async (newStatus) => {
    setIsTogglingOnline(true);
    const res = await toggleOnlineStatus(newStatus);
    if (res.success) {
      setOnlineStatus(newStatus);
      toast.success(newStatus ? "Online" : "Offline");
    }
    setIsTogglingOnline(false);
  };

  const confirmDeliveryWithOtp = async () => {
    setIsCompletingDelivery(true);
    let lat = null;
    let lng = null;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 5000, maximumAge: 0
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (err) {
      console.warn("Location capture failed during OTP verification:", err);
    }

    const res = await completeDeliveryWithOtp(currentJobId, otpValue, lat, lng, deliveryMethod, deliveryPaymentStatus);
    if (res.success) {
      toast.success("Delivered!");
      setIsOtpDialogOpen(false);
      setOtpValue("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setIsCompletingDelivery(false);
  };

  const handleMarkPaymentReceived = async (jobId) => {
    setIsMarkingPaymentId(jobId);
    const res = await markPartnerPaymentReceived(jobId);
    if (res.success) {
      toast.success("Payment recorded!");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setIsMarkingPaymentId(null);
  };

  const handleResendOtp = async (jobId) => {
    setResendingJobId(jobId);
    const res = await resendDeliveryOtp(jobId);
    if (res.success) {
      toast.success("OTP Resent to Buyer!");
    } else {
      toast.error(res.error);
    }
    setResendingJobId(null);
  };

  // --- NEW: Suggested Order & PDF Generation ---
  const sortedJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    const active = jobs.filter(j => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status));

    // Simple Greedy Path: Sort by distance from delivery boy's base or current lat/lng
    return [...active].sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [jobs]);

  const downloadDeliveryRunPdf = () => {
    const doc = new jsPDF();
    const tableColumn = ["Order", "Status", "Pickup", "Drop-off", "Contact", "Payment"];
    const tableRows = [];

    sortedJobs.forEach((job) => {
      const pickup = job.order.items[0]?.product?.farmer?.address || job.order.items[0]?.product?.agent?.address || "N/A";
      const jobData = [
        `#${job.orderId.slice(-6).toUpperCase()}`,
        job.status,
        pickup.slice(0, 30) + "...",
        job.order.shippingAddress.slice(0, 30) + "...",
        job.order.buyerPhone || "N/A",
        `Rs. ${job.totalPrice?.toFixed(2)}`
      ];
      tableRows.push(jobData);
    });

    doc.setFontSize(18);
    doc.text("Suggested Delivery Run", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, { 
      head: [tableColumn], 
      body: tableRows, 
      startY: 35, 
      theme: 'grid' 
    });
    doc.save(`delivery-run-${new Date().getTime()}.pdf`);
    toast.success("Delivery Run PDF Downloaded!");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PICKED_UP': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REQUESTED': return <Clock className="h-3 w-3" />;
      case 'ACCEPTED': return <CheckCircle2 className="h-3 w-3" />;
      case 'PICKED_UP': return <Package className="h-3 w-3" />;
      case 'IN_TRANSIT': return <Truck className="h-3 w-3" />;
      case 'DELIVERED': return <CheckCircle2 className="h-3 w-3" />;
      case 'CANCELLED': return <X className="h-3 w-3" />;
      case 'REJECTED': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const nextStep = () => setFormStep(prev => Math.min(4, prev + 1));
  const prevStep = () => setFormStep(prev => Math.max(1, prev - 1));

  // --- MULTI-STEP DIALOG CONTENT ---
  const profileDialogContent = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-3xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white flex flex-col h-[85vh]">
        {/* Step-aware Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">
                  {profileExists ? "Partner Settings" : "Join the Fleet"}
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs font-medium">
                  Step {formStep} of 4: {
                    formStep === 1 ? "Identity" :
                      formStep === 2 ? "Logistics" :
                        formStep === 3 ? "Location" : "Documents"
                  }
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Progress</span>
              <p className="text-lg font-black">{Math.round((formStep / 4) * 100)}%</p>
            </div>
          </div>
          <Progress value={(formStep / 4) * 100} className="h-1.5 bg-white/20" />
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {formStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Personal Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></Label>
                    <Input className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-medium" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></Label>
                    <Input className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-medium" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Aadhar Number (12 Digits) <span className="text-red-500">*</span></Label>
                    <Input className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-mono tracking-[0.2em]" maxLength={12} placeholder="0000 0000 0000" value={aadharNumber} onChange={e => setAadharNumber(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Vehicle & Pricing</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle Type <span className="text-red-500">*</span></Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bicycle">Bicycle</SelectItem>
                        <SelectItem value="Bike">Bike / Scooter</SelectItem>
                        <SelectItem value="Three Wheeler">Three Wheeler (Auto)</SelectItem>
                        <SelectItem value="Mini Truck">Mini Truck (Tata Ace, etc.)</SelectItem>
                        <SelectItem value="Truck">Heavy Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle Number Plate <span className="text-red-500">*</span></Label>
                    <Input className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-bold uppercase" placeholder="MH 12 AB 1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Driving License Number <span className="text-red-500">*</span></Label>
                    <Input className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-bold uppercase" placeholder="DL-1234567890" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Service Radius (KM) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input type="number" className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 pr-12 font-bold" value={radius} onChange={e => setRadius(e.target.value)} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">KM</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Price per KM (₹) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">₹</span>
                      <Input type="number" className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 pl-8 font-bold" value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {formStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Base Location</h3>
                </div>
                <LocationPicker
                  value={{ country, state: stateCode, city, pincode, lat, lng, address }}
                  onChange={(val) => {
                    setCountry(val.country);
                    setStateCode(val.state);
                    setCity(val.city);
                    setPincode(val.pincode);
                    setLat(val.lat);
                    setLng(val.lng);
                    setAddress(val.address);
                  }}
                />
              </motion.div>
            )}

            {formStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="h-5 w-5 text-pink-600" />
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Payment & Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">UPI ID <span className="text-red-500">*</span></Label>
                      <Input placeholder="user@bank" value={upiId} onChange={e => setUpiId(e.target.value)} className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Bank Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">IFSC Code <span className="text-red-500">*</span></Label>
                      <Input placeholder="HDFC0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value)} className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 uppercase font-mono" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-black text-gray-400 uppercase tracking-wider">Account Number <span className="text-red-500">*</span></Label>
                      <Input type="password" placeholder="••••••••••••" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-12 rounded-xl border-2 border-gray-100 bg-gray-50/50 font-mono tracking-widest" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Aadhar Front <span className="text-red-500">*</span></p>
                    <ImageUpload value={aadharFront ? [aadharFront] : []} onChange={urls => setAadharFront(urls[0])} onRemove={() => setAadharFront("")} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Aadhar Back <span className="text-red-500">*</span></p>
                    <ImageUpload value={aadharBack ? [aadharBack] : []} onChange={urls => setAadharBack(urls[0])} onRemove={() => setAadharBack("")} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Driving License <span className="text-red-500">*</span></p>
                    <ImageUpload value={licenseImage ? [licenseImage] : []} onChange={urls => setLicenseImage(urls[0])} onRemove={() => setLicenseImage("")} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={formStep === 1 || isPending}
            className="h-12 px-8 rounded-xl font-bold"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {formStep < 4 ? (
            <Button
              onClick={nextStep}
              className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg"
            >
              Next Step <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleProfileSubmit}
              disabled={isPending}
              className="h-12 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isPending ? "Saving..." : (profileExists ? "Update Profile" : "Complete Registration")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!mounted) return null;


  // --- WELCOME / SETUP SCREEN ---
  if (!profileExists) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 150, 0], y: [0, -80, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -120, 0], y: [0, 90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl"
          />
          {mounted && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `linear-gradient(135deg, ${['#10b981', '#3b82f6', '#8b5cf6'][i % 3]}, ${['#059669', '#2563eb', '#7c3aed'][i % 3]})`,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10 text-center max-w-md px-6"
        >
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl p-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
            >
              <Truck className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">Join the Fleet</h2>
            <p className="text-gray-500 text-lg mb-8">Complete your registration to start earning with KrishiConnect.</p>
            <Button
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl h-14 text-lg font-bold shadow-xl shadow-emerald-500/25 transition-all"
            >
              Get Started
            </Button>
          </div>
        </motion.div>

        {/* Dialog rendered inside the Welcome Screen */}
        {profileDialogContent}
      </div>
    );
  }

  const isApproved = approvalStatus === 'APPROVED';

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/20 to-green-300/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-200/20 to-indigo-300/10 rounded-full blur-3xl"
        />
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-20 bg-white/80 backdrop-blur-xl border-b-2 border-gray-200/50 sticky top-0 shadow-lg">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">Partner Portal</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-bold text-gray-500 uppercase">{onlineStatus ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.refresh()}
              className="rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
              title="Refresh Tasks"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {isApproved && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleToggleOnline(!onlineStatus)}
                  disabled={isTogglingOnline}
                  className={`rounded-full px-5 h-10 font-bold transition-all ${onlineStatus
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'border-2 border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {isTogglingOnline ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                  {onlineStatus ? "Go Offline" : "Go Online"}
                </Button>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(true)}
              className="rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 max-w-6xl mt-8 pb-20">
        {profileExists && user?.deliveryProfile && (user.deliveryProfile.lat === null || user.deliveryProfile.lng === null || user.deliveryProfile.lat === undefined || user.deliveryProfile.lng === undefined) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] shadow-xl shadow-rose-900/5 overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
              <MapPin className="h-24 w-24 text-rose-600" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
                  <MapPin className="h-8 w-8 text-rose-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight leading-none mb-2">Location Missing</h3>
                  <p className="text-rose-600 font-bold text-sm leading-relaxed max-w-md">
                    To start receiving delivery jobs, you must set your service area location in your profile settings.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsDialogOpen(true);
                  setFormStep(3);
                }}
                className="w-full md:w-auto h-14 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Navigation className="h-5 w-5 mr-2" />
                Update Location in Profile
              </Button>
            </div>
          </motion.div>
        )}
        {!isApproved ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-12 text-center text-white">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
                >
                  <Clock className="h-10 w-10" />
                </motion.div>
                <h2 className="text-3xl font-black mb-4">Application Under Review</h2>
                <p className="text-white/80 max-w-md mx-auto text-lg">
                  Our team is reviewing your documents. You'll be able to accept jobs once verified.
                </p>
              </div>
              <div className="p-8 bg-white text-center">
                <div className="flex justify-center gap-8 text-sm">
                  {[
                    { icon: CheckCircle2, label: "Registered", active: true },
                    { icon: BarChart3, label: "Reviewing", active: true },
                    { icon: TrendingUp, label: "Verified", active: false }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${step.active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <span className={`font-bold text-xs ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Earnings Card */}
              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                  <h3 className="text-3xl font-black flex items-center gap-2">
                    <IndianRupee className="h-6 w-6 text-emerald-400" />
                    {lifetimeEarnings.toFixed(2)}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                      <Navigation className="h-4 w-4" /> Radius
                    </span>
                    <span className="font-bold text-gray-900">{radius} KM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" /> Rate
                    </span>
                    <span className="font-bold text-gray-900">₹{pricePerKm}/KM</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Weekly Goal</p>
                    <Progress value={45} className="h-2 bg-gray-100" />
                  </div>
                </div>
              </Card>

              {/* Performance Card */}
              <Card className="border-0 shadow-lg rounded-3xl p-6 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">Performance</h4>
                    <p className="text-xs text-indigo-600 font-medium">Top 15% this week</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 p-3 rounded-2xl border border-white">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Jobs</p>
                    <p className="text-xl font-black text-gray-900">{total}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-2xl border border-white">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Rating</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xl font-black text-gray-900">4.9</p>
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content: Jobs */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black text-gray-900">Active Tasks</h3>
                  {sortedJobs.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={downloadDeliveryRunPdf}
                      className="rounded-xl border-2 border-emerald-100 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-bold h-9 text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1.5" /> Download Delivery Run (PDF)
                    </Button>
                  )}
                </div>
                <Badge className="bg-white text-gray-600 border-2 border-gray-200 px-4 py-2 rounded-full font-bold">
                  {total} Total
                </Badge>
              </div>

              {sortedJobs.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                      <Target className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">Suggested Delivery Sequence</h4>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Optimized for shortest travel distance</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sortedJobs.map((j, i) => (
                      <div key={j.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-indigo-50">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                        <span className="text-xs font-bold text-gray-700">#{j.orderId.slice(-6).toUpperCase()}</span>
                        {i < sortedJobs.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {jobs.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 rounded-3xl p-20 text-center bg-white/60 backdrop-blur-xl">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <Package className="h-12 w-12 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">No Active Tasks</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Tasks will appear when farmers or agents hire you for deliveries.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {jobs.map((job, idx) => (
                      <motion.div
                        key={job.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="group relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
                          <Card className="relative border-2 border-gray-100 group-hover:border-emerald-200 transition-all duration-300 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl shadow-lg group-hover:shadow-2xl">
                            <div className="flex">
                              {/* Status color bar */}
                              <div className={`w-1.5 flex-shrink-0 ${job.status === 'DELIVERED' ? 'bg-emerald-500' :
                                job.status === 'IN_TRANSIT' ? 'bg-purple-500' :
                                  'bg-indigo-500'
                                }`} />

                              <div className="flex-grow p-6">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">Task</span>
                                      <span className="font-mono text-xs font-bold text-gray-400">#{job.id.slice(-8).toUpperCase()}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900">Order #{job.orderId.slice(-8).toUpperCase()}</h4>
                                  </div>
                                  <Badge className={`${getStatusColor(job.status)} rounded-full px-4 py-1.5 border shadow-sm font-bold flex items-center gap-1.5`}>
                                    {getStatusIcon(job.status)}
                                    {job.status.replace('_', ' ')}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Pickup</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 truncate">
                                      {job.order.items[0]?.product?.farmer?.address || job.order.items[0]?.product?.agent?.address || 'Pickup Hub'}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                      <Navigation className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Drop-off</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 truncate">{job.order.shippingAddress}</p>
                                  </div>
                                  <div className="space-y-1 md:col-span-3 pt-3 mt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                                      <Layers className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Product Manifest</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {job.order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-50">
                                            {item.quantity}
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-gray-800">{item.product?.productName}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{item.product?.variety || item.product?.category}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                      <IndianRupee className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-bold uppercase">Payment</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-gray-900">₹{job.totalPrice?.toFixed(2) || '---'}</p>
                                        <span className="text-[10px] font-bold text-gray-400">({job.distance} KM)</span>
                                      </div>
                                      {job.order?.paymentStatus === 'PAID' && job.order?.paymentMethod === 'ONLINE' && (
                                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                                          <ShieldCheck className="h-3 w-3" /> Paid Online
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {job.notes && (job.status === 'CANCELLED' || job.status === 'REJECTED') && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-pulse">
                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold text-red-700">{job.notes}</p>
                                  </div>
                                )}

                                <Separator className="my-4" />

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 items-center justify-end">
                                  {job.status === 'REQUESTED' && (
                                    <div className="flex flex-wrap gap-3 items-center">
                                      <Button 
                                        variant="outline" 
                                        className="rounded-xl text-indigo-600 font-bold border-2 border-indigo-100 hover:bg-indigo-50" 
                                        onClick={() => {
                                          setSelectedJob(job);
                                          setIsDetailDialogOpen(true);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                      <Button variant="outline" className="rounded-xl text-gray-600 font-bold border-2 border-gray-200 hover:bg-gray-50" onClick={() => handleJobStatus(job.id, 'REJECTED')}>Decline</Button>
                                      <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/25" onClick={() => handleJobStatus(job.id, 'ACCEPTED')}>
                                        {statusUpdatingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Accept Task
                                      </Button>
                                    </div>
                                  )}
                                  {job.status === 'ACCEPTED' && (
                                    <>
                                      <Button variant="outline" className="rounded-xl text-red-600 font-bold border-2 border-red-100 hover:bg-red-50" onClick={() => handleJobStatus(job.id, 'CANCELLED')}>Cancel Task</Button>
                                      <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold shadow-lg" onClick={() => handleJobStatus(job.id, 'PICKED_UP')}>
                                        {statusUpdatingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />} Confirm Pickup
                                      </Button>
                                    </>
                                  )}
                                  {job.status === 'PICKED_UP' && (
                                    <>
                                      <Button variant="outline" className="rounded-xl border-2 border-gray-200 font-bold" onClick={() => handleResendOtp(job.id)}>
                                        {resendingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />} Resend OTP
                                      </Button>
                                      <Button className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-lg" onClick={() => handleJobStatus(job.id, 'IN_TRANSIT')}>
                                        {statusUpdatingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />} Start Navigation
                                      </Button>
                                    </>
                                  )}
                                  {job.status === 'IN_TRANSIT' && (
                                    <>
                                      <Button variant="outline" className="rounded-xl border-2 border-gray-200 font-bold" onClick={() => handleResendOtp(job.id)}>
                                        <RotateCcw className="h-4 w-4 mr-2" /> Resend OTP
                                      </Button>
                                      <Button className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/25" onClick={() => handleJobStatus(job.id, 'DELIVERED')}>
                                        {statusUpdatingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Deliver & Verify
                                      </Button>
                                    </>
                                  )}
                                  {job.status === 'DELIVERED' && !job.partnerPaymentReceived && (
                                    <Button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg" onClick={() => handleMarkPaymentReceived(job.id)}>
                                      {isMarkingPaymentId === job.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <IndianRupee className="h-4 w-4 mr-2" />} Payment Received
                                    </Button>
                                  )}
                                  {job.partnerPaymentReceived && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-2 border-emerald-200 rounded-xl px-6 py-3 flex items-center gap-2 font-bold">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Payment Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Pagination */}
                  <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 shadow-lg mt-8">
                    <span className="text-sm font-bold text-gray-500">{jobs.length} / {total} Tasks</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() => router.push(`/delivery-dashboard?page=${currentPage - 1}`)}
                        className="rounded-xl border-2 border-gray-200 hover:border-emerald-300 font-bold"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasMore}
                        onClick={() => router.push(`/delivery-dashboard?page=${currentPage + 1}`)}
                        className="rounded-xl border-2 border-gray-200 hover:border-emerald-300 font-bold"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* OTP Dialog - Premium */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black">Verify Delivery</DialogTitle>
            <DialogDescription className="text-green-50 font-medium mt-1">
              Enter the 6-digit OTP from the buyer
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            {/* Current Order Payment Info for Delivery Boy */}
            {jobs.find(j => j.id === currentJobId)?.order && (
              <div className="flex flex-wrap gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                  <p className="text-sm font-black text-emerald-900">
                    {jobs.find(j => j.id === currentJobId).order.paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD / CASH'}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                  <Badge className={`${jobs.find(j => j.id === currentJobId).order.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 font-bold`}>
                    {jobs.find(j => j.id === currentJobId).order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-emerald-500" /> Method *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ONLINE', label: 'Online', icon: CreditCard },
                    { id: 'COD', label: 'Cash/COD', icon: IndianRupee }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDeliveryMethod(m.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${deliveryMethod === m.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 bg-white hover:border-emerald-200'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${deliveryMethod === m.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <p className="font-black text-[10px] uppercase">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Payment Status *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'PAID', label: 'Paid', icon: CheckCircle2, bg: 'bg-emerald-500' },
                    { id: 'PENDING', label: 'Pending', icon: Clock, bg: 'bg-amber-500' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDeliveryPaymentStatus(s.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${deliveryPaymentStatus === s.id
                        ? `border-${s.id === 'PAID' ? 'emerald' : 'amber'}-500 bg-${s.id === 'PAID' ? 'emerald' : 'amber'}-50`
                        : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${deliveryPaymentStatus === s.id ? s.bg : 'bg-gray-100'
                        } text-white`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <p className="font-black text-[10px] uppercase">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`space-y-4 transition-all ${(!deliveryMethod || !deliveryPaymentStatus) ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OTP Code <span className="text-red-500 font-bold">*</span></Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResendOtp(currentJobId)}
                  className="h-6 text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 p-0"
                >
                  {resendingJobId === currentJobId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />} Resend OTP
                </Button>
              </div>
              <Input
                maxLength={6}
                className="text-center text-5xl h-24 tracking-[1.5rem] font-black border-2 border-gray-200 bg-gray-50 rounded-2xl focus:border-emerald-500"
                placeholder="000000"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <Button
              onClick={confirmDeliveryWithOtp}
              disabled={otpValue.length !== 6 || !deliveryMethod || !deliveryPaymentStatus}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/25"
            >
              {isCompletingDelivery ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />} Complete Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog rendered in Main Dashboard as well */}
      {profileDialogContent}
      {/* Job Details Modal - Premium Overlay */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Job Specifications</DialogTitle>
                  <p className="text-indigo-100/80 text-xs font-bold uppercase tracking-widest">Order ID: #{selectedJob?.orderId.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-4 py-1.5 rounded-full font-black text-[10px]">
                {selectedJob?.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Location Flow */}
            <div className="relative">
              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-indigo-400 to-rose-400 border-dashed border-l-2" />
              
              <div className="space-y-10 relative">
                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup From (Seller)</p>
                    <p className="font-black text-gray-900">{selectedJob?.order.items[0]?.product?.farmer?.name || selectedJob?.order.items[0]?.product?.agent?.name || "Seller Hub"}</p>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed mt-1">
                      {selectedJob?.order.items[0]?.product?.farmer?.address || selectedJob?.order.items[0]?.product?.agent?.address || "Location Details Available on Accept"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10">
                    <Navigation className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver To (Buyer)</p>
                    <p className="font-black text-gray-900">{selectedJob?.order.buyerUser?.name || "Premium Buyer"}</p>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed mt-1">{selectedJob?.order.shippingAddress}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span className="text-[10px] font-bold">{selectedJob?.order.buyerPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Product Manifest */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Product Manifest</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-indigo-100 text-indigo-600">
                  {selectedJob?.order.items.length} Items
                </Badge>
              </div>
              
              <div className="space-y-2">
                {selectedJob?.order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm border border-gray-100">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{item.product?.productName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{item.product?.variety || item.product?.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-900">{item.quantity} {item.product?.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Your Earnings</h4>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Estimated Payout ({selectedJob?.distance} KM)</p>
                  <h3 className="text-3xl font-black text-indigo-700">₹{selectedJob?.totalPrice?.toFixed(2)}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black">
                    {selectedJob?.order.paymentStatus === 'PAID' ? 'PRE-PAID' : 'COD'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 h-12 rounded-2xl font-bold text-gray-500" 
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
            {selectedJob?.status === 'REQUESTED' && (
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20"
                onClick={() => {
                  handleJobStatus(selectedJob.id, 'ACCEPTED');
                  setIsDetailDialogOpen(false);
                }}
              >
                Accept This Job
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
