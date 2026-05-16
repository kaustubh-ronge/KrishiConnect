// "use client";

// import { useState, useTransition, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { updateProductListing } from "@/actions/products";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { toast } from "sonner";
// import { ArrowLeft, Edit, Save, Scale, IndianRupee, Calendar, Tag, X, Image as ImageIcon, Phone, Info } from "lucide-react";
// import ImageUpload from "@/components/ImageUpload";
// import { motion, AnimatePresence } from "framer-motion";

// // Constants
// const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
// const unitOptions = ["kg", "ton", "quintal", "crate", "box", "Other"];
// const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

// // Helper to check if the current product name is one of the standard categories
// const isStandardCategory = (name) => produceCategories.includes(name);

// export default function EditListingClient({ product }) {
//   const router = useRouter();
//   const [isPending, startTransition] = useTransition();

//   // --- State Initialization (Pre-filling data) ---
//   const [images, setImages] = useState(product.images || []);
//   const [tags, setTags] = useState(product.variety ? product.variety.split(", ") : []);
//   const [tagInput, setTagInput] = useState("");

//   // --- NEW: Custom Product State for 'Other' ---
//   const initialProductName = product.productName || "";
//   const [selectedProduct, setSelectedProduct] = useState(isStandardCategory(initialProductName) ? initialProductName : "Other");
//   const [customProduct, setCustomProduct] = useState(isStandardCategory(initialProductName) ? "" : initialProductName);

//   // --- Handlers ---
//   const handleAddTag = (e) => {
//     e.preventDefault();
//     if (tagInput.trim() && !tags.includes(tagInput.trim())) {
//       setTags([...tags, tagInput.trim()]);
//       setTagInput("");
//     }
//   };
//   const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
//   const handleTagKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } };

//   const handleImageUpload = (newImages) => setImages([...images, ...newImages]);
//   const handleRemoveImage = (url) => setImages(images.filter(i => i !== url));

//   // Helper function to format date string for Input type="date"
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
//     try {
//       return new Date(dateString).toISOString().split('T')[0];
//     } catch {
//       return '';
//     }
//   };

//   // --- Submit ---
//   const handleSubmit = async (formData) => {
//     if (images.length === 0) {
//       toast.error("At least one image is required");
//       return;
//     }

//     // 1. Handle Custom Product Name Logic
//     if (selectedProduct === "Other") {
//       if (!customProduct.trim()) {
//         toast.error("Please specify the product name.");
//         return;
//       }
//       // Set the custom product name for the server action
//       formData.set("productName", customProduct.trim());
//     } else if (!selectedProduct) {
//       toast.error("Please select a product.");
//       return;
//     }


//     // 2. Append Images
//     formData.delete("images");
//     images.forEach(url => formData.append("images", url));

//     // 3. Append Tags
//     if (tags.length > 0) formData.set("variety", tags.join(", "));


//     startTransition(async () => {
//       const result = await updateProductListing(product.id, formData);
//       if (result.success) {
//         toast.success("Listing Updated Successfully!");
//         router.push("/farmer-dashboard/my-listings");
//       } else {
//         toast.error("Update Failed", { description: result.error });
//       }
//     });
//   };

//   return (
//     <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
//       <div className="max-w-4xl mx-auto">

//         <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-gray-600 hover:text-green-600 pl-0">
//           <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
//         </Button>

//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <Card className="shadow-xl border-green-100 bg-white/90 backdrop-blur-sm">
//             <CardHeader className="bg-green-50/50 border-b border-green-100 pb-6">
//               <div className="flex items-center gap-3">
//                 <div className="bg-green-100 p-3 rounded-xl text-green-600"><Edit className="h-6 w-6" /></div>
//                 <div>
//                   <CardTitle className="text-2xl text-gray-900">Edit Listing</CardTitle>
//                   <p className="text-sm text-gray-500">Update product details, price, or stock for {product.productName}.</p>
//                 </div>
//               </div>
//             </CardHeader>

//             <form action={handleSubmit}>
//               <CardContent className="grid gap-8 pt-8">

