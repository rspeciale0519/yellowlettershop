'use client';

import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { ForeclosureCriteria } from '@/types/list-builder';

interface ForeclosureStatusSectionProps {
  criteria: ForeclosureCriteria;
  onCriteriaToggle: (criterion: string) => void;
  onStatusToggle: (status: string) => void;
}

export function ForeclosureStatusSection({
  criteria,
  onCriteriaToggle,
  onStatusToggle,
}: ForeclosureStatusSectionProps) {
  // use FORECLOSURE_STATUSES defined at module scope
  return (
    <CardContent className='pt-0'>
      <div className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='foreclosure-status'
            checked={(criteria.selectedCriteria || []).includes(
              'foreclosure-status'
            )}
            onCheckedChange={() => onCriteriaToggle('foreclosure-status')}
          />
          <Label htmlFor='foreclosure-status' className='font-medium'>
            Filter by Foreclosure Status
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('foreclosure-status') && (
          <div className='ml-6 space-y-3'>
            <Label className='text-sm font-medium'>
              Select Foreclosure Statuses:
            </Label>
            <div className='grid grid-cols-2 gap-3'>
              {foreclosureStatuses.map((status) => (
                <div key={status} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`status-${status}`}
                    checked={(criteria.foreclosureStatus || []).includes(
                      status
                    )}
                    onCheckedChange={() => onStatusToggle(status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className='text-sm capitalize'
                  >
                    {status.replace(/-/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
}
