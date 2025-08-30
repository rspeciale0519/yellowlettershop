'use client';

import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { OptionsCriteria } from '@/types/list-builder';

interface AdditionalDataSectionProps {
  criteria: OptionsCriteria;
  onUpdate: (field: keyof OptionsCriteria['additionalData']) => void;
}

export function AdditionalDataSection({
  criteria,
  onUpdate,
}: AdditionalDataSectionProps) {
  return (
    <CardContent className='pt-0'>
      <div className='space-y-4'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Enhance your list with additional data points.
        </p>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label
              id='label-append-phone'
              htmlFor='append-phone'
              className='text-sm font-medium'
            >
              Append Phone Numbers
            </Label>
            <Switch
              id='append-phone'
              aria-labelledby='label-append-phone'
              checked={criteria.additionalData.appendPhoneNumbers}
              onCheckedChange={() => onUpdate('appendPhoneNumbers')}
            />{' '}
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='append-email' className='text-sm font-medium'>
              Append Email Addresses
            </Label>
            <Switch
              id='append-email'
              checked={criteria.additionalData.appendEmailAddresses}
              onCheckedChange={() => onUpdate('appendEmailAddresses')}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='append-property' className='text-sm font-medium'>
              Append Property Details
            </Label>
            <Switch
              id='append-property'
              checked={criteria.additionalData.appendPropertyDetails}
              onCheckedChange={() => onUpdate('appendPropertyDetails')}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='append-demographics'
              className='text-sm font-medium'
            >
              Append Demographics
            </Label>
            <Switch
              id='append-demographics'
              checked={criteria.additionalData.appendDemographics}
              onCheckedChange={() => onUpdate('appendDemographics')}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='append-lifestyle' className='text-sm font-medium'>
              Append Lifestyle Data
            </Label>
            <Switch
              id='append-lifestyle'
              checked={criteria.additionalData.appendLifestyleData}
              onCheckedChange={() => onUpdate('appendLifestyleData')}
            />
          </div>
        </div>
      </div>
    </CardContent>
  );
}
