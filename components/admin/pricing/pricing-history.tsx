'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PricingConfig } from '@/lib/admin/types';

interface HistoryEntry {
  id: string;
  change_type: string;
  changed_by: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

interface PricingHistoryProps {
  open: boolean;
  onClose: () => void;
  item: PricingConfig | null;
  history: HistoryEntry[];
  isLoading: boolean;
}

const changeTypeBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  create: { label: 'Created', variant: 'default' },
  update: { label: 'Updated', variant: 'secondary' },
  deactivate: { label: 'Deactivated', variant: 'destructive' },
  reactivate: { label: 'Reactivated', variant: 'outline' },
};

export function PricingHistory({ open, onClose, item, history, isLoading }: PricingHistoryProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Price Change History</DialogTitle>
          <DialogDescription>
            {item ? `History for "${item.displayName}"` : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No changes recorded.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const badge = changeTypeBadge[entry.change_type] ?? { label: entry.change_type, variant: 'secondary' as const };
                return (
                  <div key={entry.id} className="border rounded-md p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="text-sm text-muted-foreground">Reason: {entry.reason}</p>
                    )}
                    {entry.change_type === 'update' && entry.old_values && entry.new_values && (
                      <div className="text-xs font-mono bg-muted rounded p-2 space-y-0.5">
                        {Object.keys(entry.new_values).map((key) => {
                          const oldVal = (entry.old_values as Record<string, unknown>)?.[key];
                          const newVal = (entry.new_values as Record<string, unknown>)?.[key];
                          if (oldVal === newVal) return null;
                          return (
                            <div key={key}>
                              <span className="text-muted-foreground">{key}:</span>{' '}
                              <span className="text-red-500 line-through">{JSON.stringify(oldVal)}</span>{' '}
                              <span className="text-green-500">{JSON.stringify(newVal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
