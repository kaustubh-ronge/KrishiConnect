import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import AdminDashboardClient from './_components/AdminDashboardClient';
import { getAdminStats, getAllOrders, markOrderPayoutSettled, getSellerBankDetailsForOrder } from '@/actions/admin';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return <div>Not logged in</div>;

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'super_admin')) {
    return <div>Unauthorized</div>;
  }

  const statsRes = await getAdminStats();
  const ordersRes = await getAllOrders();

  if (!statsRes.success) return <div>Error loading stats: {statsRes.error}</div>;
  if (!ordersRes.success) return <div>Error loading orders: {ordersRes.error}</div>;

  return (
    <AdminDashboardClient
      initialStats={statsRes.data}
      initialOrders={ordersRes.data}
      settleAction={markOrderPayoutSettled}
      viewBankAction={getSellerBankDetailsForOrder}
      statsAction={getAdminStats}
      ordersAction={getAllOrders}
    />
  );
}
