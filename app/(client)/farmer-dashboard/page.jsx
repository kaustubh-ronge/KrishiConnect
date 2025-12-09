import { redirect } from 'next/navigation';
import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus'; // Ensure path is correct
import DashboardClient from './_components/DashboardClient';

export default async function FarmerDashboardPage() {
  // Fetch user and profile status
  const { user, profileExists, error } = await getUserWithProfileStatus('farmer');

  // Handle errors or user not logged in
  if (error || !user) {
    console.error("FarmerDashboardPage Error:", error || "User not found");
    redirect('/sign-in');
  }

  // Handle role validation
  if (user.role !== 'farmer') {
    // Redirect based on actual role
    redirect(user.role === 'none' ? '/onboarding' : '/agent-dashboard'); // Or '/' for agent
  }

  // Pass user details and profile status to the client component
  return (
    <DashboardClient
      user={user}
      profileExists={profileExists}
    />
  );
}