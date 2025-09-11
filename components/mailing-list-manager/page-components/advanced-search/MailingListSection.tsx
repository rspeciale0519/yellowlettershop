'use client';

import { MultiSelect } from '@/components/ui/multi-select';
import { Filter } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { MailingListSectionProps } from './types';

export const MailingListSection = ({
  selectedLists,
  availableLists,
  onListsChange,
  isExpanded,
  onToggle,
}: MailingListSectionProps) => {
  return (
    <CollapsibleSection
      title='Mailing List Selection'
      icon={Filter}
      isOpen={isExpanded}
      onToggle={onToggle}
      badge={selectedLists?.length}
    >
      <MultiSelect
        options={availableLists.map((l) => ({
          value: l.id,
          label: `${l.name}${
            typeof l.record_count === 'number' ? ` (${l.record_count})` : ''
          }`,
        }))}
        selected={selectedLists ?? []}
        onChange={onListsChange}
        placeholder='Select lists...'
        className='w-full'
      />
    </CollapsibleSection>
  );
};