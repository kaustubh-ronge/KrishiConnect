"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateAgentProfile } from '@/actions/agent-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";
import {
    ArrowLeft,
    User,
    Briefcase,
    Phone,
    MapPin,
    CreditCard,
    Save,
    CheckCircle2,
    AlertCircle,
    Building2,
    Shield,
    Sparkles,
    LayoutDashboard
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from '@/components/LocationPicker';
import { agentSchema } from '@/lib/zodSchema';
import { z } from 'zod';

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

const sectionIcons = [User, Briefcase, MapPin, CreditCard];
const sectionTitles = ["Identity", "Categories", "Location", "Banking"];

export default function AgentEditForm({ initialProfile = {}, user }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeSection, setActiveSection] = useState(1);

    useEffect(() => {
        if (window.location.hash === '#location') {
            setActiveSection(3);
        }
    }, []);

    // --- State for Agent Types ---
    const initialTypes = initialProfile.agentType || [];
    const standardMatches = initialTypes.filter(t => agentTypeOptions.includes(t));
    const customMatches = initialTypes.filter(t => !agentTypeOptions.includes(t));
    const hasCustom = customMatches.length > 0;

    const [selectedTypes, setSelectedTypes] = useState(hasCustom ? [...standardMatches, "Other"] : standardMatches);
    const [otherType, setOtherType] = useState(hasCustom ? customMatches.join(", ") : "");

    // Location State
    const [address, setAddress] = useState(initialProfile.address || "");
    const [country, setCountry] = useState(initialProfile.country || "IN");
    const [stateCode, setStateCode] = useState(initialProfile.state || "");
    const [city, setCity] = useState(initialProfile.city || "");
    const [pincode, setPincode] = useState(initialProfile.pincode || "");
    const [lat, setLat] = useState(initialProfile.lat || 20.5937);
    const [lng, setLng] = useState(initialProfile.lng || 78.9629);
    const [usagePurpose, setUsagePurpose] = useState(initialProfile.usagePurpose || "buy");
    const [aadharFront, setAadharFront] = useState(initialProfile.aadharFront || "");
    const [aadharBack, setAadharBack] = useState(initialProfile.aadharBack || "");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Handle Agent Types manually
        formData.delete('agentType');
        selectedTypes.forEach(t => {
            if (t !== "Other") formData.append('agentType', t);
        });
        if (selectedTypes.includes('Other') && otherType.trim()) {
            formData.append('agentType', otherType.trim());
        }

        // Handle Location manually
        formData.delete('address');
        formData.append('address', address.trim());
        formData.append('country', country);
        formData.append('state', stateCode);
        formData.append('city', city);
        formData.append('pincode', pincode.trim());
        formData.append('lat', lat.toString());
        formData.append('lng', lng.toString());
        formData.append('aadharFront', aadharFront);
        formData.append('aadharBack', aadharBack);

        // Validation
        const types = formData.getAll('agentType');
        if (types.length === 0) {
            toast.error("Please select at least one business category.", {
                icon: <AlertCircle className="h-5 w-5" />,
                className: "bg-red-50 border-red-200"
            });
            return;
        }

        try {
            const formValues = Object.fromEntries(formData.entries());
            formValues.agentType = types;
            formValues.lat = parseFloat(formValues.lat);
            formValues.lng = parseFloat(formValues.lng);
            formValues.aadharFront = aadharFront;
            formValues.aadharBack = aadharBack;
            
            agentSchema.parse(formValues);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const message = error.issues?.[0]?.message || error.errors?.[0]?.message || "Validation failed. Please check your inputs.";
                toast.error(message, {
                    icon: <AlertCircle className="h-5 w-5" />,
                    className: "bg-red-50 border-red-200"
                });
                return;
            }
        }

        startTransition(async () => {
            const res = await updateAgentProfile(formData);
            if (res.success) {
                toast.success('Profile updated successfully', {
                    icon: <CheckCircle2 className="h-5 w-5" />,
                    className: "bg-indigo-50 border-indigo-200"
                });
                router.push('/agent-dashboard');
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to update profile', {
                    icon: <AlertCircle className="h-5 w-5" />
                });
            }
        });
    };

    const toggleType = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const profileCompletion = () => {
        let score = 0;
        if (initialProfile.name) score++;
        if (initialProfile.phone) score++;
        if (initialProfile.address) score++;
        if (initialProfile.companyName) score++;
        if (initialTypes.length > 0) score++;
        return (score / 5) * 100;
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-indigo-50 via-blue-50/30 to-sky-100/40">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, -60, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 -right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, 80, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 -left-20 w-125 h-125 bg-indigo-400/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -20, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/4 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl"
                />
            </div>

            <div className="relative container mx-auto px-4 sm:px-6 max-w-5xl py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="group text-gray-600 hover:text-indigo-700 pl-0 hover:bg-white/50 backdrop-blur-sm transition-all duration-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl">
                        {/* Top gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-400 via-indigo-500 to-sky-400" />

                        <CardHeader className="relative bg-linear-to-r from-blue-50/80 via-indigo-50/60 to-sky-50/80 border-b border-blue-100/50 pb-8 px-6 sm:px-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="relative">
                                        <motion.div
                                            whileHover={{ rotate: 10 }}
                                            className="bg-linear-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/25"
                                        >
                                            <Briefcase className="h-7 w-7 sm:h-8 sm:w-8" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1"
                                        >
                                            <Sparkles className="h-3 w-3 text-white" />
                                        </motion.div>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                                            Edit Agent Profile
                                        </CardTitle>
                                        <CardDescription className="text-gray-600 mt-1">
                                            Update your business identity and trade settings
                                        </CardDescription>
                                    </div>
                                </div>

                                <Badge variant="secondary" className="bg-white/80 text-indigo-700 border border-indigo-200 backdrop-blur-sm px-4 py-2">
                                    <Shield className="h-4 w-4 mr-2" />
                                    {user?.email || "Agent"}
                                </Badge>
                            </div>

                            {/* Profile Completion */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600">Profile Completion</span>
                                    <span className="text-sm font-bold text-indigo-600">{Math.round(profileCompletion())}%</span>
                                </div>
                                <Progress value={profileCompletion()} className="h-2.5 bg-gray-100" />
                            </div>

                            {/* Section Tabs */}
                            <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                                {sectionTitles.map((title, idx) => {
                                    const Icon = sectionIcons[idx];
                                    return (
                                        <motion.button
                                            key={title}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveSection(idx + 1)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeSection === idx + 1
                                                ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                                : "bg-white/60 text-gray-600 hover:bg-white hover:shadow-md"
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {title}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="px-6 sm:px-8 pt-8 pb-4 relative">
                                <div className="space-y-6">
                                    {/* Section 1: Identity */}
                                    <motion.section
                                        key="identity"
                                        style={{ display: activeSection === 1 ? 'block' : 'none' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-blue-100 p-2 rounded-xl">
                                                <User className="h-6 w-6 text-blue-700" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800">Business Identity</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-blue-700 transition-colors">
                                                    Full Name <span className="text-red-500 font-bold">*</span>
                                                </Label>
                                                <Input
                                                    name="name"
                                                    defaultValue={initialProfile.name}
                                                    required
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-blue-700 transition-colors">
                                                    <Building2 className="h-4 w-4 inline mr-1" />
                                                    Company Name
                                                </Label>
                                                <Input
                                                    name="companyName"
                                                    defaultValue={initialProfile.companyName}
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-blue-700 transition-colors">
                                                    <Shield className="h-4 w-4 inline mr-1" />
                                                    Aadhar Number {usagePurpose === 'buy_and_sell' && <span className="text-red-500 font-bold">*</span>}
                                                </Label>
                                                <Input
                                                    name="aadharNumber"
                                                    defaultValue={initialProfile.aadharNumber}
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-blue-700 transition-colors">
                                                    <Phone className="h-4 w-4 inline mr-1" />
                                                    Phone Number <span className="text-red-500 font-bold">*</span>
                                                </Label>
                                                <Input
                                                    name="phone"
                                                    defaultValue={initialProfile.phone}
                                                    required
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700">
                                                    Platform Usage
                                                </Label>
                                                <Select name="usagePurpose" value={usagePurpose} onValueChange={setUsagePurpose}>
                                                    <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all">
                                                        <SelectValue placeholder="Select usage purpose" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="buy">Buy products only</SelectItem>
                                                        <SelectItem value="buy_and_sell">Buy and sell products</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {usagePurpose === 'buy_and_sell' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 pt-6 border-t border-blue-100"
                                                >
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Shield className="h-5 w-5 text-indigo-600" />
                                                        <h4 className="font-bold text-gray-900">Identity Verification Documents</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                Aadhar Front Side <span className="text-red-500 font-bold">*</span>
                                                            </Label>
                                                            <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-4 hover:border-blue-400 transition-colors">
                                                                <ImageUpload
                                                                    value={aadharFront ? [aadharFront] : []}
                                                                    onChange={(urls) => setAadharFront(urls[0])}
                                                                    onRemove={() => setAadharFront("")}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                Aadhar Back Side <span className="text-red-500 font-bold">*</span>
                                                            </Label>
                                                            <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-4 hover:border-blue-400 transition-colors">
                                                                <ImageUpload
                                                                    value={aadharBack ? [aadharBack] : []}
                                                                    onChange={(urls) => setAadharBack(urls[0])}
                                                                    onRemove={() => setAadharBack("")}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.section>

                                    {/* Section 2: Categories */}
                                    <motion.section
                                        key="categories"
                                        style={{ display: activeSection === 2 ? 'block' : 'none' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-indigo-100 p-2 rounded-xl">
                                                <Briefcase className="h-6 w-6 text-indigo-700" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800">Business Categories</h3>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {agentTypeOptions.map((type, idx) => (
                                                <motion.div
                                                    key={type}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`flex items-center space-x-3 border-2 p-3 rounded-xl cursor-pointer transition-all duration-300 ${selectedTypes.includes(type)
                                                        ? "bg-linear-to-r from-indigo-50 to-blue-50 border-indigo-400 shadow-md shadow-indigo-500/10"
                                                        : "bg-white/50 border-gray-200 hover:border-indigo-300 hover:bg-white"
                                                        }`}
                                                    onClick={() => toggleType(type)}
                                                >
                                                    <Checkbox
                                                        id={type}
                                                        checked={selectedTypes.includes(type)}
                                                        onCheckedChange={() => toggleType(type)}
                                                        className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                    />
                                                    <label
                                                        htmlFor={type}
                                                        className={`text-sm font-medium leading-none cursor-pointer flex-1 ${selectedTypes.includes(type) ? "text-indigo-800" : "text-gray-700"
                                                            }`}
                                                    >
                                                        {type}
                                                    </label>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <AnimatePresence>
                                            {selectedTypes.includes('Other') && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <Separator className="my-4" />
                                                    <div className="space-y-2">
                                                        <Label className="text-indigo-700 text-xs font-semibold uppercase tracking-wider">
                                                            Specify Other Category
                                                        </Label>
                                                        <Input
                                                            placeholder="e.g. Cold Storage Operator..."
                                                            value={otherType}
                                                            onChange={(e) => setOtherType(e.target.value)}
                                                            className="h-12 bg-indigo-50/50 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.section>

                                    {/* Section 3: Location */}
                                    <motion.section
                                        key="location"
                                        style={{ display: activeSection === 3 ? 'block' : 'none' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-sky-100 p-2 rounded-xl">
                                                <MapPin className="h-6 w-6 text-sky-700" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800">Business Location</h3>
                                        </div>

                                        <LocationPicker
                                            value={{ country, state: stateCode, city, pincode, lat, lng, address }}
                                            onChange={(val) => {
                                                setCountry(val.country);
                                                setStateCode(val.state);
                                                setCity(val.city);
                                                setPincode(val.pincode);
                                                setLat(val.lat);
                                                setLng(val.lng);
                                                setAddress(val.address);
                                            }}
                                        />
                                    </motion.section>

                                    {/* Section 4: Banking */}
                                    <motion.section
                                        key="banking"
                                        style={{ display: activeSection === 4 ? 'block' : 'none' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-violet-100 p-2 rounded-xl">
                                                <CreditCard className="h-6 w-6 text-violet-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800">Banking Details</h3>
                                                <p className="text-sm text-gray-500">For secure payouts and transactions</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-violet-700 transition-colors">
                                                    UPI ID {usagePurpose === 'buy_and_sell' && <span className="text-red-500 font-bold">*</span>}
                                                </Label>
                                                <Input
                                                    name="upiId"
                                                    defaultValue={initialProfile.upiId}
                                                    placeholder="user@bank"
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-violet-700 transition-colors">
                                                    Bank Name {usagePurpose === 'buy_and_sell' && <span className="text-red-500 font-bold">*</span>}
                                                </Label>
                                                <Input
                                                    name="bankName"
                                                    defaultValue={initialProfile.bankName}
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-violet-700 transition-colors">
                                                    IFSC Code {usagePurpose === 'buy_and_sell' && <span className="text-red-500 font-bold">*</span>}
                                                </Label>
                                                <Input
                                                    name="ifscCode"
                                                    defaultValue={initialProfile.ifscCode}
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all uppercase"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <Label className="text-sm font-medium text-gray-700 group-focus-within:text-violet-700 transition-colors">
                                                    Account Number {usagePurpose === 'buy_and_sell' && <span className="text-red-500 font-bold">*</span>}
                                                </Label>
                                                <Input
                                                    name="accountNumber"
                                                    type="password"
                                                    defaultValue={initialProfile.accountNumber}
                                                    className="h-12 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>
                                        </div>
                                    </motion.section>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-linear-to-r from-gray-50/80 to-blue-50/50 border-t border-blue-100/50 py-6 px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    {[1, 2, 3, 4].map((step) => (
                                        <motion.button
                                            key={step}
                                            type="button"
                                            onClick={() => setActiveSection(step)}
                                            whileHover={{ scale: 1.1 }}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${activeSection === step
                                                ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                                : "bg-white text-gray-400 hover:text-blue-600 border-2 border-gray-200 hover:border-blue-300"
                                                }`}
                                        >
                                            {step}
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        className="h-12 px-6 border-gray-300 hover:bg-white hover:border-blue-300 rounded-xl transition-all duration-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="relative h-12 px-8 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 rounded-xl transition-all duration-300 overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center gap-2 font-semibold">
                                            {isPending ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        <Save className="h-5 w-5" />
                                                    </motion.div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                                    Save Profile
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </form>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}