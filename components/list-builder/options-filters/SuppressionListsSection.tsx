'use client';

import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';
import type { OptionsCriteria } from '@/types/list-builder';

interface SuppressionListsSectionProps {
  criteria: OptionsCriteria;
  onToggle: (field: keyof OptionsCriteria['suppressionLists']) => void;
  onAddSuppressionFile: (filename: string) => void;
  onRemoveSuppressionFile: (index: number) => void;
}

export function SuppressionListsSection({
  criteria,
  onToggle,
  onAddSuppressionFile,
  onRemoveSuppressionFile,
}: SuppressionListsSectionProps) {
  const [newSuppressionFile, setNewSuppressionFile] = useState('');

  const handleAddFile = () => {
    if (newSuppressionFile.trim()) {
      onAddSuppressionFile(newSuppressionFile.trim());
      setNewSuppressionFile('');
    }
  };

  return (
    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Apply suppression lists to ensure compliance and avoid unwanted
          contacts.
        </p>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label
              htmlFor='national-do-not-mail'
              className='text-sm font-medium'
            >
              National Do Not Mail Registry
            </Label>
            <Switch
              id='national-do-not-mail'
              checked={criteria.suppressionLists.nationalDoNotMail}
              onCheckedChange={() => onToggle('nationalDoNotMail')}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='previous-mailings' className='text-sm font-medium'>
              Suppress Previous Mailings
            </Label>
            <Switch
              id='previous-mailings'
              checked={criteria.suppressionLists.previousMailings}
              onCheckedChange={() => onToggle('previousMailings')}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='competitors' className='text-sm font-medium'>
              Suppress Competitor Lists
            </Label>
            <Switch
              id='competitors'
              checked={criteria.suppressionLists.competitors}
              onCheckedChange={() => onToggle('competitors')}
            />
          </div>
        </div>

        <div className='space-y-3'>
          <Label
            htmlFor='custom-suppression-file'
            className='text-sm font-medium'
          >
            Custom Suppression Files
          </Label>
          <div className='flex gap-2'>
            <Input
              id='custom-suppression-file'
              placeholder='Upload or enter suppression file name'
              value={newSuppressionFile}
              onChange={(e) => setNewSuppressionFile(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                <button
                  type="button"
                  aria-label={`Remove ${file}`}
                  title={`Remove ${file}`}
                  onClick={() => onRemoveSuppressionFile(index)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>              type='button'
              variant='outline'
              size='sm'
              onClick={handleAddFile}
            >
              <Plus className='h-4 w-4' />
            </Button>
            <Button type='button' variant='outline' size='sm'>
              <Upload className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {criteria.suppressionLists.customSuppressionList.map(
              (file, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {file}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => onRemoveSuppressionFile(index)}
                  />
                </Badge>
              )
            )}
          </div>
        </div>
      </div>
    </CardContent>
  );
}
