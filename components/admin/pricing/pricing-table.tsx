'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, History, DollarSign } from 'lucide-react';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import type { PricingConfig } from '@/lib/admin/types';

interface PricingTableProps {
  items: PricingConfig[];
  onEdit: (item: PricingConfig) => void;
  onToggleActive: (item: PricingConfig) => void;
  onViewHistory: (item: PricingConfig) => void;
}

function formatPrice(item: PricingConfig): string {
  if (item.pricingModel === 'tiered' || item.pricingModel === 'volume_discount') {
    const tiers = item.tierConfig ?? [];
    if (tiers.length === 0) return 'No tiers';
    return `${tiers.length} tier${tiers.length > 1 ? 's' : ''}`;
  }
  if (item.unitAmount === null || item.unitAmount === undefined) return '—';

  // Mail pieces use raw units (÷1000), add-ons/design use cents (÷100)
  const isMail = ['mail_piece', 'paper_stock', 'finish', 'postage', 'shipping'].includes(item.category);
  const dollars = isMail ? item.unitAmount / 1000 : item.unitAmount / 100;
  return `$${dollars.toFixed(isMail ? 3 : 2)}`;
}

export function PricingTable({ items, onEdit, onToggleActive, onViewHistory }: PricingTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Model</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Public</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8}>
              <AdminEmptyState
                icon={DollarSign}
                title="No pricing entries"
                description="No pricing entries in this category yet. Click 'New Entry' to create one."
              />
            </TableCell>
          </TableRow>
        )}
        {items.map((item) => (
          <TableRow key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
            <TableCell className="font-medium">{item.displayName}</TableCell>
            <TableCell>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.key}</code>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{item.pricingModel}</Badge>
            </TableCell>
            <TableCell className="text-right font-mono">{formatPrice(item)}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{item.unitLabel ?? '—'}</TableCell>
            <TableCell>
              {item.isPublic ? (
                <Badge className="bg-green-500/10 text-green-600 text-xs">Public</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Hidden</Badge>
              )}
            </TableCell>
            <TableCell>
              <Switch
                checked={item.isActive}
                onCheckedChange={() => onToggleActive(item)}
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onViewHistory(item)}>
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
