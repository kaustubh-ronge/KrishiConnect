
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { createProductListing } from "@/actions/products";
// import { useFetch } from "@/hooks/use-fetch";
// import { z } from "zod";
// import { createListingSchema } from "@/lib/zodSchema";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Progress } from "@/components/ui/progress";
// import { toast } from "sonner";
// import {
//   ArrowLeft, IndianRupee, Scale, Calendar, Phone, Briefcase, X, Tag, Info, Package,
//   Sparkles, Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Calculator,
//   Camera, Truck, Clock, Hash, Shield, Settings, Wrench, FileText, Loader2, Zap, Award,
//   Eye, Boxes, Warehouse, Factory
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import ImageUpload from "@/components/ImageUpload";

// const agentProductCategories = [
//   "Fertilizers", "Pesticides", "Seeds", "Nursery Plants", "Farming Tools/Machinery",
//   "Tractor & Equipment Parts", "Vegetables (Bulk Trade)", "Fruits (Bulk Trade)",
//   "Grains & Pulses", "Animal Feed", "Other"
// ];

// const unitOptions = ["kg", "ton", "quintal", "crate", "box", "liter", "packet", "piece"];
// const gradeOptions = ["Standard", "Premium", "Export Quality", "Organic", "Commercial Grade", "Not Applicable"];

// const steps = [
//   { id: 1, title: "Product", icon: Package },
//   { id: 2, title: "Pricing", icon: IndianRupee },
//   { id: 3, title: "Media", icon: Camera },
//   { id: 4, title: "Publish", icon: Sparkles }
// ];

// export default function AgentCreateListingPage() {
//   const router = useRouter();
//   const { execute: publishListing, isLoading: isPending } = useFetch(createProductListing);
//   const [currentStep, setCurrentStep] = useState(1);

//   const [images, setImages] = useState([]);
//   const [tags, setTags] = useState([]);
//   const [tagInput, setTagInput] = useState("");
//   const [productName, setProductName] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [customCategory, setCustomCategory] = useState("");
//   const [price, setPrice] = useState("");
//   const [stock, setStock] = useState("");
//   const [unit, setUnit] = useState("piece");
//   const [qualityGrade, setQualityGrade] = useState("");
//   const [description, setDescription] = useState("");
//   const [deliveryCharge, setDeliveryCharge] = useState("0");
//   const [deliveryChargeType, setDeliveryChargeType] = useState("flat");
//   const [minOrderQuantity, setMinOrderQuantity] = useState("");
//   const [procurementDate, setProcurementDate] = useState("");
//   const [shelfLife, setShelfLife] = useState("");
//   const [shelfLifeStartDate, setShelfLifeStartDate] = useState("");
//   const [whatsappNumber, setWhatsappNumber] = useState("");
//   const [formProgress, setFormProgress] = useState(10);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const isPerishable = ["Seeds", "Nursery Plants", "Vegetables (Bulk Trade)", "Fruits (Bulk Trade)", "Grains & Pulses", "Animal Feed"].includes(selectedCategory);

//   const updateProgress = () => {
//     let progress = 10;
//     if (productName) progress += 15;
//     if (selectedCategory) progress += 10;
//     if (price && stock) progress += 25;
//     if (images.length > 0) progress += 25;
//     if (description.length > 10) progress += 15;
//     setFormProgress(Math.min(100, progress));
//   };

//   const handleImageUpload = (newImages) => { setImages((prev) => [...prev, ...newImages]); updateProgress(); };
//   const handleRemoveImage = (urlToRemove) => { setImages((prev) => prev.filter((url) => url !== urlToRemove)); updateProgress(); };
//   const handleAddTag = (e) => { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } };
//   const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
//   const handleTagKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(e); } };

//   const nextStep = () => { if (currentStep < 4) { setCurrentStep(currentStep + 1); updateProgress(); } };
//   const prevStep = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); } };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     const formData = new FormData(event.currentTarget);

