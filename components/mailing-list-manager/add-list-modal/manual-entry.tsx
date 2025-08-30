'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface ManualRecord {
  id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}
interface ManualEntryProps {
  manualRecords: ManualRecord[]
  onAddRecord: () => void
  onRemoveRecord: (index: number) => void
  onRecordChange: (index: number, field: keyof ManualRecord, value: string) => void
}
}

export function ManualEntry({
  manualRecords,
  onAddRecord,
  onRemoveRecord,
  onRecordChange,
}: ManualEntryProps) {
  return (
    <div className='space-y-4 pt-4'>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='font-medium'>Manual Record Entry</h3>
          <Button variant='outline' size='sm' onClick={onAddRecord}>
            <Plus className='h-4 w-4 mr-2' />
            Add Record
        {manualRecords.map((record, index) => (
          <div key={record.id ?? index} className="border rounded-md p-4 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onRemoveRecord(index)}
              disabled={manualRecords.length === 1}
              aria-label={`Remove record ${index + 1}`}
              title="Remove record"
            >
              <X className="h-4 w-4" />
            </Button>
              variant='ghost'
              size='sm'
              className='absolute top-2 right-2'
              onClick={() => onRemoveRecord(index)}
              disabled={manualRecords.length === 1}
            >
              <X className='h-4 w-4' />
            </Button>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor={`firstName-${index}`} className='text-sm'>
                  First Name
                </Label>
                <Input
                  id={`firstName-${index}`}
                  value={record.firstName}
                  onChange={(e) =>
                    onRecordChange(index, 'firstName', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
              <div>
                <Label htmlFor={`lastName-${index}`} className='text-sm'>
                  Last Name
                </Label>
                <Input
                  id={`lastName-${index}`}
                  value={record.lastName}
                  onChange={(e) =>
                    onRecordChange(index, 'lastName', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
              <div>
                <Label htmlFor={`address-${index}`} className='text-sm'>
                  Address
                </Label>
                <Input
                  id={`address-${index}`}
                  value={record.address}
                  onChange={(e) =>
                    onRecordChange(index, 'address', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
              <div>
                <Label htmlFor={`city-${index}`} className='text-sm'>
                  City
                </Label>
                <Input
                  id={`city-${index}`}
                  value={record.city}
                  onChange={(e) =>
                    onRecordChange(index, 'city', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
              <div>
                <Label htmlFor={`state-${index}`} className='text-sm'>
                  State
                </Label>
                <Input
                  id={`state-${index}`}
                  value={record.state}
                  onChange={(e) =>
                    onRecordChange(index, 'state', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
              <div>
                <Label htmlFor={`zipCode-${index}`} className='text-sm'>
                  Zip Code
                </Label>
                <Input
                  id={`zipCode-${index}`}
                  value={record.zipCode}
                  onChange={(e) =>
                    onRecordChange(index, 'zipCode', e.target.value)
                  }
                  className='mt-1'
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
