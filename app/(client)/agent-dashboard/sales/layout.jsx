export const dynamic = 'force-dynamic';
import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import SellerProtection from '@/components/SellerProtection';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
  const { user, profileExists } = await getUserWithProfileStatus('agent');
  if (!user || !profileExists) return redirect('/agent-dashboard');

  return (
    <SellerProtection sellingStatus={user.agentProfile?.sellingStatus}>
      {children}
    </SellerProtection>
  );
}
