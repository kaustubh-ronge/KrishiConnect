"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminDashboardClient({ initialStats = null, initialOrders = [], settleAction, viewBankAction, statsAction, ordersAction }) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);

  async function settle(orderId) {
    if (!settleAction) return toast.error('Action not available');
    setLoading(true);
    const res = await settleAction(orderId);
    if (!res || !res.success) {
      toast.error(res?.error || 'Failed to settle');
      setLoading(false);
      return;
    }
    toast.success('Marked as settled');

    // Refresh using server actions passed in from server component
    if (statsAction) {
      const s = await statsAction();
      if (s?.success) setStats(s.data);
    }
    if (ordersAction) {
      const o = await ordersAction();
      if (o?.success) setOrders(o.data);
    }
    setLoading(false);
  }

  async function viewBank(orderId) {
    if (!viewBankAction) return toast.error('Action not available');
    const res = await viewBankAction(orderId);
    if (!res || !res.success) return toast.error(res?.error || 'Failed to fetch bank details');
    alert(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total GMV</div>
          <div className="text-xl font-semibold">₹{stats?.totalGMV ?? '0'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Platform Revenue</div>
          <div className="text-xl font-semibold">₹{stats?.totalPlatformRevenue ?? '0'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending Payouts</div>
          <div className="text-xl font-semibold">₹{stats?.pendingPayouts ?? '0'}</div>
        </Card>
      </div>

      <h2 className="text-lg font-medium mb-2">Orders</h2>
      <div className="overflow-auto bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2">Order</th>
              <th className="p-2">Buyer</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Platform Fee</th>
              <th className="p-2">Seller Payout</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="p-4">Loading...</td></tr>}
            {orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.id}<br/><small>{new Date(o.createdAt).toLocaleString()}</small></td>
                <td className="p-2">{o.buyer?.name || o.buyer?.email}<br/>{o.buyer?.phone}</td>
                <td className="p-2">₹{o.totalAmount}</td>
                <td className="p-2">₹{o.platformFee}</td>
                <td className="p-2">₹{o.sellerAmount}</td>
                <td className="p-2">{o.paymentStatus} / {o.payoutStatus}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button onClick={() => viewBank(o.id)}>View Bank Details</Button>
                    {o.payoutStatus !== 'SETTLED' && <Button onClick={() => settle(o.id)}>Mark as Settled</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && <tr><td colSpan={7} className="p-4">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
