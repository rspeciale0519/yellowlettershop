'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { PricingTier } from '@/lib/admin/types';

interface TieredPricingEditorProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  isVolumeDiscount?: boolean;
}

export function TieredPricingEditor({ tiers, onChange, isVolumeDiscount }: TieredPricingEditorProps) {
  const priceLabel = isVolumeDiscount ? 'Discount %' : 'Price (cents)';

  const updateTier = (index: number, field: keyof PricingTier, value: string) => {
    const updated = [...tiers];
    const numVal = value === '' ? null : parseInt(value, 10);

    if (field === 'max') {
      updated[index] = { ...updated[index], max: numVal };
    } else if (field === 'min') {
      updated[index] = { ...updated[index], min: numVal ?? 0 };
    } else {
      updated[index] = { ...updated[index], price: numVal ?? 0 };
    }
    onChange(updated);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier ? (lastTier.max ?? lastTier.min) + 1 : 1;
    onChange([...tiers, { min: nextMin, max: null, price: 0 }]);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>{isVolumeDiscount ? 'Volume Discount Tiers' : 'Pricing Tiers'}</Label>

      <div className="space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={tier.min}
                onChange={(e) => updateTier(i, 'min', e.target.value)}
                placeholder="Min"
                className="text-sm"
              />
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="flex-1">
              <Input
                type="number"
                value={tier.max ?? ''}
                onChange={(e) => updateTier(i, 'max', e.target.value)}
                placeholder="No limit"
                className="text-sm"
              />
            </div>
            <span className="text-muted-foreground text-sm">=</span>
            <div className="flex-1">
              <Input
                type="number"
                value={tier.price}
                onChange={(e) => updateTier(i, 'price', e.target.value)}
                placeholder={priceLabel}
                className="text-sm"
              />
            </div>
            <span className="text-muted-foreground text-xs w-8">
              {isVolumeDiscount ? '%' : '¢'}
            </span>
            <Button variant="ghost" size="icon" onClick={() => removeTier(i)} className="h-8 w-8">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addTier}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Tier
      </Button>
    </div>
  );
}
