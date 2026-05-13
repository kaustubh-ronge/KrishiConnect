import { checkUser } from '@/lib/checkUser'; // Adjust path if needed
import HeaderClient from './header-client';

export default async function HeaderServer() {
  // Call checkUser on the server
  const dbUser = await checkUser();

  // Pass the result to the client component
  // We pass specific props, not the whole dbUser object
  return (
    <HeaderClient 
      isLoggedIn={!!dbUser} 
      userRole={dbUser?.role}
      isDisabled={!!dbUser?.isDisabled}
      hasFarmerProfile={!!dbUser?.farmerProfile}
      hasAgentProfile={!!dbUser?.agentProfile}
      hasDeliveryProfile={!!dbUser?.deliveryProfile}
    />
  );
}