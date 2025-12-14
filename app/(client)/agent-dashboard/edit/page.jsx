import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import AgentEditForm from './AgentEditForm';
import { redirect } from 'next/navigation';

export default async function AgentEditPage() {
  const { user, profileExists, error } = await getUserWithProfileStatus('agent');
  if (error || !user) redirect('/sign-in');
  if (!profileExists) redirect('/agent-dashboard');

  return <AgentEditForm initialProfile={user.agentProfile} user={user} />;
}
