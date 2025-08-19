export interface ColumnFilter {
  id: number;
  column: string;
  operator: string;
  value: string;
}

export interface TagFilter {
  tags: string[];
  matchType: 'any' | 'all';
}

// Mailing history filter now supports full set of options from original UI
export type MailingHistoryType =
  | 'in_last' // mailed in the last N days
  | 'more_than' // mailed more than N days ago
  | 'not_mailed' // never mailed / not yet mailed
  | 'between_dates'; // mailed between two dates

export interface MailingHistoryFilter {
  type: MailingHistoryType;
  // For 'in_last' and 'more_than'
  days?: number;
  // For 'between_dates' (ISO date strings: yyyy-mm-dd)
  startDate?: string;
  endDate?: string;
}

// Record count filter supports Top, Random and Range
export type RecordCountType = 'top' | 'random' | 'range';

export interface RecordCountFilter {
  type: RecordCountType;
  // Used when type is 'top' or 'random'
  count?: number;
  // Used when type is 'range' -> [start, end]
  range?: [number, number];
}

export interface AdvancedSearchCriteria {
  columnFilters: ColumnFilter[];
  tagFilter: TagFilter;
  mailingHistoryFilter: MailingHistoryFilter | null;
  recordCountFilter: RecordCountFilter | null;
  listFilter: string[] | null;
  logicalOperator: 'AND' | 'OR';
}
