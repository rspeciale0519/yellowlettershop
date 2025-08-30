'use client';

import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DraggableSlider } from '@/components/list-builder/common/DraggableSlider';
import type { ForeclosureCriteria } from '@/types/list-builder';

interface ForeclosureAmountsSectionProps {
  criteria: ForeclosureCriteria;
  onCriteriaToggle: (criterion: string) => void;
  onAmountRangeUpdate: (field: string, values: number[]) => void;
}

export function ForeclosureAmountsSection({
  criteria,
  onCriteriaToggle,
  onAmountRangeUpdate,
}: ForeclosureAmountsSectionProps) {
  const isEnabled = (criteria.selectedCriteria ?? []).includes(
    'foreclosure-amount'
  );
  const DEFAULT_RANGE: [number, number] = [0, 1_000_000];
  const rawRange: [number, number] = criteria.foreclosureAmount
    ? [criteria.foreclosureAmount.min, criteria.foreclosureAmount.max]
    : DEFAULT_RANGE;
  const clampedRange: [number, number] = [
    Math.min(Math.max(rawRange[0], DEFAULT_RANGE[0]), DEFAULT_RANGE[1]),
    Math.min(Math.max(rawRange[1], DEFAULT_RANGE[0]), DEFAULT_RANGE[1]),
  ];
  const sliderValue: [number, number] = [
    Math.min(clampedRange[0], clampedRange[1]),
    Math.max(clampedRange[0], clampedRange[1]),
  ];

  return (
    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='foreclosure-amount'
            checked={(criteria.selectedCriteria || []).includes(
              'foreclosure-amount'
            )}
            onCheckedChange={() => onCriteriaToggle('foreclosure-amount')}
          />
          <Label htmlFor='foreclosure-amount' className='font-medium'>
            Filter by Foreclosure Amount
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('foreclosure-amount') && (
          <div className='ml-6'>
            <DraggableSlider
              value={
                criteria.foreclosureAmount
                  ? [
                      criteria.foreclosureAmount.min,
                      criteria.foreclosureAmount.max,
                    ]
                  : [0, 1000000]
              }
              onValueChange={(values) =>
                onAmountRangeUpdate('foreclosureAmount', values)
              }
              min={0}
              max={1000000}
              step={1000}
              formatValue={(value) => `$${value.toLocaleString()}`}
              label='Foreclosure Amount Range'
            />
          </div>
        )}
      </div>
    </CardContent>
  );
}
