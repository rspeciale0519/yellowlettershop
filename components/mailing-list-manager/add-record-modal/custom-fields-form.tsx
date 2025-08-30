'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { CustomField } from './types';

interface CustomFieldsFormProps {
  customFieldDefinitions: CustomField[];
  customFields: Record<string, any>;
  errors: Record<string, string>;
  onCustomFieldChange: (field: string, value: any) => void;
}

export function CustomFieldsForm({
  customFieldDefinitions,
  customFields,
  errors,
  onCustomFieldChange,
}: CustomFieldsFormProps) {
  if (customFieldDefinitions.length === 0) {
    return null;
  }

  return (
    <div className='space-y-4 mt-0'>
      <div className='border rounded-md p-4'>
        <h4 className='font-medium mb-4'>Additional Fields</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {customFieldDefinitions.map((field) => {
            const rawValue = customFields[field.id as string];
            const error = errors[field.id as string];
            switch (field.type) {
              case 'text':
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.name}</Label>
                    <Input
                      id={field.id}
                      value={value}
                      onChange={(e) =>
                        onCustomFieldChange(field.id, e.target.value)
                      }
                      className='mt-1'
                      placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                    {error && (
                      <p className='text-sm text-destructive mt-1'>{error}</p>
                    )}
                  </div>
                );

              case 'number':
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.name}</Label>
                    <Input
                      id={field.id}
                      type='number'
                      value={value}
                      onChange={(e) =>
                        onCustomFieldChange(field.id, e.target.value)
                      }
                      className='mt-1'
                      placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                    {error && (
                      <p className='text-sm text-destructive mt-1'>{error}</p>
                    )}
                  </div>
                );

              case 'select':
                return (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.name}</Label>
                    <Select
                      value={value}
                      onValueChange={(val) =>
                        onCustomFieldChange(field.id, val)
                      }
                    >
                      <SelectTrigger className='mt-1'>
                        <SelectValue
                          placeholder={`Select ${field.name.toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {error && (
                      <p className='text-sm text-destructive mt-1'>{error}</p>
                    )}
                  </div>
                );

              case 'checkbox':
                return (
                  <div
                    key={field.id}
                    className='flex items-center space-x-2 mt-4'
                  >
                    <Checkbox
                      id={field.id}
                      checked={value || false}
                      onCheckedChange={(checked) =>
                        onCustomFieldChange(field.id, checked)
                      }
                    />
                    <Label htmlFor={field.id} className='cursor-pointer'>
                      {field.name}
                    </Label>
                    {error && (
                      <p className='text-sm text-destructive mt-1'>{error}</p>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}
