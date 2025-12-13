import { redirect } from 'next/navigation';
import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus'; // Ensure path is correct
import DashboardClient from './_components/DashboardClient';

export default async function FarmerDashboardPage() {
  const { user, profileExists, error } = await getUserWithProfileStatus('farmer');

  if (error || !user) {
    console.error("FarmerDashboardPage Error:", error || "User not found");
    redirect('/sign-in');
  }

  if (user.role !== 'farmer') {
    redirect(user.role === 'none' ? '/onboarding' : '/agent-dashboard'); // Or '/' for agent
  }

  return (
    <DashboardClient
      user={user}
      profileExists={profileExists}
    />
  );
}