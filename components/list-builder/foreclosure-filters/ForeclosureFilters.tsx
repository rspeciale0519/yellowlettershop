'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ForeclosureStatusSection } from './ForeclosureStatusSection';
import { ForeclosureDatesSection } from './ForeclosureDatesSection';
import { ForeclosureAmountsSection } from './ForeclosureAmountsSection';
import { ForeclosurePartiesSection } from './ForeclosurePartiesSection';
import { ForeclosurePropertiesSection } from './ForeclosurePropertiesSection';
import { ForeclosureLegalSection } from './ForeclosureLegalSection';
import type { ForeclosureCriteria } from '@/types/list-builder';

interface ForeclosureFiltersProps {
  criteria: ForeclosureCriteria;
  onUpdate: (values: Partial<ForeclosureCriteria>) => void;
}

export function ForeclosureFilters({
  criteria,
  onUpdate,
}: ForeclosureFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'status',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleCriteriaToggle = (criterion: string) => {
    const currentCriteria = criteria.selectedCriteria || [];
    const updatedCriteria = currentCriteria.includes(criterion)
      ? currentCriteria.filter((c) => c !== criterion)
      : [...currentCriteria, criterion];

    onUpdate({ selectedCriteria: updatedCriteria });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = Array.isArray(criteria.foreclosureStatus)
      ? criteria.foreclosureStatus
      : [];
    const updatedStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onUpdate({ foreclosureStatus: updatedStatuses });
  };

  const handleAmountRangeUpdate = (
    field: string,
    values: number[]
  ) => {
    onUpdate({ [field]: { min: values[0], max: values[1] } });
  };

  const handleDateRangeUpdate = (
    field: string,
    type: "from" | "to",
    date: Date | undefined
  ) => {
    const currentDate = criteria[field as keyof ForeclosureCriteria] as any || {};
    onUpdate({ [field]: { ...currentDate, [type]: date } });
  };
  const addItem = (field: string, value: string) => {
    if (value.trim()) {
      const currentItems = Array.isArray(
        criteria[field as keyof ForeclosureCriteria]
      )
        ? (criteria[field as keyof ForeclosureCriteria] as string[])
        : [];
      onUpdate({ [field]: [...currentItems, value.trim()] });
    }
  };

  const removeItem = (field: string, index: number) => {
    const currentItems = Array.isArray(
      criteria[field as keyof ForeclosureCriteria]
    )
      ? (criteria[field as keyof ForeclosureCriteria] as string[])
      : [];
    onUpdate({ [field]: currentItems.filter((_, i) => i !== index) });
  };

  const sections = [
    {
      id: 'status',
      title: 'Foreclosure Status',
      count: (criteria.foreclosureStatus || []).length,
      component: (
        <ForeclosureStatusSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onStatusToggle={handleStatusToggle}
        />
      ),
    },
    {
      id: 'dates',
      title: 'Important Dates',
      count: 0,
      component: (
        <ForeclosureDatesSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onDateRangeUpdate={handleDateRangeUpdate}
        />
      ),
    },
    {
      id: 'amounts',
      title: 'Financial Details',
      count: 0,
      component: (
        <ForeclosureAmountsSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onAmountRangeUpdate={handleAmountRangeUpdate}
        />
      ),
    },
    {
      id: 'parties',
      title: 'Parties Involved',
      count:
        (criteria.lenderNames || []).length +
        (criteria.currentOwners || []).length +
        (criteria.trusteeNames || []).length,
      component: (
        <ForeclosurePartiesSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />
      ),
    },
    {
      id: 'properties',
      title: 'Property Details',
      count: (criteria.propertyAddresses || []).length,
      component: (
        <ForeclosurePropertiesSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />
      ),
    },
    {
      id: 'legal',
      title: 'Legal Information',
      count:
        (criteria.noticeTypes || []).length +
        (criteria.caseNumbers || []).length,
      component: (
        <ForeclosureLegalSection
          criteria={criteria}
          onCriteriaToggle={handleCriteriaToggle}
          onUpdate={onUpdate}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50'>
          Foreclosure Filters
        </h2>
        <Badge
          variant='secondary'
          className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        >
          {(criteria.selectedCriteria || []).length} criteria selected
        </Badge>
      </div>

      <div className='grid gap-6'>
        {sections.map((section) => (
          <Card key={section.id} className='overflow-hidden'>
            <CardHeader
              className='cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
              onClick={() => toggleSection(section.id)}
            >
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  {section.title}
                  {section.count > 0 && (
                    <Badge
                      variant='secondary'
                      className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    >
                      {section.count}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className='h-5 w-5 text-gray-500' />
                ) : (
                  <ChevronDown className='h-5 w-5 text-gray-500' />
                )}
              </div>
            </CardHeader>

            {expandedSections.includes(section.id) && section.component}
          </Card>
        ))}
      </div>
    </div>
  );
}
