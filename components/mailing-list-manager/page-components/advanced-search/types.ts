import type {
  AdvancedSearchCriteria,
  ColumnFilter,
  MailingHistoryFilter,
  RecordCountFilter,
  TagFilter,
} from '@/types/advanced-search';

export type {
  AdvancedSearchCriteria,
  ColumnFilter,
  MailingHistoryFilter,
  RecordCountFilter,
  TagFilter,
};

export interface AdvancedSearchProps {
  criteria: AdvancedSearchCriteria;
  onCriteriaChange: (criteria: AdvancedSearchCriteria) => void;
  availableTags: { id: string; name: string }[];
  availableLists?: { id: string; name: string; record_count?: number }[];
  isOpen?: boolean;
  onClose?: () => void;
}

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string | number;
  children: React.ReactNode;
}

export interface ColumnFiltersSectionProps {
  columnFilters: ColumnFilter[];
  onAddFilter: () => void;
  onRemoveFilter: (id: number) => void;
  onFilterChange: (id: number, field: keyof ColumnFilter, value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface MailingListSectionProps {
  selectedLists: string[] | null;
  availableLists: { id: string; name: string; record_count?: number }[];
  onListsChange: (listIds: string[]) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface TagFiltersSectionProps {
  tagFilter: TagFilter | null;
  availableTags: { id: string; name: string }[];
  onTagFilterChange: (tags: string[]) => void;
  onMatchTypeChange: (matchType: 'any' | 'all') => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface MailingHistorySectionProps {
  mailingHistoryFilter: MailingHistoryFilter | null;
  onTypeChange: (value: 'none' | 'in_last' | 'more_than' | 'not_mailed' | 'between_dates') => void;
  onDaysChange: (days: string) => void;
  onDateChange: (which: 'startDate' | 'endDate', value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface RecordCountSectionProps {
  recordCountFilter: RecordCountFilter | null;
  onTypeChange: (value: 'none' | 'top' | 'random' | 'range') => void;
  onValueChange: (which: 'count' | 'start' | 'end', value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}