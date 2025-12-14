"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductListing } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, IndianRupee, Scale, Calendar, Phone, Leaf, X, Tag, Image as ImageIcon, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ImageUpload"; // Using the shared component

// Constants
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

export default function CreateListingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- State ---
  const [images, setImages] = useState([]); // Stores Base64 strings from ImageUpload
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Custom Product State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customProduct, setCustomProduct] = useState("");

  // Calculation State (for UX)
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("kg");

  // --- Handlers ---
  const handleImageUpload = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (urlToRemove) => {
    setImages((prev) => prev.filter((url) => url !== urlToRemove));
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

  // --- Submit ---
  const handleSubmit = async (formData) => {
    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    // 1. HANDLE CUSTOM PRODUCT NAME LOGIC
    if (selectedProduct === "Other") {
      if (!customProduct.trim()) {
        toast.error("Please specify the product name.");
        return;
      }
      formData.set("productName", customProduct.trim());
    } else if (!selectedProduct) {
      toast.error("Please select a product.");
      return;
    }

    // 2. Append images to formData
    formData.delete("images");
    images.forEach(img => formData.append("images", img));

    // 3. Append tags
    if (tags.length > 0) formData.set("variety", tags.join(", "));

    startTransition(async () => {
      const result = await createProductListing(formData);
      if (result.success) {
        toast.success("Listing Published Successfully!");
        router.push("/farmer-dashboard/my-listings");
      } else {
        toast.error("Listing Failed", { description: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6 text-gray-600 hover:text-green-600 pl-0" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">

            <CardHeader className="bg-green-50/50 border-b border-green-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-xl text-green-600"><Leaf className="h-6 w-6" /></div>
                <div><CardTitle className="text-2xl text-gray-900">Create New Listing</CardTitle><CardDescription>Provide details about your produce.</CardDescription></div>
              </div>
            </CardHeader>

            <form action={handleSubmit}>
              <CardContent className="grid gap-8 pt-8">

                {/* 1. Product Details */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">1. Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Crop / Product Select + Custom Input */}
                    <div className="space-y-2">
                      <Label>Crop / Product *</Label>
                      <Select name="productName" required onValueChange={setSelectedProduct}>
                        <SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Crop" /></SelectTrigger>
                        <SelectContent>
                          {produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* Conditional Input */}
                      <AnimatePresence>
                        {selectedProduct === "Other" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-1 overflow-hidden"
                          >
                            <Label className="text-green-600 text-xs font-semibold uppercase tracking-wide">Specify Product Name</Label>
                            <Input
                              placeholder="e.g. Dragon Fruit, Mushrooms..."
                              value={customProduct}
                              onChange={(e) => setCustomProduct(e.target.value)}
                              className="bg-green-50 border-green-200 focus:border-green-500 h-11 mt-1"
                              required
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2"><Label>Quality Grade</Label><Select name="qualityGrade"><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-green-600" /> Variety & Features</Label>
                      <div className="flex gap-2">
                        <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type and press Enter (e.g. 'Organic', 'Hybrid')" className="bg-white h-12" />
                        <Button type="button" onClick={handleAddTag} variant="outline" className="h-12 px-6 border-green-200 text-green-700 hover:bg-green-50">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                        {tags.map((tag, index) => (<span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">{tag} <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-green-600 hover:text-green-900"><X className="h-3 w-3" /></button></span>))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Shelf Life (e.g., 10 Days)</Label>
                      <Input name="shelfLife" placeholder="e.g. 10 Days" className="bg-white h-12" />
                    </div>

                    {/* Shelf Life Start Date */}
                    <div className="space-y-2">
                      <Label className="text-gray-700">Shelf Life Start Date *</Label>
                      <Input
                        type="date"
                        name="shelfLifeStartDate"
                        className="bg-white h-12 border-gray-200 focus:ring-green-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Date the shelf life countdown begins.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. Pricing & Inventory */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">2. Inventory & Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Total Stock *</Label><Input type="number" step="0.01" name="availableStock" required className="bg-white h-12" onChange={(e) => setStock(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Unit *</Label><Select name="unit" defaultValue="kg" onValueChange={setUnit}><SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Price per Unit *</Label><Input type="number" step="0.01" name="pricePerUnit" required className="bg-white h-12" onChange={(e) => setPrice(e.target.value)} /></div>

                    <div className="space-y-2"><Label>Delivery Charge (per unit)</Label><Input type="number" step="0.01" name="deliveryCharge" defaultValue={0} className="bg-white h-12" /></div>
                    <div className="space-y-2">
                      <Label>Delivery Type</Label>
                      <Select name="deliveryChargeType" defaultValue="flat">
                        <SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_unit">Per Unit</SelectItem>
                          <SelectItem value="flat">Flat (once per listing)</SelectItem>
                        </SelectContent>
                      <p className="text-xs text-gray-500 mt-1">Choose how delivery is applied: per unit multiplies by quantity; flat applies once per listing.</p>
                      </Select>
                    </div>

                    <div className="space-y-2"><Label>Min Order Qty</Label><Input type="number" step="0.01" name="minOrderQuantity" className="bg-white h-12" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Harvest Date (Optional)</Label><Input type="date" name="harvestDate" className="bg-white h-12" /></div>
                  </div>

                  {/* Live Calculation */}
                  {(stock && price) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-blue-800 border border-blue-100">
                      <Info className="h-5 w-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Estimated Total Stock Value</p>
                        <p className="text-2xl font-bold">₹ {((parseFloat(stock) || 0) * (parseFloat(price) || 0)).toLocaleString('en-IN')}</p>
                        <p className="text-xs opacity-80">Based on {stock} {unit} at ₹{price}/{unit}</p>
                      </div>
                    </motion.div>
                  )}
                </section>

                {/* 3. Images - Uses Reusable Component */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">3. Images & Info</h3>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-500" /> Product Images *</Label>

                    {/* Using the shared ImageUpload component */}
                    <ImageUpload
                      value={images}
                      onChange={handleImageUpload}
                      onRemove={handleRemoveImage}
                    />

                  </div>
                  <div className="space-y-2 mt-4"><Label>Description</Label><Textarea name="description" placeholder="Describe your produce..." className="min-h-[120px] bg-white resize-y" /></div>
                </section>

                {/* 4. Contact */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">4. Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>WhatsApp Number</Label><Input name="whatsappNumber" className="bg-white h-12" /></div>
                  </div>
                </section>
              </CardContent>

              <CardFooter className="bg-gray-50/50 border-t border-green-100 py-6 flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.back()} className="h-12 px-6">Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 px-8 shadow-md text-lg h-12">
                  {isPending ? "Publishing..." : "Publish Listing"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}