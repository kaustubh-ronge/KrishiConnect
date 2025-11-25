"use client";

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sprout, Menu, X } from "lucide-react";
import { useState } from "react";

export default function HeaderClient({ isLoggedIn, userRole }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log("HeaderClient Props:", { isLoggedIn, userRole });

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-900 hover:text-green-600 transition-colors"
          >
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold tracking-tight">
              Krishi<span className="text-green-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/onboarding" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Onboarding
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              About
            </Link>
            <Link 
              href="/how-it-works" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              How it Works
            </Link>

            {/* Language Selector */}
            <select className="bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
            </select>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <SignedIn>
                <div className="flex items-center space-x-3">
                  {userRole && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {userRole}
                    </span>
                  )}
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-green-500"
                      }
                    }}
                  />
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
          <button 
            className="md:hidden text-gray-700 p-2 hover:text-green-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 py-4 space-y-4">
            <Link 
              href="/" 
              className="block text-gray-700 hover:text-green-600 font-medium py-2 px-4 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/onboarding" 
              className="block text-gray-700 hover:text-green-600 font-medium py-2 px-4 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Onboarding
            </Link>
            <Link 
              href="/about" 
              className="block text-gray-700 hover:text-green-600 font-medium py-2 px-4 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/how-it-works" 
              className="block text-gray-700 hover:text-green-600 font-medium py-2 px-4 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            
            {/* Mobile Language Selector */}
            <div className="px-4">
              <select className="w-full bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 space-y-2 px-4">
              <SignedOut>
                <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold">
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <div className="text-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}