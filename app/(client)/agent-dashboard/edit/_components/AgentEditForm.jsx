"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAgentProfile } from '@/actions/agent-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from 'sonner';
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, User, Briefcase, Phone, MapPin, CreditCard, Save, CheckCircle2 } from "lucide-react";

const agentTypeOptions = [
  "Wholesale Buyer",
  "Fertilizer Provider",
  "Pesticide Dealer",
  "Nursery Owner",
  "FMCG Buyer",
  "Retailer/Shop Owner",
  "Logistics/Transport",
  "Other"
];

export default function AgentEditForm({ initialProfile = {}, user }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- State for Agent Types ---
  // We need to split existing types into "Standard" checkboxes and "Other" text
  const initialTypes = initialProfile.agentType || [];
  
  // Find types that match our hardcoded list
  const standardMatches = initialTypes.filter(t => agentTypeOptions.includes(t));
  
  // Find types that DON'T match (custom ones entered previously)
  const customMatches = initialTypes.filter(t => !agentTypeOptions.includes(t));
  const hasCustom = customMatches.length > 0;

  const [selectedTypes, setSelectedTypes] = useState(hasCustom ? [...standardMatches, "Other"] : standardMatches);
  const [otherType, setOtherType] = useState(hasCustom ? customMatches.join(", ") : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // 1. Handle Agent Types manually
    formData.delete('agentType'); // Clear default handling
    
    // Add standard selected types
    selectedTypes.forEach(t => {
        if (t !== "Other") formData.append('agentType', t);
    });

    // Add custom type if "Other" is checked
    if (selectedTypes.includes('Other') && otherType.trim()) {
        formData.append('agentType', otherType.trim());
    }

    // Validation
    const types = formData.getAll('agentType');
    if (types.length === 0) {
        toast.error("Please select at least one Agent Type.");
        return;
    }

    startTransition(async () => {
        const res = await updateAgentProfile(formData);
        if (res.success) {
            toast.success('Profile updated successfully');
            router.push('/agent-dashboard');
            router.refresh();
        } else {
            toast.error(res.error || 'Failed to update profile');
        }
    });
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl">
        <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 text-gray-600 hover:text-blue-600 pl-0 hover:bg-transparent"
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-blue-100 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Briefcase className="h-8 w-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-900">Edit Business Profile</CardTitle>
                            <CardDescription>Update your company details and trading preferences.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-8 pt-8 px-8">
                        
                        {/* 1. Personal & Business */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                                <User className="h-5 w-5 text-blue-600" /> Identity & Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input name="name" defaultValue={initialProfile.name} required className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input name="companyName" defaultValue={initialProfile.companyName} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input name="phone" defaultValue={initialProfile.phone} required className="pl-10 bg-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Operating Region</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input name="region" defaultValue={initialProfile.region} className="pl-10 bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Agent Types */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" /> Business Category
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {agentTypeOptions.map(type => (
                                    <div key={type} className="flex items-center space-x-2 border border-gray-100 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                                        <Checkbox 
                                            id={type} 
                                            checked={selectedTypes.includes(type)}
                                            onCheckedChange={() => toggleType(type)}
                                        />
                                        <label htmlFor={type} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                            {type}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            
                            <AnimatePresence>
                                {selectedTypes.includes('Other') && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Label className="text-blue-600 text-xs font-semibold uppercase">Specify Other Category</Label>
                                        <Input 
                                            placeholder="e.g. Cold Storage Operator" 
                                            value={otherType} 
                                            onChange={(e) => setOtherType(e.target.value)} 
                                            className="mt-1 bg-blue-50 border-blue-200 focus:border-blue-500"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 3. Payment Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                                <CreditCard className="h-5 w-5 text-blue-600" /> Banking Details <span className="text-xs font-normal text-gray-500 ml-auto">(For receiving payments)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>UPI ID</Label>
                                    <Input name="upiId" defaultValue={initialProfile.upiId} placeholder="user@bank" className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bank Name</Label>
                                    <Input name="bankName" defaultValue={initialProfile.bankName} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Number</Label>
                                    <Input name="accountNumber" type="password" defaultValue={initialProfile.accountNumber} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>IFSC Code</Label>
                                    <Input name="ifscCode" defaultValue={initialProfile.ifscCode} className="bg-white uppercase" />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t border-gray-100 py-6 px-8 flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 px-8">Cancel</Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md h-11 px-8">
                            {isPending ? "Saving Changes..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    </div>
  );
}