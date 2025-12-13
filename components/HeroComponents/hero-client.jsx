"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function HeroClient({ title, subtitle, description, stats, isLoggedIn, userRole }) {
  const { isSignedIn } = useUser();

  // Determine button state using the SERVER-PROVIDED 'userRole' prop
  // This ensures it matches the database state (e.g., 'none' after deletion)
  const getButtonState = () => {
    if (!isSignedIn) {
      return {
        text: "Get Started Free",
        href: "/sign-up",
        description: "Create your account to get started"
      };
    }

    // Use the prop 'userRole', not client metadata
    if (!userRole || userRole === "none") {
      return {
        text: "Complete Your Profile",
        href: "/onboarding",
        description: "Select your role to continue"
      };
    }

    return {
      text: `Go to ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
      href: `/${userRole}-dashboard`,
      description: `You're registered as ${userRole}`
    };
  };

  const buttonState = getButtonState();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 via-white to-emerald-100 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* User Status Indicator */}
          {isSignedIn && (
            <motion.div
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-4 py-2 mb-8 text-sm text-green-700"
              variants={itemVariants}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{buttonState.description}</span>
              {/* Only show 'Permanent' if role is actually set */}
              {userRole && userRole !== "none" && (
                <span className="text-yellow-600 ml-2">(Role is permanent)</span>
              )}
            </motion.div>
          )}

          {/* Main Content */}
          <motion.h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6" variants={itemVariants}>
            {title}
          </motion.h1>

          <motion.p className="text-xl md:text-2xl text-green-600 font-semibold mb-4" variants={itemVariants}>
            {subtitle}
          </motion.p>

          <motion.p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed" variants={itemVariants}>
            {description}
          </motion.p>

          {/* Single CTA Button */}
          <motion.div className="flex justify-center items-center mb-16" variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-12 py-6 text-white font-semibold">
                <Link href={buttonState.href}>
                  {buttonState.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto" variants={containerVariants}>
            {stats.map((stat, index) => (
              <motion.div key={index} className="text-center" variants={itemVariants} whileHover={{ y: -5 }}>
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* How it Works Link */}
          <motion.div className="mt-12" variants={itemVariants}>
            <Link href="/how-it-works" className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold group">
              <PlayCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              See how it works
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}