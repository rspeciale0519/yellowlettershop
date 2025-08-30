export type ColumnFilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'empty'
  | 'notEmpty';

export type TagFilterOperator = 'hasAll' | 'hasAny' | 'hasNone' | 'hasOnly';

export type MailingHistoryOperator =
  | 'mailedInLast'
  | 'mailedMoreThan'
  | 'notMailed'
  | 'mailedBetween';

export type RecordCountOperator =
  | 'topRecords'
  | 'randomRecords'
  | 'recordRange';

export type ColumnFilter =
  | {
      id: string;
      columnId: Column['id'];
      operator: 'empty' | 'notEmpty';
      value?: never;
    }
  | {
      id: string;
      columnId: Column['id'];
      operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
      value: string | number;
    }
  | {
      id: string;
      columnId: Column['id'];
      operator: 'greaterThan' | 'lessThan';
      value: number | Date;
    }
  | {
      id: string;
      columnId: Column['id'];
      operator: 'between';
      value: [number, number] | [Date, Date];
    }
  | {
      id: string;
      columnId: Column['id'];
      operator: 'equals';
      value: boolean;
    };

export type TagFilter = {
  id: string;
  operator: TagFilterOperator;
  tagIds: string[];
};

export type MailingHistoryFilter = {
  id: string;
  operator: MailingHistoryOperator;
  value: number | [Date, Date] | 'days' | 'weeks' | 'months';
};

export type RecordCountFilter = {
  operator: RecordCountOperator;
  value: number | [number, number];
};

export type ListFilter = {
  id: string;
  listIds: string[];
};

export type CombinedConjunction = 'AND' | 'OR';

export type AdvancedSearchCriteria = {
  columnFilters: ColumnFilter[];
  tagFilter: TagFilter | null;
  mailingHistoryFilter: MailingHistoryFilter | null;
  recordCountFilter: RecordCountFilter | null;
  listFilter: ListFilter | null;
  conjunction: CombinedConjunction;
};

export interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
}

export interface Tag {
  id: string;
  name: string;
}

export interface List {
  id: string;
  name: string;
  recordCount: number;
}
