'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, Settings } from 'lucide-react';
import type { PropertyCriteria } from '@/types/list-builder';
import type { ReactNode } from 'react';

interface PropertyRangeSectionProps {
  title: string;
  description: string;
  field: keyof PropertyCriteria;
  criteria: PropertyCriteria;
  onUpdate: (field: keyof PropertyCriteria, value: number[]) => void;
  formatValue: (value: number) => string;
  min: number;
  max: number;
  step: number;
  customRange: [number, number] | null;
  onCustomRangeInput: (
    field: keyof PropertyCriteria,
    value: [number, number] | null
  ) => void;
  onApplyCustomRange: (field: keyof PropertyCriteria) => void;
  expanded: boolean;
  onToggle: () => void;
  icon: ReactNode;
  helpText: string;
  residentialOnly?: boolean;
}

export function PropertyRangeSection({
  title,
  description,
  field,
  criteria,
  onUpdate,
  formatValue,
  min,
  max,
  step,
  customRange,
  onCustomRangeInput,
  onApplyCustomRange,
  expanded,
  onToggle,
  icon,
  helpText,
  residentialOnly,
}: PropertyRangeSectionProps) {
  const currentValue = criteria[field] || [min, max];
  const currentMin = currentValue[0];
  const currentMax = currentValue[1];

  const handleSliderChange = (value: number[]) => {
    onUpdate(field, value);
  };

  const handleCustomMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseFloat(e.target.value) || min;
    onCustomRangeInput(field, [newMin, customRange?.[1] ?? max]);
  };

  const handleCustomMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseFloat(e.target.value) || max;
    onCustomRangeInput(field, [customRange?.[0] ?? min, newMax]);
  };

  const handleApplyCustomRange = () => {
    onApplyCustomRange(field);
    setShowCustomInput(false);
  };

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant='ghost'
          className='w-full justify-between p-4 h-auto hover:bg-gray-50'
        >
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              {icon}
              <div className='text-left'>
                <div className='font-medium'>{title}</div>
                <div className='text-sm text-gray-500'>{description}</div>
                <div className='text-xs text-gray-400'>
                  {formatValue(currentMin)} - {formatValue(currentMax)}
                </div>
              </div>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='px-4 pb-4'>
        <div className='space-y-4 mt-4'>
          <div className='px-2'>
            <Slider
              value={currentValue}
              onValueChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              className='w-full'
            />
          </div>

          <div className='flex items-center justify-between text-sm text-gray-600'>
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowCustomInput(!showCustomInput)}
              className='flex items-center gap-1'
            >
              <Settings className='h-3 w-3' />
              Custom Range
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='text-xs text-gray-500 cursor-help'>ⓘ</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {showCustomInput && (
            <div className='space-y-3 p-3 bg-gray-50 rounded-lg'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label htmlFor={`${field}-min`} className='text-xs'>
                    Min
                  </Label>
                  <Input
                    id={`${field}-min`}
                    type='number'
                    value={customRange?.[0] ?? currentMin}
                    onChange={handleCustomMinChange}
                    min={min}
                    max={max}
                    step={step}
                    className='text-sm'
                  />
                </div>
                <div>
                  <Label htmlFor={`${field}-max`} className='text-xs'>
                    Max
                  </Label>
                  <Input
                    id={`${field}-max`}
                    type='number'
                    value={customRange?.[1] ?? currentMax}
                    onChange={handleCustomMaxChange}
                    min={min}
                    max={max}
                    step={step}
                    className='text-sm'
                  />
                </div>
              </div>
              <Button
                size='sm'
                onClick={handleApplyCustomRange}
                className='w-full'
                disabled={!customRange}
              >
                Apply Custom Range
              </Button>
            </div>
          )}

          {residentialOnly && (
            <div className='text-xs text-amber-600 bg-amber-50 p-2 rounded'>
              This filter applies only to residential properties
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
