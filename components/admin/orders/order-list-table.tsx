'use client';

import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface OrderRow {
  id: string;
  status: string;
  order_state: Record<string, unknown> | null;
  submitted_at: string | null;
  created_at: string;
  user_id: string;
  user_profiles?: { full_name: string | null; email: string | null };
}

interface OrderListTableProps {
  orders: OrderRow[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  processing: { label: 'Processing', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

function extractAmount(orderState: Record<string, unknown> | null): string {
  if (!orderState) return '—';
  const payment = orderState.payment as Record<string, unknown> | undefined;
  if (payment?.amount) return `$${(Number(payment.amount) / 100).toFixed(2)}`;
  const pricing = orderState.pricing as Record<string, unknown> | undefined;
  if (pricing?.total) return `$${Number(pricing.total).toFixed(2)}`;
  return '—';
}

function extractRecordCount(orderState: Record<string, unknown> | null): string {
  if (!orderState) return '—';
  const pricing = orderState.pricing as Record<string, unknown> | undefined;
  return pricing?.recordCount ? String(pricing.recordCount) : '—';
}

export function OrderListTable({ orders }: OrderListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b-2">
          <TableHead className="font-semibold">Order ID</TableHead>
          <TableHead className="font-semibold">Customer</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="text-right font-semibold">Records</TableHead>
          <TableHead className="text-right font-semibold">Amount</TableHead>
          <TableHead className="font-semibold">Date</TableHead>
          <TableHead className="text-right font-semibold">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
              No orders found matching your filters.
            </TableCell>
          </TableRow>
        )}
        {orders.map((order) => {
          const config = statusConfig[order.status] ?? statusConfig.submitted;
          const profile = order.user_profiles;
          return (
            <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors">
              <TableCell>
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded tracking-tight">
                  {order.id.slice(0, 8)}
                </code>
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email ?? order.user_id.slice(0, 8)}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
                  {config.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {extractRecordCount(order.order_state)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {extractAmount(order.order_state)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(order.submitted_at ?? order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                  <Link href={`/dashboard/admin/orders/${order.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
