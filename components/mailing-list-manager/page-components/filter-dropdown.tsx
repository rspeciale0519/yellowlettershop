'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Calendar, 
  Tag, 
  BarChart,
  Clock,
  Check,
  Filter,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';

import type { FilterState } from '@/hooks/filters/use-mailing-list-manager/useListFilters';

interface FilterDropdownProps {
  selectedFilters: FilterState;
  onFilterChange: (filterType: keyof FilterState, value: any) => void;
  onQuickAction: (action: string) => void;
  availableTags: Array<{ id: string; name: string }>;
}

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const dateRangeOptions: FilterOption[] = [
  { value: 'all-time', label: 'All Time', icon: <Clock className="h-3 w-3" /> },
  { value: 'today', label: 'Today', icon: <Calendar className="h-3 w-3" /> },
  { value: 'last-7-days', label: 'Last 7 Days', icon: <Calendar className="h-3 w-3" /> },
  { value: 'last-30-days', label: 'Last 30 Days', icon: <Calendar className="h-3 w-3" /> },
  { value: 'last-90-days', label: 'Last 90 Days', icon: <Calendar className="h-3 w-3" /> },
  { value: 'this-month', label: 'This Month', icon: <Calendar className="h-3 w-3" /> },
  { value: 'last-month', label: 'Last Month', icon: <Calendar className="h-3 w-3" /> },
  { value: 'this-year', label: 'This Year', icon: <Calendar className="h-3 w-3" /> },
];

const usageOptions: FilterOption[] = [
  { value: 'all', label: 'All Lists', icon: <BarChart className="h-3 w-3" /> },
  { value: 'used', label: 'Used in Campaign', icon: <Check className="h-3 w-3" /> },
  { value: 'unused', label: 'Not Used in Campaign', icon: <X className="h-3 w-3" /> },
  { value: 'recently-used', label: 'Recently Used', icon: <Clock className="h-3 w-3" /> },
];

export const FilterDropdown = ({
  selectedFilters,
  onFilterChange,
  onQuickAction,
  availableTags,
}: FilterDropdownProps) => {
  // Count active filters
  const activeFilterCount = [
    selectedFilters.dateRange !== 'all-time' ? 1 : 0,
    selectedFilters.tags.length > 0 ? selectedFilters.tags.length : 0,
    selectedFilters.usage !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    const currentTags = selectedFilters.tags;
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    onFilterChange('tags', newTags);
  };

  // Handle clear all filters
  const handleClearAll = () => {
    onFilterChange('dateRange', 'all-time');
    onFilterChange('tags', []);
    onFilterChange('usage', 'all');
  };

  // Get display label
  const getDisplayLabel = () => {
    if (activeFilterCount === 0) return 'Filter By';
    return `Filter By (${activeFilterCount})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant='outline' 
          className="min-w-[140px] justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm">{getDisplayLabel()}</span>
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filter Options</span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto p-0 text-xs text-red-500 hover:text-red-600"
            >
              Clear All
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Date Range Filter */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Date Range</span>
            {selectedFilters.dateRange && selectedFilters.dateRange !== 'all-time' && (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5">1</Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[200px]">
            {dateRangeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange('dateRange', option.value)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                {selectedFilters.dateRange === option.value && (
                  <Check className='ml-auto h-4 w-4 text-primary' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="mr-2 h-4 w-4" />
                <span>Tags</span>
                {selectedFilters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedFilters.tags.length}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => onFilterChange('tags', [])}
                  className="text-xs text-muted-foreground"
                >
                  Clear Tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{tag.name}</span>
                    {selectedFilters.tags.includes(tag.id) && (
                      <Check className="h-3 w-3 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        
        {/* Usage Filter */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <BarChart className="mr-2 h-4 w-4" />
            <span>Usage</span>
            {selectedFilters.usage && selectedFilters.usage !== 'all' && (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5">1</Badge>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[200px]">
            {usageOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange('usage', option.value)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                {selectedFilters.usage === option.value && (
                  <Check className='ml-auto h-4 w-4 text-primary' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        {/* Quick Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => onQuickAction('recent-unused')}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Recent Unused Lists
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onQuickAction('this-month-active')}
          >
            <TrendingUp className="h-3 w-3 mr-2" />
            This Month's Active Lists
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
