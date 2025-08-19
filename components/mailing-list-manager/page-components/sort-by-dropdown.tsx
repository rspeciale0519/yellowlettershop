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
import { ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortByDropdownProps {
  onSortChange: (column: string) => void;
  sortBy: { column: string; direction: 'asc' | 'desc' };
}

const sortOptions = [
  { value: 'name', label: 'List Name' },
  { value: 'record_count', label: 'Record Count' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Modified Date' },
];

export const SortByDropdown = ({ onSortChange, sortBy }: SortByDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>
          Sort By
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
          >
            {option.label}
            {sortBy.column === option.value &&
              (sortBy.direction === 'asc' ? (
                <ArrowUp className='ml-auto h-4 w-4' />
              ) : (
                <ArrowDown className='ml-auto h-4 w-4' />
              ))}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
