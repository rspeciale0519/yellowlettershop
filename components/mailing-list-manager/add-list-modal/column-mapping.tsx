'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import type { ColumnMapping, PredefinedField } from './types';
import { PREDEFINED_FIELDS } from './types';

import type { ColumnMapping, PredefinedField } from './types';

type FieldId = 'custom' | 'keep' | 'ignore' | PredefinedField['id'];

interface ColumnMappingProps {
  previewData: string[][];
  columnMappings: Record<string, ColumnMapping>;
  customFieldNames: Record<string, string>;
  onFieldTypeChange: (header: string, fieldId: FieldId) => void;
  onCustomFieldNameChange: (header: string, value: string) => void;
}

export function ColumnMappingSection({
  previewData,
  columnMappings,
  customFieldNames,
  onFieldTypeChange,
  onCustomFieldNameChange,
}: ColumnMappingProps) {
  if (!previewData[0]) return null;

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-medium mb-2'>Column Mapping</h3>
            const defaultMapping: ColumnMapping = {
              fieldId: "custom",
              customName: header,
            }
            const mapping: ColumnMapping = columnMappings[header] ?? defaultMapping
          <div className='bg-muted px-4 py-2 flex'>
            <div className='w-1/2 font-medium text-sm'>
              Uploaded Column Headers
            </div>
            <div className='w-1/2 font-medium text-sm'>
              Map To Predefined Fields
            </div>
          </div>

          {previewData[0].map((header, index) => {
            const mapping = columnMappings[header] || {
              fieldId: 'custom',
              customName: header,
            };

            // Determine if this was an automatic match
            const isAutoMatched =
              mapping.fieldId !== 'custom' &&
              mapping.fieldId !== 'keep' &&
              mapping.fieldId !== 'ignore' &&
              mapping.confidence &&
              mapping.confidence >= 70;

            return (
              <div key={index} className='flex border-t px-4 py-3 items-center'>
                {/* Left column - Uploaded header */}
                <div className='w-1/2 pr-4'>
                  <div className='font-medium'>{header}</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    Sample: {previewData[1]?.[index] || ''}
                  </div>
                </div>

                {/* Right column - Mapping options */}
                <div className='w-1/2'>
                  <div className='flex items-center'>
                    <div className='w-[calc(100%-2.5rem)]'>
                      <Select
                        value={mapping.fieldId}
                        onValueChange={(value) =>
                          onFieldTypeChange(header, value)
                        }
                      >
                        <SelectTrigger
                          id={`field-type-${index}`}
                          className={`w-full ${
                            isAutoMatched ? 'border-primary' : ''
                          }`}
                        >
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='custom'>
                            Use Custom Field Name
                          </SelectItem>
                          <SelectItem value='keep'>
                            Keep Original Name
                          </SelectItem>
                          <SelectItem value='ignore'>
                            Exclude This Column
                          </SelectItem>
                          <SelectSeparator />
                          {PREDEFINED_FIELDS.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='w-10 flex justify-center'>
                      {isAutoMatched ? (
                        <div
                          className='flex items-center'
                          title={`Auto-matched with ${mapping.confidence?.toFixed(
                            0
                          )}% confidence`}
                        >
                          <CheckCircle2 className='h-5 w-5 text-primary' />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {mapping.fieldId === 'custom' && (
                    <div className='mt-2'>
                      <Input
                        value={customFieldNames[header] || ''}
                        onChange={(e) =>
                          onCustomFieldNameChange(header, e.target.value)
                        }
                        placeholder='Enter custom field name'
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
