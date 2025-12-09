"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListing } from "@/actions/products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Leaf, Scale, IndianRupee, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AgentListingsClient({ initialListings }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id) => {
    if(!confirm("Delete this listing?")) return;
    const previous = listings;
    setListings(listings.filter(item => item.id !== id));

    startTransition(async () => {
      const result = await deleteListing(id);
      if (result.success) {
        toast.success("Deleted successfully.");
        router.refresh();
      } else {
        setListings(previous);
        toast.error("Failed to delete.");
      }
    });
  };

  if (listings.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-blue-200">
      <Leaf className="h-10 w-10 text-blue-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900">Your inventory is empty</h3>
      <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700"><Link href="/agent-dashboard/create-listing">Add Stock</Link></Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {listings.map((product, index) => (
          <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-blue-100 group bg-white rounded-xl">
              <div className="relative h-52 w-full bg-gray-100 overflow-hidden">
                {product.images[0] ? <Image src={product.images[0]} alt={product.productName} fill className="object-cover" /> : <div className="flex h-full items-center justify-center bg-blue-50"><Leaf className="text-blue-200 h-16 w-16"/></div>}
                <Badge className={`absolute top-3 right-3 ${product.isAvailable ? "bg-blue-600" : "bg-red-500"}`}>{product.isAvailable ? "Active" : "Sold"}</Badge>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
                   <p className="text-lg font-bold flex items-center"><IndianRupee className="h-4 w-4 mr-1" /> {product.pricePerUnit} <span className="text-xs font-normal opacity-80 ml-1">/ {product.unit}</span></p>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{product.productName}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 -mr-2"><MoreVertical className="h-4 w-4 text-gray-500" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/agent-dashboard/edit-listing/${product.id}`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(product.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm mt-2"><Scale className="h-4 w-4 text-blue-500" /> <span className="font-semibold">{product.availableStock} {product.unit}</span> Stock</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}