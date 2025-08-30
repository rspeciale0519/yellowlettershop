'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldSelection } from './FieldSelection';
import { FormatOptions } from './FormatOptions';
import { DictionarySection } from './DictionarySection';
import type { ColumnDef } from '../customizable-table';

interface FormatDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  onApplyFormat: (options: ApplyFormatOptions) => void;
  title?: string;
  description?: string;
  applyLabel?: string;
}

type RecordSelection = 'all' | 'range' | 'next' | 'rest' | 'record';

interface RecordRange {
  from: string;
  to: string;
  next: string;
  rest: string;
  record: string;
}

interface ApplyFormatOptions {
  columns: string[];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [formatOption, setFormatOption] = useState<string>('upper')
- const [recordSelection, setRecordSelection] = useState<string>('all')
 const [recordSelection, setRecordSelection] = useState<RecordSelection>('all')
 const [recordRange, setRecordRange] = useState<RecordRange>({
    from: '1',
    to: '100',
    next: '1',
    rest: '1',
    record: '1',
  })export type { FormatDataModalProps };
interface DictionaryEntry {
  search: string;
  replace: string;
}

export function FormatDataModal({
  open,
  onOpenChange,
  columns,
  onApplyFormat,
  title = 'Format Data',
  description = 'Apply text formatting to selected columns and records.',
}: FormatDataModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [formatOption, setFormatOption] = useState<string>('upper');
  const [recordSelection, setRecordSelection] = useState<string>('all');
  const [recordRange, setRecordRange] = useState({
    from: '1',
  const addDictionaryEntry = () => {
    setDictionaryEntries((prev) => [...prev, { search: '', replace: '' }])
  }

  const removeDictionaryEntry = (index: number) => {
    setDictionaryEntries((prev) => prev.filter((_, i) => i !== index))
  }  const [dictionaryEntries, setDictionaryEntries] = useState<DictionaryEntry[]>(
    [
      { search: 'JR', replace: 'Jr.' },
      { search: 'SR', replace: 'Sr.' },
      { search: 'inc', replace: 'Inc.' },
      { search: 'llc', replace: 'LLC' },
    ]
  );
  const handleApplyFormat = async () => {
    const payload: ApplyFormatOptions = {
      columns: selectedColumns,
      formatOption,
      recordSelection,
      recordRange,
      dictionaryEnabled,
      dictionaryEntries,
      includeDeleted,
      autoRun,
      autoClose,
    }
    try {
      await Promise.resolve(onApplyFormat(payload))
      if (autoClose) onOpenChange(false)
    } catch (err) {
      // Replace with toast/logger in your codebase
      // eslint-disable-next-line no-console
      console.error('onApplyFormat failed', err)
    }
  }  const removeDictionaryEntry = (index: number) => {
    setDictionaryEntries(dictionaryEntries.filter((_, i) => i !== index));
  };

  const updateDictionaryEntry = (
    index: number,
    field: 'search' | 'replace',
    value: string
  ) => {
    const newEntries = [...dictionaryEntries];
    newEntries[index][field] = value;
    setDictionaryEntries(newEntries);
  };

  const handleApplyFormat = () => {
    onApplyFormat({
      columns: selectedColumns,
      formatOption,
      recordSelection,
      recordRange,
      dictionaryEnabled,
      dictionaryEntries,
      includeDeleted,
      autoRun,
      autoClose,
    });

    if (autoClose) {
      onOpenChange(false);
    }
  };

  const textColumns = columns.filter(
    (column) =>
      column.id !== 'select' &&
      column.id !== 'actions' &&
      column.id !== 'campaigns' &&
      column.id !== 'tags'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue='fields'
          className='flex-1 overflow-hidden flex flex-col'
        >
          <TabsList className='grid grid-cols-3 mb-4'>
            <TabsTrigger value='fields'>Fields</TabsTrigger>
            <TabsTrigger value='options'>Format Options</TabsTrigger>
            <TabsTrigger value='dictionary'>Dictionary</TabsTrigger>
          </TabsList>

          <div className='flex-1 overflow-hidden'>
            <TabsContent
              value='fields'
              className='h-full overflow-hidden flex flex-col'
            >
              <FieldSelection
                textColumns={textColumns}
                selectedColumns={selectedColumns}
                onToggleColumn={toggleColumnSelection}
                recordSelection={recordSelection}
                onRecordSelectionChange={setRecordSelection}
                recordRange={recordRange}
                onRecordRangeChange={setRecordRange}
              />
            </TabsContent>

            <TabsContent
              value='options'
              className='h-full overflow-hidden flex flex-col'
            >
              <FormatOptions
                formatOption={formatOption}
                onFormatOptionChange={setFormatOption}
                includeDeleted={includeDeleted}
                onIncludeDeletedChange={setIncludeDeleted}
                autoRun={autoRun}
                onAutoRunChange={setAutoRun}
                autoClose={autoClose}
                onAutoCloseChange={setAutoClose}
              />
            </TabsContent>

            <TabsContent
              value='dictionary'
              className='h-full overflow-hidden flex flex-col'
            >
              <DictionarySection
                dictionaryEnabled={dictionaryEnabled}
                onDictionaryEnabledChange={setDictionaryEnabled}
                dictionaryEntries={dictionaryEntries}
                onAddEntry={addDictionaryEntry}
                onRemoveEntry={removeDictionaryEntry}
                onUpdateEntry={updateDictionaryEntry}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleApplyFormat}
            disabled={selectedColumns.length === 0}
          >
            {title.split(' ')[0]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
