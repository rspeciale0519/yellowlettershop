'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  Trash, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Tag,
  Mail,
  Hash,
  Columns,
  X
} from 'lucide-react';
import type {
  AdvancedSearchCriteria,
  ColumnFilter,
  MailingHistoryFilter,
  RecordCountFilter,
  TagFilter,
} from '@/types/advanced-search';

interface AdvancedSearchProps {
  criteria: AdvancedSearchCriteria;
  onCriteriaChange: (criteria: AdvancedSearchCriteria) => void;
  availableTags: { id: string; name: string }[];
  availableLists?: { id: string; name: string; record_count?: number }[];
  isOpen?: boolean;
  onClose?: () => void;
}

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

  const [nextId, setNextId] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    columnFilters: true,
    mailingLists: true,
    tagFilters: true,
    mailingHistory: true,
    recordCount: true,
  });

  // Calculate active filters count
  const activeFiltersCount = [
    criteria.columnFilters.length,
    criteria.listFilter?.length || 0,
    criteria.tagFilter?.tags?.length || 0,
    criteria.mailingHistoryFilter ? 1 : 0,
    criteria.recordCountFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const addColumnFilter = () => {
    const newFilter: ColumnFilter = {
      id: nextId,
      column: '',
      operator: '',
      value: '',
    };
    setNextId(nextId + 1);
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

  // Mailing History handlers (full set)
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

  // Record Count handlers (Top, Random, Range, None)
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
      <Collapsible open={expandedSections.columnFilters}>
        <CollapsibleTrigger
          onClick={() => toggleSection('columnFilters')}
          className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors'
        >
          <div className='flex items-center gap-2'>
            <Columns className='h-4 w-4' />
            <h4 className='font-semibold'>Column Filters</h4>
            {criteria.columnFilters.length > 0 && (
              <Badge variant='outline' className='ml-2'>
                {criteria.columnFilters.length}
              </Badge>
            )}
          </div>
          {expandedSections.columnFilters ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-2'>
          <div className='space-y-2'>
          {criteria.columnFilters.map((filter) => (
            <div key={filter.id} className='flex items-center gap-2'>
              <Select
                onValueChange={(value) =>
                  handleColumnFilterChange(filter.id, 'column', value)
                }
                value={filter.column}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select column' />
                </SelectTrigger>
                <SelectContent>
                  {/* Populate with actual columns */}
                  <SelectItem value='first_name'>First Name</SelectItem>
                  <SelectItem value='last_name'>Last Name</SelectItem>
                  <SelectItem value='address'>Address</SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  handleColumnFilterChange(filter.id, 'operator', value)
                }
                value={filter.operator}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Operator' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='contains'>Contains</SelectItem>
                  <SelectItem value='equals'>Equals</SelectItem>
                  <SelectItem value='not_equals'>Not Equals</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={filter.value}
                onChange={(e) =>
                  handleColumnFilterChange(filter.id, 'value', e.target.value)
                }
                placeholder='Value'
              />
              <Button
                variant='ghost'
                size='icon'
                onClick={() => removeColumnFilter(filter.id)}
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          ))}
          </div>
          <Button
            onClick={addColumnFilter}
            variant='outline'
            size='sm'
            className='mt-2'
          >
            + Add Filter
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Mailing List Selection and Tag Filters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Mailing List Selection */}
        <Collapsible open={expandedSections.mailingLists}>
          <CollapsibleTrigger
            onClick={() => toggleSection('mailingLists')}
            className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors mb-2'
          >
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4' />
              <h4 className='font-semibold'>Mailing List Selection</h4>
              {criteria.listFilter && criteria.listFilter.length > 0 && (
                <Badge variant='outline' className='ml-2'>
                  {criteria.listFilter.length}
                </Badge>
              )}
            </div>
            {expandedSections.mailingLists ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <MultiSelect
              options={availableLists.map((l) => ({
                value: l.id,
                label: `${l.name}${typeof l.record_count === 'number' ? ` (${l.record_count})` : ''}`,
              }))}
              selected={criteria.listFilter ?? []}
              onChange={handleListFilterChange}
              placeholder='Select lists...'
              className='w-full'
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Tag Filters */}
        <Collapsible open={expandedSections.tagFilters}>
          <CollapsibleTrigger
            onClick={() => toggleSection('tagFilters')}
            className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors mb-2'
          >
            <div className='flex items-center gap-2'>
              <Tag className='h-4 w-4' />
              <h4 className='font-semibold'>Tag Filters</h4>
              {criteria.tagFilter?.tags && criteria.tagFilter.tags.length > 0 && (
                <Badge variant='outline' className='ml-2'>
                  {criteria.tagFilter.tags.length}
                </Badge>
              )}
            </div>
            {expandedSections.tagFilters ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='flex items-center gap-2'>
              <Select
                onValueChange={(value) =>
                  handleTagFilterMatchTypeChange(value as 'any' | 'all')
                }
                value={criteria.tagFilter?.matchType || 'any'}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select match type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='any'>Any</SelectItem>
                  <SelectItem value='all'>All</SelectItem>
                </SelectContent>
              </Select>
              <MultiSelect
                options={availableTags.map((tag) => ({
                  value: tag.id,
                  label: tag.name,
                }))}
                selected={criteria.tagFilter?.tags || []}
                onChange={handleTagFilterChange}
                placeholder='Select tags...'
                className='w-full'
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mailing History & Record Count Filters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Mailing History */}
        <Collapsible open={expandedSections.mailingHistory}>
          <CollapsibleTrigger
            onClick={() => toggleSection('mailingHistory')}
            className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors mb-2'
          >
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              <h4 className='font-semibold'>Mailing History</h4>
              {criteria.mailingHistoryFilter && (
                <Badge variant='outline' className='ml-2'>1</Badge>
              )}
            </div>
            {expandedSections.mailingHistory ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
          <div className='flex items-center gap-2'>
            <Select
              onValueChange={(value) =>
                handleMailingHistoryTypeChange(
                  value as 'none' | 'in_last' | 'more_than' | 'not_mailed' | 'between_dates'
                )
              }
              value={criteria.mailingHistoryFilter?.type ?? 'none'}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select mailing history' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No mailing history filter</SelectItem>
                <SelectItem value='in_last'>Mailed in the last</SelectItem>
                <SelectItem value='more_than'>Mailed more than</SelectItem>
                <SelectItem value='not_mailed'>Not yet mailed</SelectItem>
                <SelectItem value='between_dates'>Mailed between dates</SelectItem>
              </SelectContent>
            </Select>
            {(criteria.mailingHistoryFilter?.type === 'in_last' ||
              criteria.mailingHistoryFilter?.type === 'more_than') && (
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  value={criteria.mailingHistoryFilter?.days ?? ''}
                  onChange={(e) => handleMailingHistoryDaysChange(e.target.value)}
                  className='w-[100px]'
                />
                <span>days</span>
              </div>
            )}
            {criteria.mailingHistoryFilter?.type === 'between_dates' && (
              <div className='flex items-center gap-2'>
                <Input
                  type='date'
                  value={criteria.mailingHistoryFilter?.startDate ?? ''}
                  onChange={(e) =>
                    handleMailingHistoryDateChange('startDate', e.target.value)
                  }
                />
                <span>to</span>
                <Input
                  type='date'
                  value={criteria.mailingHistoryFilter?.endDate ?? ''}
                  onChange={(e) =>
                    handleMailingHistoryDateChange('endDate', e.target.value)
                  }
                />
              </div>
            )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Record Count */}
        <Collapsible open={expandedSections.recordCount}>
          <CollapsibleTrigger
            onClick={() => toggleSection('recordCount')}
            className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors mb-2'
          >
            <div className='flex items-center gap-2'>
              <Hash className='h-4 w-4' />
              <h4 className='font-semibold'>Record Count</h4>
              {criteria.recordCountFilter && (
                <Badge variant='outline' className='ml-2'>1</Badge>
              )}
            </div>
            {expandedSections.recordCount ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
          <div className='flex items-center gap-2'>
            <Select
              onValueChange={(value) =>
                handleRecordCountTypeChange(value as 'none' | 'top' | 'random' | 'range')
              }
              value={criteria.recordCountFilter?.type ?? 'none'}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No record count filter</SelectItem>
                <SelectItem value='top'>Top records</SelectItem>
                <SelectItem value='random'>Random selection</SelectItem>
                <SelectItem value='range'>Records range</SelectItem>
              </SelectContent>
            </Select>

            {(criteria.recordCountFilter?.type === 'top' ||
              criteria.recordCountFilter?.type === 'random') && (
              <Input
                type='number'
                value={criteria.recordCountFilter?.count ?? ''}
                onChange={(e) => handleRecordCountValueChange('count', e.target.value)}
                className='w-full'
                placeholder='Number of records'
              />
            )}

            {criteria.recordCountFilter?.type === 'range' && (
              <div className='flex items-center gap-2 w-full'>
                <Input
                  type='number'
                  value={criteria.recordCountFilter?.range?.[0] ?? ''}
                  onChange={(e) => handleRecordCountValueChange('start', e.target.value)}
                  className='w-full'
                  placeholder='Start'
                />
                <span>to</span>
                <Input
                  type='number'
                  value={criteria.recordCountFilter?.range?.[1] ?? ''}
                  onChange={(e) => handleRecordCountValueChange('end', e.target.value)}
                  className='w-full'
                  placeholder='End'
                />
              </div>
            )}
            </div>
          </CollapsibleContent>
        </Collapsible>
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
