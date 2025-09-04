'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { StateSelector } from './StateSelector';
import { StateCountySelector } from './CountySelector';
import { ZipCodeFilter, ZipRadiusSelector } from './ZipCodeFilter';
import { MapView } from './MapView';
import { CitySelector } from './CitySelector';
import { GEOGRAPHY_CRITERIA_OPTIONS } from './constants';
import type { GeographyCriteria } from '@/types/list-builder';

interface GeographyFiltersProps {
  criteria: GeographyCriteria;
  onUpdate: (values: Partial<GeographyCriteria>) => void;
}

export function GeographyFilters({
  criteria,
  onUpdate,
}: GeographyFiltersProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>('');
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');

  const addCriterion = useCallback(() => {
    const currentCriteria = criteria?.selectedCriteria || [];
    if (
      selectedCriterion &&
      !currentCriteria.includes(selectedCriterion)
    ) {
      onUpdate({
        selectedCriteria: [...currentCriteria, selectedCriterion],
      });
      setExpandedPanels((prev) => [...prev, selectedCriterion]);
      setSelectedCriterion('');
    }
  }, [selectedCriterion, criteria?.selectedCriteria, onUpdate]);

  const removeCriterion = useCallback(
    (criterion: string) => {
      const currentCriteria = criteria?.selectedCriteria || [];
      onUpdate({
        selectedCriteria: currentCriteria.filter(
          (c) => c !== criterion
        ),
      });
      setExpandedPanels((prev) => prev.filter((p) => p !== criterion));

      // Clear related data when removing state criterion
      if (criterion === 'state') {
        onUpdate({ states: [] });
      } else if (criterion === 'zip-code') {
        onUpdate({ zipCodes: [] });
      } else if (criterion === 'city') {
        onUpdate({ cities: [] });
      } else if (criterion === 'county') {
        onUpdate({ counties: [] });
      }
    },
    [criteria?.selectedCriteria, onUpdate]
  );

  const togglePanel = useCallback((criterion: string) => {
    setExpandedPanels((prev) =>
      prev.includes(criterion)
        ? prev.filter((p) => p !== criterion)
        : [...prev, criterion]
    );
  }, []);

  const renderCriterionPanel = (criterion: string) => {
    const isExpanded = expandedPanels.includes(criterion);
    const criterionData = GEOGRAPHY_CRITERIA_OPTIONS.find(
      (opt) => opt.value === criterion
    );

    if (!criterionData) return null;

    return (
      <Card key={criterion} className='border-l-4 border-l-yellow-500'>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => togglePanel(criterion)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className='cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-base font-medium'>
                    {criterionData.label}
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    {criterionData.description}
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCriterion(criterion);
                    }}
                    className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className='h-4 w-4' />
                  ) : (
                    <ChevronDown className='h-4 w-4' />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>{renderCriterionContent(criterion)}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const renderCriterionContent = (criterion: string) => {
    switch (criterion) {
      case 'state':
        return <StateSelector criteria={criteria} onUpdate={onUpdate} />;

      case 'zip-code':
        return <ZipCodeFilter criteria={criteria} onUpdate={onUpdate} />;

      case 'zip-radius':
        return (
          <div className='space-y-4'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Select a center ZIP and radius to target properties within that distance.
            </p>
            <ZipRadiusSelector criteria={criteria} onUpdate={onUpdate} />
          </div>
        );

      case 'city':
        return (
          <div className='space-y-4'>
            <StateCountySelector
              selectedState={selectedState}
              onStateChange={setSelectedState}
              selectedCounty={selectedCounty}
              onCountyChange={setSelectedCounty}
              showCounty={false}
            />
            {selectedState && (
              <CitySelector
                state={selectedState}
                criteria={criteria}
                onUpdate={onUpdate}
              />
            )}
          </div>
        );

      case 'county':
        return (
          <div className='space-y-4'>
            <StateCountySelector
              selectedState={selectedState}
              onStateChange={setSelectedState}
              selectedCounty={selectedCounty}
              onCountyChange={setSelectedCounty}
              showCounty={true}
            />
          </div>
        );

      case 'map-search':
        return <MapView />;

      default:
        return (
          <div className='text-center py-8'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Configuration options for{' '}
              {
                GEOGRAPHY_CRITERIA_OPTIONS.find(
                  (opt) => opt.value === criterion
                )?.label
              }{' '}
              will be available here.
            </p>
          </div>
        );
    }
  };

  // Check if at least one geographic criterion is selected
  const hasGeographicCriteria =
    (criteria?.states?.length || 0) > 0 ||
    (criteria?.zipCodes?.length || 0) > 0 ||
    (criteria?.cities?.length || 0) > 0 ||
    (criteria?.counties?.length || 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5 text-yellow-500' />
          Geography
        </CardTitle>
        <CardDescription>
          Define the location of the properties for your mailing list. At least
          one geographic criterion is required.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {!hasGeographicCriteria && (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Please select at least one geographic criterion to define your
              target area.
            </AlertDescription>
          </Alert>
        )}

        {/* Geographic Criteria Selection */}
        <div className='space-y-4'>
          <Label className='text-base font-semibold'>Geographic Criteria</Label>
          <div className='flex gap-2'>
            <Select
              value={selectedCriterion}
              onValueChange={setSelectedCriterion}
            >
              <SelectTrigger className='flex-1'>
                <SelectValue placeholder='Choose geographic criteria...' />
              </SelectTrigger>
              <SelectContent>
                {GEOGRAPHY_CRITERIA_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={(criteria?.selectedCriteria || []).includes(option.value)}
                  >
                    {option.label}
                    {(criteria?.selectedCriteria || []).includes(option.value) &&
                      ' (Added)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addCriterion}
              disabled={
                !selectedCriterion ||
(criteria?.selectedCriteria || []).includes(selectedCriterion)
              }
              className='bg-yellow-500 hover:bg-yellow-600 text-gray-900'
            >
              <Plus className='h-4 w-4 mr-1' />
              Add
            </Button>
          </div>
        </div>

        {/* Selected Criteria Panels */}
        {(criteria?.selectedCriteria?.length || 0) > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-semibold'>
                Selected Criteria
              </Label>
              <div className='flex flex-wrap gap-1'>
                {(criteria?.selectedCriteria || []).map((criterion) => (
                  <Badge
                    key={criterion}
                    variant='secondary'
                    className='text-xs'
                  >
                    {
                      GEOGRAPHY_CRITERIA_OPTIONS.find(
                        (opt) => opt.value === criterion
                      )?.label
                    }
                  </Badge>
                ))}
              </div>
            </div>
            <div className='space-y-3'>
              {(criteria?.selectedCriteria || []).map(renderCriterionPanel)}
            </div>
          </div>
        )}

        {(criteria?.selectedCriteria?.length || 0) === 0 && (
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              Select geographic criteria above to begin filtering properties by
              location attributes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