//     const category = selectedCategory === "Other" ? customCategory.trim() : selectedCategory;
//     if (!productName || productName.length < 3) { toast.error("Valid product name required"); return; }
//     if (!category) { toast.error("Category required"); return; }
//     if (images.length === 0) { toast.error("Images required"); return; }

//     formData.set("productName", productName);
//     formData.set("category", category);
//     formData.set("qualityGrade", qualityGrade);
//     formData.set("description", description);
//     formData.set("availableStock", stock);
//     formData.set("pricePerUnit", price);
//     formData.set("unit", unit);
//     formData.set("deliveryCharge", deliveryCharge);
//     formData.set("deliveryChargeType", deliveryChargeType);
//     formData.set("minOrderQuantity", minOrderQuantity);
//     formData.set("harvestDate", procurementDate);
//     formData.set("shelfLife", shelfLife);
//     formData.set("shelfLifeStartDate", shelfLifeStartDate);
//     formData.set("whatsappNumber", whatsappNumber);
//     formData.set("variety", tags.join(", "));
//     formData.delete("images");
//     images.forEach(img => formData.append("images", img));

//     const result = await publishListing(formData);
//     if (result?.success) { toast.success("Listing Live!"); router.push("/agent-dashboard/my-listings"); }
//     else { toast.error("Error", { description: result?.error }); }
//   };

//   const totalValue = (parseFloat(stock) || 0) * (parseFloat(price) || 0);

//   return (
//     <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/50">
//       <div className="relative max-w-5xl mx-auto px-4 py-8">
//         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
//           <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 pl-0">
//             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
//           </Button>
//         </motion.div>

//         <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
//           <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-400" />
//           <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100/50 pb-6 px-8">
//             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
//               <div className="flex items-center gap-4">
//                 <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-xl">
//                   <Briefcase className="h-8 w-8" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">Add New Stock</CardTitle>
//                   <CardDescription>List machinery, tools, or bulk agriculture products</CardDescription>
//                 </div>
//               </div>
//               <div className="lg:w-64">
//                 <div className="flex justify-between mb-2">
//                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
//                   <span className="text-sm font-bold text-blue-600">{Math.round(formProgress)}%</span>
//                 </div>
//                 <Progress value={formProgress} className="h-2 bg-gray-100" />
//               </div>
//             </div>
//             <div className="mt-8 flex justify-between items-center">
//               {steps.map((step, idx) => {
//                 const StepIcon = step.icon;
//                 const isActive = currentStep === step.id;
//                 const isCompleted = currentStep > step.id;
//                 return (
//                   <div key={step.id} className="flex items-center flex-1">
//                     <button type="button" onClick={() => setCurrentStep(step.id)} className="flex flex-col items-center flex-1">
//                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-white text-blue-600 border-2 border-blue-500 scale-110 shadow-lg" : "bg-white/50 text-gray-400 border-2 border-gray-100"}`}>
//                         <StepIcon className="h-6 w-6" />
//                       </div>
//                       <span className={`mt-2 text-xs font-bold ${isActive ? "text-blue-700" : "text-gray-500"}`}>{step.title}</span>
//                     </button>
//                     {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${isCompleted ? "bg-blue-500" : "bg-gray-200"}`} />}
//                   </div>
//                 );
//               })}
//             </div>
//           </CardHeader>

