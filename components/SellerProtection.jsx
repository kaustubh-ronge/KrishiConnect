"use client";

import { motion } from "framer-motion";
import { Lock, ShieldAlert } from "lucide-react";

export default function SellerProtection({ children, sellingStatus }) {
  if (sellingStatus === "APPROVED") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-green-50/30 p-8 text-center rounded-xl border border-green-100 shadow-sm mt-8 mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-amber-100 p-4 rounded-full inline-block mb-6 shadow-sm">
          {sellingStatus === "PENDING" ? (
            <Lock className="w-12 h-12 text-amber-600" />
          ) : (
            <ShieldAlert className="w-12 h-12 text-red-500" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Feature Unavailable
        </h2>
        
        {sellingStatus === "PENDING" ? (
          <p className="text-lg text-gray-600 mb-6">
            Your request for selling privileges is currently <b>pending admin approval</b>. <br/>
            These features will unlock automatically once your profile has been approved. You will receive an email notification when this happens.
          </p>
        ) : sellingStatus === "REJECTED" ? (
          <p className="text-lg text-gray-600 mb-6">
            Your request for selling privileges was <b>rejected</b> by the administrator. <br/>
            Please contact support if you believe this is a mistake.
          </p>
        ) : (
          <p className="text-lg text-gray-600 mb-6">
            You are currently registered as a <b>Buyer Only</b>. <br/>
            These features are reserved for users who have requested and received selling privileges. You can update your profile usage purpose in the settings to request access.
          </p>
        )}
        
      </motion.div>
    </div>
  );
}
