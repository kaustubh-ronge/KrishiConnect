"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProductListing } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Edit, Save, Image as ImageIcon, Tag, X, Leaf, Phone, Calendar, Scale, IndianRupee, Briefcase } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { motion } from "framer-motion";

// Constants
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

export default function AgentEditClient({ product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- State Initialization (Pre-filling data) ---
  const [images, setImages] = useState(product.images || []);
  const [tags, setTags] = useState(product.variety ? product.variety.split(", ") : []);
  const [tagInput, setTagInput] = useState("");

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

  // --- Submit ---
  const handleSubmit = async (formData) => {
    if (images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    // Append Images
    formData.delete("images");
    images.forEach(url => formData.append("images", url));

    // Append Tags
    if (tags.length > 0) formData.set("variety", tags.join(", "));

    startTransition(async () => {
      const result = await updateProductListing(product.id, formData);
      if (result.success) {
        toast.success("Listing Updated Successfully!");
        router.push("/agent-dashboard/my-listings");
      } else {
        toast.error("Update Failed", { description: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-gray-600 hover:text-blue-600 pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-xl border-blue-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Edit className="h-6 w-6" /></div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Edit Listing (Agent)</CardTitle>
                  <p className="text-sm text-gray-500">Update stock levels, pricing, or details.</p>
                </div>
              </div>
            </CardHeader>

            <form action={handleSubmit}>
              <CardContent className="grid gap-8 pt-8">

                {/* 1. Product Details */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">1</span>
                    Product Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Crop / Product</Label>
                      <Select name="productName" defaultValue={product.productName}>
                        <SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>{produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quality Grade</Label>
                      <Select name="qualityGrade" defaultValue={product.qualityGrade}>
                        <SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {/* Tags */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-blue-600" /> Variety & Features</Label>
                      <div className="flex gap-2">
                        <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add tags..." className="bg-white h-12" />
                        <Button type="button" onClick={handleAddTag} variant="outline" className="h-12 border-blue-200 text-blue-600 hover:bg-blue-50">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                        {tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                            {tag} <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2"><Label>Shelf Life</Label><Input name="shelfLife" defaultValue={product.shelfLife} className="bg-white h-12" /></div>
                  </div>
                </section>

                {/* 2. Inventory & Pricing */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">2</span>
                    Inventory & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label className="flex items-center gap-2"><Scale className="h-4 w-4 text-gray-500" /> Stock</Label><Input name="availableStock" type="number" step="0.01" defaultValue={product.availableStock} required className="bg-white h-12" /></div>
                    <div className="space-y-2"><Label>Unit</Label><Select name="unit" defaultValue={product.unit}><SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-gray-500" /> Price</Label><Input name="pricePerUnit" type="number" step="0.01" defaultValue={product.pricePerUnit} required className="bg-white h-12" /></div>
                    <div className="space-y-2"><Label>Min Order Qty</Label><Input name="minOrderQuantity" type="number" step="0.01" defaultValue={product.minOrderQuantity} className="bg-white h-12" /></div>
                    <div className="space-y-2 md:col-span-2"><Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /> Harvest Date</Label><Input type="date" name="harvestDate" defaultValue={product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : ''} className="bg-white h-12" /></div>
                  </div>
                </section>

                {/* 3. Images */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">3</span>
                    Images & Info
                  </h3>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-500" /> Product Images</Label>
                    <ImageUpload value={images} onChange={handleImageUpload} onRemove={handleRemoveImage} />
                  </div>
                  <div className="space-y-2 mt-4"><Label>Description</Label><Textarea name="description" defaultValue={product.description} className="min-h-[120px] bg-white" /></div>
                </section>

                {/* 4. Contact */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1">4</span>
                    Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" /> WhatsApp</Label><Input name="whatsappNumber" defaultValue={product.whatsappNumber} className="bg-white h-12" /></div>
                  </div>
                </section>

              </CardContent>
              <CardFooter className="flex justify-end gap-4 bg-gray-50 border-t border-blue-100 py-6">
                <Button variant="outline" type="button" onClick={() => router.back()} className="h-12 px-6">Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-lg h-12 px-8">
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}