'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RecordCountFilter, RecordCountOperator } from './types';

interface RecordCountSectionProps {
  recordCountFilter: RecordCountFilter | null;
  onSetRecordCountFilter: (filter: RecordCountFilter | null) => void;
}

export function RecordCountSection({
  recordCountFilter,
  onSetRecordCountFilter,
}: RecordCountSectionProps) {
  const handleOperatorChange = (value: string) => {
    if (!value) {
      onSetRecordCountFilter(null);
      return;
    }

    const operator = value as RecordCountOperator;

    let defaultValue: number | [number, number] = 100;
    if (operator === 'recordRange') {
      defaultValue = [1, 100];
    }

    onSetRecordCountFilter({
      operator,
      value: defaultValue,
    });
  };

  const handleValueChange = (value: number) => {
    if (!recordCountFilter) return;
    if (!Number.isInteger(value) || value < 1) return;

    onSetRecordCountFilter({
      ...recordCountFilter,
      value,
    });
  };

  const handleRangeChange = (index: 0 | 1, value: number) => {
    if (!recordCountFilter) return;
    if (!Number.isInteger(value) || value < 1) return;

    const currentValue = Array.isArray(recordCountFilter.value)
      ? recordCountFilter.value
      : [1, 100];
    const newValue: [number, number] = [...currentValue] as [number, number];
    newValue[index] = value;

    if (index === 0 && newValue[0] > newValue[1]) {
      newValue[1] = newValue[0];
    } else if (index === 1 && newValue[1] < newValue[0]) {
      newValue[0] = newValue[1];
    }

    onSetRecordCountFilter({
      ...recordCountFilter,
      value: newValue,
    });
  };

  return (
    <div className='flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors'>
      <h3 className='text-base font-semibold mb-2'>Record Count Filters</h3>
      <p className='text-sm text-muted-foreground mb-3'>
        Limit results to a specific number of records.
      </p>
      <div className='space-y-4'>
        <RadioGroup
          value={recordCountFilter?.operator || ''}
          onValueChange={handleOperatorChange}
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='' id='count-none' />
            <Label htmlFor='count-none'>No record count filter</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='topRecords' id='top-records' />
            <Label htmlFor='top-records'>Top records</Label>
            {recordCountFilter?.operator === 'topRecords' && (
              <div className='flex items-center gap-2 ml-2'>
                <Input
                  type='number'
                  min='1'
                  className='w-20'
                  value={recordCountFilter.value as number}
                  onChange={(e) => handleValueChange(Number(e.target.value))}
                />
                <span>records</span>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='randomRecords' id='random-records' />
            <Label htmlFor='random-records'>Random selection</Label>
            {recordCountFilter?.operator === 'randomRecords' && (
              <div className='flex items-center gap-2 ml-2'>
                <Input
                  type='number'
                  min='1'
                  className='w-20'
                  value={recordCountFilter.value as number}
                  onChange={(e) => handleValueChange(Number(e.target.value))}
                />
                <span>records</span>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='recordRange' id='record-range' />
            <Label htmlFor='record-range'>Record range</Label>
          </div>
        </RadioGroup>

        {recordCountFilter?.operator === 'recordRange' && (
          <div className='mt-4'>
            <Label className='mb-2 block'>Select record range</Label>
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                min='1'
                className='w-20'
                value={
                  Array.isArray(recordCountFilter.value)
                    ? recordCountFilter.value[0]
                    : 1
                }
                onChange={(e) => handleRangeChange(0, Number(e.target.value))}
                placeholder='From'
              />
              <span>to</span>
              <Input
                type='number'
                min='1'
                className='w-20'
                value={
                  Array.isArray(recordCountFilter.value)
                    ? recordCountFilter.value[1]
                    : 100
                }
                onChange={(e) => handleRangeChange(1, Number(e.target.value))}
                placeholder='To'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