//                 {/* 1. Product Details */}
//                 <section className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">1. Product Details</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                     {/* Crop / Product Select + Custom Input */}
//                     <div className="space-y-2">
//                       <Label>Crop / Product</Label>
//                       <Select
//                         name="productName"
//                         defaultValue={selectedProduct}
//                         onValueChange={setSelectedProduct}
//                       >
//                         <SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger>
//                         <SelectContent>
//                           {produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
//                         </SelectContent>
//                       </Select>

//                       {/* Conditional Input for Other */}
//                       <AnimatePresence>
//                         {selectedProduct === "Other" && (
//                           <motion.div
//                             initial={{ opacity: 0, height: 0 }}
//                             animate={{ opacity: 1, height: 'auto' }}
//                             exit={{ opacity: 0, height: 0 }}
//                             className="pt-1 overflow-hidden"
//                           >
//                             <Label className="text-green-600 text-xs font-semibold uppercase tracking-wide">Specify Product Name</Label>
//                             <Input
//                               placeholder="e.g. Dragon Fruit, Mushrooms..."
//                               value={customProduct}
//                               onChange={(e) => setCustomProduct(e.target.value)}
//                               className="bg-green-50 border-green-200 focus:border-green-500 h-11 mt-1"
//                               required
//                             />
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>

//                     <div className="space-y-2">
//                       <Label>Quality Grade</Label>
//                       <Select name="qualityGrade" defaultValue={product.qualityGrade}>
//                         <SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select" /></SelectTrigger>
//                         <SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
//                       </Select>
//                     </div>

//                     <div className="space-y-2 md:col-span-2">
//                       <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-green-600" /> Variety & Features</Label>
//                       <div className="flex gap-2">
//                         <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add tags..." className="bg-white h-12" />
//                         <Button type="button" onClick={handleAddTag} variant="outline" className="h-12 border-green-200 text-green-600">Add</Button>
//                       </div>
//                       <div className="flex flex-wrap gap-2 mt-2">
//                         {tags.map((tag, i) => (
//                           <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
//                             {tag} <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-red-600"><X className="h-3 w-3" /></button>
//                           </span>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Shelf Life Fields */}
//                     <div className="space-y-2">
//                       <Label>Shelf Life (e.g., 10 Days)</Label>
//                       <Input name="shelfLife" defaultValue={product.shelfLife} placeholder="e.g. 10 Days" className="bg-white h-12" />
//                     </div>

//                     <div className="space-y-2">
//                       <Label className="flex items-center gap-1 text-gray-700"><Calendar className="h-4 w-4" /> Shelf Life Start Date</Label>
//                       <Input
//                         type="date"
//                         name="shelfLifeStartDate"
//                         defaultValue={formatDate(product.shelfLifeStartDate)}
//                         className="bg-white h-12"
//                       />
//                       <p className="text-xs text-gray-500 mt-1">
//                         Date the shelf life countdown begins.
//                       </p>
//                     </div>

//                   </div>
//                 </section>

//                 {/* 2. Inventory & Pricing */}
//                 <section className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">2. Inventory & Pricing</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <div className="space-y-2"><Label className="flex items-center gap-2"><Scale className="h-4 w-4 text-gray-500" /> Stock</Label><Input name="availableStock" type="number" step="0.01" defaultValue={product.availableStock} required className="bg-white h-12" /></div>
//                     <div className="space-y-2"><Label>Unit</Label><Select name="unit" defaultValue={product.unit}><SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
//                     <div className="space-y-2"><Label className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-gray-500" /> Price</Label><Input name="pricePerUnit" type="number" step="0.01" defaultValue={product.pricePerUnit} required className="bg-white h-12" /></div>

//                     <div className="space-y-2"><Label>Delivery Charge (per unit)</Label><Input name="deliveryCharge" type="number" step="0.01" defaultValue={product.deliveryCharge || 0} className="bg-white h-12" /></div>
//                     <div className="space-y-2">
//                       <Label>Delivery Type</Label>
//                       <Select name="deliveryChargeType" defaultValue={product.deliveryChargeType || 'per_unit'}>
//                         <SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="per_unit">Per Unit</SelectItem>
//                           <SelectItem value="flat">Flat (once per listing)</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <p className="text-xs text-gray-500 mt-1">Choose how delivery is applied: per unit multiplies by quantity; flat applies once per listing.</p>
//                     </div>

