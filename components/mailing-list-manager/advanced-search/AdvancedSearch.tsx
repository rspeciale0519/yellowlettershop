"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ColumnFiltersSection } from "./ColumnFiltersSection"
import { ListSelectionSection } from "./ListSelectionSection"
import { TagFiltersSection } from "./TagFiltersSection"
import { MailingHistorySection } from "./MailingHistorySection"
import { RecordCountSection } from "./RecordCountSection"
import { FiltersSummary } from "./FiltersSummary"
import {
  AdvancedSearchCriteria,
  ColumnFilter,
  TagFilter,
  MailingHistoryFilter,
  RecordCountFilter,
  ListFilter,
  CombinedConjunction,
  Column,
  Tag,
  List,
} from "./types"

// Rebuild a valid ColumnFilter from a base filter plus partial updates.
// ColumnFilter is a discriminated union keyed on `operator`, so a plain
// spread loses the operator/value correlation; re-discriminate here instead.
function mergeColumnFilter(
  base: ColumnFilter,
  updates: Partial<ColumnFilter>,
): ColumnFilter {
  const id = base.id
  const columnId = updates.columnId ?? base.columnId
  const operator = updates.operator ?? base.operator
  const value = "value" in updates ? updates.value : base.value

  switch (operator) {
    case "empty":
    case "notEmpty":
      return { id, columnId, operator }
    case "greaterThan":
    case "lessThan":
      return {
        id,
        columnId,
        operator,
        value: typeof value === "number" || value instanceof Date ? value : 0,
      }
    case "between":
      return {
        id,
        columnId,
        operator,
        value:
          Array.isArray(value) && value.length === 2
            ? value
            : [0, 0],
      }
    default:
      return {
        id,
        columnId,
        operator,
        value: typeof value === "string" || typeof value === "number" ? value : "",
      }
  }
}

interface AdvancedSearchProps {
  isOpen: boolean
  lists: List[]
  tags: Tag[]
  columns: Column[]
  initialCriteria?: AdvancedSearchCriteria
  onCriteriaChange: (criteria: AdvancedSearchCriteria) => void
}

export function AdvancedSearch({
  isOpen,
  lists,
  tags,
  columns,
  initialCriteria,
  onCriteriaChange,
}: AdvancedSearchProps) {
  const [criteria, setCriteria] = useState<AdvancedSearchCriteria>(
    initialCriteria || {
      columnFilters: [],
      tagFilter: null,
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      conjunction: "AND",
    },
  )

  // Only initialize criteria from initialCriteria once (on mount or if criteria is unset)
  useEffect(() => {
    setCriteria((prev) => (prev ?? initialCriteria ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a ref to the latest onCriteriaChange
  const onCriteriaChangeRef = useRef(onCriteriaChange);
  useEffect(() => {
    onCriteriaChangeRef.current = onCriteriaChange;
  }, [onCriteriaChange]);

  // Call the latest onCriteriaChangeRef when criteria changes
  useEffect(() => {
    onCriteriaChangeRef.current(criteria);
  }, [criteria]);

  const updateCriteria = (updates: Partial<AdvancedSearchCriteria>) => {
    setCriteria((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  const addColumnFilter = useCallback(() => {
    if (columns.length === 0) {
      console.warn("AdvancedSearch: no columns available to add a filter.")
      return
    }
    const newFilter: ColumnFilter = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `col-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      columnId: columns[0].id,
      operator: "contains",
      value: "",
    }
    updateCriteria({
      columnFilters: [...criteria.columnFilters, newFilter],
    })
  }, [columns, criteria.columnFilters])

  const removeColumnFilter = (id: string) => {
    updateCriteria({
      columnFilters: criteria.columnFilters.filter((filter) => filter.id !== id),
    })
  }

  const updateColumnFilter = (id: string, updates: Partial<ColumnFilter>) => {
    updateCriteria({
      columnFilters: criteria.columnFilters.map((filter) =>
        filter.id === id ? mergeColumnFilter(filter, updates) : filter
      ),
    })
  }

  const setConjunction = (conjunction: CombinedConjunction) => {
    updateCriteria({ conjunction })
  }

  const setTagFilter = (tagFilter: TagFilter | null) => {
    updateCriteria({ tagFilter })
  }

  const setMailingHistoryFilter = (mailingHistoryFilter: MailingHistoryFilter | null) => {
    updateCriteria({ mailingHistoryFilter })
  }

  const setRecordCountFilter = (recordCountFilter: RecordCountFilter | null) => {
    updateCriteria({ recordCountFilter })
  }

  const setListFilter = (listFilter: ListFilter | null) => {
    updateCriteria({ listFilter })
  }

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 mt-0"
      }`}
    >
      <div className="bg-card rounded-md p-3 pt-2">
        <div className="mb-4 text-sm">
          <h3 className="text-base font-bold mb-1">Advanced Search</h3>
          <p className="mb-2">Use the options below to create precise filters for your mailing lists and records.</p>
          <p className="text-muted-foreground mb-1">Filters are applied automatically as you make changes.</p>
        </div>

        <ColumnFiltersSection
          columnFilters={criteria.columnFilters}
          columns={columns}
          conjunction={criteria.conjunction}
          onAddFilter={addColumnFilter}
          onRemoveFilter={removeColumnFilter}
          onUpdateFilter={updateColumnFilter}
          onSetConjunction={setConjunction}
        />

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <ListSelectionSection
            listFilter={criteria.listFilter}
            lists={lists}
            onSetListFilter={setListFilter}
          />
          <TagFiltersSection
            tagFilter={criteria.tagFilter}
            tags={tags}
            onSetTagFilter={setTagFilter}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <MailingHistorySection
            mailingHistoryFilter={criteria.mailingHistoryFilter}
            onSetMailingHistoryFilter={setMailingHistoryFilter}
          />
          <RecordCountSection
            recordCountFilter={criteria.recordCountFilter}
            onSetRecordCountFilter={setRecordCountFilter}
          />
        </div>

        <FiltersSummary criteria={criteria} />
      </div>
    </div>
  )
}