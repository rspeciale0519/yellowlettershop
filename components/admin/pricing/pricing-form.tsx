'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import type { PricingConfig, CreatePricingInput, UpdatePricingInput, PricingCategory, PricingModel } from '@/lib/admin/types';
import { TieredPricingEditor } from './tiered-pricing-editor';

interface PricingFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreatePricingInput | (UpdatePricingInput & { reason?: string })) => Promise<void>;
  existing?: PricingConfig | null;
  defaultCategory?: PricingCategory;
}

const MODEL_OPTIONS: { value: PricingModel; label: string }[] = [
  { value: 'flat', label: 'Flat Fee' },
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'tiered', label: 'Tiered' },
  { value: 'volume_discount', label: 'Volume Discount' },
];

export function PricingForm({ open, onClose, onSave, existing, defaultCategory }: PricingFormProps) {
  const isEdit = !!existing;

  const [displayName, setDisplayName] = useState(existing?.displayName ?? '');
  const [key, setKey] = useState(existing?.key ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [pricingModel, setPricingModel] = useState<PricingModel>(existing?.pricingModel ?? 'per_unit');
  const [unitAmount, setUnitAmount] = useState(existing?.unitAmount?.toString() ?? '');
  const [unitLabel, setUnitLabel] = useState(existing?.unitLabel ?? '');
  const [tierConfig, setTierConfig] = useState(existing?.tierConfig ?? []);
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? true);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isEdit) {
        const updates: UpdatePricingInput & { reason?: string } = {};
        if (displayName !== existing.displayName) updates.displayName = displayName;
        if (description !== (existing.description ?? '')) updates.description = description || undefined;
        if (unitAmount !== (existing.unitAmount?.toString() ?? '')) updates.unitAmount = parseInt(unitAmount, 10) || 0;
        if (unitLabel !== (existing.unitLabel ?? '')) updates.unitLabel = unitLabel;
        if (isPublic !== existing.isPublic) updates.isPublic = isPublic;
        if (pricingModel === 'tiered' || pricingModel === 'volume_discount') {
          updates.tierConfig = tierConfig;
        }
        if (reason) updates.reason = reason;
        await onSave(updates);
      } else {
        await onSave({
          category: defaultCategory ?? 'add_on_service',
          key,
          displayName,
          description: description || undefined,
          pricingModel,
          unitAmount: parseInt(unitAmount, 10) || 0,
          unitLabel: unitLabel || undefined,
          tierConfig: (pricingModel === 'tiered' || pricingModel === 'volume_discount') ? tierConfig : undefined,
          isPublic,
        } as CreatePricingInput);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const showTierEditor = pricingModel === 'tiered' || pricingModel === 'volume_discount';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pricing' : 'New Pricing Entry'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${existing.displayName}` : 'Create a new product or service pricing entry.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Skip Tracing" />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label>Key (unique identifier)</Label>
                <Input value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="e.g. skip_tracing" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as PricingModel)} disabled={isEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!showTierEditor && (
              <div className="space-y-2">
                <Label>Unit Amount (raw units)</Label>
                <Input type="number" value={unitAmount} onChange={(e) => setUnitAmount(e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          {!showTierEditor && (
            <div className="space-y-2">
              <Label>Unit Label</Label>
              <Input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="e.g. per record, per piece" />
            </div>
          )}

          {showTierEditor && (
            <TieredPricingEditor tiers={tierConfig} onChange={setTierConfig} isVolumeDiscount={pricingModel === 'volume_discount'} />
          )}

          <div className="flex items-center gap-3">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            <Label>Publicly visible to customers</Label>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>Reason for change (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cost adjustment" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !displayName}>
            {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
