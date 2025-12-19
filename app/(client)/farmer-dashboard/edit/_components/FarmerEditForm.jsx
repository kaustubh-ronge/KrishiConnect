"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateFarmerProfile } from '@/actions/farmer-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, MapPin, LandPlot, Sprout, CreditCard, Save } from "lucide-react";

const produceOptions = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Other"];

export default function FarmerEditForm({ initialProfile = {}, user }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse existing produce
  const initialProduce = initialProfile.primaryProduce || [];
  const standardMatches = initialProduce.filter(p => produceOptions.includes(p));
  const customMatches = initialProduce.filter(p => !produceOptions.includes(p));
  const hasCustom = customMatches.length > 0;

  const [selectedProduce, setSelectedProduce] = useState(hasCustom ? [...standardMatches, "Other"] : standardMatches);
  const [otherProduce, setOtherProduce] = useState(hasCustom ? customMatches.join(", ") : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Handle Produce manually
    formData.delete('primaryProduce');
    selectedProduce.forEach(p => {
        if (p !== "Other") formData.append('primaryProduce', p);
    });
    if (selectedProduce.includes('Other') && otherProduce.trim()) {
        formData.append('primaryProduce', otherProduce.trim());
    }

    // Validation
    const produce = formData.getAll('primaryProduce');
    if (produce.length === 0) {
        toast.error("Please add at least one produce item.");
        return;
    }

    startTransition(async () => {
      const res = await updateFarmerProfile(formData);
      if (res.success) {
        toast.success('Profile updated successfully');
        router.push('/farmer-dashboard');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update profile');
      }
    });
  };

  const toggleProduce = (produce) => {
    setSelectedProduce(prev => 
        prev.includes(produce) ? prev.filter(p => p !== produce) : [...prev, produce]
    );
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 text-gray-600 hover:text-green-600 pl-0 hover:bg-transparent"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-green-100 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-green-50/50 border-b border-green-100 pb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-xl text-green-600">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Edit Farmer Profile</CardTitle>
                        <CardDescription>Update your personal, farm, and banking details.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-8 pt-8 px-8">
                    
                    {/* 1. Personal */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <User className="h-5 w-5 text-green-600" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input name="name" defaultValue={initialProfile.name} required className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input name="phone" defaultValue={initialProfile.phone} required className="bg-white" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Aadhar Number</Label>
                                <Input name="aadharNumber" defaultValue={initialProfile.aadharNumber} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Farm Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <LandPlot className="h-5 w-5 text-green-600" /> Farm Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Farm Name</Label>
                                <Input name="farmName" defaultValue={initialProfile.farmName} placeholder="(Optional)" className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Farm Size (Acres)</Label>
                                <Input name="farmSize" type="number" step="0.1" defaultValue={initialProfile.farmSize} className="bg-white" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Experience (Years)</Label>
                                <Input name="farmingExperience" type="number" defaultValue={initialProfile.farmingExperience} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Location */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <MapPin className="h-5 w-5 text-green-600" /> Location
                        </h3>
                        <div className="space-y-2">
                            <Label>Full Address</Label>
                            <Textarea name="address" defaultValue={initialProfile.address} required className="bg-white min-h-[80px]" />
                        </div>
                    </div>

                    {/* 4. Produce */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <Sprout className="h-5 w-5 text-green-600" /> Primary Produce
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {produceOptions.map(p => (
                                <div key={p} className="flex items-center space-x-2 border border-gray-100 p-2 rounded-lg hover:bg-green-50 transition-colors">
                                    <Checkbox 
                                        id={p} 
                                        checked={selectedProduce.includes(p)} 
                                        onCheckedChange={() => toggleProduce(p)} 
                                    />
                                    <label htmlFor={p} className="text-sm font-medium leading-none cursor-pointer w-full">{p}</label>
                                </div>
                            ))}
                        </div>
                        <AnimatePresence>
                            {selectedProduce.includes('Other') && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <Label className="text-green-600 text-xs font-semibold">Specify Other Produce</Label>
                                    <Input 
                                        placeholder="e.g. Dragon Fruit" 
                                        value={otherProduce} 
                                        onChange={(e) => setOtherProduce(e.target.value)} 
                                        className="mt-1 bg-green-50 border-green-200 focus:border-green-500"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 5. Banking */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <CreditCard className="h-5 w-5 text-green-600" /> Banking Details <span className="text-xs font-normal text-gray-500 ml-auto">(For Payouts)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label>UPI ID</Label><Input name="upiId" defaultValue={initialProfile.upiId} className="bg-white" /></div>
                            <div className="space-y-2"><Label>Bank Name</Label><Input name="bankName" defaultValue={initialProfile.bankName} className="bg-white" /></div>
                            <div className="space-y-2"><Label>IFSC Code</Label><Input name="ifscCode" defaultValue={initialProfile.ifscCode} className="bg-white uppercase" /></div>
                            <div className="space-y-2"><Label>Account Number</Label><Input name="accountNumber" type="password" defaultValue={initialProfile.accountNumber} className="bg-white" /></div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-100 py-6 px-8 flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 px-8">Cancel</Button>
                    <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white shadow-md h-11 px-8">
                        {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </motion.div>
    </div>
  );
}