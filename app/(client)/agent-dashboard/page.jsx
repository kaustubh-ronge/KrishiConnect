import { redirect } from 'next/navigation';
import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import AgentDashboardClient from './_components/AgentDashboardClient';

export default async function AgentDashboardPage() {
  // 1. Fetch User & Profile Status specifically for 'agent'
  const { user, profileExists, error } = await getUserWithProfileStatus('agent');

  // 2. Handle Auth Errors
  if (error || !user) {
    redirect('/sign-in');
  }

  // 3. Strict Role Enforcement
  if (user.role !== 'agent') {
    if (user.role === 'none') {
        redirect('/onboarding'); // Must choose role first
    }
    redirect('/farmer-dashboard'); // Redirect farmers away
  }

  // 4. Render Client UI
  return (
    <AgentDashboardClient
      user={user}
      profileExists={profileExists}
    />
  );
}