"use client";

import { ImagePlus, X, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ImageUpload({ value = [], onChange, onRemove }) {
  
  // Helper: Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Limit validation (Optional: e.g. max 5 images total)
    if (value.length + files.length > 5) {
        toast.error("Maximum 5 images allowed");
        return;
    }

    // Size validation (4MB)
    const validFiles = files.filter(f => f.size < 4 * 1024 * 1024);
    if (validFiles.length !== files.length) {
        toast.error("Skipped files larger than 4MB");
    }

    try {
        const base64Promises = validFiles.map(file => convertToBase64(file));
        const newImages = await Promise.all(base64Promises);
        // Pass new images back to parent
        onChange(newImages); 
    } catch (error) {
        console.error(error);
        toast.error("Error processing images");
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
              <Image 
                src={url} 
                alt="Preview" 
                fill 
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button 
                type="button" 
                onClick={() => onRemove(url)} 
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-green-300 rounded-xl p-8 bg-green-50/30 hover:bg-green-50 transition-colors text-center relative cursor-pointer group">
        <Input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-green-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <ImagePlus className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-900 font-medium">Click to upload images</p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG or WebP (max 4MB)</p>
        </div>
      </div>
    </div>
  );
}