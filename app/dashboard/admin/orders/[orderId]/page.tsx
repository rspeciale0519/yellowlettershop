'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, User, Package } from 'lucide-react';
import { OrderTimeline } from '@/components/admin/orders/order-timeline';
import { OrderPaymentActions } from '@/components/admin/orders/order-payment-actions';
import { createClient } from '@/utils/supabase/client';

const statusOptions = ['submitted', 'processing', 'completed', 'cancelled'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');

  const supabase = createClient();

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/orders/${orderId}`, { headers });
      if (res.ok) {
        const { data } = await res.json();
        setDetail(data);
        setNewStatus((data.order as Record<string, unknown>)?.status as string ?? '');
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }),
    });
    await fetchDetail();
  };

  const handleCapture = async (piId: string) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'POST', headers,
      body: JSON.stringify({ action: 'capture', paymentIntentId: piId }),
    });
    await fetchDetail();
  };

  const handleRefund = async (piId: string, amount?: number, reason?: string) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'POST', headers,
      body: JSON.stringify({ action: 'refund', paymentIntentId: piId, amount, reason }),
    });
    await fetchDetail();
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading order...</p>;
  }
  if (!detail) {
    return <p className="text-sm text-destructive py-12 text-center">Order not found.</p>;
  }

  const order = detail.order as Record<string, unknown>;
  const user = detail.user as Record<string, unknown> | null;
  const payments = (detail.payments as Record<string, unknown>[]) ?? [];
  const timeline = (detail.timeline as Record<string, unknown>[]) ?? [];
  const status = order.status as string;
  const orderState = order.order_state as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Order</h1>
              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{orderId.slice(0, 12)}</code>
              <Badge variant="outline" className={
                status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                status === 'processing' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-blue-500/10 text-blue-600 border-blue-500/20'
              }>{status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {new Date(order.created_at as string).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Update */}
        <div className="flex items-center gap-2">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleStatusUpdate} disabled={newStatus === status}>
            Update
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Order Details + Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{user.full_name as string ?? 'Unknown'}</p>
                <p className="text-muted-foreground">{user.email as string}</p>
                <Link
                  href={`/dashboard/admin/users/${user.user_id as string}`}
                  className="text-xs text-red-500 hover:underline"
                >
                  View full profile
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Order State Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderState ? (
                <div className="text-sm space-y-2">
                  {orderState.pricing && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-mono font-semibold">
                        ${Number((orderState.pricing as Record<string, unknown>).total ?? 0).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">Records:</span>
                      <span className="font-mono">
                        {String((orderState.pricing as Record<string, unknown>).recordCount ?? '—')}
                      </span>
                    </div>
                  )}
                  {orderState.mailingOptions && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <span className="text-muted-foreground">Service Level:</span>
                      <span>{String((orderState.mailingOptions as Record<string, unknown>).serviceLevel ?? '—')}</span>
                      <span className="text-muted-foreground">Format:</span>
                      <span>{String((orderState.mailingOptions as Record<string, unknown>).mailPieceFormat ?? '—')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No order state data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Payments</h3>
            <OrderPaymentActions
              payments={payments as Parameters<typeof OrderPaymentActions>[0]['payments']}
              onCapture={handleCapture}
              onRefund={handleRefund}
            />
          </div>
        </div>

        {/* Right Column — Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                entries={timeline as Parameters<typeof OrderTimeline>[0]['entries']}
                orderCreatedAt={order.created_at as string}
                orderStatus={status}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
