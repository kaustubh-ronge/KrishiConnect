"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { createAgentProfile } from '@/actions/agent-profile';
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence
import {
  Store, User, Phone, Briefcase, CheckCircle2, MapPin,
  ShoppingBag, Search, TrendingUp, ArrowRight, Plus, Package, Settings
} from "lucide-react";
import { toast } from "sonner";

// New List of Agent Types
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

export default function AgentDashboardClient({ user, profileExists: initialProfileExists }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileExists, setProfileExists] = useState(initialProfileExists);
  const [isDialogOpen, setIsDialogOpen] = useState(!initialProfileExists);

  // --- New State for Agent Type ---
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [otherType, setOtherType] = useState("");

  useEffect(() => {
    if (!initialProfileExists) setIsDialogOpen(true);
  }, [initialProfileExists]);

  const handleProfileSubmit = async (formData) => {
    formData.delete('agentType'); // Clear form data just in case

    // 1. Add standard types
    selectedTypes.forEach(type => {
      if (type !== "Other") {
        formData.append('agentType', type);
      }
    });

    // 2. Handle "Other" Logic
    if (selectedTypes.includes("Other") && otherType.trim()) {
      formData.append('agentType', otherType.trim());
    }

    // Validation: Check if at least one type is selected/entered
    const hasStandard = selectedTypes.some(t => t !== "Other");
    const hasCustom = selectedTypes.includes("Other") && otherType.trim() !== "";

    if (!hasStandard && !hasCustom) {
      toast.error("Please select at least one Agent Type.");
      return;
    }

    startTransition(async () => {
      const result = await createAgentProfile(formData);
      if (result.success) {
        setIsDialogOpen(false);
        setProfileExists(true);
        toast.success("Agent Profile Setup Complete!");
        router.refresh();
      } else {
        toast.error("Setup Failed", { description: result.error });
      }
    });
  };

  // --- 1. WELCOME / SETUP SCREEN ---
  if (!profileExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"></div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {!isDialogOpen && (
            <DialogTrigger asChild>
              <div className="relative z-10 text-center">
                <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Start Trading Today</h1>
                <p className="text-blue-100 mb-8 max-w-md mx-auto">Complete your business profile to access the marketplace and start connecting with farmers.</p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 shadow-xl">
                  Complete Agent Profile
                </Button>
              </div>
            </DialogTrigger>
          )}

          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" /> Agent Profile Details
              </DialogTitle>
              <DialogDescription>Enter your business details to start trading. * required.</DialogDescription>
            </DialogHeader>

            <form action={handleProfileSubmit} className="grow overflow-hidden flex flex-col">
              <div className="grid gap-6 py-4 grow overflow-y-auto pr-4">

                {/* Business Info */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex gap-2"><User className="h-5 w-5 text-blue-600" /> Business Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Full Name *</Label><Input name="name" required defaultValue={user.name || ""} /></div>
                    <div className="space-y-2"><Label>Company Name</Label><Input name="companyName" placeholder="e.g. Fresh Traders" /></div>
                    <div className="space-y-2"><Label>Phone *</Label><Input name="phone" required placeholder="Contact Number" /></div>
                    <div className="space-y-2"><Label>Operating Region *</Label><Input name="region" required placeholder="e.g. Solapur, Pune" /></div>
                  </div>
                </section>

                {/* --- NEW: Agent Type Multi-Select --- */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex gap-2"><MapPin className="h-5 w-5 text-blue-600" /> Agent Type(s) *</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {agentTypeOptions.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          onCheckedChange={(checked) => {
                            setSelectedTypes(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                          }}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm text-gray-700 cursor-pointer">{type}</label>
                      </div>
                    ))}
                  </div>

                  {/* --- "Other" Input Field --- */}
                  {selectedTypes.includes("Other") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <Label htmlFor="otherType" className="text-blue-700 text-xs font-semibold">Please specify other type:</Label>
                      <Input
                        id="otherType"
                        name="otherAgentType" // Temporary name
                        value={otherType}
                        onChange={(e) => setOtherType(e.target.value)}
                        placeholder="e.g. Exotic Fruit Importer"
                        className="mt-1 border-blue-300 focus-visible:ring-blue-500"
                      />
                    </motion.div>
                  )}
                </section>


                {/* Payment Info (For Selling) */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex gap-2"><span className="text-blue-600 font-bold">₹</span> Payment Details (For Selling)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2"><Label>UPI ID</Label><Input name="upiId" placeholder="user@bank" /></div>
                    <div className="space-y-2"><Label>Bank Name</Label><Input name="bankName" placeholder="Bank Name" /></div>
                    <div className="space-y-2"><Label>IFSC Code</Label><Input name="ifscCode" placeholder="IFSC" /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>Account Number</Label><Input name="accountNumber" type="password" placeholder="Account Number" /></div>
                  </div>
                </section>
              </div>

              <DialogFooter className="pt-4 border-t mt-auto">
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" size="lg">
                  {isPending ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>) : "Complete Setup"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- 2. MAIN DASHBOARD (If profile exists) ---
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
              <p className="text-lg text-gray-600">Welcome, {user.agentProfile?.companyName || user.agentProfile?.name}!</p>
            </div>
            <div className="hidden md:block">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Verified Trader
              </span>
            </div>
          </div>

          {/* Main Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* --- BUYING SECTION --- */}

            {/* Card 1: Marketplace (Primary Action) */}
            <DashboardCard icon={Store} title="Marketplace" description="Browse fresh produce from farmers and other agents." color="blue">
              <Button
                onClick={() => router.push('/marketplace')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12 shadow-md font-medium"
              >
                <Search className="mr-2 h-5 w-5" /> Browse Products
              </Button>
            </DashboardCard>

            {/* Card 2: My Orders */}
            <DashboardCard icon={ShoppingBag} title="My Orders" description="Track your purchases and delivery status." color="indigo">
              <Button variant="outline" disabled className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                No Orders Yet
              </Button>
            </DashboardCard>

            {/* --- SELLING SECTION --- */}

            {/* Card 3: Create Listing */}
            <DashboardCard icon={Plus} title="Sell Products" description="Have stock? List it on the marketplace." color="green">
              <Button
                onClick={() => router.push('/agent-dashboard/create-listing')}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Create Listing
              </Button>
            </DashboardCard>

            {/* Card 4: My Inventory */}
            <DashboardCard icon={Package} title="My Inventory" description="Manage products you have listed for sale." color="emerald">
              <Button variant="outline" onClick={() => router.push('/agent-dashboard/my-listings')} className="w-full border-green-200 text-green-700 hover:bg-green-50">
                View My Listings
              </Button>
            </DashboardCard>

            {/* --- ACCOUNT SECTION --- */}

            <DashboardCard icon={User} title="Business Profile" description="Update company details and payment info." color="gray">
              <Button variant="ghost" onClick={() => setIsDialogOpen(true)} className="w-full hover:bg-gray-100 border border-gray-200">Edit Profile</Button>
            </DashboardCard>

            <DashboardCard icon={Settings} title="Settings" description="Notifications and security settings." color="gray">
              <Button variant="ghost" disabled className="w-full text-gray-400 bg-gray-50">Coming Soon</Button>
            </DashboardCard>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Reusable Card Component
function DashboardCard({ icon: Icon, title, description, children, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 border border-gray-100 flex flex-col justify-between h-full transition-all">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${colors[color]}`}><Icon className="h-6 w-6" /></div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm">{description}</p>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}