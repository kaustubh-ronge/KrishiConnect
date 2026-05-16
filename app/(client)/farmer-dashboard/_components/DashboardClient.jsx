

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createFarmerProfile, updateFarmerProfile } from '@/actions/farmer-profile';
import { useFetch } from '@/hooks/use-fetch';
import { farmerSchema } from '@/lib/zodSchema';
import LocationPicker from '@/components/LocationPicker';
import ImageUpload from '@/components/ImageUpload';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sprout, User, MapPin, LandPlot, CheckCircle2,
  Plus, Package, BarChart3, Settings, MessageCircle,
  ArrowRight, X, TrendingUp, Loader2,
  ShoppingBag, Store, Search, Truck, CreditCard,
  Sparkles, Star, Award, Shield, Zap, Heart,
  Leaf, Wheat, Cloud, Sun, Moon, Compass,
  Target, Gift, Bell, Users, Calendar, Clock,
  ChevronRight, ChevronLeft, Upload, Camera, Phone,
  Mail, Building2, FileText, BadgeCheck, AlertCircle,
  Info, Hash, IndianRupee, Scale, Flame, Crown, Gem
} from "lucide-react";
import Link from 'next/link';
import z from 'zod';

// List of standard crops
const produceOptions = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Other"];

const starPositions = Array.from({ length: 20 }, (_, index) => {
  const left = ((index * 37.3 + 12.5) % 100).toFixed(4);
  const top = ((index * 63.7 + 24.1) % 100).toFixed(4);
  const duration = 3 + ((index * 0.37) % 4);
  const delay = ((index * 0.13) % 2);
  return { left: `${left}%`, top: `${top}%`, duration, delay };
});

