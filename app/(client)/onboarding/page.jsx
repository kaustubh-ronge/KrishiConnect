export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma"; 
import OnboardingClient from "./_components/OnboardingClient";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 🔒 SAFE READ: We check the DB directly to bypass Clerk's JWT cache delay.
  // Using findUnique avoids the 'upsert' race condition you were worried about!
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  const role = dbUser?.role || "none";

  // 🔒 CRITICAL: PREVENT ACCESS IF ROLE ALREADY SELECTED
  if (role !== "none") {
    // Because we checked the DB, this redirect is 100% accurate and will never loop
    redirect(`/${role}-dashboard`);
  }

  return <OnboardingClient userRole={role} />;
}

// export const dynamic = 'force-dynamic';
// import { redirect } from "next/navigation"; // ADD THIS
// import OnboardingClient from "./_components/OnboardingClient";
// import { checkUser } from "@/lib/checkUser";

// export default async function OnboardingPage() {
//   const { sessionClaims } = await checkUser();
//   const role = sessionClaims?.role;

//   // Onboarding page (server): role fetched

//   // 🔒 CRITICAL: PREVENT ACCESS IF ROLE ALREADY SELECTED
//   if (role && role !== "none") {
//     // User already has role; redirecting
//     redirect(`/${role}-dashboard`);
//   }

//   return <OnboardingClient userRole={role} />;
// }