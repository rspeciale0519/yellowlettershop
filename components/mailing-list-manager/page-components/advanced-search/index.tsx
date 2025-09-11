'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { ColumnFiltersSection } from './ColumnFiltersSection';
import { MailingListSection } from './MailingListSection';
import { TagFiltersSection } from './TagFiltersSection';
import { MailingHistorySection } from './MailingHistorySection';
import { RecordCountSection } from './RecordCountSection';
import { useAdvancedSearchState } from './useAdvancedSearchState';
import type {
  AdvancedSearchProps,
  ColumnFilter,
  MailingHistoryFilter,
  RecordCountFilter,
} from './types';

export const AdvancedSearch = ({
  criteria,
  onCriteriaChange,
  availableTags,
  availableLists = [],
  isOpen = true,
  onClose,
}: AdvancedSearchProps) => {
  // Guard against rendering with incomplete criteria to prevent runtime errors
  if (!criteria) {
    return null; // Or a loading indicator
  }

  const { expandedSections, toggleSection, getNextId, getActiveFiltersCount } = useAdvancedSearchState();

  // Calculate active filters count
  const activeFiltersCount = getActiveFiltersCount(criteria);

  // Clear all filters
  const handleClearAll = () => {
    onCriteriaChange({
      ...criteria,
      columnFilters: [],
      listFilter: null,
      tagFilter: { tags: [], matchType: 'any' },
      mailingHistoryFilter: null,
      recordCountFilter: null,
    });
  };

  // Column Filter handlers
  const addColumnFilter = () => {
    const newFilter: ColumnFilter = {
      id: getNextId(),
      column: '',
      operator: '',
      value: '',
    };
    onCriteriaChange({
      ...criteria,
      columnFilters: [...criteria.columnFilters, newFilter],
    });
  };

  const removeColumnFilter = (id: number) => {
    onCriteriaChange({
      ...criteria,
      columnFilters: criteria.columnFilters.filter((f) => f.id !== id),
    });
  };

  const handleColumnFilterChange = (
    id: number,
    field: keyof ColumnFilter,
    value: string
  ) => {
    onCriteriaChange({
      ...criteria,
      columnFilters: criteria.columnFilters.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  };

  // Tag Filter handlers
  const handleTagFilterChange = (tags: string[]) => {
    onCriteriaChange({
      ...criteria,
      tagFilter: { 
        matchType: criteria.tagFilter?.matchType || 'any',
        tags 
      },
    });
  };

  const handleTagFilterMatchTypeChange = (matchType: 'any' | 'all') => {
    onCriteriaChange({
      ...criteria,
      tagFilter: { 
        tags: criteria.tagFilter?.tags || [],
        matchType 
      },
    });
  };

  // Mailing list selection
  const handleListFilterChange = (listIds: string[]) => {
    onCriteriaChange({
      ...criteria,
      listFilter: listIds.length > 0 ? listIds : null,
    });
  };

  // Mailing History handlers
  const handleMailingHistoryTypeChange = (
    value: 'none' | 'in_last' | 'more_than' | 'not_mailed' | 'between_dates'
  ) => {
    if (value === 'none') {
      onCriteriaChange({ ...criteria, mailingHistoryFilter: null });
      return;
    }
    const current = criteria.mailingHistoryFilter || ({} as MailingHistoryFilter);
    const newFilter: MailingHistoryFilter = { type: value } as MailingHistoryFilter;
    if (value === 'in_last' || value === 'more_than') {
      newFilter.days = current.days ?? 30;
    } else if (value === 'between_dates') {
      newFilter.startDate = current.startDate || '';
      newFilter.endDate = current.endDate || '';
    }
    onCriteriaChange({ ...criteria, mailingHistoryFilter: newFilter });
  };

  const handleMailingHistoryDaysChange = (days: string) => {
    const parsed = parseInt(days, 10) || 0;
    onCriteriaChange({
      ...criteria,
      mailingHistoryFilter: criteria.mailingHistoryFilter
        ? { ...criteria.mailingHistoryFilter, days: parsed, type: criteria.mailingHistoryFilter.type }
        : { type: 'in_last', days: parsed },
    });
  };

  const handleMailingHistoryDateChange = (
    which: 'startDate' | 'endDate',
    value: string
  ) => {
    const base: MailingHistoryFilter =
      criteria.mailingHistoryFilter?.type === 'between_dates'
        ? criteria.mailingHistoryFilter
        : { type: 'between_dates', startDate: '', endDate: '' };
    onCriteriaChange({
      ...criteria,
      mailingHistoryFilter: { ...base, [which]: value },
    });
  };

  // Record Count handlers
  const handleRecordCountTypeChange = (
    value: 'none' | 'top' | 'random' | 'range'
  ) => {
    if (value === 'none') {
      onCriteriaChange({ ...criteria, recordCountFilter: null });
      return;
    }
    const current = criteria.recordCountFilter || ({} as RecordCountFilter);
    const newFilter: RecordCountFilter = { type: value } as RecordCountFilter;
    if (value === 'top' || value === 'random') {
      newFilter.count = current.count ?? 100;
    } else if (value === 'range') {
      newFilter.range = current.range ?? [1, 100];
    }
    onCriteriaChange({ ...criteria, recordCountFilter: newFilter });
  };

  const handleRecordCountValueChange = (
    which: 'count' | 'start' | 'end',
    value: string
  ) => {
    const parsed = parseInt(value, 10) || 0;
    const current = criteria.recordCountFilter || ({} as RecordCountFilter);
    if (which === 'count') {
      onCriteriaChange({
        ...criteria,
        recordCountFilter: { type: current.type || 'top', count: parsed },
      });
      return;
    }
    const [start, end] = current.range ?? [1, 100];
    const nextRange: [number, number] = [
      which === 'start' ? parsed : start,
      which === 'end' ? parsed : end,
    ];
    onCriteriaChange({
      ...criteria,
      recordCountFilter: { type: 'range', range: nextRange },
    });
  };

  return (
    <div className='space-y-4 p-4 bg-background border rounded-lg'>
      {/* Header */}
      <div className='flex items-center justify-between pb-4 border-b'>
        <div className='flex items-center gap-2'>
          <Filter className='h-5 w-5' />
          <h3 className='text-lg font-semibold'>Advanced Search</h3>
          {activeFiltersCount > 0 && (
            <Badge variant='secondary'>{activeFiltersCount} active</Badge>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {activeFiltersCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearAll}
              className='text-red-500 hover:text-red-600'
            >
              <X className='h-4 w-4 mr-1' />
              Clear All
            </Button>
          )}
          {onClose && (
            <Button variant='ghost' size='icon' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Column Filters Section */}
      <ColumnFiltersSection
        columnFilters={criteria.columnFilters}
        onAddFilter={addColumnFilter}
        onRemoveFilter={removeColumnFilter}
        onFilterChange={handleColumnFilterChange}
        isExpanded={expandedSections.columnFilters}
        onToggle={() => toggleSection('columnFilters')}
      />

      {/* Mailing List Selection and Tag Filters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <MailingListSection
          selectedLists={criteria.listFilter}
          availableLists={availableLists}
          onListsChange={handleListFilterChange}
          isExpanded={expandedSections.mailingLists}
          onToggle={() => toggleSection('mailingLists')}
        />

        <TagFiltersSection
          tagFilter={criteria.tagFilter}
          availableTags={availableTags}
          onTagFilterChange={handleTagFilterChange}
          onMatchTypeChange={handleTagFilterMatchTypeChange}
          isExpanded={expandedSections.tagFilters}
          onToggle={() => toggleSection('tagFilters')}
        />
      </div>

      {/* Mailing History & Record Count Filters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <MailingHistorySection
          mailingHistoryFilter={criteria.mailingHistoryFilter}
          onTypeChange={handleMailingHistoryTypeChange}
          onDaysChange={handleMailingHistoryDaysChange}
          onDateChange={handleMailingHistoryDateChange}
          isExpanded={expandedSections.mailingHistory}
          onToggle={() => toggleSection('mailingHistory')}
        />
        
        <RecordCountSection
          recordCountFilter={criteria.recordCountFilter}
          onTypeChange={handleRecordCountTypeChange}
          onValueChange={handleRecordCountValueChange}
          isExpanded={expandedSections.recordCount}
          onToggle={() => toggleSection('recordCount')}
        />
      </div>

      {/* Footer with Logical Operator and Apply Button */}
      <div className='flex items-center justify-between pt-4 border-t'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Logical Operator:</label>
          <Select
            value={criteria.logicalOperator}
            onValueChange={(value) =>
              onCriteriaChange({
                ...criteria,
                logicalOperator: value as 'AND' | 'OR',
              })
            }
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='AND'>AND</SelectItem>
              <SelectItem value='OR'>OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className='min-w-[120px]'>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};