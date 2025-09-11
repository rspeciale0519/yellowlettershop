'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { MailingHistorySectionProps } from './types';

export const MailingHistorySection = ({
  mailingHistoryFilter,
  onTypeChange,
  onDaysChange,
  onDateChange,
  isExpanded,
  onToggle,
}: MailingHistorySectionProps) => {
  return (
    <CollapsibleSection
      title='Mailing History'
      icon={Mail}
      isOpen={isExpanded}
      onToggle={onToggle}
      badge={mailingHistoryFilter ? 1 : undefined}
    >
      <div className='flex items-center gap-2'>
        <Select
          onValueChange={(value) =>
            onTypeChange(
              value as 'none' | 'in_last' | 'more_than' | 'not_mailed' | 'between_dates'
            )
          }
          value={mailingHistoryFilter?.type ?? 'none'}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select mailing history' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No mailing history filter</SelectItem>
            <SelectItem value='in_last'>Mailed in the last</SelectItem>
            <SelectItem value='more_than'>Mailed more than</SelectItem>
            <SelectItem value='not_mailed'>Not yet mailed</SelectItem>
            <SelectItem value='between_dates'>Mailed between dates</SelectItem>
          </SelectContent>
        </Select>
        {(mailingHistoryFilter?.type === 'in_last' ||
          mailingHistoryFilter?.type === 'more_than') && (
          <div className='flex items-center gap-2'>
            <Input
              type='number'
              value={mailingHistoryFilter?.days ?? ''}
              onChange={(e) => onDaysChange(e.target.value)}
              className='w-[100px]'
            />
            <span>days</span>
          </div>
        )}
        {mailingHistoryFilter?.type === 'between_dates' && (
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              value={mailingHistoryFilter?.startDate ?? ''}
              onChange={(e) =>
                onDateChange('startDate', e.target.value)
              }
            />
            <span>to</span>
            <Input
              type='date'
              value={mailingHistoryFilter?.endDate ?? ''}
              onChange={(e) =>
                onDateChange('endDate', e.target.value)
              }
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};