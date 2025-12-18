"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  Loader2, 
  Banknote, 
  TrendingUp, 
  AlertCircle, 
  Eye, 
  CheckCircle2, 
  Search,
  Building2,
  ArrowUpRight
} from "lucide-react";

// Shadcn UI Imports (Ensure you have these installed)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminDashboardClient({ 
  initialStats = null, 
  initialOrders = [], 
  settleAction, 
  viewBankAction, 
  statsAction, 
  ordersAction 
}) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState(null); // Track specific action loading
  const [isClient, setIsClient] = useState(false);
  
  // Bank Details Modal State
  const [bankDetails, setBankDetails] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- ACTIONS ---

  async function handleSettle(orderId) {
    if (!settleAction) return toast.error('Action not available');
    setLoadingId(orderId);
    
    try {
      const res = await settleAction(orderId);
      if (!res || !res.success) throw new Error(res?.error || 'Failed to settle');
      
      toast.success('Payout marked as settled');

      // Refresh data
      if (statsAction) {
        const s = await statsAction();
        if (s?.success) setStats(s.data);
      }
      if (ordersAction) {
        const o = await ordersAction();
        if (o?.success) setOrders(o.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleViewBank(orderId) {
    if (!viewBankAction) return toast.error('Action not available');
    setLoadingId(`bank-${orderId}`);
    
    try {
      const res = await viewBankAction(orderId);
      if (!res || !res.success) throw new Error(res?.error || 'Failed to fetch details');
      
      setBankDetails(res.data);
      setIsBankModalOpen(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  // --- HELPERS ---

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
      case 'SETTLED': return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-muted-foreground">Manage orders, payouts, and view platform performance.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total GMV</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalGMV)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross Merchandise Value</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPlatformRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total earnings from fees</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayouts)}</div>
            <p className="text-xs text-muted-foreground mt-1">Due to sellers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/disputes'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openDisputes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Needs attention
              <ArrowUpRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ORDERS TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="px-6 py-4 border-b bg-gray-50/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-md border shadow-sm">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Buyer Details</TableHead>
                <TableHead>Financials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground align-top py-4">
                      <span className="font-medium text-gray-900 text-sm">#{o.id.slice(-6)}</span>
                      <br />
                      {isClient ? new Date(o.createdAt).toLocaleDateString() : "..."}
                    </TableCell>
                    
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{o.buyer?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{o.buyer?.email}</span>
                        <span className="text-xs text-muted-foreground">{o.buyer?.phone}</span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between w-32">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium">{formatCurrency(o.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between w-32 text-xs">
                          <span className="text-muted-foreground">Fee:</span>
                          <span className="text-green-600">+{formatCurrency(o.platformFee)}</span>
                        </div>
                        <div className="flex justify-between w-32 text-xs border-t pt-1 mt-1">
                          <span className="text-muted-foreground font-medium">Seller:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(o.sellerAmount)}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4 space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] uppercase font-bold text-gray-400 w-12 tracking-wide">Pay</span>
                         <Badge variant="outline" className={getStatusColor(o.paymentStatus)}>
                            {o.paymentStatus}
                         </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] uppercase font-bold text-gray-400 w-12 tracking-wide">Payout</span>
                         <Badge variant="outline" className={getStatusColor(o.payoutStatus)}>
                            {o.payoutStatus}
                         </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right align-top py-4">
                      <div className="flex flex-col gap-2 items-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-2 w-[140px] justify-start text-gray-600"
                          onClick={() => handleViewBank(o.id)}
                          disabled={loadingId === `bank-${o.id}`}
                        >
                          {loadingId === `bank-${o.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
                          Bank Details
                        </Button>

                        {o.payoutStatus !== 'SETTLED' && (
                          <Button 
                            size="sm" 
                            className="h-8 gap-2 w-[140px] justify-start bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            onClick={() => handleSettle(o.id)}
                            disabled={loadingId === o.id || o.paymentStatus !== 'PAID'}
                          >
                             {loadingId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                             Mark Settled
                          </Button>
                        )}
                         
                        {o.payoutStatus === 'SETTLED' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground pr-2 h-8">
                                <CheckCircle2 className="h-3 w-3 text-green-600" /> Settled
                            </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BANK DETAILS DIALOG */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                Seller Bank Accounts
            </DialogTitle>
            <DialogDescription>
                Payout details for the sellers involved in this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {bankDetails?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-sm text-gray-900">{item.productName}</p>
                            <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                                {item.sellerType}
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                        {item.sellerProfile ? (
                            <>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-muted-foreground">Account Name:</span>
                                    <span className="col-span-2 font-medium">{item.sellerProfile.name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-muted-foreground">Bank:</span>
                                    <span className="col-span-2 font-medium">{item.sellerProfile.bankName || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-muted-foreground">Account No:</span>
                                    <span className="col-span-2 font-mono bg-white px-1 rounded border w-fit">
                                        {item.sellerProfile.accountNumber || 'N/A'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-muted-foreground">IFSC:</span>
                                    <span className="col-span-2 font-mono">{item.sellerProfile.ifscCode || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-muted-foreground">UPI ID:</span>
                                    <span className="col-span-2 font-mono text-green-700">{item.sellerProfile.upiId || 'N/A'}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-xs">
                                <AlertCircle className="h-4 w-4" /> 
                                No bank details linked for this seller.
                            </div>
                        )}
                    </div>
                </div>
            ))}
          </div>

          <div className="flex justify-end">
             <Button variant="secondary" onClick={() => setIsBankModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}