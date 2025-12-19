import { getUserWithProfileStatus } from '@/lib/getUserWithProfileStatus';
import FarmerEditForm from './_components/FarmerEditForm';
import { redirect } from 'next/navigation';
import { currentUser } from "@clerk/nextjs/server";

export default async function FarmerEditPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const { user, profileExists, error } = await getUserWithProfileStatus('farmer');
  
  if (error || !user) redirect('/sign-in');
  if (!profileExists) redirect('/farmer-dashboard'); // Should have profile to edit

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 py-12">
        <FarmerEditForm initialProfile={user.farmerProfile} user={user} />
    </div>
  );
}