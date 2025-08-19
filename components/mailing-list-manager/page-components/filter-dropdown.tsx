'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const filterOptions = {
  all: 'All',
  last_7_days: 'Last 7 Days',
  used_in_campaign: 'Used in Campaign',
};

export const FilterDropdown = ({
  selectedFilter,
  onFilterChange,
}: FilterDropdownProps) => {
  const displayLabel = filterOptions[selectedFilter as keyof typeof filterOptions] || 'Filter';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>
          {displayLabel}
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFilterChange('last-7-days')}>
          Last 7 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFilterChange('last-30-days')}>
          Last 30 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFilterChange('used-in-campaign')}>
          Used in campaign
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onFilterChange('not-used-in-campaign')}
        >
          Not used in campaign
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFilterChange('all')} className='text-red-500'>
          Clear Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
