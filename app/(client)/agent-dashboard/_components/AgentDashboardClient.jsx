
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createAgentProfile, updateAgentProfile } from '@/actions/agent-profile';
import { useFetch } from '@/hooks/use-fetch';
import { z } from 'zod';
import { agentSchema } from '@/lib/zodSchema';
import LocationPicker from '@/components/LocationPicker';
import ImageUpload from '@/components/ImageUpload';
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, User, Phone, Briefcase, CheckCircle2, MapPin,
  ShoppingBag, Search, TrendingUp, ArrowRight, Plus, Package,
  Settings, Truck, CreditCard, Sparkles, Star, Award, Shield,
  Zap, Heart, Building2, Globe, Mail, FileText, BadgeCheck,
  AlertCircle, Info, Hash, IndianRupee, ChevronRight, ChevronLeft,
  BarChart3, Users, Target, Clock, Crown, Gem, Flame, Loader2,
  MessageCircle, Navigation, Camera, Upload
} from "lucide-react";
import Link from 'next/link';
import { toast } from "sonner";

// Agent Type Options
const agentTypeOptions = [
  "Wholesale Buyer",
  "Fertilizer Provider",
  "Pesticide Dealer",
  "Nursery Owner",
  "FMCG Buyer",
  "Retailer/Shop Owner",
  "Logistics/Transport",
  "Other"
];

const particlePositions = Array.from({ length: 30 }, (_, index) => {
  const left = ((index * 37.3 + 12.5) % 100).toFixed(4);
  const top = ((index * 63.7 + 24.1) % 100).toFixed(4);
  const duration = 3 + ((index * 0.37) % 4);
  const delay = ((index * 0.13) % 2);
  return { left: `${left}%`, top: `${top}%`, duration, delay };
});

