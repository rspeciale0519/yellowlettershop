import { useState, useCallback, useEffect } from 'react';
import type { DemographicsCriteria } from '@/types/list-builder';
import { GENDER_OPTIONS } from '@/data/demographics';

interface UseDemographicsFiltersProps {
  criteria: DemographicsCriteria;
  onUpdate: (values: Partial<DemographicsCriteria>) => void;
}

export function useDemographicsFilters({
  criteria,
  onUpdate,
}: UseDemographicsFiltersProps) {
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    personal: false,
    economic: false,
    lifestyle: false,
    cultural: false,
    family: false,
  });

  const defaultCriteria: DemographicsCriteria = {
    selectedCriteria: [],
    age: [18, 100],
    gender: [],
    maritalStatus: [],
    householdSize: [1, 8],
    income: [25000, 250000],
    educationLevel: [],
    occupation: [],
    employmentStatus: [],
    homeOwnership: [],
    creditRating: [],
    lifestyle: {
      interests: [],
      hobbies: [],
      purchasingBehavior: [],
    },
    ethnicity: [],
    language: [],
    religion: [],
    politicalAffiliation: [],
    veteranStatus: [],
    childrenInHousehold: {
      hasChildren: 'any',
      ageRanges: [],
      numberOfChildren: [0, 5],
    },
    presets: [],
    activePreset: null,
  };

  const safeCriteria: DemographicsCriteria = {
    ...defaultCriteria,
    ...criteria,
  };

  // Generate selected criteria labels
  const generateSelectedCriteria = useCallback(() => {
    const selected: string[] = [];

    // Age criteria
    if (safeCriteria.age[0] > 18 || safeCriteria.age[1] < 100) {
      selected.push(`Age: ${safeCriteria.age[0]}-${safeCriteria.age[1]} years`);
    }

    // Gender
    if (safeCriteria.gender.length > 0) {
      selected.push(
        `Gender: ${safeCriteria.gender
          .map((g) => GENDER_OPTIONS.find((opt) => opt.value === g)?.label || g)
          .join(', ')}`
      );
    }

    // Other criteria...
    if (safeCriteria.maritalStatus.length > 0) {
      selected.push(
        `Marital Status: ${safeCriteria.maritalStatus.length} status(es)`
      );
    }

    if (
      safeCriteria.householdSize[0] > 1 ||
      safeCriteria.householdSize[1] < 8
    ) {
      selected.push(
        `Household Size: ${safeCriteria.householdSize[0]}-${safeCriteria.householdSize[1]} people`
      );
    }

    if (safeCriteria.income[0] > 25000 || safeCriteria.income[1] < 250000) {
      selected.push(
        `Income: $${safeCriteria.income[0].toLocaleString()}-$${safeCriteria.income[1].toLocaleString()}`
      );
    }

    if (safeCriteria.educationLevel.length > 0) {
      selected.push(
        `Education: ${safeCriteria.educationLevel.length} level(s)`
      );
    }

    if (safeCriteria.occupation.length > 0) {
      selected.push(
        `Occupation: ${safeCriteria.occupation.length} category(ies)`
      );
    }

    if (safeCriteria.employmentStatus.length > 0) {
      selected.push(
        `Employment: ${safeCriteria.employmentStatus.length} status(es)`
      );
    }

    if (safeCriteria.homeOwnership.length > 0) {
      selected.push(
        `Home Ownership: ${safeCriteria.homeOwnership.length} type(s)`
      );
    }

    if (safeCriteria.creditRating.length > 0) {
      selected.push(
        `Credit Rating: ${safeCriteria.creditRating.length} rating(s)`
      );
    }

    if (safeCriteria.lifestyle.interests.length > 0) {
      selected.push(
        `Interests: ${safeCriteria.lifestyle.interests.length} interest(s)`
      );
    }

    if (safeCriteria.lifestyle.purchasingBehavior.length > 0) {
      selected.push(
        `Purchasing: ${safeCriteria.lifestyle.purchasingBehavior.length} behavior(s)`
      );
    }

    if (safeCriteria.ethnicity.length > 0) {
      selected.push(`Ethnicity: ${safeCriteria.ethnicity.length} group(s)`);
    }

    if (safeCriteria.language.length > 0) {
      selected.push(`Language: ${safeCriteria.language.length} language(s)`);
    }

    if (safeCriteria.politicalAffiliation.length > 0) {
      selected.push(
        `Political Affiliation: ${safeCriteria.politicalAffiliation.length} affiliation(s)`
      );
    }

    if (safeCriteria.veteranStatus.length > 0) {
      selected.push(
        `Veteran Status: ${safeCriteria.veteranStatus.length} status(es)`
      );
    }

    if (safeCriteria.childrenInHousehold.hasChildren !== 'any') {
      selected.push(
        `Has Children: ${safeCriteria.childrenInHousehold.hasChildren}`
      );
    }

    if (safeCriteria.childrenInHousehold.ageRanges.length > 0) {
      selected.push(
        `Children Age Ranges: ${safeCriteria.childrenInHousehold.ageRanges.length} range(s)`
      );
    }

    return selected;
  const savePreset = () => {
    if (!presetName.trim()) return

    const existingPresetIndex = safeCriteria.presets.findIndex(
      p => p.name === presetName
    )
    const newPreset = {
      name: presetName,
      criteria: { ...safeCriteria },
    }

    const updatedPresets =
      existingPresetIndex >= 0
        ? safeCriteria.presets.map((preset, index) =>
  const loadPreset = (presetName: string) => {
    const preset = safeCriteria.presets.find((p) => p.name === presetName)
    if (preset) {
      onUpdate({ ...preset.criteria, activePreset: presetName })
    } else {
      console.warn(`Preset "${presetName}" not found`)
    }
  }    setShowPresetDialog(false)
  }    safeCriteria.ethnicity,
    safeCriteria.language,
    safeCriteria.politicalAffiliation,
    safeCriteria.veteranStatus,
    safeCriteria.childrenInHousehold.hasChildren,
    safeCriteria.childrenInHousehold.ageRanges,
  ]);

  // Update selected criteria when dependencies change
  useEffect(() => {
    const newSelectedCriteria = generateSelectedCriteria();
    if (
      JSON.stringify(newSelectedCriteria) !==
      JSON.stringify(safeCriteria.selectedCriteria)
    ) {
      onUpdate({ selectedCriteria: newSelectedCriteria });
    }
  }, [generateSelectedCriteria, safeCriteria.selectedCriteria, onUpdate]);

  const handleRemoveCriterion = (index: number) => {
    if (index < 0 || index >= safeCriteria.selectedCriteria.length) {
      console.warn(`Invalid index ${index} for removing criterion`);
      return;
    }

    const updatedCriteria = [...safeCriteria.selectedCriteria];
    updatedCriteria.splice(index, 1);
    onUpdate({ selectedCriteria: updatedCriteria });
  };
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      name: presetName,
      criteria: { ...safeCriteria },
    };

    const updatedPresets = [...safeCriteria.presets, newPreset];
    onUpdate({ presets: updatedPresets, activePreset: presetName });
    setPresetName('');
    setShowPresetDialog(false);
  };

  const loadPreset = (presetName: string) => {
    const preset = safeCriteria.presets.find((p) => p.name === presetName);
    if (preset) {
      onUpdate({ ...preset.criteria, activePreset: presetName });
    }
  };

  const deletePreset = (presetName: string) => {
    const updatedPresets = safeCriteria.presets.filter(
      (p) => p.name !== presetName
    );
    const updates: Partial<DemographicsCriteria> = { presets: updatedPresets };

    if (safeCriteria.activePreset === presetName) {
      updates.activePreset = null;
    }

    onUpdate(updates);
    setDeletePresetId(null);
  };

  return {
    safeCriteria,
    expandedSections,
    showPresetDialog,
    setShowPresetDialog,
    presetName,
    setPresetName,
    deletePresetId,
    setDeletePresetId,
    handleRemoveCriterion,
    toggleSection,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
