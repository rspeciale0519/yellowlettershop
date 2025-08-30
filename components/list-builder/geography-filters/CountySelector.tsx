'use client';

import React, { useId, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { US_STATES } from './constants';

// Define the type for a US state
type USState = (typeof US_STATES)[number];

// Define the props for the component
interface StateCountySelectorProps {
  selectedState?: USState;
  onStateChange: (state?: USState) => void;
  selectedCounty?: string;
  onCountyChange: (county?: string) => void;
  showCounty?: boolean;
}

export function StateCountySelector({
  selectedState,
  onStateChange,
  selectedCounty,
  onCountyChange,
  showCounty = false,
}: StateCountySelectorProps) {
  const stateId = useId();
  const countyId = useId();

  const handleStateChange = (value: string) => {
    const nextState = value as USState;
    if (selectedCounty) onCountyChange(undefined);
    onStateChange(nextState);
  };

  // Mock county data - in real app, this would be fetched based on state
  const counties = useMemo(
    () => (selectedState ? ['County A', 'County B', 'County C'] : []),
    [selectedState]
  );

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor={stateId}>Select State</Label>
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger id={stateId}>
            <SelectValue placeholder='Choose a state...' />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCounty && selectedState && (
        <div className='space-y-2'>
          <Label htmlFor={countyId}>Select County</Label>
          <Select value={selectedCounty} onValueChange={onCountyChange}>
            <SelectTrigger id={countyId}>
              <SelectValue placeholder='Choose a county...' />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
