'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type FormatOption =
  | 'upper'
  | 'lower'
  | 'proper'
  | 'mixed'
  | 'clear'
  | 'clearAll';

interface FormatOptionsProps {
  formatOption: FormatOption;
  onFormatOptionChange: (option: FormatOption) => void;
  includeDeleted: boolean;
  onIncludeDeletedChange: (checked: boolean) => void;
  autoRun: boolean;
  onAutoRunChange: (checked: boolean) => void;
  autoClose: boolean;
  onAutoCloseChange: (checked: boolean) => void;
}
export function FormatOptions({
  formatOption,
  onFormatOptionChange,
  includeDeleted,
  onIncludeDeletedChange,
  autoRun,
  onAutoRunChange,
  autoClose,
  onAutoCloseChange,
}: FormatOptionsProps) {
  return (
    <div className='flex-1 overflow-hidden'>
      <div className='mb-4'>
        <Label className='text-base font-medium'>Format Options</Label>
        <p className='text-sm text-muted-foreground mb-2'>
          Select the formatting option to apply to the selected fields.
        </p>
      </div>

      <RadioGroup
        value={formatOption}
        onValueChange={onFormatOptionChange}
        className='space-y-2'
      >
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='upper' id='upper' />
          <Label htmlFor='upper'>Upper (ALL CAPS)</Label>
        </div>

        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='lower' id='lower' />
          <Label htmlFor='lower'>Lower (all lowercase)</Label>
        </div>

        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='proper' id='proper' />
          <Label htmlFor='proper'>
            Proper Case (First Letter Of Each Word)
          </Label>
        </div>

        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='mixed' id='mixed' />
          <Label htmlFor='mixed'>Mixed Case (First letter of sentence)</Label>
        </div>

        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='clear' id='clear' />
          <Label htmlFor='clear'>Clear (Empty field)</Label>
        </div>

        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='clearAll' id='clearAll' />
          <Label htmlFor='clearAll'>Clear All (Empty all fields)</Label>
        </div>
      </RadioGroup>

      <div className='mt-8'>
        <div className='flex items-center space-x-2 mb-4'>
          <Checkbox
            id='include-deleted'
            checked={includeDeleted}
            onCheckedChange={(checked) =>
              onIncludeDeletedChange(checked === true)
            }
          />
          <Label htmlFor='include-deleted'>Include Deleted</Label>
        </div>

        <div className='flex items-center space-x-2 mb-4'>
          <Checkbox
            id='auto-run'
            checked={autoRun}
            onCheckedChange={(checked) => onAutoRunChange(checked === true)}
          />
          <Label htmlFor='auto-run'>Auto Run</Label>
        </div>

        <div className='flex items-center space-x-2'>
          <Checkbox
            id='auto-close'
            checked={autoClose}
            onCheckedChange={(checked) => onAutoCloseChange(checked === true)}
          />
          <Label htmlFor='auto-close'>Auto Close</Label>
        </div>
      </div>
    </div>
  );
}
