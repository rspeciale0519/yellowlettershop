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

interface ForeclosureLegalSectionProps {
  criteria: ForeclosureCriteria;
  onCriteriaToggle: (criterion: string) => void;
  onUpdate: (updates: Partial<ForeclosureCriteria>) => void;
  onAddItem: (field: string, value: string) => void;
  onRemoveItem: (field: string, index: number) => void;
}

export function ForeclosureLegalSection({
  criteria,
  onCriteriaToggle,
  onUpdate,
  onAddItem,
  onRemoveItem,
}: ForeclosureLegalSectionProps) {
  const [newCaseNumber, setNewCaseNumber] = useState('');

  const noticeTypes = [
    'Notice of Default',
    'Lis Pendens',
    'Notice of Trustee Sale',
    'Notice of Foreclosure Sale',
    'Substitution of Trustee',
    'Assignment of Deed of Trust',
  ];

  const handleNoticeTypeToggle = (type: string) => {
    const currentTypes = Array.isArray(criteria.noticeTypes)
      ? criteria.noticeTypes
      : [];
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onUpdate({ noticeTypes: updatedTypes });
  };

  const handleAddCaseNumber = () => {
    const trimmed = newCaseNumber.trim();
    if (!trimmed) return;

    const existing = Array.isArray(criteria.caseNumbers)
      ? criteria.caseNumbers
      : [];
    if (existing.includes(trimmed)) {
      setNewCaseNumber('');
      return;
    }

    onAddItem('caseNumbers', trimmed);
    setNewCaseNumber('');
  };
  return (
    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='notice-types'
            checked={(criteria.selectedCriteria || []).includes('notice-types')}
            onCheckedChange={() => onCriteriaToggle('notice-types')}
          />
          <Label htmlFor='notice-types' className='font-medium'>
            Filter by Notice Types
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('notice-types') && (
          <div className='ml-6 space-y-2'>
            {noticeTypes.map((type) => (
              <div key={type} className='flex items-center space-x-2'>
                <Checkbox
                  id={`notice-${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  checked={(criteria.noticeTypes || []).includes(type)}
                  onCheckedChange={() => handleNoticeTypeToggle(type)}
                />
                <Label htmlFor={`notice-${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className='text-sm'>
                  {type}
                </Label>
              </div>
            ))}
          </div>
        )}

        <div className='flex items-center space-x-2'>
          <Checkbox
            id='case-numbers'
            checked={(criteria.selectedCriteria || []).includes('case-numbers')}
            onCheckedChange={() => onCriteriaToggle('case-numbers')}
          />
          <Label htmlFor='case-numbers' className='font-medium'>
            Filter by Case Numbers
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes('case-numbers') && (
          <div className='ml-6 space-y-3'>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter case number'
                value={newCaseNumber}
                onChange={(e) => setNewCaseNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCaseNumber();
                  }
                }}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddCaseNumber}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(criteria.caseNumbers || []).map((caseNum, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {caseNum}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveItem('caseNumbers', index)}
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
