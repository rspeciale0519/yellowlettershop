'use client';

import { useState } from 'react';
import type { AdvancedSearchCriteria, ColumnFilter } from './types';

interface ExpandedSections {
  columnFilters: boolean;
  mailingLists: boolean;
  tagFilters: boolean;
  mailingHistory: boolean;
  recordCount: boolean;
}

export const useAdvancedSearchState = () => {
  const [nextId, setNextId] = useState(1);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    columnFilters: true,
    mailingLists: true,
    tagFilters: true,
    mailingHistory: true,
    recordCount: true,
  });

  // Toggle section expansion
  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate next ID for column filters
  const getNextId = () => {
    const id = nextId;
    setNextId(id + 1);
    return id;
  };

  // Calculate active filters count
  const getActiveFiltersCount = (criteria: AdvancedSearchCriteria) => {
    return [
      criteria.columnFilters.length,
      criteria.listFilter?.length || 0,
      criteria.tagFilter?.tags?.length || 0,
      criteria.mailingHistoryFilter ? 1 : 0,
      criteria.recordCountFilter ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  };

  return {
    expandedSections,
    toggleSection,
    getNextId,
    getActiveFiltersCount,
  };
};