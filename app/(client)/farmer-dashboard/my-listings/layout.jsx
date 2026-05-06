export const dynamic = 'force-dynamic';
import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import SellerProtection from '@/components/SellerProtection';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
  const { user, profileExists } = await getUserWithProfileStatus('farmer');
  if (!user || !profileExists) return redirect('/farmer-dashboard');

  return (
    <SellerProtection sellingStatus={user.farmerProfile?.sellingStatus}>
      {children}
    </SellerProtection>
  );
}
