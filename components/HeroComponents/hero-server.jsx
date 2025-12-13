import HeroClient from "./hero-client";
import { checkUser } from "@/lib/checkUser"; // Import checkUser

export default async function HeroServer() {
  // 1. Fetch the REAL user status from the DB (Single Source of Truth)
  const dbUser = await checkUser();

  const heroData = {
    title: "Connecting Farmers & Agents",
    subtitle: "Direct B2B platform for vegetables and fruits trading in rural areas",
    description: "Join thousands of farmers and agents across India. Sell your produce directly or connect with reliable suppliers. Start free today!",
    stats: [
      { number: "10K+", label: "Farmers Registered" },
      { number: "2.5K+", label: "Active Agents" },
      { number: "50K+", label: "Transactions" },
      { number: "100+", label: "Villages Served" }
    ]
  };

  // 2. Pass the DB role to the client
  return (
    <HeroClient 
      {...heroData} 
      isLoggedIn={!!dbUser} 
      userRole={dbUser?.role} // This will be 'none' if re-created, fixing your issue
    />
  );
}