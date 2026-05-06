import HeroClient from "./hero-client";
import { checkUser } from "@/lib/checkUser"; // Import checkUser

import { HERO_CONTENT } from "@/data/HeroData/constants";

export default async function HeroServer() {
  // 1. Fetch the REAL user status from the DB (Single Source of Truth)
  const dbUser = await checkUser();

  // 2. Pass the DB role to the client
  return (
    <HeroClient 
      {...HERO_CONTENT} 
      isLoggedIn={!!dbUser} 
      userRole={dbUser?.role} // This will be 'none' if re-created, fixing your issue
    />
  );
}