//           <form onSubmit={handleSubmit}>
//             <CardContent className="px-8 pt-8 pb-4">
//               <AnimatePresence mode="wait">
//                 {currentStep === 1 && (
//                   <motion.section key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
//                     <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Package className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Product Info</h3></div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="space-y-2 md:col-span-2">
//                         <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Product Name *</Label>
//                         <Input placeholder="Product Name" value={productName} onChange={(e) => { setProductName(e.target.value); updateProgress(); }} className="h-14 rounded-2xl border-2 border-blue-50" required />
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="flex items-center gap-2"><Boxes className="h-4 w-4" /> Category *</Label>
//                         <Select name="category" value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); updateProgress(); }}>
//                           <SelectTrigger className="h-14 rounded-2xl border-2 border-blue-50"><SelectValue placeholder="Select Category" /></SelectTrigger>
//                           <SelectContent>{agentProductCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
//                         </Select>
//                         {selectedCategory === "Other" && <Input placeholder="Custom Category" maxLength={50} className="mt-3 h-12 rounded-xl" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />}
//                       </div>
//                       <div className="space-y-2"><Label className="flex items-center gap-2"><Award className="h-4 w-4" /> Quality</Label><Select value={qualityGrade} onValueChange={setQualityGrade}><SelectTrigger className="h-14 rounded-2xl border-2 border-blue-50"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
//                       <div className="md:col-span-2 space-y-2">
//                         <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Variety / Brands</Label>
//                         <div className="flex gap-2">
//                           <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Enter brand..." className="h-14 rounded-2xl" />
//                           <Button type="button" onClick={handleAddTag} className="h-14 px-8 bg-blue-600 text-white rounded-2xl">Add</Button>
//                         </div>
//                         <div className="flex flex-wrap gap-2 mt-3">{tags.map(t => <Badge key={t} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex gap-2">{t} <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(t)} /></Badge>)}</div>
//                       </div>
//                       {isPerishable && (
//                         <>
//                           <div className="space-y-2"><Label>Shelf Life</Label><Input value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} className="h-14 rounded-2xl" placeholder="e.g. 6 Months" /></div>
//                           <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={shelfLifeStartDate} onChange={(e) => setShelfLifeStartDate(e.target.value)} className="h-14 rounded-2xl" /></div>
//                         </>
//                       )}
//                     </div>
//                   </motion.section>
//                 )}

//                 {currentStep === 2 && (
//                   <motion.section key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
//                     <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><IndianRupee className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Pricing</h3></div>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                       <div className="space-y-2"><Label>Stock *</Label><Input type="number" max={10000000} value={stock} onChange={(e) => { setStock(e.target.value); updateProgress(); }} className="h-14 text-lg font-bold rounded-2xl" /></div>
//                       <div className="space-y-2"><Label>Unit *</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger className="h-14 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
//                       <div className="space-y-2"><Label>Price *</Label><Input type="number" max={100000000} value={price} onChange={(e) => { setPrice(e.target.value); updateProgress(); }} className="h-14 text-lg font-bold rounded-2xl" /></div>
//                       <div className="space-y-2"><Label>Delivery Cost</Label><Input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} className="h-14 rounded-2xl" /></div>
//                       <div className="space-y-2"><Label>Min Order</Label><Input type="number" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} className="h-14 rounded-2xl" /></div>
//                       <div className="md:col-span-2 space-y-2"><Label>Mfg Date</Label><Input type="date" value={procurementDate} onChange={(e) => setProcurementDate(e.target.value)} className="h-14 rounded-2xl" /></div>
//                     </div>
//                     {stock && price && (
//                       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white flex justify-between items-center shadow-xl">
//                         <div><p className="text-blue-100 text-xs font-bold">Total Value</p><p className="text-4xl font-black">₹{mounted ? totalValue.toLocaleString('en-IN') : '0'}</p></div>
//                         <Calculator className="h-12 w-12 text-white/20" />
//                       </div>
//                     )}
//                   </motion.section>
//                 )}

//                 {currentStep === 3 && (
//                   <motion.section key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
//                     <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Camera className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Media</h3></div>
//                     <div className="space-y-3"><Label>Photos *</Label><ImageUpload value={images} onChange={handleImageUpload} onRemove={handleRemoveImage} /></div>
//                     <div className="space-y-2"><Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Description</Label><Textarea value={description} onChange={(e) => { setDescription(e.target.value); updateProgress(); }} className="min-h-[180px] rounded-2xl border-2 border-blue-50" placeholder="Specifications..." /></div>
//                   </motion.section>
//                 )}

