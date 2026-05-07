
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
  ArrowLeft, IndianRupee, Scale, Calendar, Phone, Briefcase, X, Tag, Info, Package,
  Sparkles, Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Calculator,
  Camera, Truck, Clock, Hash, Shield, Settings, Wrench, FileText, Loader2, Zap, Award,
  Eye, Boxes, Warehouse, Factory
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";

const agentProductCategories = [
  "Fertilizers", "Pesticides", "Seeds", "Nursery Plants", "Farming Tools/Machinery",
  "Tractor & Equipment Parts", "Vegetables (Bulk Trade)", "Fruits (Bulk Trade)",
  "Grains & Pulses", "Animal Feed", "Other"
];

const unitOptions = ["kg", "ton", "quintal", "crate", "box", "liter", "packet", "piece"];
const gradeOptions = ["Standard", "Premium", "Export Quality", "Organic", "Commercial Grade", "Not Applicable"];

const steps = [
  { id: 1, title: "Product", icon: Package },
  { id: 2, title: "Pricing", icon: IndianRupee },
  { id: 3, title: "Media", icon: Camera },
  { id: 4, title: "Publish", icon: Sparkles }
];

export default function AgentCreateListingPage() {
  const router = useRouter();
  const { execute: publishListing, isLoading: isPending } = useFetch(createProductListing);
  const [currentStep, setCurrentStep] = useState(1);

  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("piece");
  const [qualityGrade, setQualityGrade] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [deliveryChargeType, setDeliveryChargeType] = useState("flat");
  const [minOrderQuantity, setMinOrderQuantity] = useState("");
  const [procurementDate, setProcurementDate] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [shelfLifeStartDate, setShelfLifeStartDate] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [formProgress, setFormProgress] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPerishable = ["Seeds", "Nursery Plants", "Vegetables (Bulk Trade)", "Fruits (Bulk Trade)", "Grains & Pulses", "Animal Feed"].includes(selectedCategory);

  const updateProgress = () => {
    let progress = 10;
    if (productName) progress += 15;
    if (selectedCategory) progress += 10;
    if (price && stock) progress += 25;
    if (images.length > 0) progress += 25;
    if (description.length > 10) progress += 15;
    setFormProgress(Math.min(100, progress));
  };

  const handleImageUpload = (newImages) => { setImages((prev) => [...prev, ...newImages]); updateProgress(); };
  const handleRemoveImage = (urlToRemove) => { setImages((prev) => prev.filter((url) => url !== urlToRemove)); updateProgress(); };
  const handleAddTag = (e) => { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } };
  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
  const handleTagKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(e); } };

  const nextStep = () => { if (currentStep < 4) { setCurrentStep(currentStep + 1); updateProgress(); } };
  const prevStep = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); } };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const category = selectedCategory === "Other" ? customCategory.trim() : selectedCategory;
    if (!productName || productName.length < 3) { toast.error("Valid product name required"); return; }
    if (!category) { toast.error("Category required"); return; }
    if (images.length === 0) { toast.error("Images required"); return; }

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
    formData.set("harvestDate", procurementDate);
    formData.set("shelfLife", shelfLife);
    formData.set("shelfLifeStartDate", shelfLifeStartDate);
    formData.set("whatsappNumber", whatsappNumber);
    formData.set("variety", tags.join(", "));
    formData.delete("images");
    images.forEach(img => formData.append("images", img));

    const result = await publishListing(formData);
    if (result?.success) { toast.success("Listing Live!"); router.push("/agent-dashboard/my-listings"); }
    else { toast.error("Error", { description: result?.error }); }
  };

  const totalValue = (parseFloat(stock) || 0) * (parseFloat(price) || 0);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/50">
      <div className="relative max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </motion.div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-400" />
          <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100/50 pb-6 px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-xl">
                  <Briefcase className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">Add New Stock</CardTitle>
                  <CardDescription>List machinery, tools, or bulk agriculture products</CardDescription>
                </div>
              </div>
              <div className="lg:w-64">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(formProgress)}%</span>
                </div>
                <Progress value={formProgress} className="h-2 bg-gray-100" />
              </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button type="button" onClick={() => setCurrentStep(step.id)} className="flex flex-col items-center flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-white text-blue-600 border-2 border-blue-500 scale-110 shadow-lg" : "bg-white/50 text-gray-400 border-2 border-gray-100"}`}>
                        <StepIcon className="h-6 w-6" />
                      </div>
                      <span className={`mt-2 text-xs font-bold ${isActive ? "text-blue-700" : "text-gray-500"}`}>{step.title}</span>
                    </button>
                    {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${isCompleted ? "bg-blue-500" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="px-8 pt-8 pb-4">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.section key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Package className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Product Info</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Product Name *</Label>
                        <Input placeholder="Product Name" value={productName} onChange={(e) => { setProductName(e.target.value); updateProgress(); }} className="h-14 rounded-2xl border-2 border-blue-50" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Boxes className="h-4 w-4" /> Category *</Label>
                        <Select name="category" value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); updateProgress(); }}>
                          <SelectTrigger className="h-14 rounded-2xl border-2 border-blue-50"><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>{agentProductCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        {selectedCategory === "Other" && <Input placeholder="Custom Category" maxLength={50} className="mt-3 h-12 rounded-xl" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />}
                      </div>
                      <div className="space-y-2"><Label className="flex items-center gap-2"><Award className="h-4 w-4" /> Quality</Label><Select value={qualityGrade} onValueChange={setQualityGrade}><SelectTrigger className="h-14 rounded-2xl border-2 border-blue-50"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Variety / Brands</Label>
                        <div className="flex gap-2">
                          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Enter brand..." className="h-14 rounded-2xl" />
                          <Button type="button" onClick={handleAddTag} className="h-14 px-8 bg-blue-600 text-white rounded-2xl">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">{tags.map(t => <Badge key={t} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex gap-2">{t} <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(t)} /></Badge>)}</div>
                      </div>
                      {isPerishable && (
                        <>
                          <div className="space-y-2"><Label>Shelf Life</Label><Input value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} className="h-14 rounded-2xl" placeholder="e.g. 6 Months" /></div>
                          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={shelfLifeStartDate} onChange={(e) => setShelfLifeStartDate(e.target.value)} className="h-14 rounded-2xl" /></div>
                        </>
                      )}
                    </div>
                  </motion.section>
                )}

                {currentStep === 2 && (
                  <motion.section key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><IndianRupee className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Pricing</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2"><Label>Stock *</Label><Input type="number" max={10000000} value={stock} onChange={(e) => { setStock(e.target.value); updateProgress(); }} className="h-14 text-lg font-bold rounded-2xl" /></div>
                      <div className="space-y-2"><Label>Unit *</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger className="h-14 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label>Price *</Label><Input type="number" max={100000000} value={price} onChange={(e) => { setPrice(e.target.value); updateProgress(); }} className="h-14 text-lg font-bold rounded-2xl" /></div>
                      <div className="space-y-2"><Label>Delivery Cost</Label><Input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} className="h-14 rounded-2xl" /></div>
                      <div className="space-y-2"><Label>Min Order</Label><Input type="number" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} className="h-14 rounded-2xl" /></div>
                      <div className="md:col-span-2 space-y-2"><Label>Mfg Date</Label><Input type="date" value={procurementDate} onChange={(e) => setProcurementDate(e.target.value)} className="h-14 rounded-2xl" /></div>
                    </div>
                    {stock && price && (
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white flex justify-between items-center shadow-xl">
                        <div><p className="text-blue-100 text-xs font-bold">Total Value</p><p className="text-4xl font-black">₹{mounted ? totalValue.toLocaleString('en-IN') : '0'}</p></div>
                        <Calculator className="h-12 w-12 text-white/20" />
                      </div>
                    )}
                  </motion.section>
                )}

                {currentStep === 3 && (
                  <motion.section key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Camera className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Media</h3></div>
                    <div className="space-y-3"><Label>Photos *</Label><ImageUpload value={images} onChange={handleImageUpload} onRemove={handleRemoveImage} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Description</Label><Textarea value={description} onChange={(e) => { setDescription(e.target.value); updateProgress(); }} className="min-h-[180px] rounded-2xl border-2 border-blue-50" placeholder="Specifications..." /></div>
                  </motion.section>
                )}

                {currentStep === 4 && (
                  <motion.section key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Sparkles className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Publish</h3></div>
                    <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="max-w-md mx-auto space-y-6">
                        <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91..." className="h-14 rounded-2xl bg-white border-2 border-blue-50" /></div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                          <Shield className="h-8 w-8 text-emerald-500" />
                          <div><p className="font-bold text-gray-800">Ready to go!</p><p className="text-xs text-gray-500">By listing, you agree to KrishiConnect Trade Terms.</p></div>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 1} className="h-12 px-6 rounded-xl font-bold">Previous</Button>
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button type="submit" disabled={isPending} className="h-12 px-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-blue-500/30">
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Publish Listing</>}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}