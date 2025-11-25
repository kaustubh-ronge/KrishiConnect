import { checkUser } from "@/lib/checkUser";
import HeroClient from "./hero-client";

export default async function HeroServer() {

  const dbUser = await checkUser();
  // No auth calls in server component - let client handle it
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

  return <HeroClient
    isLoggedIn={!!dbUser}
    userRole={dbUser?.role}
    {...heroData} />;
}