//                 {currentStep === 4 && (
//                   <motion.section key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
//                     <div className="flex items-center gap-3"><div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Sparkles className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-gray-800">Publish</h3></div>
//                     <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200">
//                       <div className="max-w-md mx-auto space-y-6">
//                         <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91..." className="h-14 rounded-2xl bg-white border-2 border-blue-50" /></div>
//                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
//                           <Shield className="h-8 w-8 text-emerald-500" />
//                           <div><p className="font-bold text-gray-800">Ready to go!</p><p className="text-xs text-gray-500">By listing, you agree to KrishiConnect Trade Terms.</p></div>
//                         </div>
//                       </div>
//                     </div>
//                   </motion.section>
//                 )}
//               </AnimatePresence>
//             </CardContent>

//             <CardFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between">
//               <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 1} className="h-12 px-6 rounded-xl font-bold">Previous</Button>
//               {currentStep < 4 ? (
//                 <Button type="button" onClick={nextStep} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
//               ) : (
//                 <Button type="submit" disabled={isPending} className="h-12 px-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-blue-500/30">
//                   {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Publish Listing</>}
//                 </Button>
//               )}
//             </CardFooter>
//           </form>
//         </Card>
//       </div>
//     </div>
//   );
// }


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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft, IndianRupee, Scale, Calendar, Phone, Briefcase, X, Tag, Info, Package,
  Sparkles, Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Calculator,
  Camera, Truck, Clock, Hash, Shield, FileText, Loader2, Zap, Award, Boxes
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
  { id: 1, title: "Product", icon: Package, description: "Choose category" },
  { id: 2, title: "Pricing", icon: IndianRupee, description: "Set price & stock" },
  { id: 3, title: "Media", icon: Camera, description: "Upload images" },
  { id: 4, title: "Publish", icon: Sparkles, description: "Review & publish" }
];

