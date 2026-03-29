'use client';

import { CheckCircle2, Clock, XCircle, DollarSign, Truck, AlertCircle } from 'lucide-react';

interface TimelineEntry {
  id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

interface OrderTimelineProps {
  entries: TimelineEntry[];
  orderCreatedAt: string;
  orderStatus: string;
}

const actionConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  order_status_changed: { icon: AlertCircle, label: 'Status Changed', color: 'text-blue-500' },
  order_payment_captured: { icon: DollarSign, label: 'Payment Captured', color: 'text-emerald-500' },
  order_refunded: { icon: XCircle, label: 'Refunded', color: 'text-red-500' },
  order_vendor_assigned: { icon: Truck, label: 'Vendor Assigned', color: 'text-amber-500' },
};

export function OrderTimeline({ entries, orderCreatedAt, orderStatus }: OrderTimelineProps) {
  const allEvents = [
    { id: 'created', action: 'created', new_value: null, old_value: null, created_at: orderCreatedAt },
    ...entries,
  ];

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

      <div className="space-y-6">
        {allEvents.map((entry, i) => {
          const isCreated = entry.action === 'created';
          const config = isCreated
            ? { icon: CheckCircle2, label: 'Order Created', color: 'text-emerald-500' }
            : actionConfig[entry.action] ?? { icon: Clock, label: entry.action, color: 'text-muted-foreground' };

          const Icon = config.icon;
          const newVal = entry.new_value as Record<string, unknown> | null;

          return (
            <div key={entry.id} className="relative flex gap-4 pl-8">
              {/* Dot */}
              <div className={`absolute left-0 top-0.5 rounded-full p-1 bg-background border-2 ${
                i === allEvents.length - 1 ? 'border-red-500' : 'border-muted'
              }`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{config.label}</p>
                {newVal?.status && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.old_value?.status ? `${entry.old_value.status} → ` : ''}{newVal.status as string}
                  </p>
                )}
                {newVal?.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    "{newVal.notes as string}"
                  </p>
                )}
                {newVal?.paymentIntentId && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {(newVal.paymentIntentId as string).slice(0, 20)}...
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
