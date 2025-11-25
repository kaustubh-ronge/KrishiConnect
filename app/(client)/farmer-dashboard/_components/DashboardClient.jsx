"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Removed Checkbox import, added X icon
import { createFarmerProfile } from '@/actions/farmer-profile';
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sprout, User, MapPin, LandPlot, CheckCircle2,
  Plus, Package, BarChart3, Settings, MessageCircle, 
  ArrowRight, ShieldCheck, Rocket, X
} from "lucide-react";

export default function DashboardClient({ user, profileExists: initialProfileExists }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const [isDialogOpen, setIsDialogOpen] = useState(!initialProfileExists);
  
  // --- New State for Dynamic Produce Tags ---
  const [selectedProduce, setSelectedProduce] = useState([]);
  const [produceInput, setProduceInput] = useState("");

  // Log initial state
  useEffect(() => {
    if (!initialProfileExists) {
      setIsDialogOpen(true);
    }
  }, [initialProfileExists]);

  const goToCreateListing = () => {
    router.push('/farmer-dashboard/create-listing');
  };

  // --- Helper Functions for Produce Tags ---
  const handleAddProduce = (e) => {
    e.preventDefault(); // Prevent form submission
    if (produceInput.trim() && !selectedProduce.includes(produceInput.trim())) {
      setSelectedProduce([...selectedProduce, produceInput.trim()]);
      setProduceInput("");
    }
  };

  const handleRemoveProduce = (itemToRemove) => {
    setSelectedProduce(selectedProduce.filter(item => item !== itemToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProduce(e);
    }
  };

  // --- Form Submission ---
  const handleProfileSubmit = async (formData) => {
    // Validate produce
    if (selectedProduce.length === 0) {
        toast.error("Please add at least one produce item.");
        return;
    }

    // Manually append the dynamic tags to formData
    selectedProduce.forEach(produce => formData.append('primaryProduce', produce));

    startTransition(async () => {
      const result = await createFarmerProfile(formData);
      if (result.success) {
        setIsDialogOpen(false);
        setProfileExists(true);
        toast.success("Welcome to KrishiConnect!", { description: "Your profile has been created." });
        router.refresh();
      } else {
        toast.error("Error", { description: result.error || "Something went wrong." });
      }
    });
  };

  // --- 1. Welcome Screen (If no profile) ---
  if (!profileExists) {
    return (
      <WelcomeSetupScreen 
        user={user} 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        isPending={isPending}
        handleProfileSubmit={handleProfileSubmit}
        selectedProduce={selectedProduce}
        produceInput={produceInput}
        setProduceInput={setProduceInput}
        handleAddProduce={handleAddProduce}
        handleRemoveProduce={handleRemoveProduce}
        handleKeyDown={handleKeyDown}
      />
    );
  }

  // --- 2. Main Dashboard (If profile exists) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100">
       <div className="container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
             <div className="flex justify-between items-end mb-10">
               <div>
                 <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
                 <p className="text-lg text-gray-600">Welcome back, {user.farmerProfile?.name || "Farmer"}!</p>
               </div>
               <div className="hidden md:block">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full border border-green-200">
                    Verified Farmer
                  </span>
               </div>
             </div>

             {/* Main Action Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <DashboardCard icon={Plus} title="New Product Listing" description="List your harvest to connect with agents immediately." color="green">
                   <Button onClick={goToCreateListing} className="w-full bg-green-600 hover:bg-green-700 font-medium shadow-sm">
                      Create Listing <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </DashboardCard>

                <DashboardCard icon={Package} title="My Listings" description="Manage your active stock, update prices, or mark sold." color="blue">
                    <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300" onClick={() => router.push('/farmer-dashboard/my-listings')}>
                       View Inventory
                    </Button>
                </DashboardCard>

                <DashboardCard icon={BarChart3} title="Sales Insights" description="Track your revenue and most popular produce." color="yellow">
                     <Button variant="ghost" disabled className="w-full text-gray-400 bg-gray-50">Coming Soon</Button>
                </DashboardCard>

                <DashboardCard icon={MessageCircle} title="Messages" description="Chat directly with interested agents and buyers." color="purple">
                     <Button variant="ghost" disabled className="w-full text-gray-400 bg-gray-50">Coming Soon</Button>
                </DashboardCard>

                <DashboardCard icon={Settings} title="Settings" description="Update profile, bank details, and preferences." color="gray">
                     <Button variant="ghost" disabled className="w-full text-gray-400 bg-gray-50">Coming Soon</Button>
                </DashboardCard>
             </div>
          </motion.div>
       </div>
    </div>
  );
}

// --- Sub-Component: Welcome/Setup Screen ---
function WelcomeSetupScreen({ 
  user, isDialogOpen, setIsDialogOpen, isPending, handleProfileSubmit,
  selectedProduce, produceInput, setProduceInput, handleAddProduce, handleRemoveProduce, handleKeyDown 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative z-10 bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border-t-4 border-green-500"
      >
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sprout className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Welcome, Farmer!</h1>
          <p className="text-lg text-gray-600">Set up your profile to start selling.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 shadow-lg">
              Set Up My Farmer Profile
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-6 w-6 text-green-600" /> Farmer Profile Details
              </DialogTitle>
              <DialogDescription>All fields marked with * are required.</DialogDescription>
            </DialogHeader>
            
            <form action={handleProfileSubmit} className="flex-grow overflow-hidden flex flex-col">
              <div className="grid gap-6 py-4 flex-grow overflow-y-auto pr-4">
                
                {/* Personal Info */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                    <User className="h-5 w-5 text-green-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" name="name" required defaultValue={user.name || ""} /></div>
                     <div className="space-y-2"><Label htmlFor="phone">Phone *</Label><Input id="phone" name="phone" required /></div>
                     <div className="space-y-2 sm:col-span-2"><Label htmlFor="aadharNumber">Aadhar</Label><Input id="aadharNumber" name="aadharNumber" placeholder="12-digit number" maxLength={12} /></div>
                  </div>
                </section>

                {/* Farm Info */}
                <section className="space-y-4">
                   <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                      <LandPlot className="h-5 w-5 text-green-600" /> Farm Information
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="farmName">Farm Name</Label><Input id="farmName" name="farmName" placeholder="(Optional)" /></div>
                       <div className="space-y-2"><Label htmlFor="farmSize">Farm Size (Acres)</Label><Input id="farmSize" name="farmSize" type="number" step="0.1" placeholder="0.0" /></div>
                       <div className="space-y-2 sm:col-span-2"><Label htmlFor="farmingExperience">Experience (Years)</Label><Input id="farmingExperience" name="farmingExperience" type="number" placeholder="0" /></div>
                   </div>
                </section>

                {/* Location */}
                <section className="space-y-4">
                   <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                      <MapPin className="h-5 w-5 text-green-600" /> Location
                   </h3>
                   <div className="space-y-2"><Label htmlFor="address">Full Address *</Label><Textarea id="address" name="address" required className="min-h-[80px]" placeholder="Village, Taluka, District..." /></div>
                </section>

                {/* UPDATED: Dynamic Primary Produce */}
                <section className="space-y-4">
                   <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                      <Sprout className="h-5 w-5 text-green-600" /> Primary Produce *
                   </h3>
                   
                   <div className="space-y-3">
                      {/* Input Area */}
                      <div className="flex gap-2">
                        <Input 
                          value={produceInput}
                          onChange={(e) => setProduceInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type crop name (e.g. Wheat, Mango) and press Enter"
                          className="flex-grow"
                        />
                        <Button type="button" onClick={handleAddProduce} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                          Add
                        </Button>
                      </div>

                      {/* Tags Display Area */}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-md border border-dashed border-gray-300">
                        {selectedProduce.length === 0 && (
                          <span className="text-sm text-gray-400 italic p-1">No produce added yet.</span>
                        )}
                        {selectedProduce.map((item, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 animate-in fade-in zoom-in duration-200">
                            {item}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveProduce(item)}
                              className="ml-2 text-green-600 hover:text-green-900 focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">Add all the major crops you grow.</p>
                   </div>
                </section>

              </div>
              <DialogFooter className="pt-4 border-t mt-auto">
                <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" size="lg">
                  {isPending ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>) : "Complete Setup"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

// 2. Reusable Dashboard Card
function DashboardCard({ icon: Icon, title, description, children, color = "green" }) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 flex flex-col justify-between h-full transition-all"
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{description}</p>
      </div>
      <div>
        {children}
      </div>
    </motion.div>
  );
}