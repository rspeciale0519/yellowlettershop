'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { FilterDropdown } from './filter-dropdown';
import { SortByDropdown } from './sort-by-dropdown';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  showAdvancedSearch: boolean;
  onToggleAdvancedSearch: () => void;
  sortBy: { column: string; direction: 'asc' | 'desc' };
  onSortByChange: (column: string) => void;
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
}

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
  showAdvancedSearch,
  onToggleAdvancedSearch,
  sortBy,
  onSortByChange,
  quickFilter,
  onQuickFilterChange,
}: FilterBarProps) => {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative flex-grow sm:flex-grow-0 sm:w-64'>
        <Input
          placeholder='Search...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-8'
        />
        <Filter className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
      </div>

      <div className='flex items-center gap-2'>
        <FilterDropdown
          selectedFilter={quickFilter}
          onFilterChange={onQuickFilterChange}
        />
        <SortByDropdown sortBy={sortBy} onSort={onSortByChange} />
        <Button
          variant={showAdvancedSearch ? 'secondary' : 'outline'}
          onClick={onToggleAdvancedSearch}
        >
          <SlidersHorizontal className='mr-2 h-4 w-4' />
          Advanced Search
        </Button>
        {hasActiveFilters && (
          <Button
            variant='ghost'
            onClick={onClearFilters}
            className='text-red-500 hover:text-red-600'
          >
            <X className='mr-2 h-4 w-4' />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};
