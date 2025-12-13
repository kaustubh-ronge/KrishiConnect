
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // ADD THIS
import OnboardingClient from "./_components/OnboardinClient";

export default async function OnboardingPage() {
  const { sessionClaims } = auth();
  const role = sessionClaims?.role;

  console.log("OnboardingPage (Server): Fetched role:", role);

  // 🔒 CRITICAL: PREVENT ACCESS IF ROLE ALREADY SELECTED
  if (role && role !== "none") {
    console.log(`User already has role ${role}, redirecting to dashboard`);
    redirect(`/${role}-dashboard`);
  }

  return <OnboardingClient userRole={role} />;
}