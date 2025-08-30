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

type CriterionKey = 'lender-names' | 'current-owners' | 'trustee-names';
type FieldKey = 'lenderNames' | 'currentOwners' | 'trusteeNames';

interface ForeclosurePartiesSectionProps {
  criteria: ForeclosureCriteria;
  onCriteriaToggle: (criterion: CriterionKey) => void;
  onAddItem: (field: FieldKey, value: string) => void;
  onRemoveItem: (field: FieldKey, index: number) => void;
}
export function ForeclosurePartiesSection({
  criteria,
  onCriteriaToggle,
  onAddItem,
  onRemoveItem,
}: ForeclosurePartiesSectionProps) {
  const [newLender, setNewLender] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newTrustee, setNewTrustee] = useState('');

  const handleAdd = (field: FieldKey, value: string, setter: (value: string) => void) => {
    const v = value.trim();
    if (!v) return;

    const listMap: Record<FieldKey, readonly string[]> = {
      lenderNames: criteria.lenderNames ?? [],
      currentOwners: criteria.currentOwners ?? [],
      trusteeNames: criteria.trusteeNames ?? [],
    };

    // Prevent case-insensitive duplicates
    if (listMap[field].some((s) => s.toLowerCase() === v.toLowerCase())) {
      setter('');
      return;
    }

    onAddItem(field, v);
    setter('');
  };

  return (
    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='lender-names'
            checked={(criteria.selectedCriteria || []).includes('lender-names')}
            onCheckedChange={() => onCriteriaToggle('lender-names')}
          />
          <Label htmlFor='lender-names' className='font-medium'>
            Filter by Lender Names
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('lender-names') && (
          <div className='ml-6 space-y-3'>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter lender name'
                value={newLender}
                onChange={(e) => setNewLender(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  handleAdd('lenderNames', newLender, setNewLender)
                }
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  handleAdd('lenderNames', newLender, setNewLender)
                }
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(criteria.lenderNames || []).map((lender, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {lender}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveItem('lenderNames', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className='flex items-center space-x-2'>
          <Checkbox
            id='current-owners'
            checked={(criteria.selectedCriteria || []).includes(
              'current-owners'
            )}
            onCheckedChange={() => onCriteriaToggle('current-owners')}
          />
          <Label htmlFor='current-owners' className='font-medium'>
            Filter by Current Owners
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('current-owners') && (
          <div className='ml-6 space-y-3'>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter owner name'
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  handleAdd('currentOwners', newOwner, setNewOwner)
                }
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  handleAdd('currentOwners', newOwner, setNewOwner)
                }
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(criteria.currentOwners || []).map((owner, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {owner}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveItem('currentOwners', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className='flex items-center space-x-2'>
          <Checkbox
            id='trustee-names'
            checked={(criteria.selectedCriteria || []).includes(
              'trustee-names'
            )}
            onCheckedChange={() => onCriteriaToggle('trustee-names')}
          />
          <Label htmlFor='trustee-names' className='font-medium'>
            Filter by Trustee Names
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('trustee-names') && (
          <div className='ml-6 space-y-3'>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter trustee name'
                value={newTrustee}
                onChange={(e) => setNewTrustee(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  handleAdd('trusteeNames', newTrustee, setNewTrustee)
                }
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  handleAdd('trusteeNames', newTrustee, setNewTrustee)
                }
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(criteria.trusteeNames || []).map((trustee, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {trustee}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveItem('trusteeNames', index)}
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
