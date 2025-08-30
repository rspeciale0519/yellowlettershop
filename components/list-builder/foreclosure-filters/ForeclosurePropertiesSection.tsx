'use client';

import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { ForeclosureCriteria } from '@/types/list-builder';

interface ForeclosurePropertiesSectionProps {
  criteria: ForeclosureCriteria;
  onCriteriaToggle: (criterion: 'property-addresses') => void;
  onAddItem: (field: 'propertyAddresses', value: string) => void;
  onRemoveItem: (field: 'propertyAddresses', index: number) => void;
}
export function ForeclosurePropertiesSection({
  criteria,
  onCriteriaToggle,
  onAddItem,
  onRemoveItem,
}: ForeclosurePropertiesSectionProps) {
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (newAddress.trim()) {
      onAddItem('propertyAddresses', newAddress.trim());
      setNewAddress('');
    }
  };

  return (
    <CardContent className='pt-0'>
      <div className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='property-addresses'
            checked={(criteria.selectedCriteria || []).includes(
              'property-addresses'
            )}
            onCheckedChange={() => onCriteriaToggle('property-addresses')}
          />
          <Label htmlFor='property-addresses' className='font-medium'>
            Filter by Property Addresses
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('property-addresses') && (
          <div className='ml-6 space-y-3'>
            <div className='flex gap-2'>
              <Input
                id="new-property-address"
                placeholder="Enter property address"
                aria-label="Property address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAdd}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(criteria.propertyAddresses || []).map((address, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {address}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveItem('propertyAddresses', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
}
