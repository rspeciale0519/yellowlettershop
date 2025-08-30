'use client';

import React, { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import type { GeographyCriteria } from '@/types/list-builder';

interface ZipCodeFilterProps {
  criteria: GeographyCriteria;
  onUpdate: (values: Partial<GeographyCriteria>) => void;
}

export function ZipCodeFilter({ criteria, onUpdate }: ZipCodeFilterProps) {
  const [zipInput, setZipInput] = useState('');
  const [zipRangeInput, setZipRangeInput] = useState('');

  const addZipCode = useCallback(() => {
    if (
      zipInput &&
      /^\d{5}$/.test(zipInput) &&
      !criteria.zipCodes.includes(zipInput)
    ) {
      onUpdate({ zipCodes: [...criteria.zipCodes, zipInput] });
      setZipInput('');
    }
  }, [zipInput, criteria.zipCodes, onUpdate]);

  const addZipRange = useCallback(() => {
    if (zipRangeInput) {
      // Parse comma-separated ZIP codes and ranges
      const zips = zipRangeInput
        .split(',')
        .map((z) => z.trim())
        .filter((z) => z);

      const expandedZips: string[] = [];

      for (const zip of zips) {
        if (/^\d{5}$/.test(zip)) {
          expandedZips.push(zip);
        } else if (/^\d{5}-\d{5}$/.test(zip)) {
          const [start, end] = zip.split('-').map(Number);
          // Only expand if the start is ≤ end and range size is reasonable
          if (start <= end && end - start <= 999) {
            for (let i = start; i <= end; i++) {
              expandedZips.push(i.toString().padStart(5, '0'));
            }
          }
        }
      }

      const newZips = [...new Set([...criteria.zipCodes, ...expandedZips])];
      onUpdate({ zipCodes: newZips });
      setZipRangeInput('');
    }
  }, [zipRangeInput, criteria.zipCodes, onUpdate]);
  const removeZipCode = useCallback(
    (zipToRemove: string) => {
      onUpdate({
        zipCodes: criteria.zipCodes.filter((zip) => zip !== zipToRemove),
      });
    },
    [criteria.zipCodes, onUpdate]
  );

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='zip-single'>Add Single ZIP Code</Label>
        <div className='flex gap-2'>
          <Input
            id='zip-single'
            placeholder='e.g., 90210'
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addZipCode()}
            maxLength={5}
            pattern='\d{5}'
          />
          <Button
            onClick={addZipCode}
            disabled={!zipInput || !/^\d{5}$/.test(zipInput)}
          >
            Add
          </Button>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='zip-range'>Add Multiple ZIP Codes or Ranges</Label>
        <div className='flex gap-2'>
          <Input
            id='zip-range'
            placeholder='e.g., 90210, 90211-90215, 91001'
            value={zipRangeInput}
            onChange={(e) => setZipRangeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addZipRange()}
          />
          <Button onClick={addZipRange} disabled={!zipRangeInput}>
            Add
          </Button>
        </div>
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          Separate multiple ZIP codes with commas. Use hyphens for ranges (e.g.,
          90210-90215).
        </p>
      </div>

      {criteria.zipCodes.length > 0 && (
        <div className='space-y-2'>
          <Label>Selected ZIP Codes ({criteria.zipCodes.length})</Label>
          <div className='flex flex-wrap gap-2 p-3 border rounded-md max-h-32 overflow-y-auto'>
            {criteria.zipCodes.map((zip) => (
              <Badge key={zip} variant='secondary'>
                {zip}
                <button
                  onClick={() => removeZipCode(zip)}
                  className='ml-1 rounded-full hover:bg-gray-400/20 p-0.5'
                  aria-label={`Remove ZIP ${zip}`}
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ZipRadiusSelectorProps {
  criteria: GeographyCriteria;
  onUpdate: (values: Partial<GeographyCriteria>) => void;
}

export function ZipRadiusSelector({
  criteria,
  onUpdate,
}: ZipRadiusSelectorProps) {
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('5');

  const addZipRadius = () => {
    if (zipCode && /^\d{5}$/.test(zipCode) && radius) {
      const newEntry = { zip: zipCode, radius: Number(radius) };
      const existing = criteria.zipRadius.find((zr) => zr.zip === zipCode);

      if (!existing) {
        onUpdate({ zipRadius: [...criteria.zipRadius, newEntry] });
        setZipCode('');
        setRadius('5');
      }
    }
  };

  const removeZipRadius = (zipToRemove: string) => {
    onUpdate({
      zipRadius: criteria.zipRadius.filter((zr) => zr.zip !== zipToRemove),
    });
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-3 gap-2'>
        <div className='col-span-2'>
          <Label htmlFor='zip-radius-code'>ZIP Code</Label>
          <Input
            id='zip-radius-code'
            placeholder='90210'
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
            pattern='\d{5}'
          />
        </div>
        <div>
          <Label htmlFor='radius-miles'>Radius (miles)</Label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => i + 1).map((mile) => (
                <SelectItem key={mile} value={mile.toString()}>
                  {mile} mile{mile !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={addZipRadius}
        disabled={!zipCode || !/^\d{5}$/.test(zipCode)}
        className='w-full'
      >
        Add ZIP + Radius
      </Button>

      {criteria.zipRadius.length > 0 && (
        <div className='space-y-2'>
          <Label>Selected ZIP + Radius Combinations</Label>
          <div className='space-y-2'>
            {criteria.zipRadius.map((zr, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 border rounded'
              >
                <span className='text-sm'>
                  {zr.zip} + {zr.radius} mile{zr.radius !== 1 ? 's' : ''}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeZipRadius(zr.zip)}
                  className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
