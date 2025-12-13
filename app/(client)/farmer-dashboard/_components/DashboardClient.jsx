"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createFarmerProfile } from '@/actions/farmer-profile';
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sprout, User, MapPin, LandPlot, CheckCircle2,
  Plus, Package, BarChart3, Settings, MessageCircle,
  ArrowRight, X, TrendingUp,
  ShoppingBag,
  Store,
  Search
} from "lucide-react";
import Link from 'next/link';

// List of standard crops
const produceOptions = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Other"];

export default function DashboardClient({ user, profileExists: initialProfileExists }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const [isDialogOpen, setIsDialogOpen] = useState(!initialProfileExists);

  // --- Produce State ---
  const [selectedProduce, setSelectedProduce] = useState([]);
  const [otherProduce, setOtherProduce] = useState(""); // Stores custom text

  useEffect(() => {
    if (!initialProfileExists) {
      setIsDialogOpen(true);
    }
  }, [initialProfileExists]);

  const goToCreateListing = () => {
    router.push('/farmer-dashboard/create-listing');
  };

  // --- Form Submission ---
  const handleProfileSubmit = async (formData) => {
    // 1. Add standard checkboxes
    // We clear any existing "primaryProduce" entries to avoid duplicates if re-submitting
    formData.delete('primaryProduce');

    selectedProduce.forEach(produce => {
      if (produce !== "Other") {
        formData.append('primaryProduce', produce);
      }
    });

    // 2. Handle "Other" Logic
    if (selectedProduce.includes("Other") && otherProduce.trim()) {
      formData.append('primaryProduce', otherProduce.trim());
    }

    // Validation
    const hasStandard = selectedProduce.some(p => p !== "Other");
    const hasCustom = selectedProduce.includes("Other") && otherProduce.trim() !== "";

    if (!hasStandard && !hasCustom) {
      toast.error("Please select at least one produce.");
      return;
    }

    startTransition(async () => {
      const result = await createFarmerProfile(formData);
      if (result.success) {
        setIsDialogOpen(false);
        setProfileExists(true);
        toast.success("Welcome to KrishiConnect!", { description: "Your profile is ready." });
        router.refresh();
      } else {
        toast.error("Error", { description: result.error || "Something went wrong." });
      }
    });
  };

  // --- 1. Welcome Screen (Profile Creation) ---
  if (!profileExists) {
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

              <form action={handleProfileSubmit} className="grow overflow-hidden flex flex-col">
                <div className="grid gap-6 py-4 grow overflow-y-auto pr-4">

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
                    <div className="space-y-2"><Label htmlFor="address">Full Address *</Label><Textarea id="address" name="address" required className="min-h-20" placeholder="Village, Taluka, District..." /></div>
                  </section>

                  {/* Primary Produce - UPDATED LOGIC */}
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                      <Sprout className="h-5 w-5 text-green-600" /> Primary Produce *
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {produceOptions.map((produce) => (
                        <div key={produce} className="flex items-center space-x-2">
                          <Checkbox
                            id={`produce-${produce}`}
                            onCheckedChange={(checked) => {
                              setSelectedProduce(prev => checked ? [...prev, produce] : prev.filter(p => p !== produce));
                            }}
                          />
                          <label htmlFor={`produce-${produce}`} className="text-sm text-gray-700 cursor-pointer">{produce}</label>
                        </div>
                      ))}
                    </div>

                    {/* --- "Other" Input Field --- */}
                    {selectedProduce.includes("Other") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <Label htmlFor="otherProduce" className="text-green-700 text-xs font-semibold">Please specify:</Label>
                        <Input
                          id="otherProduce"
                          value={otherProduce}
                          onChange={(e) => setOtherProduce(e.target.value)}
                          placeholder="e.g. Dragon Fruit..."
                          className="mt-1 border-green-300 focus-visible:ring-green-500"
                        />
                      </motion.div>
                    )}
                  </section>

                  {/* Payment Details */}
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                      <span className="text-green-600">₹</span> Payment Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input id="upiId" name="upiId" placeholder="e.g. user@oksbi" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input id="bankName" name="bankName" placeholder="e.g. SBI" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input id="ifscCode" name="ifscCode" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" name="accountNumber" type="password" />
                      </div>
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

  // --- 2. Main Dashboard ---
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-100">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <DashboardCard icon={Store} title="Marketplace" description="Browse fresh produce from farmers and other agents." color="blue">
              <Button
                onClick={() => router.push('/marketplace')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12 shadow-md font-medium"
              >
                <Search className="mr-2 h-5 w-5" /> Browse Products
              </Button>
            </DashboardCard>

            <DashboardCard icon={Plus} title="New Product Listing" description="List your harvest to connect with agents immediately." color="green">
              <Button onClick={goToCreateListing} className="w-full bg-green-600 hover:bg-green-700 font-medium shadow-sm">
                Sell Products <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DashboardCard>

            <DashboardCard icon={Package} title="My Listings" description="Manage your active stock, update prices, or mark sold." color="blue">
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300" onClick={() => router.push('/farmer-dashboard/my-listings')}>
                View Inventory
              </Button>
            </DashboardCard>

            {/* Sales Page */}
            <DashboardCard icon={TrendingUp} title="Sales" description="See sold items and revenue." color="purple">
              <Button variant="outline" onClick={() => router.push('/farmer-dashboard/sales')} className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                View Sales
              </Button>
            </DashboardCard>

            <DashboardCard icon={ShoppingBag} title="My Orders" description="Chat directly with interested agents and buyers." color="purple">
              <Link href={'/my-orders'}>
                <Button variant="outline" className="w-full">My Orders</Button>
              </Link>
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

// Reusable Card
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
      <div>{children}</div>
    </motion.div>
  );
}