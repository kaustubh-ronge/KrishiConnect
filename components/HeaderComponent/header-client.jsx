"use client";

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sprout, 
  Menu, 
  Languages, 
  ChevronDown, 
  ShoppingCart,
  Home,
  LayoutDashboard,
  Store,
  ShieldCheck,
  Info,
  HelpCircle,
  LogIn,
  UserPlus
} from "lucide-react"; 
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore"; 

const supportedLanguages = [
  { name: "English", code: "en" },
  { name: "हिंदी", code: "hi" },
  { name: "मराठी", code: "mr" },
  { name: "ಕನ್ನಡ", code: "kn" },
  { name: "தமிழ்", code: "ta" },
  { name: "తెలుగు", code: "te" }
];

export default function HeaderClient({ isLoggedIn, userRole }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const { cartCount, fetchCart } = useCartStore();

  useEffect(() => {
    if (isLoggedIn) fetchCart();
  }, [isLoggedIn, fetchCart]);

  // --- ROLE LOGIC ---
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isFarmerOrAgent = userRole === 'farmer' || userRole === 'agent';
  
  // Dashboard/Onboarding Link Logic
  const onboardingLink = isFarmerOrAgent ? `/${userRole}-dashboard` : "/onboarding";
  const onboardingText = isFarmerOrAgent ? "Dashboard" : "Onboarding";

  // Google Translate Logic
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(c => c.trim().startsWith('googtrans='));
    if (langCookie) {
      const code = langCookie.split('/')[2];
      const lang = supportedLanguages.find(l => l.code === code);
      if (lang) setSelectedLang(lang.name);
    }
  }, []);

  const handleLanguageChange = (langName, langCode) => {
    setSelectedLang(langName);
    if (window.changeGoogleTranslateLanguage) {
      window.changeGoogleTranslateLanguage(langCode);
    }
  };

  // Helper for Mobile Links
  const MobileLink = ({ href, icon: Icon, children }) => (
    <Link
      href={href}
      onClick={() => setIsMobileMenuOpen(false)}
      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all active:scale-95"
    >
      <Icon className="h-5 w-5 text-gray-500 group-hover:text-green-600" />
      {children}
    </Link>
  );

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* --- LEFT: LOGO --- */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-900 hover:text-green-600 transition-colors notranslate"
          >
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold tracking-tight">
              Krishi<span className="text-green-600">Connect</span>
            </span>
          </Link>

          {/* --- CENTER: DESKTOP NAV --- */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Home</Link>
            
            {/* Conditional Render: Hide Onboarding & Marketplace for Admin */}
            {!isAdmin && (
              <>
                <Link href={onboardingLink} className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                  {onboardingText}
                </Link>
                <Link href="/marketplace" className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                  Marketplace
                </Link>
              </>
            )}

            {/* Show Super Admin link only if Admin or just always (typically only admins see this) */}
            <Link href="/admin" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Super Admin</Link>
            
            {/* Language Selector Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-full px-3">
                  <Languages className="h-4 w-4" />
                  <span>{selectedLang}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.name, lang.code)}>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Cart */}
            {isLoggedIn && (
               <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors group">
                  <ShoppingCart className="h-6 w-6 group-hover:scale-105 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                       {cartCount}
                    </span>
                  )}
               </Link>
            )}

            {/* Desktop Auth */}
            <div className="flex items-center space-x-3 pl-2 border-l border-gray-200">
              <SignedIn>
                  {userRole && userRole !== 'none' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium capitalize border border-green-200">
                      {userRole}
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" className="text-gray-700 hover:text-green-600">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-green-600 text-white hover:bg-green-700 rounded-full px-6">
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </div>
              </SignedOut>
            </div>
          </nav>

          {/* --- RIGHT: MOBILE CONTROLS --- */}
          <div className="md:hidden flex items-center gap-2">
            
            {/* 1. Mobile Cart */}
            {isLoggedIn && (
               <Link href="/cart" className="relative p-2 text-gray-700 hover:text-green-600 active:scale-95 transition-transform">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                       {cartCount}
                    </span>
                  )}
               </Link>
            )}

            {/* 2. User Avatar (Outside Sheet) */}
            <SignedIn>
                <div className="ml-1">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </SignedIn>

            {/* 3. Hamburger Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <button className="p-2 text-gray-700 hover:text-green-600 transition-colors rounded-md active:bg-gray-100">
                        <Menu className="h-7 w-7" />
                    </button>
                </SheetTrigger>
                
                {/* --- MOBILE SHEET CONTENT (Left Side) --- */}
                <SheetContent side="left" className="w-[300px] flex flex-col bg-white p-0 border-r border-gray-100 shadow-xl">
                    
                    {/* Header of Sheet */}
                    <SheetHeader className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <SheetTitle className="flex items-center gap-2">
                            <Sprout className="h-6 w-6 text-green-600" /> 
                            <span className="font-bold text-gray-900 text-lg">KrishiConnect</span>
                        </SheetTitle>
                    </SheetHeader>
                    
                    {/* Scrollable Navigation Area */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                         <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
                         
                         <MobileLink href="/" icon={Home}>Home</MobileLink>
                         
                         {/* Conditional Render: Hide Onboarding & Marketplace for Admin */}
                         {!isAdmin && (
                            <>
                              <MobileLink href={onboardingLink} icon={LayoutDashboard}>{onboardingText}</MobileLink>
                              <MobileLink href="/marketplace" icon={Store}>Marketplace</MobileLink>
                            </>
                         )}

                         <MobileLink href="/admin" icon={ShieldCheck}>Super Admin</MobileLink>
                         
                         <div className="my-4 border-t border-gray-100"></div>
                         
                         <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</p>
                         <MobileLink href="/about" icon={Info}>About Us</MobileLink>
                         <MobileLink href="/how-it-works" icon={HelpCircle}>How it Works</MobileLink>
                    </div>

                    {/* Footer Fixed Area */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                        
                        {/* Language Selector */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 font-medium">
                                <Languages className="h-4 w-4" /> 
                                <span>Choose Language</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {supportedLanguages.map((lang) => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.name, lang.code)}
                                        className={`text-xs font-medium border rounded-lg px-2 py-2 transition-all ${selectedLang === lang.name ? 'bg-green-100 border-green-500 text-green-800 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'}`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sign In / Sign Up (Only shown if NOT logged in) */}
                        <SignedOut>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full gap-2 border-gray-300">
                                        <LogIn className="h-4 w-4" /> Sign In
                                    </Button>
                                </Link>
                                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                                        <UserPlus className="h-4 w-4" /> Join
                                    </Button>
                                </Link>
                            </div>
                        </SignedOut>
                    </div>

                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}