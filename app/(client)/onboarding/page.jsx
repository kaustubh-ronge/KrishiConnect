
export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"; // ADD THIS
import OnboardingClient from "./_components/OnboardinClient";
import { checkUser } from "@/lib/checkUser";

export default async function OnboardingPage() {
  const { sessionClaims } = await checkUser();
  const role = sessionClaims?.role;

  // Onboarding page (server): role fetched

  // 🔒 CRITICAL: PREVENT ACCESS IF ROLE ALREADY SELECTED
  if (role && role !== "none") {
    // User already has role; redirecting
    redirect(`/${role}-dashboard`);
  }

  return <OnboardingClient userRole={role} />;
}