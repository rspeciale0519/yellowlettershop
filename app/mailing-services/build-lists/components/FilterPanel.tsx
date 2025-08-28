'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ListCriteria } from "@/types/list-builder"
import type { Category, UpdateCriteria } from "../hooks/useBuildListsPage"

const GeographyFilters = dynamic(() =>
  import('@/components/list-builder/geography-filters').then(
    (m) => m.GeographyFilters
  )
);

const PropertyFilters = dynamic(() =>
  import('@/components/list-builder/property').then(
    (m) => m.PropertyFilters
  )
);

const DemographicsFilters = dynamic(() =>
  import('@/components/list-builder/demographics').then(
    (m) => m.DemographicsFilters
  )
);

const MortgageFilters = dynamic(() =>
  import('@/components/list-builder/mortgage-filters').then(
    (m) => m.MortgageFilters
  )
);

const ForeclosureFilters = dynamic(() =>
  import('@/components/list-builder/foreclosure-filters').then(
    (m) => m.ForeclosureFilters
  )
);

const PredictiveFilters = dynamic(() =>
  import('@/components/list-builder/predictive-filters').then(
    (m) => m.PredictiveFilters
  )
);

const OptionsFilters = dynamic(() =>
  import('@/components/list-builder/options-filters').then(
    (m) => m.OptionsFilters
  )
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
    case 'predictive':
      return (
        <PredictiveFilters
          criteria={criteria.predictive}
          onUpdate={(values) => updateCriteria('predictive', values)}
        />
      );
    case 'options':
      return <OptionsFilters />;
    default:
      return null;
  }
}
