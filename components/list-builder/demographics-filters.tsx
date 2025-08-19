"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  X,
  Save,
  Trash2,
  Plus,
  Info,
  Users,
  Heart,
  GraduationCap,
  Briefcase,
  Home,
  CreditCard,
  Baby,
  Globe,
  BookOpen,
  Flag,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { DemographicsCriteria } from "@/types/list-builder"
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EDUCATION_LEVELS,
  OCCUPATION_CATEGORIES,
  EMPLOYMENT_STATUS,
  HOME_OWNERSHIP,
  CREDIT_RATINGS,
  INTERESTS,
  PURCHASING_BEHAVIOR,
  ETHNICITY_OPTIONS,
  LANGUAGE_OPTIONS,
  POLITICAL_AFFILIATIONS,
  VETERAN_STATUS,
  CHILDREN_AGE_RANGES,
} from "@/data/demographics"

import { DraggableSlider } from "@/components/list-builder/common/draggable-slider"
import { MultiSelect } from "@/components/list-builder/common/multi-select"

interface DemographicsFiltersProps {
  criteria: DemographicsCriteria
  onUpdate: (values: Partial<DemographicsCriteria>) => void
}

// Components moved to '@/components/list-builder/common/*'

// Components moved to '@/components/list-builder/common/*'

