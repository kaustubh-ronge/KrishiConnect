
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProductListing } from "@/actions/products";
import { useFetch } from "@/hooks/use-fetch";
import { z } from "zod";
import { createListingSchema } from "@/lib/zodSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  IndianRupee,
  Scale,
  Calendar,
  Phone,
  Leaf,
  X,
  Tag,
  Image as ImageIcon,
  Info,
  Package,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Camera,
  Truck,
  Clock,
  Hash,
  Star,
  Shield,
  MapPin,
  BadgePercent,
  TrendingUp,
  Zap,
  Award,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";

// Constants
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

// Steps configuration
const steps = [
  { id: 1, title: "Product", icon: Package, description: "Choose your crop" },
  { id: 2, title: "Pricing", icon: IndianRupee, description: "Set price & stock" },
  { id: 3, title: "Media", icon: Camera, description: "Upload images" },
  { id: 4, title: "Contact", icon: Phone, description: "Add details" }
];

export default function CreateListingPage() {
  const router = useRouter();
  const { execute: publishListing, isLoading: isPending } = useFetch(createProductListing);
  const [currentStep, setCurrentStep] = useState(1);

  // --- State ---
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Custom Product State
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Calculation State (for UX)
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("kg");

  // Additional form state for persisted fields
  const [qualityGrade, setQualityGrade] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [deliveryChargeType, setDeliveryChargeType] = useState("per_unit");
  const [minOrderQuantity, setMinOrderQuantity] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [shelfLifeStartDate, setShelfLifeStartDate] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Form progress tracking
  const [formProgress, setFormProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPerishable = !["Cotton", "Other"].includes(selectedCategory);

  // --- Handlers ---
  const handleImageUpload = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
    updateProgress();
  };

  const handleRemoveImage = (urlToRemove) => {
    setImages((prev) => prev.filter((url) => url !== urlToRemove));
    updateProgress();
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
  const handleTagKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } };

  const updateProgress = () => {
    let progress = 0;
    if (productName) progress += 15;
    if (selectedCategory) progress += 10;
    if (price && stock) progress += 25;
    if (images.length > 0) progress += 25;
    if (tags.length > 0) progress += 15;
    if (progress === 0) progress = 10;
    setFormProgress(progress);
  };

  // --- Submit ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const category = selectedCategory === "Other" ? customCategory.trim() : selectedCategory;
    
    if (!productName || productName.length < 3) {
      toast.error("Please enter a valid product name (min 3 chars).", {
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    if (!category) {
      toast.error("Please select a category.", {
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image.", {
        icon: <AlertCircle className="h-5 w-5" />,
        className: "bg-red-50 border-red-200"
      });
      return;
    }

    formData.set("productName", productName);
    formData.set("category", category);
    formData.set("qualityGrade", qualityGrade);
    formData.set("description", description);
    formData.set("availableStock", stock);
    formData.set("pricePerUnit", price);
    formData.set("unit", unit);
    formData.set("deliveryCharge", deliveryCharge);
    formData.set("deliveryChargeType", deliveryChargeType);
    formData.set("minOrderQuantity", minOrderQuantity);
    formData.set("harvestDate", harvestDate);
    formData.set("shelfLife", shelfLife);
    formData.set("shelfLifeStartDate", shelfLifeStartDate);
    formData.set("whatsappNumber", whatsappNumber);
    formData.set("variety", tags.join(", "));

    formData.delete("images");
    images.forEach(img => formData.append("images", img));

    const validationData = {
      productName,
      category,
      variety: tags.join(", "),
      description,
      availableStock: stock,
      pricePerUnit: price,
      minOrderQuantity,
      unit,
      deliveryCharge,
      deliveryChargeType,
      qualityGrade,
      shelfLife,
      whatsappNumber,
      harvestDate,
      shelfLifeStartDate,
      images,
    };

    try {
      createListingSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues?.[0]?.message || error.errors?.[0]?.message || "Please fix the highlighted fields";
        toast.error("Validation Error", {
          description: message,
          icon: <AlertCircle className="h-5 w-5" />
        });
        return;
      }
      toast.error("Validation failed.", {
        icon: <AlertCircle className="h-5 w-5" />
      });
      return;
    }

    const result = await publishListing(formData);
    if (result?.success) {
      toast.success("Listing Published Successfully!", {
        icon: <CheckCircle2 className="h-5 w-5" />,
        className: "bg-green-50 border-green-200"
      });
      router.push("/farmer-dashboard/my-listings");
    } else {
      toast.error("Publishing Failed", {
        description: result?.error || "Please try again later",
        icon: <AlertCircle className="h-5 w-5" />
      });
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      updateProgress();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const totalValue = (parseFloat(stock) || 0) * (parseFloat(price) || 0);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50/30 to-teal-100/40">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating gradient orbs */}
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-300/20 to-green-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-teal-300/20 to-emerald-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-green-200/15 to-lime-300/10 rounded-full blur-3xl"
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIG9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOCIvPjxjaXJjbGUgY3g9IjE4IiBjeT0iMTgiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="group text-gray-600 hover:text-emerald-700 pl-0 hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/75 backdrop-blur-xl rounded-3xl">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />

            <CardHeader className="relative bg-gradient-to-r from-emerald-50/90 via-green-50/70 to-teal-50/80 border-b border-emerald-100/50 pb-6 px-6 sm:px-8">
              {/* Header Content */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 p-4 rounded-2xl text-white shadow-xl shadow-green-500/30">
                      <Leaf className="h-8 w-8" />
                    </div>
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
                    </motion.div>
                  </motion.div>

                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                      Create New Listing
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      List your produce and reach buyers across India
                    </CardDescription>
                  </div>
                </div>

                {/* Progress Indicator */}
                <motion.div
                  className="lg:w-64"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Listing Progress
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {Math.round(formProgress)}%
                    </span>
                  </div>
                  <Progress value={formProgress} className="h-2.5 bg-gray-100">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500" />
                  </Progress>
                </motion.div>
              </div>

              {/* Steps Navigation */}
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  {steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                      <div key={step.id} className="flex items-center flex-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentStep(step.id)}
                          className={`relative flex flex-col items-center group ${idx < steps.length - 1 ? 'flex-1' : ''
                            }`}
                        >
                          <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCompleted
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                            : isActive
                              ? "bg-white text-emerald-600 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 scale-110"
                              : "bg-white/50 text-gray-400 border-2 border-gray-200 hover:border-emerald-300"
                            }`}>
                            <StepIcon className="h-6 w-6" />
                            {isCompleted && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1"
                              >
                                <CheckCircle2 className="h-5 w-5 text-yellow-400 bg-white rounded-full" />
                              </motion.div>
                            )}
                            {isActive && (
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400 ring-opacity-50"
                              />
                            )}
                          </div>

                          <span className={`mt-2 text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                            }`}>
                            {step.title}
                          </span>
                        </motion.button>

                        {idx < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 mt-[-20px]">
                            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted
                              ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                              : 'bg-gray-200'
                              }`}>
                              {isActive && (
                                <motion.div
                                  initial={{ width: '0%' }}
                                  animate={{ width: '50%' }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="px-6 sm:px-8 pt-8 pb-4">
                <AnimatePresence mode="wait">
                  {/* Step 1: Product Details */}
                  {currentStep === 1 && (
                    <motion.section
                      key="step1"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-3 rounded-xl">
                          <Package className="h-7 w-7 text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Product Details</h3>
                          <p className="text-sm text-gray-500">Tell us about your produce</p>
                        </div>
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                          Step 1 of 4
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className="space-y-2 group md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-emerald-500" />
                            Product Name *
                          </Label>
                          <Input
                            placeholder="e.g. Fresh Organic Alphanso Mangoes"
                            value={productName}
                            onChange={(e) => {
                              setProductName(e.target.value);
                              updateProgress();
                            }}
                            maxLength={100}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg"
                            required
                          />
                        </div>

                        {/* Category Select */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-emerald-500" />
                            Category *
                          </Label>
                          <Select
                            name="category"
                            required
                            value={selectedCategory}
                            onValueChange={(value) => {
                              setSelectedCategory(value);
                              updateProgress();
                            }}
                          >
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue placeholder="Choose category..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {produceCategories.map(c => (
                                <SelectItem key={c} value={c} className="py-3 cursor-pointer hover:bg-emerald-50">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <AnimatePresence>
                            {selectedCategory === "Other" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="pt-3"
                              >
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-200">
                                  <Label className="text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                                    <Info className="h-3 w-3" />
                                    Custom Category Name
                                  </Label>
                                  <Input
                                    placeholder="e.g. Exotic Fruit, Spices..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    maxLength={50}
                                    className="h-12 bg-white border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl"
                                    required
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Quality Grade */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Award className="h-4 w-4 text-emerald-500" />
                            Quality Grade
                          </Label>
                          <Select
                            name="qualityGrade"
                            value={qualityGrade}
                            onValueChange={setQualityGrade}
                          >
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue placeholder="Select grade..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {gradeOptions.map(g => (
                                <SelectItem key={g} value={g} className="py-3 cursor-pointer hover:bg-emerald-50">
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2 md:col-span-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-emerald-500" />
                            Variety & Features
                          </Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="e.g., Organic, Hybrid, Fresh..."
                                className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 pr-12"
                              />
                              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                            <Button
                              type="button"
                              onClick={handleAddTag}
                              className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 rounded-2xl transition-all duration-300 font-semibold"
                            >
                              Add Tag
                            </Button>
                          </div>

                          <AnimatePresence>
                            {tags.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex flex-wrap gap-2 mt-4"
                              >
                                {tags.map((tag, index) => (
                                  <motion.span
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-2 border-emerald-200 shadow-sm"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(tag)}
                                      className="ml-1 hover:text-red-600 transition-colors bg-white rounded-full p-0.5"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </motion.span>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Shelf Life Section - Conditional */}
                        <AnimatePresence>
                          {isPerishable && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 pt-4 border-t border-emerald-50"
                            >
                              <div className="space-y-2 group">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-emerald-500" />
                                  Shelf Life
                                </Label>
                                <Input
                                  name="shelfLife"
                                  value={shelfLife}
                                  placeholder="e.g., 10 Days"
                                  className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300"
                                  onChange={(e) => setShelfLife(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2 group">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-emerald-500" />
                                  Shelf Life Start Date *
                                </Label>
                                <Input
                                  type="date"
                                  name="shelfLifeStartDate"
                                  value={shelfLifeStartDate}
                                  className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300"
                                  required={isPerishable}
                                  onChange={(e) => setShelfLifeStartDate(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-2 ml-2">
                                  The date from which the shelf life begins
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.section>
                  )}

                  {/* Step 2: Pricing & Inventory */}
                  {currentStep === 2 && (
                    <motion.section
                      key="step2"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-3 rounded-xl">
                          <IndianRupee className="h-7 w-7 text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Inventory & Pricing</h3>
                          <p className="text-sm text-gray-500">Set your stock and price details</p>
                        </div>
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                          Step 2 of 4
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stock */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Scale className="h-4 w-4 text-emerald-500" />
                            Total Stock *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="availableStock"
                            required
                            max={10000000}
                            value={stock}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg font-semibold"
                            onChange={(e) => {
                              setStock(e.target.value);
                              updateProgress();
                            }}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Unit */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-emerald-500" />
                            Unit *
                          </Label>
                          <Select
                            name="unit"
                            value={unit}
                            onValueChange={(value) => {
                              setUnit(value);
                              updateProgress();
                            }}
                          >
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {unitOptions.map(u => (
                                <SelectItem key={u} value={u} className="py-3">
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-emerald-500" />
                            Price per Unit *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="pricePerUnit"
                            required
                            max={100000000}
                            value={price}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg font-semibold"
                            onChange={(e) => {
                              setPrice(e.target.value);
                              updateProgress();
                            }}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Delivery Charge */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-500" />
                            Delivery Charge
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="deliveryCharge"
                            value={deliveryCharge}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setDeliveryCharge(e.target.value)}
                          />
                        </div>

                        {/* Delivery Type */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <BadgePercent className="h-4 w-4 text-emerald-500" />
                            Delivery Type
                          </Label>
                          <Select
                            name="deliveryChargeType"
                            value={deliveryChargeType}
                            onValueChange={setDeliveryChargeType}
                          >
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="per_unit">Per Unit</SelectItem>
                              <SelectItem value="flat">Flat Rate (One-time)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-2 ml-2">
                            Per unit multiplies by quantity; flat applies once
                          </p>
                        </div>

                        {/* Min Order Qty */}
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Min Order Qty
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="minOrderQuantity"
                            value={minOrderQuantity}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setMinOrderQuantity(e.target.value)}
                          />
                        </div>

                        {/* Harvest Date */}
                        <div className="space-y-2 md:col-span-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            Harvest Date (Optional)
                          </Label>
                          <Input
                            type="date"
                            name="harvestDate"
                            value={harvestDate}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setHarvestDate(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Live Calculation Card */}
                      <AnimatePresence>
                        {stock && price && (
                          <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-2xl shadow-blue-500/25"
                          >
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="relative flex items-start gap-4">
                              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Calculator className="h-7 w-7" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-100">Estimated Total Stock Value</p>
                                <p className="text-4xl font-bold mt-1">
                                  ₹ {mounted ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
                                </p>
                                <div className="flex items-center gap-3 mt-3 text-sm text-blue-100">
                                  <span className="flex items-center gap-1">
                                    <Scale className="h-4 w-4" />
                                    {stock} {unit}
                                  </span>
                                  <span>×</span>
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="h-4 w-4" />
                                    {price}/{unit}
                                  </span>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="ml-auto"
                              >
                                <Zap className="h-8 w-8 text-yellow-300" />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>
                  )}

                  {/* Step 3: Images & Info */}
                  {currentStep === 3 && (
                    <motion.section
                      key="step3"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-3 rounded-xl">
                          <Camera className="h-7 w-7 text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Images & Description</h3>
                          <p className="text-sm text-gray-500">Showcase your produce with photos</p>
                        </div>
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                          Step 3 of 4
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload className="h-4 w-4 text-emerald-500" />
                            Product Images *
                          </Label>

                          <div className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 transition-all duration-300 p-6">
                            <ImageUpload
                              value={images}
                              onChange={handleImageUpload}
                              onRemove={handleRemoveImage}
                            />
                          </div>
                        </div>

                        <Separator className="bg-emerald-100" />

                        {/* Description */}
                        <div className="space-y-3 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-500" />
                            Product Description
                          </Label>
                          <Textarea
                            name="description"
                            value={description}
                            placeholder="Describe your produce in detail - quality, freshness, growing methods, certifications..."
                            className="min-h-[160px] bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 resize-y text-base"
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {/* Step 4: Contact */}
                  {currentStep === 4 && (
                    <motion.section
                      key="step4"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-3 rounded-xl">
                          <Phone className="h-7 w-7 text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Contact Information</h3>
                          <p className="text-sm text-gray-500">How buyers can reach you</p>
                        </div>
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                          Final Step
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 group">
                              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-emerald-500" />
                                WhatsApp Number
                              </Label>
                              <Input
                                name="whatsappNumber"
                                value={whatsappNumber}
                                placeholder="+91 98765 43210"
                                className="h-14 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-2xl transition-all duration-300 text-lg"
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                              />
                              <p className="text-xs text-gray-500 ml-2">
                                Buyers will contact you via WhatsApp
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Listing Preview Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border-2 border-emerald-100 p-6"
                        >
                          <div className="flex items-center gap-2 text-emerald-700 mb-4">
                            <Shield className="h-5 w-5" />
                            <span className="font-semibold">Listing Preview</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="text-gray-500">Product</span>
                              <p className="font-semibold text-gray-800">
                                 {productName || "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-gray-500">Stock</span>
                              <p className="font-semibold text-gray-800">
                                {stock ? `${stock} ${unit}` : "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-gray-500">Price</span>
                              <p className="font-semibold text-gray-800">
                                {price ? `₹${price}/${unit}` : "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-gray-500">Images</span>
                              <p className="font-semibold text-gray-800">{images.length} uploaded</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="h-12 px-6 border-2 border-gray-200 hover:border-emerald-300 hover:bg-white rounded-2xl transition-all duration-300 font-semibold disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 rounded-2xl transition-all duration-300 font-semibold"
                    >
                      Next Step
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="relative h-14 px-10 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 rounded-2xl transition-all duration-300 font-bold text-lg overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {isPending ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="h-5 w-5" />
                            </motion.div>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Star className="h-5 w-5 group-hover:rotate-45 transition-transform" />
                            Publish Listing
                            <Sparkles className="h-5 w-5 group-hover:scale-125 transition-transform" />
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}