export default function AgentCreateListingPage() {
  const router = useRouter();
  const { execute: publishListing, isLoading: isPending } = useFetch(createProductListing);
  const [currentStep, setCurrentStep] = useState(1);

  // --- State ---
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
    if (!productName || productName.length < 3) { toast.error("Valid product name required", { icon: <AlertCircle className="h-5 w-5" /> }); return; }
    if (!category) { toast.error("Category required", { icon: <AlertCircle className="h-5 w-5" /> }); return; }
    if (images.length === 0) { toast.error("Images required", { icon: <AlertCircle className="h-5 w-5" /> }); return; }

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
    if (result?.success) {
      toast.success("Listing Live!", { icon: <CheckCircle2 className="h-5 w-5" />, className: "bg-green-50 border-green-200" });
      router.push("/agent-dashboard/my-listings");
    } else {
      toast.error("Error", { description: result?.error || "Please try again later", icon: <AlertCircle className="h-5 w-5" /> });
    }
  };

  const totalValue = (parseFloat(stock) || 0) * (parseFloat(price) || 0);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 150, 0], y: [0, -100, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/20 to-indigo-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-300/20 to-blue-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/15 to-purple-300/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIG9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOCIvPjxjaXJjbGUgY3g9IjE4IiBjeT0iMTgiIHI9IjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="group text-gray-600 hover:text-blue-700 pl-0 hover:bg-white/50 backdrop-blur-sm transition-all duration-300">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/75 backdrop-blur-xl rounded-3xl">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-400" />

            <CardHeader className="relative bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/80 border-b border-blue-100/50 pb-6 px-6 sm:px-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: 15, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="relative">
                    <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-500/30">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 -right-2">
                      <Sparkles className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
                    </motion.div>
                  </motion.div>

                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                      Add New Stock
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      List machinery, tools, or bulk agriculture products
                    </CardDescription>
                  </div>
                </div>

                <motion.div className="lg:w-64" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-sm font-bold text-blue-600">{Math.round(formProgress)}%</span>
                  </div>
                  <Progress value={formProgress} className="h-2.5 bg-gray-100">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500" />
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
                          type="button"
                          onClick={() => setCurrentStep(step.id)}
                          className={`relative flex flex-col items-center group ${idx < steps.length - 1 ? 'flex-1' : ''}`}
                        >
                          <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCompleted
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                              : isActive
                                ? "bg-white text-blue-600 border-2 border-blue-500 shadow-xl shadow-blue-500/20 scale-110"
                                : "bg-white/50 text-gray-400 border-2 border-gray-200 hover:border-blue-300"
                            }`}>
                            <StepIcon className="h-6 w-6" />
                            {isCompleted && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1">
                                <CheckCircle2 className="h-5 w-5 text-yellow-400 bg-white rounded-full" />
                              </motion.div>
                            )}
                            {isActive && (
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-2xl ring-2 ring-blue-400 ring-opacity-50"
                              />
                            )}
                          </div>
                          <span className={`mt-2 text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-blue-700' : isCompleted ? 'text-blue-600' : 'text-gray-500'}`}>
                            {step.title}
                          </span>
                        </motion.button>

                        {idx < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 mt-[-20px]">
                            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gray-200'}`}>
                              {isActive && (
                                <motion.div
                                  initial={{ width: '0%' }}
                                  animate={{ width: '50%' }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
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
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                          <Package className="h-7 w-7 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Product Info</h3>
                          <p className="text-sm text-gray-500">Tell us what you're listing</p>
                        </div>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">Step 1 of 4</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-500" /> Product Name *
                          </Label>
                          <Input
                            placeholder="e.g. John Deere Tractor Model X, Premium DAP Fertilizer"
                            value={productName}
                            onChange={(e) => { setProductName(e.target.value); updateProgress(); }}
                            maxLength={100}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg"
                            required
                          />
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-blue-500" /> Category *
                          </Label>
                          <Select name="category" required value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); updateProgress(); }}>
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue placeholder="Choose category..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {agentProductCategories.map(c => (
                                <SelectItem key={c} value={c} className="py-3 cursor-pointer hover:bg-blue-50">{c}</SelectItem>
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
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                  <Label className="text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                                    <Info className="h-3 w-3" /> Custom Category Name
                                  </Label>
                                  <Input
                                    placeholder="e.g. Irrigation Pipes..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    maxLength={50}
                                    className="h-12 bg-white border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl"
                                    required
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-500" /> Quality Grade
                          </Label>
                          <Select name="qualityGrade" value={qualityGrade} onValueChange={setQualityGrade}>
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue placeholder="Select grade..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {gradeOptions.map(g => (
                                <SelectItem key={g} value={g} className="py-3 cursor-pointer hover:bg-blue-50">{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-500" /> Variety & Brands
                          </Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="e.g., Mahadhan, ISI Certified, Heavy Duty..."
                                className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 pr-12"
                              />
                              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </div>
                            <Button
                              type="button"
                              onClick={handleAddTag}
                              className="h-14 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 rounded-2xl transition-all duration-300 font-semibold"
                            >
                              Add Tag
                            </Button>
                          </div>

                          <AnimatePresence>
                            {tags.length > 0 && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-2 mt-4">
                                {tags.map((tag, index) => (
                                  <motion.span
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-2 border-blue-200 shadow-sm"
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

                        <AnimatePresence>
                          {isPerishable && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 pt-4 border-t border-blue-50"
                            >
                              <div className="space-y-2 group">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-500" /> Shelf Life
                                </Label>
                                <Input
                                  name="shelfLife"
                                  value={shelfLife}
                                  placeholder="e.g., 6 Months"
                                  className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300"
                                  onChange={(e) => setShelfLife(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2 group">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-blue-500" /> Shelf Life Start Date *
                                </Label>
                                <Input
                                  type="date"
                                  name="shelfLifeStartDate"
                                  value={shelfLifeStartDate}
                                  className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300"
                                  required={isPerishable}
                                  onChange={(e) => setShelfLifeStartDate(e.target.value)}
                                />
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
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                          <IndianRupee className="h-7 w-7 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Inventory & Pricing</h3>
                          <p className="text-sm text-gray-500">Set your stock and price details</p>
                        </div>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">Step 2 of 4</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Scale className="h-4 w-4 text-blue-500" /> Total Stock *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="availableStock"
                            required
                            max={10000000}
                            value={stock}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg font-semibold"
                            onChange={(e) => { setStock(e.target.value); updateProgress(); }}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-blue-500" /> Unit *
                          </Label>
                          <Select name="unit" value={unit} onValueChange={(value) => { setUnit(value); updateProgress(); }}>
                            <SelectTrigger className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {unitOptions.map(u => (
                                <SelectItem key={u} value={u} className="py-3">{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-blue-500" /> Price per Unit *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="pricePerUnit"
                            required
                            max={100000000}
                            value={price}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg font-semibold"
                            onChange={(e) => { setPrice(e.target.value); updateProgress(); }}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" /> Delivery Cost
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="deliveryCharge"
                            value={deliveryCharge}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setDeliveryCharge(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-blue-500" /> Min Order Qty
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="minOrderQuantity"
                            value={minOrderQuantity}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setMinOrderQuantity(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" /> Mfg Date
                          </Label>
                          <Input
                            type="date"
                            name="harvestDate"
                            value={procurementDate}
                            className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300"
                            onChange={(e) => setProcurementDate(e.target.value)}
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
                            className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-2xl shadow-blue-500/25 mt-6"
                          >
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
                              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="ml-auto">
                                <Zap className="h-8 w-8 text-yellow-300" />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>
                  )}

                  {/* Step 3: Media */}
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
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                          <Camera className="h-7 w-7 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Images & Description</h3>
                          <p className="text-sm text-gray-500">Showcase your stock</p>
                        </div>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">Step 3 of 4</Badge>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload className="h-4 w-4 text-blue-500" /> Product Images *
                          </Label>

                          <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all duration-300 p-6">
                            <ImageUpload
                              value={images}
                              onChange={handleImageUpload}
                              onRemove={handleRemoveImage}
                            />
                          </div>
                        </div>

                        <Separator className="bg-blue-100" />

                        <div className="space-y-3 group">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" /> Product Description
                          </Label>
                          <Textarea
                            name="description"
                            value={description}
                            placeholder="Describe specifications, condition, capabilities..."
                            className="min-h-[160px] bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 resize-y text-base"
                            onChange={(e) => { setDescription(e.target.value); updateProgress(); }}
                          />
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {/* Step 4: Publish */}
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
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                          <Sparkles className="h-7 w-7 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Final Review</h3>
                          <p className="text-sm text-gray-500">Add contact and publish</p>
                        </div>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">Final Step</Badge>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 group">
                              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-500" /> WhatsApp Number
                              </Label>
                              <Input
                                name="whatsappNumber"
                                value={whatsappNumber}
                                placeholder="+91 98765 43210"
                                className="h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl transition-all duration-300 text-lg"
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                              />
                              <p className="text-xs text-gray-500 ml-2">Buyers will contact you via WhatsApp</p>
                            </div>

                            <div className="flex items-center">
                              <div className="bg-white p-4 w-full rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
                                <Shield className="h-8 w-8 text-indigo-500" />
                                <div>
                                  <p className="font-bold text-gray-800">KrishiConnect Verified</p>
                                  <p className="text-xs text-gray-500">By listing, you agree to our Trade Terms.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Listing Preview Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-blue-700 mb-4">
                            <Briefcase className="h-5 w-5" />
                            <span className="font-semibold">Listing Preview</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="text-gray-500">Product</span>
                              <p className="font-semibold text-gray-800">{productName || "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-gray-500">Stock</span>
                              <p className="font-semibold text-gray-800">{stock ? `${stock} ${unit}` : "—"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-gray-500">Price</span>
                              <p className="font-semibold text-gray-800">{price ? `₹${price}/${unit}` : "—"}</p>
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
                    className="h-12 px-6 border-2 border-gray-200 hover:border-blue-300 hover:bg-white rounded-2xl transition-all duration-300 font-semibold disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 rounded-2xl transition-all duration-300 font-semibold"
                    >
                      Next Step <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="relative h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 rounded-2xl transition-all duration-300 font-bold text-lg overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 group-hover:scale-125 transition-transform" />
                            Publish Listing
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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