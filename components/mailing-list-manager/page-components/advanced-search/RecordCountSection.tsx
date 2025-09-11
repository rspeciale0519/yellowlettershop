'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hash } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { RecordCountSectionProps } from './types';

export const RecordCountSection = ({
  recordCountFilter,
  onTypeChange,
  onValueChange,
  isExpanded,
  onToggle,
}: RecordCountSectionProps) => {
  return (
    <CollapsibleSection
      title='Record Count'
      icon={Hash}
      isOpen={isExpanded}
      onToggle={onToggle}
      badge={recordCountFilter ? 1 : undefined}
    >
      <div className='flex items-center gap-2'>
        <Select
          onValueChange={(value) =>
            onTypeChange(value as 'none' | 'top' | 'random' | 'range')
          }
          value={recordCountFilter?.type ?? 'none'}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No record count filter</SelectItem>
            <SelectItem value='top'>Top records</SelectItem>
            <SelectItem value='random'>Random selection</SelectItem>
            <SelectItem value='range'>Records range</SelectItem>
          </SelectContent>
        </Select>

        {(recordCountFilter?.type === 'top' ||
          recordCountFilter?.type === 'random') && (
          <Input
            type='number'
            value={recordCountFilter?.count ?? ''}
            onChange={(e) => onValueChange('count', e.target.value)}
            className='w-full'
            placeholder='Number of records'
          />
        )}

        {recordCountFilter?.type === 'range' && (
          <div className='flex items-center gap-2 w-full'>
            <Input
              type='number'
              value={recordCountFilter?.range?.[0] ?? ''}
              onChange={(e) => onValueChange('start', e.target.value)}
              className='w-full'
              placeholder='Start'
            />
            <span>to</span>
            <Input
              type='number'
              value={recordCountFilter?.range?.[1] ?? ''}
              onChange={(e) => onValueChange('end', e.target.value)}
              className='w-full'
              placeholder='End'
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};