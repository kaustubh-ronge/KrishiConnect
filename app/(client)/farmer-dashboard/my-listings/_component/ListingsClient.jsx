"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListing } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Edit, Leaf, Scale, IndianRupee, Calendar, MoreVertical, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ListingsClient({ initialListings }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id) => {
    // Optimistic UI Update
    const previous = listings;
    setListings(listings.filter(item => item.id !== id));
    toast.promise(
        deleteListing(id),
        {
            loading: 'Deleting...',
            success: (result) => {
                if (!result.success) {
                    setListings(previous); // Revert on failure
                    throw new Error(result.error);
                }
                return 'Listing deleted successfully';
            },
            error: 'Failed to delete listing',
        }
    );
  };

  // --- Empty State ---
  if (listings.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-green-200"
      >
        <div className="bg-green-100 p-6 rounded-full mb-6 shadow-inner">
          <Leaf className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Your inventory is empty</h3>
        <p className="text-gray-600 max-w-md mt-3 mb-8 text-lg">
          Add your harvest to the marketplace so agents can start bidding on your produce.
        </p>
        <Button asChild className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all text-lg h-12 px-8 rounded-full">
          <Link href="/farmer-dashboard/create-listing">
            <Package className="mr-2 h-5 w-5" /> Create First Listing
          </Link>
        </Button>
      </motion.div>
    );
  }

  // --- Grid Layout ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence>
        {listings.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              
              {/* Image Area */}
              <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.productName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-green-50">
                    <Leaf className="text-green-200 h-20 w-20 opacity-50"/>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/50 backdrop-blur-md hover:bg-black/60 text-white border-0">
                        {product.unit}
                    </Badge>
                </div>
                
                <div className="absolute top-3 right-3">
                  <Badge className={`${product.isAvailable ? "bg-green-500" : "bg-red-500"} shadow-lg border-0 px-3 py-1`}>
                    {product.isAvailable ? "Active" : "Sold Out"}
                  </Badge>
                </div>

                {/* Price Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16">
                   <div className="text-white">
                        <p className="text-xs opacity-90 font-medium uppercase tracking-wider">Price</p>
                        <p className="text-2xl font-bold flex items-center">
                            <IndianRupee className="h-5 w-5 mr-1" /> {product.pricePerUnit} <span className="text-sm font-normal ml-1 opacity-80">/ {product.unit}</span>
                        </p>
                   </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{product.productName}</h3>
                    {product.variety && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {product.variety.split(',').map((tag, i) => (
                                <span key={i} className="text-[10px] font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-100">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  {/* Quick Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/farmer-dashboard/edit-listing/${product.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Stock</p>
                      <p className="font-semibold text-gray-900">{product.availableStock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Harvest</p>
                      <p className="font-semibold text-gray-900">
                        {product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full border-gray-300 hover:bg-white hover:border-green-500 hover:text-green-600" onClick={() => router.push(`/farmer-dashboard/edit-listing/${product.id}`)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-100" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}