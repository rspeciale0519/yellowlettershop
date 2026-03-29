'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DollarSign, ArrowDownCircle, RotateCcw } from 'lucide-react';

interface Payment {
  id: string;
  stripe_payment_intent_id: string;
  amount: number;
  status: string;
  captured_at: string | null;
  created_at: string;
}

interface OrderPaymentActionsProps {
  payments: Payment[];
  onCapture: (paymentIntentId: string) => Promise<void>;
  onRefund: (paymentIntentId: string, amount?: number, reason?: string) => Promise<void>;
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-500/10 text-gray-500' },
  authorized: { label: 'Authorized', className: 'bg-amber-500/10 text-amber-600 animate-pulse' },
  captured: { label: 'Captured', className: 'bg-emerald-500/10 text-emerald-600' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
  refunded: { label: 'Refunded', className: 'bg-purple-500/10 text-purple-500' },
};

export function OrderPaymentActions({ payments, onCapture, onRefund }: OrderPaymentActionsProps) {
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (piId: string) => {
    setIsProcessing(true);
    try { await onCapture(piId); } finally { setIsProcessing(false); }
  };

  const handleRefund = async (piId: string) => {
    setIsProcessing(true);
    try {
      const amount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
      await onRefund(piId, amount, refundReason || undefined);
      setRefundAmount('');
      setRefundReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No payment records for this order.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const config = paymentStatusConfig[payment.status] ?? paymentStatusConfig.pending;
        const canCapture = payment.status === 'authorized';
        const canRefund = payment.status === 'captured';

        return (
          <Card key={payment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-mono">${(payment.amount / 100).toFixed(2)}</span>
                </CardTitle>
                <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Stripe: <code className="font-mono">{payment.stripe_payment_intent_id}</code></p>
                <p>Created: {new Date(payment.created_at).toLocaleString()}</p>
                {payment.captured_at && <p>Captured: {new Date(payment.captured_at).toLocaleString()}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                {canCapture && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={isProcessing}>
                        <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5" />
                        Capture Payment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Capture ${(payment.amount / 100).toFixed(2)}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will finalize the charge on the customer's card. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCapture(payment.stripe_payment_intent_id)}>
                          Capture
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {canRefund && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={isProcessing}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Refund
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Refund this payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Original amount: ${(payment.amount / 100).toFixed(2)}. Leave amount blank for a full refund.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 py-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Refund Amount (optional)</Label>
                          <Input
                            type="number" step="0.01" placeholder="Full refund"
                            value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reason</Label>
                          <Input
                            placeholder="e.g. Customer request"
                            value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleRefund(payment.stripe_payment_intent_id)}
                        >
                          Confirm Refund
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
