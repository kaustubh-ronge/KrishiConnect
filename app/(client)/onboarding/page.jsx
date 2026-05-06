
export const dynamic = 'force-dynamic';
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // ADD THIS
import OnboardingClient from "./_components/OnboardinClient";

export default async function OnboardingPage() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.role;

  // Onboarding page (server): role fetched

  // 🔒 CRITICAL: PREVENT ACCESS IF ROLE ALREADY SELECTED
  if (role && role !== "none") {
    // User already has role; redirecting
    redirect(`/${role}-dashboard`);
  }

  return <OnboardingClient userRole={role} />;
}