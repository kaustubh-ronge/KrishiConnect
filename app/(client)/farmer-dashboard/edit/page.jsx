import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import FarmerEditForm from './FarmerEditForm';
import { redirect } from 'next/navigation';

export default async function FarmerEditPage() {
  const { user, profileExists, error } = await getUserWithProfileStatus('farmer');
  if (error || !user) redirect('/sign-in');
  if (!profileExists) redirect('/farmer-dashboard');

  return <FarmerEditForm initialProfile={user.farmerProfile} user={user} />;
}