export default function AgentDashboardClient({ user, profileExists: initialProfileExists }) {
  const router = useRouter();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [initialProfileExists, user]);

  // --- Agent Type State ---
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [otherType, setOtherType] = useState("");

  // Business state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("buy");
  const [aadharFront, setAadharFront] = useState("");
  const [aadharBack, setAadharBack] = useState("");

  // Location State
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("IN");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState(20.5937);
  const [lng, setLng] = useState(78.9629);

  // Payment info
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    if (!initialProfileExists) {
      setIsDialogOpen(true);
    }

    if (initialProfileExists && user?.agentProfile) {
      const rawAgentTypes = user.agentProfile.agentType || [];
      const standardAgentTypes = rawAgentTypes.filter((type) => agentTypeOptions.includes(type) && type !== "Other");
      const customAgentTypes = rawAgentTypes.filter((type) => !agentTypeOptions.includes(type) && type !== "Other");
      const hasOtherPlaceholder = rawAgentTypes.includes("Other");

      setSelectedTypes([
        ...new Set([
          ...standardAgentTypes,
          ...(customAgentTypes.length || hasOtherPlaceholder ? ["Other"] : []),
        ]),
      ]);
      setOtherType(customAgentTypes[0] || "");
      setAddress(user.agentProfile.address || "");
      setCountry(user.agentProfile.country || "IN");
      setStateCode(user.agentProfile.state || "");
      setCity(user.agentProfile.city || "");
      setPincode(user.agentProfile.pincode || "");
      setLat(user.agentProfile.lat || 20.5937);
      setLng(user.agentProfile.lng || 78.9629);
      setName(user.agentProfile.name || user.name || "");
      setCompanyName(user.agentProfile.companyName || "");
      setPhone(user.agentProfile.phone || "");
      setAadharNumber(user.agentProfile.aadharNumber || "");
      setAadharFront(user.agentProfile.aadharFront || "");
      setAadharBack(user.agentProfile.aadharBack || "");
      setUsagePurpose(user.agentProfile.usagePurpose || "buy");
      setUpiId(user.agentProfile.upiId || "");
      setBankName(user.agentProfile.bankName || "");
      setIfscCode(user.agentProfile.ifscCode || "");
      setAccountNumber(user.agentProfile.accountNumber || "");
    }
  }, [initialProfileExists, user]);

  const { execute: submitProfile, isLoading: isPending } = useFetch(
    profileExists ? updateAgentProfile : createAgentProfile
  );

  const updateFormProgress = (step) => {
    const progressMap = { 1: 25, 2: 50, 3: 75, 4: 100 };
    setFormProgress(progressMap[step] || 0);
  };

  const nextFormStep = () => {
    if (formStep < 4) {
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
    { id: 1, icon: Building2, title: "Business", color: "blue" },
    { id: 2, icon: MapPin, title: "Location", color: "indigo" },
    { id: 3, icon: Briefcase, title: "Type", color: "purple" },
    { id: 4, icon: CreditCard, title: "Payment", color: "emerald" }
  ];

  const handleProfileSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const formData = new FormData();
    formData.delete('agentType');

    formData.set('name', name.trim());
    formData.set('companyName', companyName.trim());
    formData.set('phone', phone.trim());
    formData.set('aadharNumber', aadharNumber.trim());

    formData.set('address', address.trim());
    formData.set('country', country);
    formData.set('state', stateCode);
    formData.set('city', city);
    formData.set('pincode', pincode.trim());
    formData.set('lat', lat.toString());
    formData.set('lng', lng.toString());

    formData.set('upiId', upiId.trim());
    formData.set('bankName', bankName.trim());
    formData.set('ifscCode', ifscCode.trim());
    formData.set('accountNumber', accountNumber.trim());
    formData.set('aadharFront', aadharFront);
    formData.set('aadharBack', aadharBack);
    formData.set('usagePurpose', usagePurpose);

    selectedTypes.forEach(type => {
      if (type !== "Other") {
        formData.append('agentType', type);
      }
    });

    if (selectedTypes.includes("Other") && !otherType.trim()) {
      toast.error("Please specify the custom business type for Other.", {
        description: "Enter a custom type before submitting.",
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    if (selectedTypes.includes("Other") && otherType.trim()) {
      formData.append('agentType', otherType.trim());
    }

    const formValues = Object.fromEntries(formData.entries());
    formValues.agentType = formData.getAll('agentType');

    try {
      const valuesForValidation = {
        ...formValues,
        lat: parseFloat(lat.toString()),
        lng: parseFloat(lng.toString())
      };
      agentSchema.parse(valuesForValidation);
    } catch (error) {
      const validationMessage =
        error instanceof z.ZodError
          ? error.errors?.[0]?.message || error.issues?.[0]?.message || "Please fix the highlighted fields."
          : error?.message || "Validation failed. Please check your input.";

      toast.error("Validation Error", {
        description: validationMessage,
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    const result = await submitProfile(formData);
    if (result?.success) {
      setIsDialogOpen(false);
      toast.success(profileExists ? "🎉 Profile Updated!" : "🏢 Business Profile Ready!", {
        description: profileExists ? "Your changes have been saved." : "Start trading on the marketplace!",
        icon: profileExists ? <CheckCircle2 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />
      });

      if (!profileExists) {
        window.location.reload();
      } else {
        setProfileExists(true);
        router.refresh();
      }
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  // --- WELCOME / SETUP SCREEN ---
  if (!profileExists) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 150, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -120, 0],
              y: [0, 80, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 -left-40 w-[700px] h-[700px] bg-gradient-to-tr from-purple-400/20 to-blue-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-violet-500/5 rounded-full blur-3xl"
          />

          {/* Floating particles */}
          {mounted && particlePositions.map((p, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
                y: [0, -20, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
              }}
              className="absolute w-1.5 h-1.5 bg-blue-300/50 rounded-full"
              style={{
                left: p.left,
                top: p.top,
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
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative inline-block mb-6"
            >
              <div className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                <Building2 className="h-16 w-16 text-white" />
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
              className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent"
            >
              Welcome, Agent!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl md:text-2xl text-blue-100/80 max-w-2xl mx-auto"
            >
              Connect with farmers, source fresh produce, and grow your business
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
                <h2 className="text-2xl font-bold text-white mb-2">Start Your Business</h2>
                <p className="text-blue-100/70">Set up your agent profile in minutes</p>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  { icon: CheckCircle2, text: "Register your business details" },
                  { icon: Package, text: "Source products from farmers" },
                  { icon: TrendingUp, text: "Sell on the marketplace" },
                  { icon: IndianRupee, text: "Receive secure payments" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + idx * 0.1 }}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <item.icon className="h-5 w-5 text-blue-300" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <Dialog defaultOpen={!initialProfileExists}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-bold shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 rounded-2xl transition-all duration-300 group">
                    <Crown className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Set Up Business Profile
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </DialogTrigger>

                {/* --- PREMIUM MULTI-STEP FORM DIALOG --- */}
                <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col bg-gradient-to-b from-slate-50 to-white border-0 shadow-2xl rounded-3xl">

                  {/* Dialog Header */}
                  <DialogHeader className="relative px-8 py-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white border-0 m-0 rounded-t-3xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ rotate: 15 }}
                          className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl"
                        >
                          <Briefcase className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                          <DialogTitle className="text-2xl font-bold text-white">
                            {profileExists ? 'Update Profile' : 'Business Registration'}
                          </DialogTitle>
                          <DialogDescription className="text-blue-100 font-medium mt-1">
                            Step {formStep} of 4 • Complete your business profile
                          </DialogDescription>
                        </div>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm px-4 py-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Verified Process
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-6">
                      <Progress value={formProgress} className="h-2 bg-white/20">
                        <div className="h-full bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 rounded-full transition-all duration-500" />
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
                                ? "bg-yellow-400 text-indigo-900 shadow-lg"
                                : isActive
                                  ? "bg-white text-indigo-600 shadow-xl scale-110"
                                  : "bg-white/20 text-white/60 hover:bg-white/30"
                                }`}>
                                <StepIcon className="h-5 w-5" />
                                {isCompleted && (
                                  <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-400 bg-white rounded-full" />
                                )}
                              </div>
                              <span className={`mt-2 text-xs font-semibold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-blue-200' : 'text-white/50'
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

                        {/* Step 1: Business Info */}
                        {formStep === 1 && (
                          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
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
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Browse the marketplace and purchase produce from farmers and other agents.</p>
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
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">List products for sale AND browse the marketplace. Requires admin approval.</p>
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
                            <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-lg shadow-blue-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/25">
                                  <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Business Information</h3>
                                  <p className="text-sm text-gray-500">Basic business details and contact</p>
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
                                  <Label className="text-sm font-semibold text-gray-700">
                                    Company Name
                                  </Label>
                                  <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                      name="companyName"
                                      placeholder="e.g. Fresh Trade Solutions"
                                      value={companyName}
                                      onChange={(e) => setCompanyName(e.target.value)}
                                      className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all"
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
                                      placeholder="+91 98765 43210"
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all"
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

                                {/* Aadhar Front */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Aadhar Front Side</Label>
                                  <ImageUpload
                                    value={aadharFront ? [aadharFront] : []}
                                    onChange={(urls) => setAadharFront(urls[0])}
                                    onRemove={() => setAadharFront("")}
                                  />
                                </div>

                                {/* Aadhar Back */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Aadhar Back Side</Label>
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

                        {/* Step 2: Location */}
                        {formStep === 2 && (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-lg shadow-indigo-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/25">
                                  <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Business Location</h3>
                                  <p className="text-sm text-gray-500">Where your business operates <span className="text-red-500">*</span></p>
                                </div>
                              </div>

                              <div className="space-y-4">
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
                            </div>
                          </motion.div>
                        )}

                        {/* Step 3: Agent Type - FIXED INFINITE LOOP */}
                        {formStep === 3 && (
                          <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                          >
                            <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-lg shadow-purple-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-500/25">
                                  <Briefcase className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Business Type</h3>
                                  <p className="text-sm text-gray-500">Select your business categories <span className="text-red-500">*</span></p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {agentTypeOptions.map((type) => (
                                  <div
                                    key={type}
                                    className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${selectedTypes.includes(type)
                                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-400 shadow-lg shadow-purple-500/10'
                                      : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-white'
                                      }`}
                                  >
                                    <Checkbox
                                      id={`type-${type}`}
                                      checked={selectedTypes.includes(type)}
                                      onCheckedChange={(checked) => {
                                        setSelectedTypes(prev =>
                                          checked
                                            ? [...prev, type]
                                            : prev.filter(t => t !== type)
                                        );
                                      }}
                                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <Label
                                      htmlFor={`type-${type}`}
                                      className={`text-sm font-semibold cursor-pointer flex-1 ${selectedTypes.includes(type) ? 'text-purple-800' : 'text-gray-700'
                                        }`}
                                    >
                                      {type}
                                    </Label>
                                    {selectedTypes.includes(type) && (
                                      <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-purple-500" />
                                    )}
                                  </div>
                                ))}
                              </div>

                              <AnimatePresence>
                                {selectedTypes.includes("Other") && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                  >
                                    <Separator className="my-4" />
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                                      <Label className="text-purple-700 text-sm font-bold flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4" />
                                        Specify Business Type
                                      </Label>
                                      <Input
                                        value={otherType}
                                        onChange={(e) => setOtherType(e.target.value)}
                                        placeholder="e.g. Exotic Fruit Importer, Cold Storage Provider..."
                                        className="h-12 bg-white border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 4: Payment Details */}
                        {formStep === 4 && (
                          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-lg shadow-emerald-500/5">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/25">
                                  <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                                  <p className="text-sm text-gray-500">Required if you plan to sell on the platform</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700">UPI ID {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input name="upiId" placeholder="user@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 font-mono text-emerald-700 rounded-xl" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">Bank Name {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input name="bankName" placeholder="e.g. HDFC Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-gray-700">IFSC Code {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input name="ifscCode" placeholder="HDFC0001234" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 uppercase font-mono rounded-xl" />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                  <Label className="text-sm font-semibold text-gray-700">Account Number {usagePurpose === "buy_and_sell" && <span className="text-red-500">*</span>}</Label>
                                  <Input name="accountNumber" type="password" placeholder="••••••••••••" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-14 bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 focus:border-emerald-500 font-mono tracking-widest rounded-xl" />
                                </div>
                              </div>
                            </div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" /> Profile Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Business Type:</span>
                                  <p className="font-semibold text-gray-800">{selectedTypes.length > 0 ? selectedTypes.join(", ") : "None selected"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Steps Completed:</span>
                                  <p className="font-semibold text-blue-700">4/4</p>
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
                        className="h-12 px-6 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all font-semibold disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                      </Button>

                      {formStep < 4 ? (
                        <Button
                          type="button"
                          onClick={nextFormStep}
                          className="h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-xl transition-all font-semibold"
                        >
                          Next <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isPending}
                          className="h-14 px-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 rounded-xl transition-all font-bold text-lg group"
                        >
                          {isPending ? (
                            <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Setting Up...</>
                          ) : (
                            <><Crown className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" /> Complete Registration <Sparkles className="h-5 w-5 ml-2 group-hover:scale-125 transition-transform" /></>
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

  // --- 2. MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
              <p className="text-lg text-gray-600">Welcome, {user.agentProfile?.companyName || user.agentProfile?.name}!</p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Verified Trader
              </span>
              {user.agentProfile?.usagePurpose === 'buy_and_sell' && user.agentProfile?.sellingStatus === 'PENDING' && (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1">
                  Selling: Pending Approval
                </span>
              )}
            </div>
          </div>
          
          {/* Main Action Grid */}
          {profileExists && user?.agentProfile && (user.agentProfile.lat === null || user.agentProfile.lng === null || user.agentProfile.lat === undefined || user.agentProfile.lng === undefined) && (
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
                      Please set your business location in your profile to enable logistics calculation and reach local customers effectively.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/agent-dashboard/edit#location')}
                  className="w-full md:w-auto h-14 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Update Location in Profile
                </Button>
              </div>
            </motion.div>
          )}

          {(() => {
            const isSellingApproved = user.agentProfile?.sellingStatus === 'APPROVED';
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* --- BUYING SECTION --- */}
                <DashboardCard
                  icon={Store}
                  title="Marketplace"
                  description="Browse fresh produce from farmers and other agents."
                  color="blue"
                  action={() => router.push('/marketplace')}
                  buttonText="Browse Products"
                  buttonIcon={Search}
                  primary
                />

                <DashboardCard
                  icon={ShoppingBag}
                  title="My Orders"
                  description="Track your purchases and delivery status."
                  color="indigo"
                  action={() => router.push('/my-orders')}
                  buttonText="My Orders"
                />

                {/* --- SELLING SECTION (Protected) --- */}
                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.agentProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Admin Approval"}
                  icon={Plus}
                  title="Sell Products"
                  description="Have stock? List it on the marketplace."
                  color="green"
                  action={() => router.push('/agent-dashboard/create-listing')}
                  buttonText="Create Listing"
                  buttonIcon={TrendingUp}
                  primary
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.agentProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Admin Approval"}
                  icon={Package}
                  title="My Inventory"
                  description="Manage products you have listed for sale."
                  color="emerald"
                  action={() => router.push('/agent-dashboard/my-listings')}
                  buttonText="View My Listings"
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.agentProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Admin Approval"}
                  icon={Truck}
                  title="Manage Orders"
                  description="Update order status and add tracking details."
                  color="orange"
                  action={() => router.push('/agent-dashboard/manage-orders')}
                  buttonText="Manage Orders"
                />

                <DashboardCard
                  disabled={!isSellingApproved}
                  disabledMsg={user.agentProfile?.usagePurpose !== 'buy_and_sell' ? "Buy-only Profile" : "Pending Admin Approval"}
                  icon={TrendingUp}
                  title="Sales"
                  description="View your sold products and earnings."
                  color="purple"
                  action={() => router.push('/agent-dashboard/sales')}
                  buttonText="View Sales"
                />

                {/* --- ACCOUNT SECTION --- */}
                <DashboardCard
                  icon={User}
                  title="Business Profile"
                  description="Update company details and payment info."
                  color="gray"
                  action={() => router.push('/agent-dashboard/edit')}
                  buttonText="Edit Profile"
                />

                <DashboardCard
                  icon={Settings}
                  title="Settings"
                  description="Notifications and security settings."
                  color="gray"
                  disabled
                  disabledMsg="Coming Soon"
                  buttonText="Settings"
                />
              </div>
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
  color = "blue",
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
    indigo: "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/30 text-white",
    gray: "bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-slate-500/30 text-white",
  };

  const subtleButtonStyles = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200",
    green: "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border-orange-200",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-800 border-gray-200",
  };

  const colorClasses = {
    green: { bg: "bg-gradient-to-br from-green-100 to-emerald-100", text: "text-green-600", border: "border-green-200", hover: "hover:border-green-400", shadow: "shadow-green-500/10" },
    blue: { bg: "bg-gradient-to-br from-blue-100 to-cyan-100", text: "text-blue-600", border: "border-blue-200", hover: "hover:border-blue-400", shadow: "shadow-blue-500/10" },
    emerald: { bg: "bg-gradient-to-br from-emerald-100 to-teal-100", text: "text-emerald-600", border: "border-emerald-200", hover: "hover:border-emerald-400", shadow: "shadow-emerald-500/10" },
    purple: { bg: "bg-gradient-to-br from-purple-100 to-violet-100", text: "text-purple-600", border: "border-purple-200", hover: "hover:border-purple-400", shadow: "shadow-purple-500/10" },
    orange: { bg: "bg-gradient-to-br from-orange-100 to-amber-100", text: "text-orange-600", border: "border-orange-200", hover: "hover:border-orange-400", shadow: "shadow-orange-500/10" },
    indigo: { bg: "bg-gradient-to-br from-indigo-100 to-blue-100", text: "text-indigo-600", border: "border-indigo-200", hover: "hover:border-indigo-400", shadow: "shadow-indigo-500/10" },
    gray: { bg: "bg-gradient-to-br from-gray-100 to-slate-100", text: "text-gray-600", border: "border-gray-200", hover: "hover:border-gray-400", shadow: "shadow-gray-500/10" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

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