export default function DashboardClient({ user, profileExists: initialProfileExists }) {
  const router = useRouter();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const [formStep, setFormStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [initialProfileExists, user]);

  // --- Form State ---
  const [selectedProduce, setSelectedProduce] = useState([]);
  const [otherProduce, setOtherProduce] = useState("");
  const [formProgress, setFormProgress] = useState(25);
  const [usagePurpose, setUsagePurpose] = useState("buy");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmingExperience, setFarmingExperience] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("IN");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [aadharFront, setAadharFront] = useState("");
  const [aadharBack, setAadharBack] = useState("");

  useEffect(() => {
    if (!user) return;

    const profile = user.farmerProfile || {};
    setName(profile.name || user.name || "");
    setPhone(profile.phone || "");
    setAadharNumber(profile.aadharNumber || "");
    setFarmName(profile.farmName || "");
    setFarmSize(profile.farmSize?.toString() || "");
    setFarmingExperience(profile.farmingExperience?.toString() || "");
    setAddress(profile.address || "");
    setCountry(profile.country || "IN");
    setStateCode(profile.state || "");
    setCity(profile.city || "");
    setPincode(profile.pincode || "");
    setLat(profile.lat || 20.5937);
    setLng(profile.lng || 78.9629);
    setAadharFront(profile.aadharFront || "");
    setAadharBack(profile.aadharBack || "");
    setUsagePurpose(profile.usagePurpose || "buy");

    if (initialProfileExists && profile.primaryProduce) {
      const knownProduce = profile.primaryProduce.filter((item) => produceOptions.includes(item));
      const customProduce = profile.primaryProduce.find((item) => !produceOptions.includes(item)) || "";
      setSelectedProduce(customProduce ? [...new Set([...knownProduce, "Other"])] : knownProduce);
      setOtherProduce(customProduce);
    }
  }, [initialProfileExists, user]);

  const goToCreateListing = () => {
    router.push('/farmer-dashboard/create-listing');
  };

  // --- useFetch Hook ---
  const { execute: submitProfile, isLoading: isPending } = useFetch(
    profileExists ? updateFarmerProfile : createFarmerProfile
  );

  // --- Form Submission ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const submissionData = new FormData();
    submissionData.append('name', name.trim());
    submissionData.append('phone', phone.trim());
    submissionData.append('aadharNumber', aadharNumber.trim());
    submissionData.append('farmName', farmName.trim());
    submissionData.append('farmSize', farmSize.trim());
    submissionData.append('farmingExperience', farmingExperience.trim());
    submissionData.append('address', address.trim());
    submissionData.append('country', country);
    submissionData.append('state', stateCode);
    submissionData.append('city', city);
    submissionData.append('pincode', pincode.trim());
    submissionData.append('lat', lat.toString());
    submissionData.append('lng', lng.toString());
    submissionData.append('upiId', upiId.trim());
    submissionData.append('bankName', bankName.trim());
    submissionData.append('ifscCode', ifscCode.trim());
    submissionData.append('accountNumber', accountNumber.trim());
    submissionData.append('aadharFront', aadharFront);
    submissionData.append('aadharBack', aadharBack);
    submissionData.append('usagePurpose', usagePurpose);

    selectedProduce.forEach((produce) => {
      if (produce !== "Other") {
        submissionData.append('primaryProduce', produce);
      }
    });

    if (selectedProduce.includes("Other") && otherProduce.trim()) {
      submissionData.append('primaryProduce', otherProduce.trim());
    }

    const formValues = {
      name: name.trim(),
      phone: phone.trim(),
      aadharNumber: aadharNumber.trim(),
      farmName: farmName.trim(),
      farmSize: farmSize.trim(),
      farmingExperience: farmingExperience.trim(),
      address: address.trim(),
      country,
      state: stateCode,
      city,
      pincode: pincode.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      upiId: upiId.trim(),
      bankName: bankName.trim(),
      ifscCode: ifscCode.trim(),
      accountNumber: accountNumber.trim(),
      usagePurpose,
      primaryProduce: submissionData.getAll('primaryProduce'),
      aadharFront,
      aadharBack,
    };

    try {
      farmerSchema.parse(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message || error.issues?.[0]?.message || "Invalid form data";
        toast.error("Validation Error", {
          description: errorMessage,
          icon: <AlertCircle className="h-5 w-5" />
        });
        return;
      }
      toast.error("Validation Error", {
        description: "An unexpected validation error occurred",
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    const result = await submitProfile(submissionData);
    if (result?.success) {
      toast.success(profileExists ? '🎉 Profile updated successfully!' : "🌾 Welcome to KrishiConnect!", {
        description: profileExists ? "Your changes have been saved." : "Your farmer profile is ready. Start selling today!",
        icon: profileExists ? <CheckCircle2 className="h-5 w-5" /> : <Sprout className="h-5 w-5" />
      });

      if (!profileExists) {
        window.location.reload();
      } else {
        setProfileExists(true);
        router.refresh();
      }
    }
  };

  const updateFormProgress = (step) => {
    const progressMap = { 1: 25, 2: 50, 3: 75, 4: 90, 5: 100 };
    setFormProgress(progressMap[step] || 0);
  };

  const nextFormStep = () => {
    if (formStep < 5) {
      const nextStep = formStep + 1;
      setFormStep(nextStep);
      updateFormProgress(nextStep);
    }
  };

  const prevFormStep = () => {
    if (formStep > 1) {
      const prevStep = formStep - 1;
      setFormStep(prevStep);
      updateFormProgress(prevStep);
    }
  };

  const formSteps = [
    { id: 1, icon: User, title: "Personal", color: "blue" },
    { id: 2, icon: LandPlot, title: "Farm", color: "amber" },
    { id: 3, icon: MapPin, title: "Location", color: "red" },
    { id: 4, icon: Sprout, title: "Produce", color: "green" },
    { id: 5, icon: CreditCard, title: "Payment", color: "purple" }
  ];

  if (!mounted) {
    return <div className="min-h-screen bg-emerald-900" />;
  }

  // --- 1. Welcome Screen (Profile Creation) ---
  if (!profileExists) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-green-400/20 to-emerald-300/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-teal-400/20 to-green-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400/5 to-green-400/5 rounded-full blur-3xl"
          />

          {/* Stars/particles */}
          {mounted && starPositions.map((star, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: star.left,
                top: star.top,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative inline-block mb-6"
            >
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50">
                <Sprout className="h-16 w-16 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 -right-3"
              >
                <Sparkles className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-green-200 via-white to-emerald-200 bg-clip-text text-transparent"
            >
              Welcome, Farmer!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl md:text-2xl text-green-100/80 max-w-2xl mx-auto"
            >
              Join thousands of farmers selling directly to buyers across India
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Get Started in Minutes</h2>
                <p className="text-green-100/70">Set up your profile and start selling your produce</p>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  { icon: CheckCircle2, text: "Create your farmer profile" },
                  { icon: Package, text: "List your produce for sale" },
                  { icon: TrendingUp, text: "Connect with buyers instantly" },
                  { icon: IndianRupee, text: "Receive payments directly" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + idx * 0.1 }}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <item.icon className="h-5 w-5 text-green-300" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <Dialog defaultOpen={!initialProfileExists}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full h-14 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-lg font-bold shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 rounded-2xl transition-all duration-300 group">
                    <Star className="h-5 w-5 mr-2 group-hover:rotate-45 transition-transform" />
                    Set Up My Farmer Profile
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </DialogTrigger>

                {/* --- PREMIUM MULTI-STEP FORM DIALOG --- */}
                <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col bg-gradient-to-b from-slate-50 to-white border-0 shadow-2xl rounded-3xl">

                  {/* Dialog Header */}
                  <DialogHeader className="relative px-8 py-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white border-0 m-0 rounded-t-3xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ rotate: 15 }}
                          className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl"
                        >
                          <User className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                          <DialogTitle className="text-2xl font-bold text-white">
                            {profileExists ? 'Update Profile' : 'Create Your Profile'}
                          </DialogTitle>
                          <DialogDescription className="text-green-100 font-medium mt-1">
                            Step {formStep} of 5 • Complete all sections to start trading
                          </DialogDescription>
                        </div>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm">
                        <Shield className="h-4 w-4 mr-1" />
                        Secure Setup
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-6">
                      <Progress value={formProgress} className="h-2 bg-white/20">
                        <div className="h-full bg-gradient-to-r from-yellow-300 via-green-200 to-white rounded-full transition-all duration-500" />
                      </Progress>
                    </div>

                    {/* Step Indicators */}
                    <div className="relative flex justify-between mt-4">
                      {formSteps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = formStep === step.id;
                        const isCompleted = formStep > step.id;

                        return (
                          <div key={step.id} className="flex items-center flex-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setFormStep(step.id);
                                updateFormProgress(step.id);
                              }}
                              className={`relative flex flex-col items-center group ${idx < formSteps.length - 1 ? 'flex-1' : ''
                                }`}
                            >
                              <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isCompleted
                                ? "bg-yellow-400 text-emerald-900 shadow-lg"
                                : isActive
                                  ? "bg-white text-emerald-600 shadow-xl scale-110"
                                  : "bg-white/20 text-white/60 hover:bg-white/30"
                                }`}>
                                <StepIcon className="h-5 w-5" />
                                {isCompleted && (
                                  <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-400 bg-white rounded-full" />
                                )}
                              </div>
                              <span className={`mt-2 text-xs font-semibold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-green-200' : 'text-white/50'
                                }`}>
                                {step.title}
                              </span>
                            </motion.button>

                            {idx < formSteps.length - 1 && (
                              <div className="flex-1 h-0.5 mx-2 mt-[-16px] bg-white/20">
                                {isCompleted && (
                                  <div className="h-full bg-gradient-to-r from-yellow-400 to-white rounded-full" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </DialogHeader>

                  <form onSubmit={handleProfileSubmit} className="flex-1 overflow-hidden flex flex-col">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                      <AnimatePresence mode="wait">
                        {/* Step 1: Personal Info */}
                        {formStep === 1 && (
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            {/* Profile Purpose Card */}
                            <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-lg shadow-indigo-500/5">
                              <div className="flex items-center gap-3 mb-5">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/25">
                                  <Target className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Profile Purpose <span className="text-red-500">*</span></h3>
                                  <p className="text-sm text-gray-500">Choose how you want to use KrishiConnect</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Buy Only */}
                                <button
                                  type="button"
                                  onClick={() => setUsagePurpose("buy")}
                                  className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${usagePurpose === "buy"
                                    ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/15 ring-2 ring-indigo-300"
                                    : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30"
                                    }`}
                                >
                                  <div className={`p-2.5 rounded-xl ${usagePurpose === "buy" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"} transition-all`}>
                                    <ShoppingBag className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-base">Buy Only</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Browse the marketplace and purchase produce from other farmers and agents.</p>
                                  </div>
                                  {usagePurpose === "buy" && (
                                    <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-indigo-500" />
                                  )}
                                </button>

                                {/* Buy & Sell */}
                                <button
                                  type="button"
                                  onClick={() => setUsagePurpose("buy_and_sell")}
                                  className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${usagePurpose === "buy_and_sell"
                                    ? "border-green-500 bg-green-50 shadow-lg shadow-green-500/15 ring-2 ring-green-300"
                                    : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/30"
                                    }`}
                                >
                                  <div className={`p-2.5 rounded-xl ${usagePurpose === "buy_and_sell" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"} transition-all`}>
                                    <Store className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-base">Buy & Sell</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">List your own produce for sale AND browse the marketplace. Requires admin approval.</p>
                                  </div>
                                  {usagePurpose === "buy_and_sell" && (
                                    <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-green-500" />
                                  )}
                                </button>
                              </div>

                              {usagePurpose === "buy_and_sell" && (
                                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                  <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                                  <span>Your profile will be reviewed by an admin before you can list products for sale. You can still browse and purchase immediately.</span>
                                </div>
                              )}
                            </div>

                            {/* Personal Information Card */}
                            <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-lg shadow-blue-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/25">
                                  <User className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                                  <p className="text-sm text-gray-500">Basic details to verify your identity</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    Full Name <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                      name="name"
                                      required
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all"
                                      placeholder="Enter your full name"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    Phone Number <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                      name="phone"
                                      required
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all"
                                      placeholder="+91 98765 43210"
                                    />
                                  </div>
                                </div>

                                  <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                      <Shield className="h-4 w-4" />
                                      Aadhar Number {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}
                                    </Label>
                                    <div className="relative">
                                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                      <Input
                                        name="aadharNumber"
                                        placeholder="XXXX XXXX XXXX"
                                        maxLength={12}
                                        value={aadharNumber}
                                        onChange={(e) => setAadharNumber(e.target.value)}
                                        className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all font-mono tracking-widest"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                      Aadhar Front Side {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}
                                    </Label>
                                    <ImageUpload
                                      value={aadharFront ? [aadharFront] : []}
                                      onChange={(urls) => setAadharFront(urls[0])}
                                      onRemove={() => setAadharFront("")}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                      Aadhar Back Side {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}
                                    </Label>
                                    <ImageUpload
                                      value={aadharBack ? [aadharBack] : []}
                                      onChange={(urls) => setAadharBack(urls[0])}
                                      onRemove={() => setAadharBack("")}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                        {/* Step 2: Farm Info */}
                        {formStep === 2 && (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-amber-100 p-6 shadow-lg shadow-amber-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl text-white shadow-lg shadow-amber-500/25">
                                  <LandPlot className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Farm Information</h3>
                                  <p className="text-sm text-gray-500">Tell us about your farm</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">
                                    Farm Name
                                  </Label>
                                  <Input
                                    name="farmName"
                                    placeholder="e.g. Sunny Fields"
                                    value={farmName}
                                    onChange={(e) => setFarmName(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl transition-all"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">
                                    Farm Size (Acres)
                                  </Label>
                                  <Input
                                    name="farmSize"
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={farmSize}
                                    onChange={(e) => setFarmSize(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl transition-all"
                                  />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700">
                                    Farming Experience (Years)
                                  </Label>
                                  <Input
                                    name="farmingExperience"
                                    type="number"
                                    placeholder="e.g. 5"
                                    value={farmingExperience}
                                    onChange={(e) => setFarmingExperience(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 3: Location */}
                        {formStep === 3 && (
                          <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-red-100 p-6 shadow-lg shadow-red-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl text-white shadow-lg shadow-red-500/25">
                                  <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Location</h3>
                                  <p className="text-sm text-gray-500">Your farm address for buyers</p>
                                </div>
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
                            </div>
                          </motion.div>
                        )}

                        {/* Step 4: Produce */}
                        {formStep === 4 && (
                          <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-green-100 p-6 shadow-lg shadow-green-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-green-500/25">
                                  <Sprout className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Primary Produce</h3>
                                  <p className="text-sm text-gray-500">Select what you grow <span className="text-red-500">*</span></p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Label className="text-sm font-semibold text-gray-700">Select Primary Produce <span className="text-red-500">*</span></Label>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                  {produceOptions.map((produce) => (
                                    <div key={produce} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-colors">
                                      <Checkbox
                                        id={`produce-${produce}`}
                                        checked={selectedProduce.includes(produce)}
                                        onCheckedChange={(checked) => {
                                          setSelectedProduce(prev =>
                                            checked
                                              ? [...prev, produce]
                                              : prev.filter(p => p !== produce)
                                          );
                                        }}
                                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                      />
                                      <Label
                                        htmlFor={`produce-${produce}`}
                                        className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                                      >
                                        {produce}
                                      </Label>
                                      {selectedProduce.includes(produce) && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Display selected produce as badges */}
                                {selectedProduce.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {selectedProduce.map((produce) => (
                                      <Badge
                                        key={produce}
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 border-green-200 px-3 py-1"
                                      >
                                        {produce}
                                        <X
                                          className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600"
                                          onClick={() => setSelectedProduce(prev => prev.filter(p => p !== produce))}
                                        />
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <AnimatePresence>
                                {selectedProduce.includes("Other") && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                  >
                                    <Separator className="my-4" />
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                      <Label className="text-green-700 text-sm font-bold flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4" />
                                        Specify Other Produce
                                      </Label>
                                      <Input
                                        value={otherProduce}
                                        onChange={(e) => setOtherProduce(e.target.value)}
                                        placeholder="e.g. Dragon Fruit, Mangoes..."
                                        className="h-12 bg-white border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-xl"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 5: Payment */}
                        {formStep === 5 && (
                          <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-lg shadow-purple-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-xl text-white shadow-lg shadow-purple-500/25">
                                  <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                                  <p className="text-sm text-gray-500">Where you'll receive payments</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700">UPI ID {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                      name="upiId"
                                      placeholder="user@oksbi"
                                      value={upiId}
                                      onChange={(e) => setUpiId(e.target.value)}
                                      className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl transition-all font-mono text-purple-700"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Bank Name {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input
                                    name="bankName"
                                    placeholder="e.g. SBI"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl transition-all"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">IFSC Code {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input
                                    name="ifscCode"
                                    placeholder="SBIN0001234"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl transition-all uppercase font-mono"
                                  />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700">Account Number {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input
                                    name="accountNumber"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl transition-all font-mono tracking-widest"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Summary Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-green-200 p-6"
                            >
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Profile Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Produce:</span>
                                  <p className="font-semibold text-gray-800">
                                    {selectedProduce.length > 0 ? selectedProduce.join(", ") : "None selected"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Steps Completed:</span>
                                  <p className="font-semibold text-green-700">5/5</p>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sticky Footer */}
                    <div className="px-6 md:px-10 py-5 bg-white border-t-2 border-gray-100 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevFormStep}
                        disabled={formStep === 1}
                        className="h-12 px-6 border-2 border-gray-200 hover:border-green-300 rounded-xl transition-all font-semibold disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        Previous
                      </Button>

                      {formStep < 5 ? (
                        <Button
                          type="button"
                          onClick={nextFormStep}
                          className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 rounded-xl transition-all font-semibold"
                        >
                          Next
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isPending}
                          className="h-14 px-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 rounded-xl transition-all font-bold text-lg group"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="animate-spin h-5 w-5 mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Crown className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                              Complete Setup
                              <Sparkles className="h-5 w-5 ml-2 group-hover:scale-125 transition-transform" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- 2. Main Dashboard (Enhanced) ---
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-100/40">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-green-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 md:p-8 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl text-white shadow-xl shadow-green-500/25"
                >
                  <Sprout className="h-8 w-8" />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Farmer Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Welcome back, <span className="font-semibold text-green-700">{user.farmerProfile?.name || "Farmer"}</span>!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verified Farmer
                </Badge>
                {user.farmerProfile?.usagePurpose === 'buy_and_sell' && user.farmerProfile?.sellingStatus === 'PENDING' && (
                  <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200 px-4 py-2 shadow-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Selling: Pending Approval
                  </Badge>
                )}
                {user.farmerProfile?.sellingStatus === 'APPROVED' && (
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-2 shadow-sm">
                    <Award className="h-4 w-4 mr-2" />
                    Approved Seller
                  </Badge>
                )}
              </div>
            </div>
          </div>

               {profileExists && user?.farmerProfile && (user.farmerProfile.lat === null || user.farmerProfile.lng === null || user.farmerProfile.lat === undefined || user.farmerProfile.lng === undefined) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] shadow-xl shadow-rose-900/5 overflow-hidden relative group"
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
                    Please set your farm location in your profile to enable logistics calculation and reach local buyers effectively.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/farmer-dashboard/edit#location')}
                className="w-full md:w-auto h-14 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Navigation className="h-5 w-5 mr-2" />
                Update Location in Profile
              </Button>
            </div>
          </motion.div>
        )}
          {(() => {
            const isSellingApproved = user.farmerProfile?.sellingStatus === 'APPROVED';
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <DashboardCard
                  icon={Store}
                  title="Marketplace"
                  description="Browse fresh produce from farmers across India."
                  color="blue"
                  action={() => router.push('/marketplace')}
                  buttonText="Browse Products"
                  buttonIcon={Search}
                  primary
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.farmerProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Approval"}
                  icon={Plus}
                  title="Create Listing"
                  description="List your harvest and reach buyers instantly."
                  color="green"
                  action={goToCreateListing}
                  buttonText="Sell Products"
                  buttonIcon={ArrowRight}
                  primary
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.farmerProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Approval"}
                  icon={Package}
                  title="My Listings"
                  description="Manage active stock and update prices."
                  color="emerald"
                  action={() => router.push('/farmer-dashboard/my-listings')}
                  buttonText="View Inventory"
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.farmerProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Approval"}
                  icon={Truck}
                  title="Manage Orders"
                  description="Update status and add tracking details."
                  color="orange"
                  action={() => router.push('/farmer-dashboard/manage-orders')}
                  buttonText="Manage Orders"
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.farmerProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Approval"}
                  icon={TrendingUp}
                  title="Sales Analytics"
                  description="Track revenue and sold items."
                  color="purple"
                  action={() => router.push('/farmer-dashboard/sales')}
                  buttonText="View Sales"
                />

                <DashboardCard
                  icon={ShoppingBag}
                  title="My Orders"
                  description="Track products you've purchased."
                  color="pink"
                  action={() => router.push('/my-orders')}
                  buttonText="My Orders"
                />

                <DashboardCard
                  icon={Settings}
                  title="Settings"
                  description="Update profile and preferences."
                  color="gray"
                  action={() => router.push('/farmer-dashboard/edit')}
                  buttonText="Edit Profile"
                />
              </motion.div>
            );
          })()}
        </motion.div>
      </div>
    </div>
  );
}

// Enhanced Dashboard Card Component - Vibrantly Updated
function DashboardCard({
  icon: Icon,
  title,
  description,
  color = "green",
  disabled = false,
  disabledMsg = "",
  action,
  buttonText,
  buttonIcon: ButtonIcon,
  primary = false
}) {

  // High-contrast, vibrant gradients for the buttons based on the color prop
  const buttonGradients = {
    blue: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30 text-white",
    green: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 text-white",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30 text-white",
    orange: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/30 text-white",
    purple: "bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 shadow-purple-500/30 text-white",
    pink: "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/30 text-white",
    gray: "bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-slate-500/30 text-white",
  };

  const subtleButtonStyles = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200",
    green: "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border-orange-200",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200",
    pink: "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 border-pink-200",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-800 border-gray-200",
  };

  const colorClasses = {
    green: { bg: "bg-gradient-to-br from-green-100 to-emerald-100", text: "text-green-600", border: "border-green-200", hover: "hover:border-green-400", shadow: "shadow-green-500/10" },
    blue: { bg: "bg-gradient-to-br from-blue-100 to-cyan-100", text: "text-blue-600", border: "border-blue-200", hover: "hover:border-blue-400", shadow: "shadow-blue-500/10" },
    emerald: { bg: "bg-gradient-to-br from-emerald-100 to-teal-100", text: "text-emerald-600", border: "border-emerald-200", hover: "hover:border-emerald-400", shadow: "shadow-emerald-500/10" },
    purple: { bg: "bg-gradient-to-br from-purple-100 to-violet-100", text: "text-purple-600", border: "border-purple-200", hover: "hover:border-purple-400", shadow: "shadow-purple-500/10" },
    orange: { bg: "bg-gradient-to-br from-orange-100 to-amber-100", text: "text-orange-600", border: "border-orange-200", hover: "hover:border-orange-400", shadow: "shadow-orange-500/10" },
    pink: { bg: "bg-gradient-to-br from-pink-100 to-rose-100", text: "text-pink-600", border: "border-pink-200", hover: "hover:border-pink-400", shadow: "shadow-pink-500/10" },
    gray: { bg: "bg-gradient-to-br from-gray-100 to-slate-100", text: "text-gray-600", border: "border-gray-200", hover: "hover:border-gray-400", shadow: "shadow-gray-500/10" },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${colors.border} ${!disabled && colors.hover} p-6 flex flex-col justify-between h-full transition-all duration-300 ${!disabled && `shadow-xl ${colors.shadow} hover:shadow-2xl`} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
          <Badge className="bg-gray-800/90 text-white text-xs font-bold px-4 py-2 backdrop-blur-sm border border-gray-700">
            {disabledMsg}
          </Badge>
        </div>
      )}

      {/* Card Content */}
      <div className={disabled ? 'pointer-events-none' : ''}>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={!disabled ? { rotate: 10, scale: 1.1 } : {}}
            className={`p-3 rounded-xl ${colors.bg} ${colors.text} shadow-sm`}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {primary && (
            <Badge className="ml-auto bg-yellow-100 text-yellow-700 border-yellow-200">
              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
              Popular
            </Badge>
          )}
        </div>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Vibrantly Updated Button */}
      <div className={disabled ? 'pointer-events-none' : ''}>
        <Button
          onClick={action}
          disabled={disabled}
          className={`w-full h-12 font-bold rounded-xl transition-all duration-300 ${primary
            ? `${buttonGradients[color]} shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-none`
            : `${subtleButtonStyles[color]} border-2 border-dashed hover:border-solid shadow-sm`
            }`}
        >
          {ButtonIcon && <ButtonIcon className="h-4 w-4 mr-2" />}
          {buttonText}
        </Button>
      </div>
    </motion.div>
  );
}