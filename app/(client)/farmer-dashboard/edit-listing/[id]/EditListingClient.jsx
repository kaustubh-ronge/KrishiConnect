"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProductListing } from "@/actions/products"; // Import update action
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Edit, Save } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

// Constants (Same as Create Page)
const produceCategories = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const unitOptions = ["kg", "ton", "quintal", "crate", "box"];

export default function EditListingClient({ product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize State with Existing Data
  const [images, setImages] = useState(product.images || []);
  const [tags, setTags] = useState(product.variety ? product.variety.split(", ") : []);
  
  const handleSubmit = async (formData) => {
    formData.delete("images");
    images.forEach(url => formData.append("images", url));
    if (tags.length > 0) formData.set("variety", tags.join(", "));

    startTransition(async () => {
      const result = await updateProductListing(product.id, formData);
      if (result.success) {
        toast.success("Listing Updated Successfully!");
        router.push("/farmer-dashboard/my-listings");
      } else {
        toast.error("Update Failed", { description: result.error });
      }
    });
  };

  // Render largely same form as Create, but with defaultValue={product.xyz}
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4"/> Cancel</Button>
        
        <Card className="shadow-lg border-green-100">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Edit className="h-6 w-6"/></div>
                    <CardTitle>Edit Listing: {product.productName}</CardTitle>
                </div>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="grid gap-6 pt-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Select name="productName" defaultValue={product.productName}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{produceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select name="unit" defaultValue={product.unit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Stock</Label><Input name="availableStock" type="number" step="0.01" defaultValue={product.availableStock} required /></div>
                        <div className="space-y-2"><Label>Price per Unit</Label><Input name="pricePerUnit" type="number" step="0.01" defaultValue={product.pricePerUnit} required /></div>
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <Label>Images</Label>
                        <ImageUpload value={images} onChange={(urls) => setImages([...images, ...urls])} onRemove={(url) => setImages(images.filter(i => i !== url))} />
                    </div>

                    {/* Description */}
                    <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={product.description} /></div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 bg-gray-50 py-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">{isPending ? "Saving..." : "Save Changes"}</Button>
                </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
}