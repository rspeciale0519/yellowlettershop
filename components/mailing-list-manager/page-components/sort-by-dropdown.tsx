'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Check,
  Calendar,
  Hash,
  User,
  Clock,
} from 'lucide-react';

interface SortByDropdownProps {
  onSortChange: (column: string) => void;
  sortBy: { column: string; direction: 'asc' | 'desc' };
}

interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
}

const sortOptions: SortOption[] = [
  // Name Group
  {
    value: 'name',
    label: 'List Name (A-Z)',
    icon: <ArrowUp className='h-3 w-3' />,
    group: 'name',
  },
  {
    value: 'name_desc',
    label: 'List Name (Z-A)',
    icon: <ArrowDown className='h-3 w-3' />,
    group: 'name',
  },

  // Record Count Group
  {
    value: 'record_count',
    label: 'Record Count (Low to High)',
    icon: <Hash className='h-3 w-3' />,
    group: 'count',
  },
  {
    value: 'record_count_desc',
    label: 'Record Count (High to Low)',
    icon: <Hash className='h-3 w-3' />,
    group: 'count',
  },

  // Date Group
  {
    value: 'created_at',
    label: 'Created Date (Oldest First)',
    icon: <Calendar className='h-3 w-3' />,
    group: 'date',
  },
  {
    value: 'created_at_desc',
    label: 'Created Date (Newest First)',
    icon: <Calendar className='h-3 w-3' />,
    group: 'date',
  },
  {
    value: 'updated_at',
    label: 'Modified Date (Oldest First)',
    icon: <Clock className='h-3 w-3' />,
    group: 'date',
  },
  {
    value: 'updated_at_desc',
    label: 'Modified Date (Newest First)',
    icon: <Clock className='h-3 w-3' />,
    group: 'date',
  },

  // User Group
  {
    value: 'created_by',
    label: 'Created By (A-Z)',
    icon: <User className='h-3 w-3' />,
    group: 'user',
  },
  {
    value: 'created_by_desc',
    label: 'Created By (Z-A)',
    icon: <User className='h-3 w-3' />,
    group: 'user',
  },
  {
    value: 'modified_by',
    label: 'Modified By (A-Z)',
    icon: <User className='h-3 w-3' />,
    group: 'user',
  },
  {
    value: 'modified_by_desc',
    label: 'Modified By (Z-A)',
    icon: <User className='h-3 w-3' />,
    group: 'user',
  },
];

export const SortByDropdown = ({
  onSortChange,
  sortBy,
}: SortByDropdownProps) => {
  // Get current sort option
  const currentSortKey =
    sortBy.direction === 'desc' && !sortBy.column.endsWith('_desc')
      ? `${sortBy.column}_desc`
      : sortBy.column;

  const currentOption = sortOptions.find((opt) => opt.value === currentSortKey);

  // Handle sort change with direction
  const handleSortChange = (value: string) => {
    const isDescending = value.endsWith('_desc');
    const column = value.replace('_desc', '');
    onSortChange(column);
  };

  // Group options by category
  const groupedOptions = {
    name: sortOptions.filter((opt) => opt.group === 'name'),
    count: sortOptions.filter((opt) => opt.group === 'count'),
    date: sortOptions.filter((opt) => opt.group === 'date'),
    user: sortOptions.filter((opt) => opt.group === 'user'),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='min-w-[140px] justify-between'>
          <span className='flex items-center gap-2'>
            {currentOption?.icon}
            <span className='text-sm'>Sort By</span>
          </span>
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[280px]'>
        <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Name Group */}
        <DropdownMenuGroup>
          <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
            Name
          </div>
          {groupedOptions.name.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className='flex items-center justify-between'
            >
              <span className='flex items-center gap-2'>
                {option.icon}
                {option.label}
              </span>
              {currentSortKey === option.value && (
                <Check className='ml-auto h-4 w-4 text-primary' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Record Count Group */}
        <DropdownMenuGroup>
          <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
            Record Count
          </div>
          {groupedOptions.count.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className='flex items-center justify-between'
            >
              <span className='flex items-center gap-2'>
                {option.icon}
                {option.label}
              </span>
              {currentSortKey === option.value && (
                <Check className='ml-auto h-4 w-4 text-primary' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Date Group */}
        <DropdownMenuGroup>
          <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
            Date
          </div>
          {groupedOptions.date.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className='flex items-center justify-between'
            >
              <span className='flex items-center gap-2'>
                {option.icon}
                {option.label}
              </span>
              {currentSortKey === option.value && (
                <Check className='ml-auto h-4 w-4 text-primary' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* User Group */}
        <DropdownMenuGroup>
          <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
            User
          </div>
          {groupedOptions.user.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className='flex items-center justify-between'
            >
              <span className='flex items-center gap-2'>
                {option.icon}
                {option.label}
              </span>
              {currentSortKey === option.value && (
                <Check className='ml-auto h-4 w-4 text-primary' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
