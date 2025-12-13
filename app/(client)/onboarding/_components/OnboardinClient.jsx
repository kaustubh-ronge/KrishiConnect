
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { selectRole } from '@/actions/users';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sprout, UserCheck, Users, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingClient({ userRole }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (userRole === 'farmer') {
      toast.success("Farmer role selected successfully!", {
        description: "Welcome to your farmer dashboard"
      });
      setTimeout(() => router.push('/farmer-dashboard'), 1500);
    } else if (userRole === 'agent') {
      toast.success("Agent role selected successfully!", {
        description: "Welcome to your agent dashboard"
      });
      setTimeout(() => router.push('/agent-dashboard'), 1500);
    }
  }, [userRole, router]);

  const handleRoleSelect = async (role) => {
    if (isLoading) return;

    setIsLoading(true);
    setSelectedRole(role);

    try {
      const formData = new FormData();
      formData.append('role', role);

      const result = await selectRole(formData);

      if (result?.error) {
        if (result.error === "Role already selected") {
          toast.error("Role already selected", {
            description: result.message || "You have already chosen your role and cannot change it."
          });
          // Redirect to their existing dashboard after showing toast
          if (result.existingRole) {
            setTimeout(() => {
              router.push(`/${result.existingRole}-dashboard`);
            }, 2000);
          }
        } else {
          toast.error("Selection Failed", {
            description: result.error
          });
        }
      }
      // If no error returned, the server action will handle the redirect automatically
      // Success toast will be shown after redirect
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again in a moment"
      });
      console.error("Role selection error:", error);
    } finally {
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  if (userRole && userRole !== "none") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-green-50 to-emerald-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-semibold">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const roleOptions = [
    {
      value: "farmer",
      title: "Farmer",
      description: "Sell your vegetables and fruits directly to agents",
      icon: Sprout,
      features: ["List your produce", "Set your prices", "Connect with agents"],
      buttonVariant: "default"
    },
    {
      value: "agent",
      title: "Agent",
      description: "Buy fresh produce directly from farmers also sell your products",
      icon: Users,
      features: ["Access farmer details", "Bulk purchasing", "Quality assurance"],
      buttonVariant: "outline"
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Path
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you want to use KrishiConnect.
            <strong className="text-red-600 block mt-2">This choice is permanent and cannot be changed.</strong>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {roleOptions.map((role, index) => (
            <motion.div
              key={role.value}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full border-2 border-gray-200 hover:border-green-300 transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <role.icon className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">{role.title}</CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Features List */}
                  <div className="space-y-3">
                    {role.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.1) + (featureIndex * 0.05) }}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </motion.div>
                    ))}
                  </div>


                  {/* Action Button */}
                  <Button
                    onClick={() => handleRoleSelect(role.value)}
                    variant={role.buttonVariant}
                    className="w-full group"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading && selectedRole === role.value ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Continue as {role.title}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            <strong className="text-red-600">Important:</strong> Your role selection is permanent.
            Contact support only for exceptional cases.
          </p>
        </motion.div>
      </div>
    </div>
  );
}