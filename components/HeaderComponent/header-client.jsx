// "use client";

// import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Sprout, Menu, X, Languages, ChevronDown } from "lucide-react";
// import { useState, useEffect } from "react";
// import {
//   DropdownMenu,
//   DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
// } from "@/components/ui/dropdown-menu";
// import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

// const supportedLanguages = [
//   { name: "English", code: "en" },
//   { name: "हिंदी", code: "hi" },
//   { name: "मराठी", code: "mr" },
//   { name: "ಕನ್ನಡ", code: "kn" },
//   { name: "தமிழ்", code: "ta" },
//   { name: "తెలుగు", code: "te" }
// ];

// export default function HeaderClient({ isLoggedIn, userRole }) {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [selectedLang, setSelectedLang] = useState("English");

//   // --- 1. SMART NAVIGATION LOGIC ---
//   // If role is 'farmer' or 'agent', link to Dashboard. Else, link to Onboarding.
//   const hasRole = userRole === 'farmer' || userRole === 'agent';
//   const onboardingLink = hasRole ? `/${userRole}-dashboard` : "/onboarding";
//   const onboardingText = hasRole ? "Dashboard" : "Onboarding";

//   // --- 2. GOOGLE TRANSLATE LOGIC ---
//   useEffect(() => {
//     const cookies = document.cookie.split(';');
//     const langCookie = cookies.find(c => c.trim().startsWith('googtrans='));
//     if (langCookie) {
//       const code = langCookie.split('/')[2];
//       const lang = supportedLanguages.find(l => l.code === code);
//       if (lang) setSelectedLang(lang.name);
//     }
//   }, []);

//   const handleLanguageChange = (langName, langCode) => {
//     setSelectedLang(langName);
//     if (window.changeGoogleTranslateLanguage) {
//       window.changeGoogleTranslateLanguage(langCode);
//     }
//   };

//   return (
//     <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo */}
//           <Link
//             href="/"
//             className="flex items-center space-x-2 text-gray-900 hover:text-green-600 transition-colors notranslate"
//           >
//             <Sprout className="h-8 w-8 text-green-600" />
//             <span className="text-xl font-bold tracking-tight">
//               Krishi<span className="text-green-600">Connect</span>
//             </span>
//           </Link>

//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex items-center space-x-6">
//             <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
//               Home
//             </Link>

//             {/* Dynamic Link: Onboarding OR Dashboard */}
//             <Link href={onboardingLink} className="text-gray-700 hover:text-green-600 font-medium transition-colors">
//               {onboardingText}
//             </Link>

//             <Link href="/marketplace" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
//               Marketplace
//             </Link>
//             <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
//               About
//             </Link>
//             <Link href="/how-it-works" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
//               How it Works
//             </Link>

//             {/* Language Selector (Desktop) */}
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="sm" className="gap-1 text-gray-700 hover:bg-gray-100 border border-gray-200">
//                   <Languages className="h-4 w-4" />
//                   <span>{selectedLang}</span>
//                   <ChevronDown className="h-3 w-3 opacity-50" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 {supportedLanguages.map((lang) => (
//                   <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.name, lang.code)}>
//                     {lang.name}
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>

//             {/* Auth Buttons */}
//             <div className="flex items-center space-x-3">
//               <SignedIn>
//                 <div className="flex items-center space-x-3">
//                   {userRole && userRole !== 'none' && (
//                     <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
//                       {userRole}
//                     </span>
//                   )}
//                   <UserButton afterSignOutUrl="/" />
//                 </div>
//               </SignedIn>
//               <SignedOut>
//                 <div className="flex items-center space-x-2">
//                   <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600">
//                     <Link href="/sign-in">Sign In</Link>
//                   </Button>
//                   <Button asChild className="bg-green-600 text-white hover:bg-green-700 font-semibold">
//                     <Link href="/sign-up">Get Started</Link>
//                   </Button>
//                 </div>
//               </SignedOut>
//             </div>
//           </nav>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden">
//             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
//               <SheetTrigger asChild>
//                 <button className="text-gray-700 p-2 hover:text-green-600 transition-colors">
//                   <Menu className="h-6 w-6" />
//                 </button>
//               </SheetTrigger>
//               <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
//                 <SheetHeader>
//                   <SheetTitle className="text-left flex items-center gap-2">
//                     <Sprout className="h-6 w-6 text-green-600" /> KrishiConnect
//                   </SheetTitle>
//                 </SheetHeader>

//                 <div className="flex flex-col gap-y-4 mt-6">
//                   <Link
//                     href="/"
//                     className="text-lg font-medium text-gray-700 hover:text-green-600"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     Home
//                   </Link>
//                   {/* Dynamic Mobile Link */}
//                   <Link
//                     href={onboardingLink}
//                     className="text-lg font-medium text-gray-700 hover:text-green-600"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     {onboardingText}
//                   </Link>
//                   <Link
//                     href="/marketplace"
//                     className="text-lg font-medium text-gray-700 hover:text-green-600"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     Marketplace
//                   </Link>
//                   <Link
//                     href="/about"
//                     className="text-lg font-medium text-gray-700 hover:text-green-600"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     About
//                   </Link>
//                   <Link
//                     href="/how-it-works"
//                     className="text-lg font-medium text-gray-700 hover:text-green-600"
//                     onClick={() => setIsMobileMenuOpen(false)}
//                   >
//                     How it Works
//                   </Link>