//                     <div className="space-y-2"><Label>Min Order Qty</Label><Input name="minOrderQuantity" type="number" step="0.01" defaultValue={product.minOrderQuantity} className="bg-white h-12" /></div>
//                     <div className="space-y-2 md:col-span-2"><Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /> Harvest Date</Label><Input type="date" name="harvestDate" defaultValue={formatDate(product.harvestDate)} className="bg-white h-12" /></div>
//                   </div>
//                 </section>

//                 {/* 3. Images */}
//                 <section className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">3. Images & Info</h3>
//                   <div className="space-y-2">
//                     <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-500" /> Product Images</Label>
//                     {/* NOTE: Assuming ImageUpload is a shared component with a consistent UI */}
//                     <ImageUpload
//                       value={images}
//                       onChange={handleImageUpload}
//                       onRemove={handleRemoveImage}
//                     />
//                   </div>
//                   <div className="space-y-2 mt-4"><Label>Description</Label><Textarea name="description" defaultValue={product.description} className="min-h-[120px] bg-white" /></div>
//                 </section>

//                 {/* 4. Contact */}
//                 <section className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">4. Contact</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2"><Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-600" /> WhatsApp</Label><Input name="whatsappNumber" defaultValue={product.whatsappNumber} className="bg-white h-12" /></div>
//                   </div>
//                 </section>

//               </CardContent>
//               <CardFooter className="flex justify-end gap-4 bg-gray-50 border-t border-green-100 py-6">
//                 <Button variant="outline" type="button" onClick={() => router.back()} className="h-12 px-6">Cancel</Button>
//                 <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white shadow-md text-lg h-12 px-8">
//                   {isPending ? "Saving..." : "Save Changes"}
//                 </Button>
//               </CardFooter>
//             </form>
//           </Card>
//         </motion.div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProductListing } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit3,
  Save,
  Scale,
  IndianRupee,
  Calendar,
  Tag,
  X,
  Image as ImageIcon,
  Phone,
  Info,
  Package,
  Truck,
  Sparkles,
  Leaf,
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { motion, AnimatePresence } from "framer-motion";

// Constants
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box", "Other"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

// Helper to check if the current product name is one of the standard categories
const isStandardCategory = (name) => produceCategories.includes(name);

