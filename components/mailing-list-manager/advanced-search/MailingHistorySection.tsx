'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MailingHistoryFilter, MailingHistoryOperator } from './types';

interface MailingHistorySectionProps {
  mailingHistoryFilter: MailingHistoryFilter | null;
  onSetMailingHistoryFilter: (filter: MailingHistoryFilter | null) => void;
}

export function MailingHistorySection({
  mailingHistoryFilter,
  onSetMailingHistoryFilter,
}: MailingHistorySectionProps) {
  const handleOperatorChange = (value: MailingHistoryOperator | '') => {
    if (!value) {
      onSetMailingHistoryFilter(null);
      return;
    }

    const operator = value as MailingHistoryOperator;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `mailing-${crypto.randomUUID()}`
        : `mailing-${Date.now()}`;

    if (operator === 'notMailed') {
      // NOTE: Ensure MailingHistoryFilter types allow omitting `value` for this operator.
      onSetMailingHistoryFilter({ id, operator } as MailingHistoryFilter);
      return;
    }
  const handleValueChange = (value: number) => {
    if (!mailingHistoryFilter) return
    const n = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
    onSetMailingHistoryFilter({ ...mailingHistoryFilter, value: n })
  }    }

    onSetMailingHistoryFilter({ id, operator, value: defaultValue });
  };
  const handleValueChange = (value: number) => {
    if (!mailingHistoryFilter) return;
    onSetMailingHistoryFilter({
      ...mailingHistoryFilter,
      value,
    });
  };

  const handleDateRangeChange = (
    range: { from: Date; to: Date } | undefined
  ) => {
    if (!mailingHistoryFilter || !range?.from || !range?.to) return;
    onSetMailingHistoryFilter({
      ...mailingHistoryFilter,
      value: [range.from, range.to],
    });
  };

  return (
    <div className='flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors'>
      <h3 className='text-base font-semibold mb-2'>Mailing History</h3>
      <p className='text-sm text-muted-foreground mb-3'>
        Find records based on when they were last mailed.
      </p>
      <div className='space-y-4'>
        <RadioGroup
          value={mailingHistoryFilter?.operator || ''}
          onValueChange={handleOperatorChange}
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='' id='mailing-none' />
            <Label htmlFor='mailing-none'>No mailing history filter</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='mailedInLast' id='mailing-in-last' />
            <Label htmlFor='mailing-in-last'>Mailed in the last</Label>
            {mailingHistoryFilter?.operator === 'mailedInLast' && (
              <div className='flex items-center gap-2 ml-2'>
                <Input
                  type='number'
                  min='1'
                  className='w-20'
                  value={mailingHistoryFilter.value as number}
                  onChange={(e) => handleValueChange(Number(e.target.value))}
                />
                <span>days</span>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='mailedMoreThan' id='mailing-more-than' />
            <Label htmlFor='mailing-more-than'>Mailed more than</Label>
            {mailingHistoryFilter?.operator === 'mailedMoreThan' && (
              <div className='flex items-center gap-2 ml-2'>
                <Input
                  type='number'
                  min='1'
                  className='w-20'
                  value={mailingHistoryFilter.value as number}
                  onChange={(e) => handleValueChange(Number(e.target.value))}
                />
                <span>days ago</span>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='notMailed' id='not-mailed' />
            <Label htmlFor='not-mailed'>Not yet mailed</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='mailedBetween' id='mailed-between' />
            <Label htmlFor='mailed-between'>
              Mailed between specific dates
            </Label>
          </div>
        </RadioGroup>

        {mailingHistoryFilter?.operator === 'mailedBetween' && (
          <div className='mt-4'>
            <Label className='mb-2 block'>Select date range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !mailingHistoryFilter.value && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {Array.isArray(mailingHistoryFilter.value) ? (
                    <>
                      {format(mailingHistoryFilter.value[0], 'LLL dd, y')} -{' '}
                      {format(mailingHistoryFilter.value[1], 'LLL dd, y')}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='range'
                  selected={{
                    from: Array.isArray(mailingHistoryFilter.value)
                      ? mailingHistoryFilter.value[0]
                      : undefined,
                    to: Array.isArray(mailingHistoryFilter.value)
                      ? mailingHistoryFilter.value[1]
                      : undefined,
                  }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
