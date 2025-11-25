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
import { ArrowLeft, IndianRupee, Scale, Calendar, Phone, Briefcase, X, Tag, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";

const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];
const gradeOptions = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

export default function AgentCreateListingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (t) => setTags(tags.filter(tag => tag !== t));
  const handleTagKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(e); } };

  const handleSubmit = async (formData) => {
    if (images.length === 0) { toast.error("Upload at least one image."); return; }
    formData.delete("images");
    images.forEach(url => formData.append("images", url));
    if (tags.length > 0) formData.set("variety", tags.join(", "));

    startTransition(async () => {
      const result = await createProductListing(formData);
      if (result.success) {
        toast.success("Stock Listed Successfully!");
        router.push("/agent-dashboard/my-listings");
      } else {
        toast.error("Failed", { description: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6 text-gray-600 hover:text-blue-600 pl-0" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-blue-100 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Briefcase className="h-6 w-6" /></div>
                <div><CardTitle className="text-2xl text-gray-900">Add Stock</CardTitle><CardDescription>List inventory for sale.</CardDescription></div>
              </div>
            </CardHeader>
            <form action={handleSubmit}>
              <CardContent className="grid gap-8 pt-8">
                {/* 1. Product */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">1. Product</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Product</Label><Select name="productName" required><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Crop" /></SelectTrigger><SelectContent>{produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Grade</Label><Select name="qualityGrade"><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-blue-600" /> Variety (Tags)</Label>
                      <div className="flex gap-2"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Enter variety..." className="bg-white h-12" /><Button type="button" onClick={handleAddTag} variant="outline" className="h-12 border-blue-200 text-blue-600">Add</Button></div>
                      <div className="flex flex-wrap gap-2 mt-2">{tags.map((tag, i) => (<span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">{tag} <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2"><X className="h-3 w-3" /></button></span>))}</div>
                    </div>
                  </div>
                </section>
                {/* 2. Inventory */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">2. Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Stock</Label><Input type="number" step="0.01" name="availableStock" required className="bg-white h-12" /></div>
                    <div className="space-y-2"><Label>Unit</Label><Select name="unit" defaultValue="kg"><SelectTrigger className="bg-white h-12"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Price/Unit</Label><Input type="number" step="0.01" name="pricePerUnit" required className="bg-white h-12" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Procured Date</Label><Input type="date" name="harvestDate" className="bg-white h-12" /></div>
                  </div>
                </section>
                {/* 3. Images */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">3. Media</h3>
                  <div className="space-y-2"><Label>Images</Label><ImageUpload value={images} onChange={(urls) => setImages([...images, ...urls])} onRemove={(url) => setImages(images.filter(i => i !== url))} /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea name="description" className="bg-white" /></div>
                </section>
                {/* 4. Contact */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">4. Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label>WhatsApp</Label><Input name="whatsappNumber" className="bg-white h-12" /></div></div>
                </section>
              </CardContent>
              <CardFooter className="bg-blue-50 border-t border-blue-100 py-6 flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">{isPending ? "Publishing..." : "Publish Listing"}</Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}