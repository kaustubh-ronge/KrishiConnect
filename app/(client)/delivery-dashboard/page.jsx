export const dynamic = 'force-dynamic';
import { getUserWithProfileStatus } from "@/lib/getUserWithProfileStatus";
import { redirect } from "next/navigation";
import DeliveryDashboardClient from "./_components/DeliveryDashboardClient";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Delivery Dashboard | KrishiConnect",
  description: "Manage your deliveries and service area.",
};

export default async function DeliveryDashboardPage(props) {
  const { user, profileExists, error } = await getUserWithProfileStatus('delivery');
  const searchParams = await props?.searchParams;
  const page = parseInt(searchParams?.page) || 1;
  const limit = 10;

  let initialJobs = [];
  let totalJobs = 0;
  let hasMore = false;
  let lifetimeEarnings = 0;

  if (profileExists && user?.deliveryProfile) {
    totalJobs = await db.deliveryJob.count({
      where: { deliveryBoyId: user.deliveryProfile.id }
    });

    const earningsResult = await db.deliveryJob.aggregate({
      where: { 
        deliveryBoyId: user.deliveryProfile.id,
        status: "DELIVERED"
      },
      _sum: {
        totalPrice: true
      }
    });
    lifetimeEarnings = earningsResult._sum.totalPrice || 0;

    initialJobs = await db.deliveryJob.findMany({
      where: { deliveryBoyId: user.deliveryProfile.id },
      include: {
        order: {
          include: {
            items: { 
              include: { 
                product: {
                  include: {
                    farmer: { select: { address: true, name: true, phone: true } },
                    agent: { select: { address: true, companyName: true, phone: true } }
                  }
                } 
              } 
            },
            buyerUser: { include: { farmerProfile: true, agentProfile: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Strip OTP for security (should only be verified on server)
    initialJobs = initialJobs.map(({ otp, ...job }) => job);
    hasMore = (page * limit) < totalJobs;
  }

  if (error) {
    return <div className="p-10 text-red-500 font-bold">Error: {error}</div>;
  }

  // If user is logged in but has a different role, redirect to their respective dashboard
  if (user && user.role !== 'none' && user.role !== 'delivery') {
    redirect(`/${user.role}-dashboard`);
  }

  return (
    <DeliveryDashboardClient
      user={user}
      profileExists={profileExists}
      initialJobs={initialJobs}
      total={totalJobs}
      hasMore={hasMore}
      currentPage={page}
      lifetimeEarnings={lifetimeEarnings}
    />
  );
}
