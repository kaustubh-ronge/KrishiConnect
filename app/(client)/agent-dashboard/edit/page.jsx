import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import { redirect } from 'next/navigation';
import { currentUser } from "@clerk/nextjs/server";
import AgentEditForm from './_components/AgentEditForm';

export default async function AgentEditPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  // Fetch fresh data
  const { user: dbUser, profileExists, error } = await getUserWithProfileStatus('agent');
  
  if (error || !dbUser) {
    redirect('/sign-in');
  }

  
  if (!profileExists) {
    redirect('/agent-dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <AgentEditForm initialProfile={dbUser.agentProfile} user={dbUser} />
    </div>
  );
}