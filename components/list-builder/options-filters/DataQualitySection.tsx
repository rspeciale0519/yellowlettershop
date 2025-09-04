'use client';

import { CardContent } from '@/components/ui/card';
import { useId } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DraggableSlider } from '@/components/list-builder/common/DraggableSlider';
import type { OptionsCriteria } from '@/types/list-builder';
type DataQualityField = keyof OptionsCriteria['dataQuality'];

interface DataQualitySectionProps {
  criteria: OptionsCriteria;
  onToggle: (field: DataQualityField, value: boolean) => void;
  onConfidenceScoreChange: (values: [number, number]) => void;
}

export function DataQualitySection({
  criteria,
  onToggle,
  onConfidenceScoreChange,
}: DataQualitySectionProps) {
  return (
    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Set data quality requirements for your mailing list.
        </p>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='require-phone' className='text-sm font-medium'>
              Require Phone Numbers
            </Label>
            <Switch
              id='require-phone'
              checked={criteria.dataQuality.requirePhoneNumbers}
              onCheckedChange={(checked) => onToggle('requirePhoneNumbers', checked)}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='require-email' className='text-sm font-medium'>
              Require Email Addresses
            </Label>
            <Switch
              id='require-email'
              checked={criteria.dataQuality.requireEmailAddresses}
              onCheckedChange={(checked) => onToggle('requireEmailAddresses', checked)}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='require-complete-address'
              className='text-sm font-medium'
            >
              Require Complete Addresses
            </Label>
            <Switch
              id='require-complete-address'
              checked={criteria.dataQuality.requireCompleteAddresses}
              onCheckedChange={(checked) => onToggle('requireCompleteAddresses', checked)}
            />
          </div>
        </div>

        <div className='space-y-3'>
          <DraggableSlider
            value={[criteria.dataQuality.minimumConfidenceScore, 100]}
            onValueChange={onConfidenceScoreChange}
            min={0}
            max={100}
            step={5}
            formatValue={(value) => `${value}%`}
            label='Minimum Data Confidence Score'
          />
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Higher confidence scores mean more accurate data but fewer records.
          </p>
        </div>
      </div>
    </CardContent>
  );
}