export default function EditListingClient({ product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- State Initialization (Pre-filling data) ---
  const [images, setImages] = useState(product.images || []);
  const [tags, setTags] = useState(product.variety ? product.variety.split(", ") : []);
  const [tagInput, setTagInput] = useState("");
  const [activeSection, setActiveSection] = useState(1);

  // --- NEW: Product State ---
  const initialProductName = product.productName || "";
  const initialCategory = product.category || "";
  
  const [productName, setProductName] = useState(initialProductName);
  const [selectedCategory, setSelectedCategory] = useState(isStandardCategory(initialCategory) ? initialCategory : (initialCategory ? "Other" : ""));
  const [customCategory, setCustomCategory] = useState(isStandardCategory(initialCategory) ? "" : initialCategory);

  const [unit, setUnit] = useState(unitOptions.includes(product.unit) ? product.unit : "Other");
  const [customUnit, setCustomUnit] = useState(unitOptions.includes(product.unit) ? "" : product.unit);

  // --- Handlers ---
  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
  const handleTagKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } };

  const handleImageUpload = (newImages) => setImages([...images, ...newImages]);
  const handleRemoveImage = (url) => setImages(images.filter(i => i !== url));

  // Helper function to format date string for Input type="date"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // --- Submit ---
  const handleSubmit = async (formData) => {
    if (images.length === 0) {
      toast.error("At least one image is required", {
        icon: <AlertCircle className="h-5 w-5" />,
        className: "bg-red-50 border-red-200"
      });
      return;
    }

    // 1. Handle Category Logic
    const category = selectedCategory === "Other" ? customCategory.trim() : selectedCategory;
    const unitToSubmit = unit === "Other" ? customUnit.trim() : unit;
    
    if (!productName || productName.trim().length < 3) {
      toast.error("Please enter a valid product name (min 3 chars).");
      return;
    }

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    // Explicitly set values to ensure they are captured from state or form
    formData.set("productName", productName.trim());
    formData.set("category", category);

    // Ensure Select values are captured (sometimes Shadcn Select needs explicit setting in formData)
    if (!formData.get("qualityGrade") && product.qualityGrade) formData.set("qualityGrade", product.qualityGrade);
    formData.set("unit", unitToSubmit);
    if (!formData.get("deliveryChargeType") && product.deliveryChargeType) formData.set("deliveryChargeType", product.deliveryChargeType);

    // 2. Append Images
    formData.delete("images");
    images.forEach(url => formData.append("images", url));

    // 3. Append Tags
    if (tags.length > 0) formData.set("variety", tags.join(", "));

    startTransition(async () => {
      const result = await updateProductListing(product.id, formData);
      if (result.success) {
        toast.success("Listing Updated Successfully!", {
          icon: <CheckCircle2 className="h-5 w-5" />,
          className: "bg-green-50 border-green-200"
        });
        router.push("/farmer-dashboard/my-listings");
      } else {
        toast.error("Update Failed", {
          description: result.error,
          icon: <AlertCircle className="h-5 w-5" />
        });
      }
    });
  };

  const sectionIcons = [Package, IndianRupee, ImageIcon, Phone];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/30 to-green-100/40">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-green-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBNNDAgNDBMMCAwIiBzdHJva2U9IiMwNjQ4MjAiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header with animation */}
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
            Back to Listings
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl">
            {/* Card top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />

            <CardHeader className="relative bg-gradient-to-r from-emerald-50/80 via-green-50/60 to-teal-50/80 border-b border-emerald-100/50 pb-8 px-6 sm:px-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    className="bg-gradient-to-br from-emerald-400 to-green-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/25"
                  >
                    <Edit3 className="h-7 w-7" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1"
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                    Edit Listing
                  </CardTitle>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    Update your {product.productName} details
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                  ID: #{product.id?.slice(0, 8)}
                </Badge>
              </div>

              {/* Section Navigation */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                {["Product Details", "Pricing & Stock", "Images & Info", "Contact"].map((section, idx) => {
                  const Icon = sectionIcons[idx];
                  return (
                    <motion.button
                      key={section}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(idx + 1)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeSection === idx + 1
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-white/60 text-gray-600 hover:bg-white hover:shadow-md"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section}
                    </motion.button>
                  );
                })}
              </div>
            </CardHeader>

            <form action={handleSubmit}>
              <CardContent className="px-6 sm:px-8 pt-8 pb-4">
                <AnimatePresence mode="wait">
                  {activeSection === 1 && (
                    <motion.section
                      key="product-details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Package className="h-6 w-6 text-emerald-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Product Details</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-semibold text-gray-700">Product Name <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="e.g. Fresh Organic Alphanso Mangoes"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            maxLength={100}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></Label>
                          <Select
                            name="category"
                            defaultValue={selectedCategory}
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {produceCategories.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <AnimatePresence>
                            {selectedCategory === "Other" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 overflow-hidden"
                              >
                                <Label className="text-emerald-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Specify Category Name
                                </Label>
                                <Input
                                  placeholder="e.g. Exotic Fruit, Spices..."
                                  value={customCategory}
                                  onChange={(e) => setCustomCategory(e.target.value)}
                                  maxLength={50}
                                  className="mt-1.5 h-11 bg-emerald-50/50 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition-all"
                                  required
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Quality Grade</Label>
                          <Select name="qualityGrade" defaultValue={product.qualityGrade}>
                            <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map(g => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-emerald-500" />
                            Variety & Features
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={handleTagKeyDown}
                              placeholder="Add tags like 'Hybrid', 'Fresh'..."
                              className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                            />
                            <Button
                              type="button"
                              onClick={handleAddTag}
                              variant="outline"
                              className="h-12 px-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl transition-all duration-300"
                            >
                              Add
                            </Button>
                          </div>
                          <AnimatePresence>
                            {tags.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 mt-3"
                              >
                                {tags.map((tag, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border border-emerald-200 shadow-sm"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(tag)}
                                      className="ml-2 hover:text-red-600 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </motion.span>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Shelf Life <span className="text-red-500">*</span></Label>
                          <Input
                            name="shelfLife"
                            defaultValue={product.shelfLife}
                            placeholder="e.g. 10 Days"
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            Shelf Life Start Date
                          </Label>
                          <Input
                            type="date"
                            name="shelfLifeStartDate"
                            defaultValue={formatDate(product.shelfLifeStartDate)}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                          <p className="text-xs text-gray-500 mt-1.5 ml-1">
                            Date when shelf life countdown begins
                          </p>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {activeSection === 2 && (
                    <motion.section
                      key="pricing"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <IndianRupee className="h-6 w-6 text-emerald-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Inventory & Pricing</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Scale className="h-4 w-4 text-gray-400" />
                            Stock Quantity <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="availableStock"
                            type="number"
                            step="0.01"
                            max={10000000}
                            defaultValue={product.availableStock}
                            required
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Select
                            name="unit"
                            value={unit}
                            onValueChange={setUnit}
                          >
                            <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <AnimatePresence>
                            {unit === "Other" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-2 overflow-hidden"
                              >
                                <Label className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 block">
                                  Enter Custom Unit
                                </Label>
                                <Input
                                  placeholder="e.g. bundle, bunch"
                                  value={customUnit}
                                  onChange={(e) => setCustomUnit(e.target.value)}
                                  className="h-10 bg-white border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                  required={unit === "Other"}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-gray-400" />
                            Price per Unit <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="pricePerUnit"
                            type="number"
                            step="0.01"
                            max={100000000}
                            defaultValue={product.pricePerUnit}
                            required
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            Delivery Charge <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="deliveryCharge"
                            type="number"
                            step="0.01"
                            defaultValue={product.deliveryCharge || 0}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Delivery Type</Label>
                          <Select name="deliveryChargeType" defaultValue={product.deliveryChargeType || 'per_unit'}>
                            <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_unit">Per Unit</SelectItem>
                              <SelectItem value="flat">Flat Rate</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1.5 ml-1">
                            Per unit multiplies by quantity; flat applies once
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-500" />
                            Max Delivery Range (KM) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="maxDeliveryRange"
                            type="number"
                            step="0.1"
                            defaultValue={product.maxDeliveryRange}
                            placeholder="e.g. 50"
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                          <p className="text-xs text-gray-500 mt-1.5 ml-1">
                            Maximum distance you can deliver (overrides profile)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Min Order Qty <span className="text-red-500">*</span></Label>
                          <Input
                            name="minOrderQuantity"
                            type="number"
                            step="0.01"
                            defaultValue={product.minOrderQuantity}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            Harvest Date
                          </Label>
                          <Input
                            type="date"
                            name="harvestDate"
                            defaultValue={formatDate(product.harvestDate)}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                          />
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {activeSection === 3 && (
                    <motion.section
                      key="images"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <ImageIcon className="h-6 w-6 text-emerald-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Images & Information</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                            <Upload className="h-4 w-4 text-gray-400" />
                            Product Images <span className="text-red-500">*</span>
                          </Label>
                          <ImageUpload
                            value={images}
                            onChange={handleImageUpload}
                            onRemove={handleRemoveImage}
                          />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Description</Label>
                          <Textarea
                            name="description"
                            defaultValue={product.description}
                            className="min-h-[140px] bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition-all"
                            placeholder="Describe your product in detail..."
                          />
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {activeSection === 4 && (
                    <motion.section
                      key="contact"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Phone className="h-6 w-6 text-emerald-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            WhatsApp Number
                          </Label>
                          <Input
                            name="whatsappNumber"
                            defaultValue={product.whatsappNumber}
                            className="h-12 bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </CardContent>

              <CardFooter className="flex justify-between items-center bg-gradient-to-r from-gray-50/80 to-emerald-50/50 border-t border-emerald-100/50 py-6 px-6 sm:px-8">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <motion.button
                      key={step}
                      type="button"
                      onClick={() => setActiveSection(step)}
                      whileHover={{ scale: 1.1 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${activeSection === step
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                        : "bg-white text-gray-400 hover:text-emerald-600 border border-gray-200"
                        }`}
                    >
                      {step}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.back()}
                    className="h-12 px-6 border-gray-300 hover:bg-white hover:border-emerald-300 rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="relative h-12 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 rounded-xl transition-all duration-300 overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                      {isPending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Save className="h-5 w-5" />
                          </motion.div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                          Save Changes
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}