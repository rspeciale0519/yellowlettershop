'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ListSelectorProps {
  listOption: 'existing' | 'new';
  selectedListId: string;
  newListName: string;
  lists: any[] | undefined;
  errors: Record<string, string>;
  onListOptionChange: (option: 'existing' | 'new') => void;
  onListChange: (listId: string) => void;
  onNewListNameChange: (name: string) => void;
}

export function ListSelector({
  listOption,
  selectedListId,
  newListName,
  lists,
  errors,
  onListOptionChange,
  onListChange,
  onNewListNameChange,
}: ListSelectorProps) {
  return (
    <div className='space-y-4'>
      <div>
        <Label id='list-selector-label' className='mb-2 block'>
          Select Mailing List
        </Label>
        <RadioGroup
          aria-labelledby='list-selector-label'
          value={listOption}
          onValueChange={(value) => {
            if (value === 'existing' || value === 'new')
              onListOptionChange(value);
          }}
          className='flex flex-row flex-wrap gap-x-6 gap-y-2'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='existing' id='existing-list' />
            <Label htmlFor='existing-list' className='font-normal'>
              Use existing list
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='new' id='new-list' />
            <Label htmlFor='new-list' className='font-normal'>
              Create new list
            </Label>
          </div>
        </RadioGroup>
      </div>

      {listOption === 'existing' ? (
        <div>
          <Label htmlFor='list-select'>Select a mailing list</Label>
          <Select
            value={selectedListId}
            onValueChange={onListChange}
            disabled={!lists || lists.length === 0}
          >
            <SelectTrigger id='list-select' className='mt-1'>
              <SelectValue placeholder='Select a mailing list' />
            </SelectTrigger>
            <SelectContent>
              {lists?.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name} ({list.recordCount.toLocaleString()} records)
                </SelectItem>
              ))}
              {(!lists || lists.length === 0) && (
                <div className='px-2 py-4 text-center text-muted-foreground'>
                  No mailing lists available
                </div>
              )}
            </SelectContent>
          </Select>
          {errors.selectedListId && (
            <p className='text-sm text-destructive mt-1'>
              {errors.selectedListId}
            </p>
          )}
        </div>
      ) : (
        <div>
          <Label htmlFor='new-list-name'>New list name</Label>
          <Input
            id='new-list-name'
            value={newListName}
            onChange={(e) => onNewListNameChange(e.target.value)}
            placeholder='e.g., New York Leads 2025'
            className='mt-1'
          />
          {errors.newListName && (
            <p className='text-sm text-destructive mt-1'>
              {errors.newListName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