export function DemographicsFilters({ criteria, onUpdate }: DemographicsFiltersProps) {
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    personal: false,
    economic: false,
    lifestyle: false,
    cultural: false,
    family: false,
  })

  // Ensure criteria has default values
  const safeCriteria: DemographicsCriteria = {
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
      hasChildren: "any",
      ageRanges: [],
      numberOfChildren: [0, 5],
    },
    presets: [],
    activePreset: null,
    ...criteria,
  }

  // Generate selected criteria labels - moved outside of useEffect to prevent infinite loops
  const generateSelectedCriteria = useCallback(() => {
    const selected: string[] = []

    // Age criteria
    if (safeCriteria.age[0] > 18 || safeCriteria.age[1] < 100) {
      selected.push(`Age: ${safeCriteria.age[0]}-${safeCriteria.age[1]} years`)
    }

    // Gender
    if (safeCriteria.gender.length > 0) {
      selected.push(
        `Gender: ${safeCriteria.gender.map((g) => GENDER_OPTIONS.find((opt) => opt.value === g)?.label || g).join(", ")}`,
      )
    }

    // Marital Status
    if (safeCriteria.maritalStatus.length > 0) {
      selected.push(
        `Marital Status: ${safeCriteria.maritalStatus.map((s) => MARITAL_STATUS_OPTIONS.find((opt) => opt.value === s)?.label || s).join(", ")}`,
      )
    }

    // Household Size
    if (safeCriteria.householdSize[0] > 1 || safeCriteria.householdSize[1] < 8) {
      selected.push(`Household Size: ${safeCriteria.householdSize[0]}-${safeCriteria.householdSize[1]} people`)
    }

    // Income
    if (safeCriteria.income[0] > 25000 || safeCriteria.income[1] < 250000) {
      selected.push(`Income: $${safeCriteria.income[0].toLocaleString()}-$${safeCriteria.income[1].toLocaleString()}`)
    }

    // Education
    if (safeCriteria.educationLevel.length > 0) {
      selected.push(`Education: ${safeCriteria.educationLevel.length} level(s)`)
    }

    // Add other criteria...
    if (safeCriteria.occupation.length > 0) {
      selected.push(`Occupation: ${safeCriteria.occupation.length} category(ies)`)
    }

    if (safeCriteria.employmentStatus.length > 0) {
      selected.push(`Employment: ${safeCriteria.employmentStatus.length} status(es)`)
    }

    if (safeCriteria.homeOwnership.length > 0) {
      selected.push(`Home Ownership: ${safeCriteria.homeOwnership.length} type(s)`)
    }

    if (safeCriteria.creditRating.length > 0) {
      selected.push(`Credit Rating: ${safeCriteria.creditRating.length} rating(s)`)
    }

    if (safeCriteria.lifestyle.interests.length > 0) {
      selected.push(`Interests: ${safeCriteria.lifestyle.interests.length} interest(s)`)
    }

    if (safeCriteria.lifestyle.purchasingBehavior.length > 0) {
      selected.push(`Purchasing Behavior: ${safeCriteria.lifestyle.purchasingBehavior.length} behavior(s)`)
    }

    if (safeCriteria.ethnicity.length > 0) {
      selected.push(`Ethnicity: ${safeCriteria.ethnicity.length} group(s)`)
    }

    if (safeCriteria.language.length > 0) {
      selected.push(`Language: ${safeCriteria.language.length} language(s)`)
    }

    if (safeCriteria.politicalAffiliation.length > 0) {
      selected.push(`Political Affiliation: ${safeCriteria.politicalAffiliation.length} affiliation(s)`)
    }

    if (safeCriteria.veteranStatus.length > 0) {
      selected.push(`Veteran Status: ${safeCriteria.veteranStatus.length} status(es)`)
    }

    if (safeCriteria.childrenInHousehold.hasChildren !== "any") {
      selected.push(`Has Children: ${safeCriteria.childrenInHousehold.hasChildren}`)
    }

    if (safeCriteria.childrenInHousehold.ageRanges.length > 0) {
      selected.push(`Children Age Ranges: ${safeCriteria.childrenInHousehold.ageRanges.length} range(s)`)
    }

    return selected
  }, [
    safeCriteria.age,
    safeCriteria.gender,
    safeCriteria.maritalStatus,
    safeCriteria.householdSize,
    safeCriteria.income,
    safeCriteria.educationLevel,
    safeCriteria.occupation,
    safeCriteria.employmentStatus,
    safeCriteria.homeOwnership,
    safeCriteria.creditRating,
    safeCriteria.lifestyle.interests,
    safeCriteria.lifestyle.purchasingBehavior,
    safeCriteria.ethnicity,
    safeCriteria.language,
    safeCriteria.politicalAffiliation,
    safeCriteria.veteranStatus,
    safeCriteria.childrenInHousehold.hasChildren,
    safeCriteria.childrenInHousehold.ageRanges,
  ])

  // Update selected criteria only when dependencies change
  useEffect(() => {
    const newSelectedCriteria = generateSelectedCriteria()
    // Only update if the criteria have actually changed
    if (JSON.stringify(newSelectedCriteria) !== JSON.stringify(safeCriteria.selectedCriteria)) {
      onUpdate({ selectedCriteria: newSelectedCriteria })
    }
  }, [generateSelectedCriteria, safeCriteria.selectedCriteria, onUpdate])

  const handleRemoveCriterion = (index: number) => {
    // This would require more complex logic to map back to specific criteria
    // For now, we'll show a simple implementation
    const newSelected = safeCriteria.selectedCriteria.filter((_, i) => i !== index)
    onUpdate({ selectedCriteria: newSelected })
  }

  const savePreset = () => {
    if (!presetName.trim()) return

    const newPreset = {
      name: presetName,
      criteria: { ...safeCriteria },
    }

    const updatedPresets = [...safeCriteria.presets, newPreset]
    onUpdate({ presets: updatedPresets, activePreset: presetName })
    setPresetName("")
    setShowPresetDialog(false)
  }

  const loadPreset = (presetName: string) => {
    const preset = safeCriteria.presets.find((p) => p.name === presetName)
    if (preset) {
      onUpdate({ ...preset.criteria, activePreset: presetName })
    }
  }

  const deletePreset = (presetName: string) => {
    const updatedPresets = safeCriteria.presets.filter((p) => p.name !== presetName)
    const newActivePreset = safeCriteria.activePreset === presetName ? null : safeCriteria.activePreset
    onUpdate({ presets: updatedPresets, activePreset: newActivePreset })
    setDeletePresetId(null)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Active Demographics Criteria */}
        {safeCriteria.selectedCriteria.length > 0 && (
          <Card className="bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-600" />
                Active Demographics Criteria
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {safeCriteria.selectedCriteria.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {safeCriteria.selectedCriteria.map((criterion, index) => (
                  <Badge key={index} variant="outline" className="bg-white/50 border-yellow-300">
                    {criterion}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-yellow-200"
                      onClick={() => handleRemoveCriterion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presets Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Demographics Presets
              </span>
              <div className="flex gap-2">
                <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Save Preset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Demographics Preset</DialogTitle>
                      <DialogDescription>
                        Save your current demographics criteria as a preset for future use.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preset-name">Preset Name</Label>
                        <Input
                          id="preset-name"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Enter preset name..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={savePreset} disabled={!presetName.trim()}>
                        Save Preset
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          {safeCriteria.presets.length > 0 && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {safeCriteria.presets.map((preset) => (
                  <div key={preset.name} className="flex items-center gap-1">
                    <Button
                      variant={safeCriteria.activePreset === preset.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => loadPreset(preset.name)}
                      className={safeCriteria.activePreset === preset.name ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      {preset.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletePresetId(preset.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Basic Demographics */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("basic")}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Basic Demographics
              </span>
              {expandedSections.basic ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>Age, gender, and household characteristics</CardDescription>
          </CardHeader>
          {expandedSections.basic && (
            <CardContent className="space-y-6">
              <DraggableSlider
                label="Age Range"
                value={safeCriteria.age}
                min={18}
                max={100}
                step={1}
                formatValue={(value) => `${value} years`}
                onChange={(value) => onUpdate({ age: value })}
                ariaLabel="Age range selector"
                icon={<Users className="h-4 w-4 text-blue-600" />}
                tooltip="Target recipients within this age range"
              />

              <MultiSelect
                label="Gender"
                options={GENDER_OPTIONS}
                selected={safeCriteria.gender}
                onChange={(selected) => onUpdate({ gender: selected })}
                icon={<Users className="h-4 w-4 text-blue-600" />}
                tooltip="Select specific gender demographics"
              />

              <MultiSelect
                label="Marital Status"
                options={MARITAL_STATUS_OPTIONS}
                selected={safeCriteria.maritalStatus}
                onChange={(selected) => onUpdate({ maritalStatus: selected })}
                icon={<Heart className="h-4 w-4 text-blue-600" />}
                tooltip="Target based on relationship status"
              />

              <DraggableSlider
                label="Household Size"
                value={safeCriteria.householdSize}
                min={1}
                max={8}
                step={1}
                formatValue={(value) => `${value} ${value === 1 ? "person" : "people"}`}
                onChange={(value) => onUpdate({ householdSize: value })}
                ariaLabel="Household size selector"
                icon={<Home className="h-4 w-4 text-blue-600" />}
                tooltip="Number of people living in the household"
              />
            </CardContent>
          )}
        </Card>

        {/* Economic Demographics */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("economic")}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                Economic Demographics
              </span>
              {expandedSections.economic ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>Income, employment, education, and financial status</CardDescription>
          </CardHeader>
          {expandedSections.economic && (
            <CardContent className="space-y-6">
              <DraggableSlider
                label="Household Income"
                value={safeCriteria.income}
                min={25000}
                max={250000}
                step={5000}
                formatValue={(value) => `$${value.toLocaleString()}/yr`}
                onChange={(value) => onUpdate({ income: value })}
                ariaLabel="Income range selector"
                icon={<Briefcase className="h-4 w-4 text-green-600" />}
                tooltip="Annual household income range"
              />

              <MultiSelect
                label="Education Level"
                options={EDUCATION_LEVELS}
                selected={safeCriteria.educationLevel}
                onChange={(selected) => onUpdate({ educationLevel: selected })}
                icon={<GraduationCap className="h-4 w-4 text-green-600" />}
                tooltip="Highest level of education completed"
              />

              <MultiSelect
                label="Occupation Category"
                options={OCCUPATION_CATEGORIES}
                selected={safeCriteria.occupation}
                onChange={(selected) => onUpdate({ occupation: selected })}
                icon={<Briefcase className="h-4 w-4 text-green-600" />}
                tooltip="Professional occupation categories"
              />

              <MultiSelect
                label="Employment Status"
                options={EMPLOYMENT_STATUS}
                selected={safeCriteria.employmentStatus}
                onChange={(selected) => onUpdate({ employmentStatus: selected })}
                icon={<Briefcase className="h-4 w-4 text-green-600" />}
                tooltip="Current employment situation"
              />

              <MultiSelect
                label="Home Ownership"
                options={HOME_OWNERSHIP}
                selected={safeCriteria.homeOwnership}
                onChange={(selected) => onUpdate({ homeOwnership: selected })}
                icon={<Home className="h-4 w-4 text-green-600" />}
                tooltip="Housing ownership status"
              />

              <MultiSelect
                label="Credit Rating"
                options={CREDIT_RATINGS}
                selected={safeCriteria.creditRating}
                onChange={(selected) => onUpdate({ creditRating: selected })}
                icon={<CreditCard className="h-4 w-4 text-green-600" />}
                tooltip="Credit score ranges"
              />
            </CardContent>
          )}
        </Card>

        {/* Lifestyle & Interests */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("lifestyle")}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-600" />
                Lifestyle & Interests
              </span>
              {expandedSections.lifestyle ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>Hobbies, interests, and purchasing behavior</CardDescription>
          </CardHeader>
          {expandedSections.lifestyle && (
            <CardContent className="space-y-6">
              <MultiSelect
                label="Interests & Hobbies"
                options={INTERESTS}
                selected={safeCriteria.lifestyle.interests}
                onChange={(selected) =>
                  onUpdate({
                    lifestyle: { ...safeCriteria.lifestyle, interests: selected },
                  })
                }
                icon={<Heart className="h-4 w-4 text-purple-600" />}
                tooltip="Personal interests and hobbies"
              />

              <MultiSelect
                label="Purchasing Behavior"
                options={PURCHASING_BEHAVIOR}
                selected={safeCriteria.lifestyle.purchasingBehavior}
                onChange={(selected) =>
                  onUpdate({
                    lifestyle: { ...safeCriteria.lifestyle, purchasingBehavior: selected },
                  })
                }
                icon={<CreditCard className="h-4 w-4 text-purple-600" />}
                tooltip="Shopping and purchasing patterns"
              />
            </CardContent>
          )}
        </Card>

        {/* Cultural Demographics */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("cultural")}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-600" />
                Cultural Demographics
              </span>
              {expandedSections.cultural ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>Ethnicity, language, and cultural preferences</CardDescription>
          </CardHeader>
          {expandedSections.cultural && (
            <CardContent className="space-y-6">
              <MultiSelect
                label="Ethnicity"
                options={ETHNICITY_OPTIONS}
                selected={safeCriteria.ethnicity}
                onChange={(selected) => onUpdate({ ethnicity: selected })}
                icon={<Globe className="h-4 w-4 text-orange-600" />}
                tooltip="Ethnic background and heritage"
              />

              <MultiSelect
                label="Primary Language"
                options={LANGUAGE_OPTIONS}
                selected={safeCriteria.language}
                onChange={(selected) => onUpdate({ language: selected })}
                icon={<BookOpen className="h-4 w-4 text-orange-600" />}
                tooltip="Primary language spoken at home"
              />

              <MultiSelect
                label="Political Affiliation"
                options={POLITICAL_AFFILIATIONS}
                selected={safeCriteria.politicalAffiliation}
                onChange={(selected) => onUpdate({ politicalAffiliation: selected })}
                icon={<Flag className="h-4 w-4 text-orange-600" />}
                tooltip="Political party affiliation or preference"
              />

              <MultiSelect
                label="Veteran Status"
                options={VETERAN_STATUS}
                selected={safeCriteria.veteranStatus}
                onChange={(selected) => onUpdate({ veteranStatus: selected })}
                icon={<Shield className="h-4 w-4 text-orange-600" />}
                tooltip="Military service status"
              />
            </CardContent>
          )}
        </Card>

        {/* Family Demographics */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("family")}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-pink-600" />
                Family Demographics
              </span>
              {expandedSections.family ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>Children and family composition</CardDescription>
          </CardHeader>
          {expandedSections.family && (
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-pink-600" />
                  <Label className="font-medium">Has Children in Household</Label>
                </div>
                <RadioGroup
                  value={safeCriteria.childrenInHousehold.hasChildren}
                  onValueChange={(value) =>
                    onUpdate({
                      childrenInHousehold: {
                        ...safeCriteria.childrenInHousehold,
                        hasChildren: value as "yes" | "no" | "any",
                      },
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="children-any" />
                    <Label htmlFor="children-any">Any</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="children-yes" />
                    <Label htmlFor="children-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="children-no" />
                    <Label htmlFor="children-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {safeCriteria.childrenInHousehold.hasChildren === "yes" && (
                <>
                  <MultiSelect
                    label="Children Age Ranges"
                    options={CHILDREN_AGE_RANGES}
                    selected={safeCriteria.childrenInHousehold.ageRanges}
                    onChange={(selected) =>
                      onUpdate({
                        childrenInHousehold: {
                          ...safeCriteria.childrenInHousehold,
                          ageRanges: selected,
                        },
                      })
                    }
                    icon={<Baby className="h-4 w-4 text-pink-600" />}
                    tooltip="Age ranges of children in household"
                  />

                  <DraggableSlider
                    label="Number of Children"
                    value={safeCriteria.childrenInHousehold.numberOfChildren}
                    min={0}
                    max={5}
                    step={1}
                    formatValue={(value) => `${value} ${value === 1 ? "child" : "children"}`}
                    onChange={(value) =>
                      onUpdate({
                        childrenInHousehold: {
                          ...safeCriteria.childrenInHousehold,
                          numberOfChildren: value,
                        },
                      })
                    }
                    ariaLabel="Number of children selector"
                    icon={<Baby className="h-4 w-4 text-pink-600" />}
                    tooltip="Total number of children in household"
                  />
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Delete Preset Confirmation */}
        <AlertDialog open={!!deletePresetId} onOpenChange={() => setDeletePresetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Preset</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the preset "{deletePresetId}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePresetId && deletePreset(deletePresetId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
