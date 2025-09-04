'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type {
  ListCriteria,
  GeographyCriteria,
  PropertyCriteria,
  DemographicsCriteria,
  MortgageCriteria,
  ForeclosureCriteria,
} from "@/types/list-builder"
import type { Category, UpdateCriteria } from "../hooks/useBuildListsPage"

const GeographyFilters = dynamic<{
  criteria: GeographyCriteria;
  onUpdate: (values: Partial<GeographyCriteria>) => void;
}>(
  () =>
    import('@/components/list-builder/geography-filters').then(
      (m) => m.GeographyFilters
    ),
  { ssr: false }
);

const PropertyFilters = dynamic<{
  criteria: PropertyCriteria;
  onUpdate: (values: Partial<PropertyCriteria>) => void;
}>(
  () =>
    import('@/components/list-builder/property-filters').then(
      (m) => m.PropertyFilters
    ),
  { ssr: false }
);

const DemographicsFilters = dynamic<{
  criteria: DemographicsCriteria;
  onUpdate: (values: Partial<DemographicsCriteria>) => void;
}>(
  () =>
    import('@/components/list-builder/demographics-filters').then(
      (m) => m.DemographicsFilters
    ),
  { ssr: false }
);

const MortgageFilters = dynamic<{
  criteria: MortgageCriteria;
  onUpdate: (values: Partial<MortgageCriteria>) => void;
}>(
  () =>
    import('@/components/list-builder/mortgage-filters').then(
      (m) => m.MortgageFilters
    ),
  { ssr: false }
);

const ForeclosureFilters = dynamic<{
  criteria: ForeclosureCriteria;
  onUpdate: (values: Partial<ForeclosureCriteria>) => void;
}>(
  () =>
    import('@/components/list-builder/foreclosure-filters').then(
      (m) => m.ForeclosureFilters
    ),
  { ssr: false }
);


const OptionsFilters = dynamic<{}>(
  () =>
    import('@/components/list-builder/options-filters').then(
      (m) => m.OptionsFilters
    ),
  { ssr: false }
);

interface FilterPanelProps {
  activeCategory: Category;
  criteria: ListCriteria;
  updateCriteria: UpdateCriteria;
}

export function FilterPanel({
  activeCategory,
  criteria,
  updateCriteria,
}: FilterPanelProps) {
  switch (activeCategory) {
    case 'geography':
      return (
        <GeographyFilters
          criteria={criteria.geography}
          onUpdate={(values) => updateCriteria('geography', values)}
        />
      );
    case 'property':
      return (
        <PropertyFilters
          criteria={criteria.property}
          onUpdate={(values) => updateCriteria('property', values)}
        />
      );
    case 'demographics':
      return (
        <DemographicsFilters
          criteria={criteria.demographics}
          onUpdate={(values) => updateCriteria('demographics', values)}
        />
      );
    case 'mortgage':
      return (
        <MortgageFilters
          criteria={criteria.mortgage}
          onUpdate={(values) => updateCriteria('mortgage', values)}
        />
      );
    case 'foreclosure':
      return (
        <ForeclosureFilters
          criteria={criteria.foreclosure}
          onUpdate={(values) => updateCriteria('foreclosure', values)}
        />
      );
    case 'options':
      return <OptionsFilters />;
    default:
      return null;
  }
}
