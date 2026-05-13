

export const dynamic = 'force-dynamic';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import AdminCommandCenterClient from './_components/AdminCommandCenterClient';
import { getAdvancedAdminStats } from '@/actions/admin-advanced';
import { adminDeleteOrder, approveProfile, getAdminStats, getAllOrders, getPendingProfiles, getSellerBankDetailsForOrder, markOrderItemSettled, markOrderSettled, rejectProfile, getAdminDeliveryJobs, getAdminReviews, clearStaleOrders } from '@/actions/admin';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return <div>Not logged in</div>;

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (!dbUser || dbUser.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  const [statsRes, ordersRes, pendingProfilesRes, advancedStatsRes] = await Promise.all([
    getAdminStats(),
    getAllOrders(),
    getPendingProfiles(),
    getAdvancedAdminStats()
  ]);

  if (!statsRes.success) return <div>Error loading stats: {statsRes.error}</div>;
  if (!ordersRes.success) return <div>Error loading orders: {ordersRes.error}</div>;

  return (
    <AdminCommandCenterClient
      initialStats={statsRes.data}
      initialOrders={ordersRes.data}
      initialPendingProfiles={pendingProfilesRes.data || []}
      advancedStats={advancedStatsRes}
      settleAction={markOrderSettled}
      viewBankAction={getSellerBankDetailsForOrder}
      statsAction={getAdvancedAdminStats}
      ordersAction={getAllOrders}
      approveAction={approveProfile}
      rejectAction={rejectProfile}
      getPendingAction={getPendingProfiles}
      deleteOrderAction={adminDeleteOrder}
      clearStaleAction={clearStaleOrders}
      deliveryJobsAction={getAdminDeliveryJobs}
      reviewsAction={getAdminReviews}
    />
  );
}