//                   <hr className="border-gray-100" />

//                   {/* Mobile Language Selector */}
//                   <div>
//                     <p className="text-xs text-gray-400 mb-3 font-semibold uppercase">Language</p>
//                     <div className="grid grid-cols-2 gap-2">
//                       {supportedLanguages.map((lang) => (
//                         <button
//                           key={lang.code}
//                           onClick={() => handleLanguageChange(lang.name, lang.code)}
//                           className={`text-sm border rounded-md px-3 py-2 transition-colors ${selectedLang === lang.name ? 'bg-green-100 border-green-500 text-green-800' : 'border-gray-200 text-gray-600'}`}
//                         >
//                           {lang.name}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <hr className="border-gray-100" />

//                   {/* Mobile Auth */}
//                   <div className="mt-2">
//                     <SignedIn>
//                       <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
//                         <span className="text-sm font-medium">My Account</span>
//                         <UserButton afterSignOutUrl="/" />
//                       </div>
//                     </SignedIn>
//                     <SignedOut>
//                       <div className="flex flex-col gap-3">
//                         <Button asChild variant="outline" className="w-full justify-center">
//                           <Link href="/sign-in">Sign In</Link>
//                         </Button>
//                         <Button asChild className="w-full bg-green-600 hover:bg-green-700 justify-center">
//                           <Link href="/sign-up">Get Started</Link>
//                         </Button>
//                       </div>
//                     </SignedOut>
//                   </div>
//                 </div>
//               </SheetContent>
//             </Sheet>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }


"use client";

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sprout, Menu, X, Languages, ChevronDown, ShoppingCart } from "lucide-react"; // Added ShoppingCart
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore"; // Import Zustand Store

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

  // --- ZUSTAND CART STORE ---
  const { cartCount, fetchCart } = useCartStore();

  // Fetch cart data when user logs in
  useEffect(() => {
    if (isLoggedIn) {
        fetchCart();
    }
  }, [isLoggedIn, fetchCart]);

  // --- 1. SMART NAVIGATION LOGIC ---
  const hasRole = userRole === 'farmer' || userRole === 'agent';
  const onboardingLink = hasRole ? `/${userRole}-dashboard` : "/onboarding";
  const onboardingText = hasRole ? "Dashboard" : "Onboarding";

  // --- 2. GOOGLE TRANSLATE LOGIC ---
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

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-900 hover:text-green-600 transition-colors notranslate"
          >
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold tracking-tight">
              Krishi<span className="text-green-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Home
            </Link>
            
            <Link href={onboardingLink} className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              {onboardingText}
            </Link>
            
            <Link href="/marketplace" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Marketplace
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              About
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              How it Works
            </Link>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-gray-700 hover:bg-gray-100 border border-gray-200">
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

            {/* --- CART ICON (Only when logged in) --- */}
            {isLoggedIn && (
               <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                       {cartCount}
                    </span>
                  )}
               </Link>
            )}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <SignedIn>
                <div className="flex items-center space-x-3">
                  {userRole && userRole !== 'none' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium capitalize border border-green-200">
                      {userRole}
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <div className="flex items-center space-x-2">
                  <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-green-600 text-white hover:bg-green-700 font-semibold">
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </div>
              </SignedOut>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {/* Mobile Cart Icon */}
            {isLoggedIn && (
               <Link href="/cart" className="relative text-gray-600 hover:text-green-600">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                       {cartCount}
                    </span>
                  )}
               </Link>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <button className="text-gray-700 p-2 hover:text-green-600 transition-colors">
                        <Menu className="h-6 w-6" />
                    </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
                    <SheetHeader>
                        <SheetTitle className="text-left flex items-center gap-2">
                            <Sprout className="h-6 w-6 text-green-600" /> KrishiConnect
                        </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col gap-y-4 mt-6">
                         <Link 
                            href="/" 
                            className="text-lg font-medium text-gray-700 hover:text-green-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link 
                            href={onboardingLink} 
                            className="text-lg font-medium text-gray-700 hover:text-green-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {onboardingText}
                        </Link>
                        <Link 
                            href="/marketplace" 
                            className="text-lg font-medium text-gray-700 hover:text-green-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Marketplace
                        </Link>
                        <Link 
                            href="/about" 
                            className="text-lg font-medium text-gray-700 hover:text-green-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            About
                        </Link>
                        <Link 
                            href="/how-it-works" 
                            className="text-lg font-medium text-gray-700 hover:text-green-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            How it Works
                        </Link>
                        
                        <hr className="border-gray-100" />
                        
                        {/* Mobile Language Selector */}
                        <div>
                            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase">Language</p>
                            <div className="grid grid-cols-2 gap-2">
                                {supportedLanguages.map((lang) => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.name, lang.code)}
                                        className={`text-sm border rounded-md px-3 py-2 transition-colors ${selectedLang === lang.name ? 'bg-green-100 border-green-500 text-green-800' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Mobile Auth */}
                        <div className="mt-2">
                             <SignedIn>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium">My Account</span>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <div className="flex flex-col gap-3">
                                    <Button asChild variant="outline" className="w-full justify-center">
                                        <Link href="/sign-in">Sign In</Link>
                                    </Button>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 justify-center">
                                        <Link href="/sign-up">Get Started</Link>
                                    </Button>
                                </div>
                            </SignedOut>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}