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
import { ArrowLeft, IndianRupee, Scale, Calendar, Phone, Leaf, X, Tag, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

// Constants
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

export default function CreateListingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // --- State ---
  const [images, setImages] = useState([]); // Stores Base64 strings
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // --- Helper: File to Base64 ---
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // --- Handlers ---
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
        toast.error("Max 4 images allowed");
        return;
    }
    
    const validFiles = files.filter(f => f.size < 2 * 1024 * 1024); // 2MB limit per file
    if (validFiles.length !== files.length) toast.error("Some files were too big (Max 2MB)");

    const base64Promises = validFiles.map(file => convertToBase64(file));
    const newImages = await Promise.all(base64Promises);
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index) => setImages(images.filter((_, i) => i !== index));

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
  const handleTagKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); }};

  // --- Submit ---
  const handleSubmit = async (formData) => {
    if (images.length === 0) {
        toast.error("Please upload at least one image.");
        return;
    }

    // Append images to formData
    formData.delete("images");
    images.forEach(img => formData.append("images", img));

    // Append tags
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
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
                    <div className="space-y-2"><Label>Crop / Product *</Label><Select name="productName" required><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Crop" /></SelectTrigger><SelectContent>{produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Quality Grade</Label><Select name="qualityGrade"><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-green-600"/> Variety & Features</Label>
                      <div className="flex gap-2"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type and press Enter (e.g. 'Organic', 'Hybrid')" className="bg-white h-12"/><Button type="button" onClick={handleAddTag} variant="outline" className="h-12 px-6">Add</Button></div>
                      <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">{tags.map((tag, index) => (<span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">{tag} <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-green-600 hover:text-green-900"><X className="h-3 w-3" /></button></span>))}</div>
                    </div>
                    <div className="space-y-2 md:col-span-2"><Label>Shelf Life</Label><Input name="shelfLife" placeholder="e.g. 10 Days" className="bg-white h-12" /></div>
                  </div>
                </section>

                {/* 2. Pricing & Inventory */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">2. Inventory & Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Total Stock *</Label><Input type="number" step="0.01" name="availableStock" required className="bg-white h-12" /></div>
                    <div className="space-y-2"><Label>Unit *</Label><Select name="unit" defaultValue="kg"><SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Price per Unit *</Label><Input type="number" step="0.01" name="pricePerUnit" required className="bg-white h-12" /></div>
                    <div className="space-y-2"><Label>Min Order Qty</Label><Input type="number" step="0.01" name="minOrderQuantity" className="bg-white h-12" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Harvest Date</Label><Input type="date" name="harvestDate" className="bg-white h-12" /></div>
                  </div>
                </section>

                {/* 3. Images - DIRECT UPLOAD */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">3. Images</h3>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gray-500"/> Product Images *</Label>
                    <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="cursor-pointer bg-white" />
                    <div className="flex flex-wrap gap-4 mt-4">
                        {images.map((src, index) => (
                            <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
                                <Image src={src} alt="Preview" fill className="object-cover" />
                                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
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