'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Deliberately plain: this surface exists to make fulfillment operable. The
// Masthead redesign re-skins it later.

interface Dispatch {
  id: string;
  vendor_id: string;
  status: string;
  package: { recordCount?: number } | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  error: string | null;
  dispatched_at: string;
  accepted_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface VendorOption {
  id: string;
  name: string;
  vendorType: string[];
  isActive: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  sent: { label: 'Sent to vendor', className: 'bg-blue-500/10 text-blue-600' },
  accepted: { label: 'Accepted', className: 'bg-indigo-500/10 text-indigo-600' },
  in_production: { label: 'In production', className: 'bg-amber-500/10 text-amber-600' },
  shipped: { label: 'Mailed', className: 'bg-emerald-500/10 text-emerald-600' },
  delivered: { label: 'Delivered', className: 'bg-emerald-600/10 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
};

/** What the admin can move the dispatch to next, given where it is. */
const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  sent: [
    { status: 'accepted', label: 'Mark accepted' },
    { status: 'failed', label: 'Mark failed' },
  ],
  accepted: [
    { status: 'in_production', label: 'Mark in production' },
    { status: 'failed', label: 'Mark failed' },
  ],
  in_production: [
    { status: 'shipped', label: 'Mark mailed' },
    { status: 'failed', label: 'Mark failed' },
  ],
  shipped: [{ status: 'delivered', label: 'Mark delivered' }],
  delivered: [],
  failed: [],
};

export function OrderDispatchPanel({ orderId }: { orderId: string }) {
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const supabase = createClient();

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }, [supabase]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      const [dispatchRes, vendorRes] = await Promise.all([
        fetch(`/api/admin/orders/${orderId}/dispatch`, { headers }),
        fetch('/api/vendors?type=print&status=active', { headers }),
      ]);

      if (dispatchRes.ok) setDispatch((await dispatchRes.json()).dispatch);
      if (vendorRes.ok) setVendors(await vendorRes.json());
    } finally {
      setIsLoading(false);
    }
  }, [orderId, authHeaders]);

  useEffect(() => { load(); }, [load]);

  const handleDispatch = async () => {
    setIsBusy(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(selectedVendor ? { vendorId: selectedVendor } : {}),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Dispatch failed');
        return;
      }
      toast.success(`Sent to ${body.vendorName} (${body.recordCount} pieces)`);
      await load();
    } finally {
      setIsBusy(false);
    }
  };

  const handleTransition = async (status: string) => {
    setIsBusy(true);
    try {
      const headers = await authHeaders();
      const payload: Record<string, unknown> = { status };
      if (status === 'shipped') {
        if (trackingNumber) payload.trackingNumber = trackingNumber;
        if (trackingCarrier) payload.trackingCarrier = trackingCarrier;
      }

      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Could not update dispatch');
        return;
      }
      toast.success(
        body.orderStatus ? `Dispatch updated — order is now ${body.orderStatus}` : 'Dispatch updated'
      );
      setTrackingNumber('');
      setTrackingCarrier('');
      await load();
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading fulfillment…
        </CardContent>
      </Card>
    );
  }

  if (!dispatch || dispatch.status === 'failed') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" /> Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dispatch?.status === 'failed' && (
            <p className="text-xs text-red-500">
              Previous dispatch failed{dispatch.error ? `: ${dispatch.error}` : ''}. You can retry below.
            </p>
          )}
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active print vendor configured. Add one under Vendors before dispatching.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Print vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Use the default active print vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleDispatch}
            disabled={isBusy || vendors.length === 0}
          >
            <Truck className="h-3.5 w-3.5 mr-1.5" />
            Dispatch to vendor
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[dispatch.status] ?? statusConfig.sent;
  const actions = NEXT_ACTIONS[dispatch.status] ?? [];
  const vendorName = vendors.find((v) => v.id === dispatch.vendor_id)?.name ?? 'Vendor';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" /> Fulfillment
          </CardTitle>
          <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs space-y-1 text-muted-foreground">
          <p>Vendor: <span className="font-medium text-foreground">{vendorName}</span></p>
          {dispatch.package?.recordCount != null && (
            <p>Pieces: {dispatch.package.recordCount.toLocaleString()}</p>
          )}
          <p>Dispatched: {new Date(dispatch.dispatched_at).toLocaleString()}</p>
          {dispatch.shipped_at && <p>Mailed: {new Date(dispatch.shipped_at).toLocaleString()}</p>}
          {dispatch.delivered_at && <p>Delivered: {new Date(dispatch.delivered_at).toLocaleString()}</p>}
          {dispatch.tracking_number && (
            <p>
              Tracking: <code className="font-mono">{dispatch.tracking_number}</code>
              {dispatch.tracking_carrier ? ` (${dispatch.tracking_carrier})` : ''}
            </p>
          )}
          {dispatch.error && <p className="text-amber-600">Note: {dispatch.error}</p>}
        </div>

        {dispatch.status === 'in_production' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Tracking number (optional)</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="9400 1118 99…"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Carrier (optional)</Label>
              <Input
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                placeholder="USPS"
              />
            </div>
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex gap-2 pt-1">
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.status === 'failed' ? 'outline' : 'default'}
                disabled={isBusy}
                onClick={() => handleTransition(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
