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
  UserPlus,
  ShoppingBag
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore";
import NotificationCenter from "@/components/NotificationCenter";

const supportedLanguages = [
  { name: "English", code: "en" },
  { name: "हिंदी", code: "hi" },
  { name: "मराठी", code: "mr" },
  { name: "ಕನ್ನಡ", code: "kn" },
  { name: "தமிழ்", code: "ta" },
  { name: "తెలుగు", code: "te" }
];

import { ShieldAlert, AlertTriangle, LogOut } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function HeaderClient({ isLoggedIn, userRole, isDisabled, hasFarmerProfile, hasAgentProfile, hasDeliveryProfile }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [mounted, setMounted] = useState(false);
  const { cartCount, fetchCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchCart();
  }, [isLoggedIn, fetchCart]);

  // --- ROLE & DASHBOARD LOGIC ---
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  // Multi-Dashboard Detection
  const availableDashboards = [];
  if (hasFarmerProfile || userRole === 'farmer') availableDashboards.push({ name: 'Farmer', href: '/farmer-dashboard' });
  if (hasAgentProfile || userRole === 'agent') availableDashboards.push({ name: 'Agent', href: '/agent-dashboard' });
  if (hasDeliveryProfile || userRole === 'delivery') availableDashboards.push({ name: 'Delivery', href: '/delivery-dashboard' });

  const hasMultipleDashboards = availableDashboards.length > 1;
  const onboardingLink = availableDashboards.length > 0 ? availableDashboards[0].href : "/onboarding";
  const onboardingText = availableDashboards.length > 0 ? "Dashboard" : "Onboarding";

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
    <>
      {/* --- GLOBAL ACCOUNT DISABLED OVERLAY --- */}
      {isDisabled && mounted && (
        <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 p-10 text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="h-12 w-12 text-rose-600 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Account Restricted</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Your KrishiConnect account has been temporarily disabled by an administrator for security or policy review.
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4 text-left">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">What to do?</p>
                <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                  If you believe this is a mistake, please contact our support team or reach out to your local agent.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <SignOutButton redirectUrl="/">
                <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                  <LogOut className="h-4 w-4" /> Sign Out Securely
                </Button>
              </SignOutButton>
            </div>
            
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">KrishiConnect Security Node</p>
          </div>
        </div>
      )}

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

            {/* Conditional Render: Dashboards or Onboarding */}
            {!isAdmin && (
              hasMultipleDashboards ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-600 hover:text-green-600 font-medium transition-colors h-auto p-0 flex items-center gap-1">
                      Dashboards
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {availableDashboards.map((db) => (
                      <DropdownMenuItem key={db.href} asChild>
                        <Link href={db.href} className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          {db.name} Dashboard
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={onboardingLink} className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                  {onboardingText}
                </Link>
              )
            )}

            {!isAdmin && (userRole !== 'delivery') && (
              <Link href="/marketplace" className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                Marketplace
              </Link>
            )}

            {isLoggedIn && !isAdmin && (
              <Link href="/my-orders" className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                My Orders
              </Link>
            )}

            {/* Show Super Admin link only if Admin or Super Admin */}
            {isAdmin && (
              <Link href="/admin-dashboard" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Super Admin</Link>
            )}

            <Link href="/how-it-works" className="text-gray-600 hover:text-green-600 font-medium transition-colors">How It Works</Link>
            <Link href="/about" className="text-gray-600 hover:text-green-600 font-medium transition-colors">About Us</Link>

            {/* Language Selector Desktop */}
            {mounted ? (
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
            ) : (
              <div className="w-24 h-8 bg-gray-100 animate-pulse rounded-full" />
            )}

            {/* Desktop Notifications & Cart */}
            {mounted && isLoggedIn && (
              <>
                <NotificationCenter />
                {!isAdmin && (
                  <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors group" aria-label={`Shopping cart with ${cartCount} items`}>
                    <ShoppingCart className="h-6 w-6 group-hover:scale-105 transition-transform" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}

            {/* Desktop Auth */}
            <div className="flex items-center space-x-3 pl-2 border-l border-gray-200">
              {mounted ? (
                <>
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
                </>
              ) : (
                <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-full" />
              )}
            </div>
          </nav>

          {/* --- RIGHT: MOBILE CONTROLS --- */}
          <div className="md:hidden flex items-center gap-2">

            {/* 1. Mobile Notifications & Cart */}
            {mounted && isLoggedIn && (
              <>
                <NotificationCenter />
                {!isAdmin && (
                  <Link href="/cart" className="relative p-2 text-gray-700 hover:text-green-600 active:scale-95 transition-transform">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}

            {/* 2. User Avatar (Outside Sheet) */}
            {mounted && (
              <SignedIn>
                <div className="ml-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            )}

            {/* 3. Hamburger Menu Trigger */}
            {mounted ? (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 text-gray-800 hover:text-green-600 transition-colors rounded-md active:bg-gray-100" aria-label="Open navigation menu">
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

                    {/* Conditional Render: Dashboards or Onboarding */}
                    {!isAdmin && (
                      availableDashboards.length > 0 ? (
                        availableDashboards.map(db => (
                          <MobileLink key={db.href} href={db.href} icon={LayoutDashboard}>{db.name} Dashboard</MobileLink>
                        ))
                      ) : (
                        <MobileLink href="/onboarding" icon={LayoutDashboard}>Onboarding</MobileLink>
                      )
                    )}

                    {!isAdmin && (userRole !== 'delivery') && (
                      <MobileLink href="/marketplace" icon={Store}>Marketplace</MobileLink>
                    )}

                    {isLoggedIn && !isAdmin && (
                      <MobileLink href="/my-orders" icon={ShoppingBag}>My Orders</MobileLink>
                    )}

                    {isAdmin && (
                      <MobileLink href="/admin-dashboard" icon={ShieldCheck}>Super Admin</MobileLink>
                    )}

                    <Link href="/how-it-works" className="text-gray-600 hover:text-green-600 font-medium transition-colors">How It Works</Link>

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
            ) : (
              <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-md" />
            )}
          </div>
        </div>
      </div>
      </header>
    </>
  );
}