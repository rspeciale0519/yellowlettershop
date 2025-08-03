"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, ChevronDown, ChevronUp, Plus, X, Info, AlertTriangle, Map } from "lucide-react"
import type { GeographyCriteria } from "@/types/list-builder"

// Complete list of all 50 US states
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

const GEOGRAPHY_CRITERIA_OPTIONS = [
  { value: "state", label: "State", description: "Select one or multiple states" },
  { value: "area-code", label: "Area Code", description: "Target properties by telephone area code" },
  { value: "census-tract", label: "Census Tract", description: "Filter by census tract numbers" },
  { value: "city", label: "City", description: "Select specific cities within states" },
  { value: "county", label: "County", description: "Filter by county boundaries" },
  { value: "fips-code", label: "FIPS Code", description: "Federal Information Processing Standard codes" },
  { value: "msa", label: "MSA (Metropolitan Statistical Area)", description: "Metropolitan statistical areas" },
  { value: "map-book-page", label: "Map Book Page/Grid", description: "Local map book references" },
  { value: "map-search", label: "Map Search", description: "Interactive map selection with custom shapes" },
  { value: "municipality", label: "Municipality/Township", description: "Municipal and township boundaries" },
  { value: "parcel-id", label: "Parcel ID Range", description: "Property parcel identification ranges" },
  { value: "scf", label: "SCF (Sectional Center Facility)", description: "First three digits of ZIP codes" },
  { value: "street-name", label: "Street Name", description: "Specific street segments with house numbers" },
  { value: "subdivision", label: "Subdivision", description: "Named subdivisions and developments" },
  { value: "tax-rate-area", label: "Tax Rate Area", description: "Tax millage code areas" },
  { value: "trs", label: "Township-Range-Section (TRS)", description: "Public Land Survey System coordinates" },
  { value: "tract", label: "Tract", description: "Local tract numbers" },
  { value: "zip-radius", label: "ZIP + Radius", description: "ZIP code with radius in miles" },
  { value: "zip-code", label: "ZIP Code", description: "Specific ZIP codes or ranges" },
]

interface GeographyFiltersProps {
  criteria: GeographyCriteria
  onUpdate: (values: Partial<GeographyCriteria>) => void
}

export function GeographyFilters({ criteria, onUpdate }: GeographyFiltersProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>("")
  const [expandedPanels, setExpandedPanels] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedCounty, setSelectedCounty] = useState<string>("")
  const [zipInput, setZipInput] = useState("")
  const [zipRangeInput, setZipRangeInput] = useState("")

  const addCriterion = useCallback(() => {
    if (selectedCriterion && !criteria.selectedCriteria.includes(selectedCriterion)) {
      onUpdate({
        selectedCriteria: [...criteria.selectedCriteria, selectedCriterion],
      })
      setExpandedPanels((prev) => [...prev, selectedCriterion])
      setSelectedCriterion("")
    }
  }, [selectedCriterion, criteria.selectedCriteria, onUpdate])

  const removeCriterion = useCallback(
    (criterion: string) => {
      onUpdate({
        selectedCriteria: criteria.selectedCriteria.filter((c) => c !== criterion),
      })
      setExpandedPanels((prev) => prev.filter((p) => p !== criterion))

      // Clear related data when removing state criterion
      if (criterion === "state") {
        onUpdate({ states: [] })
      }
    },
    [criteria.selectedCriteria, onUpdate],
  )

  const togglePanel = useCallback((criterion: string) => {
    setExpandedPanels((prev) => (prev.includes(criterion) ? prev.filter((p) => p !== criterion) : [...prev, criterion]))
  }, [])

  const handleStateChange = useCallback(
    (state: string, checked: boolean) => {
      const newStates = checked ? [...criteria.states, state] : criteria.states.filter((s) => s !== state)
      onUpdate({ states: newStates })
    },
    [criteria.states, onUpdate],
  )

  const addZipCode = useCallback(() => {
    if (zipInput && /^\d{5}$/.test(zipInput) && !criteria.zipCodes.includes(zipInput)) {
      onUpdate({ zipCodes: [...criteria.zipCodes, zipInput] })
      setZipInput("")
    }
  }, [zipInput, criteria.zipCodes, onUpdate])

  const addZipRange = useCallback(() => {
    if (zipRangeInput) {
      // Parse comma-separated ZIP codes and ranges
      const zips = zipRangeInput
        .split(",")
        .map((z) => z.trim())
        .filter((z) => z)
      const validZips = zips.filter((z) => /^\d{5}(-\d{5})?$/.test(z))
      const newZips = [...new Set([...criteria.zipCodes, ...validZips])]
      onUpdate({ zipCodes: newZips })
      setZipRangeInput("")
    }
  }, [zipRangeInput, criteria.zipCodes, onUpdate])

  const removeZipCode = useCallback(
    (zipToRemove: string) => {
      onUpdate({ zipCodes: criteria.zipCodes.filter((zip) => zip !== zipToRemove) })
    },
    [criteria.zipCodes, onUpdate],
  )

  const renderCriterionPanel = (criterion: string) => {
    const isExpanded = expandedPanels.includes(criterion)
    const criterionData = GEOGRAPHY_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)

    if (!criterionData) return null

    return (
      <Card key={criterion} className="border-l-4 border-l-yellow-500">
        <Collapsible open={isExpanded} onOpenChange={() => togglePanel(criterion)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">{criterionData.label}</CardTitle>
                  <CardDescription className="text-sm">{criterionData.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCriterion(criterion)
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>{renderCriterionContent(criterion)}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  const renderCriterionContent = (criterion: string) => {
    switch (criterion) {
      case "state":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-md max-h-64 overflow-y-auto">
              {US_STATES.map((state) => (
                <div key={state} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`state-${state}`}
                    checked={criteria.states.includes(state)}
                    onChange={(e) => handleStateChange(state, e.target.checked)}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor={`state-${state}`} className="text-sm font-medium leading-none cursor-pointer">
                    {state}
                  </label>
                </div>
              ))}
            </div>
            {criteria.states.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {criteria.states.map((state) => (
                  <Badge key={state} variant="secondary">
                    {state}
                    <button
                      onClick={() => handleStateChange(state, false)}
                      className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                      aria-label={`Remove ${state}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )

      case "zip-code":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zip-single">Add Single ZIP Code</Label>
              <div className="flex gap-2">
                <Input
                  id="zip-single"
                  placeholder="e.g., 90210"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addZipCode()}
                  maxLength={5}
                  pattern="\d{5}"
                />
                <Button onClick={addZipCode} disabled={!zipInput || !/^\d{5}$/.test(zipInput)}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip-range">Add Multiple ZIP Codes or Ranges</Label>
              <div className="flex gap-2">
                <Input
                  id="zip-range"
                  placeholder="e.g., 90210, 90211-90215, 91001"
                  value={zipRangeInput}
                  onChange={(e) => setZipRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addZipRange()}
                />
                <Button onClick={addZipRange} disabled={!zipRangeInput}>
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Separate multiple ZIP codes with commas. Use hyphens for ranges (e.g., 90210-90215).
              </p>
            </div>

            {criteria.zipCodes.length > 0 && (
              <div className="space-y-2">
                <Label>Selected ZIP Codes ({criteria.zipCodes.length})</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                  {criteria.zipCodes.map((zip) => (
                    <Badge key={zip} variant="secondary">
                      {zip}
                      <button
                        onClick={() => removeZipCode(zip)}
                        className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                        aria-label={`Remove ZIP ${zip}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "zip-radius":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter a ZIP code and select a radius to include all properties within that distance.
            </p>
            <ZipRadiusSelector criteria={criteria} onUpdate={onUpdate} />
          </div>
        )

      case "city":
        return (
          <div className="space-y-4">
            <StateCountySelector
              selectedState={selectedState}
              onStateChange={setSelectedState}
              selectedCounty={selectedCounty}
              onCountyChange={setSelectedCounty}
              showCounty={false}
            />
            {selectedState && <CitySelector state={selectedState} criteria={criteria} onUpdate={onUpdate} />}
          </div>
        )

      case "county":
        return (
          <div className="space-y-4">
            <StateCountySelector
              selectedState={selectedState}
              onStateChange={setSelectedState}
              selectedCounty={selectedCounty}
              onCountyChange={setSelectedCounty}
              showCounty={true}
            />
          </div>
        )

      case "map-search":
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use our interactive map to draw custom shapes or set radius areas for precise geographic targeting.
              </p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <Map className="h-4 w-4 mr-2" />
              Open Interactive Map
            </Button>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Map functionality will open in a new window where you can draw polygons or set radius areas.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configuration options for {GEOGRAPHY_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)?.label} will
              be available here.
            </p>
          </div>
        )
    }
  }

  // Check if at least one geographic criterion is selected
  const hasGeographicCriteria =
    criteria.states.length > 0 ||
    criteria.zipCodes.length > 0 ||
    criteria.cities.length > 0 ||
    criteria.counties.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-yellow-500" />
          Geography
        </CardTitle>
        <CardDescription>
          Define the location of the properties for your mailing list. At least one geographic criterion is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasGeographicCriteria && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select at least one geographic criterion to define your target area.
            </AlertDescription>
          </Alert>
        )}

        {/* Geographic Criteria Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Geographic Criteria</Label>
          <div className="flex gap-2">
            <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose geographic criteria..." />
              </SelectTrigger>
              <SelectContent>
                {GEOGRAPHY_CRITERIA_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={criteria.selectedCriteria.includes(option.value)}
                  >
                    {option.label}
                    {criteria.selectedCriteria.includes(option.value) && " (Added)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addCriterion}
              disabled={!selectedCriterion || criteria.selectedCriteria.includes(selectedCriterion)}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Selected Criteria Panels */}
        {criteria.selectedCriteria.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Selected Criteria</Label>
              <div className="flex flex-wrap gap-1">
                {criteria.selectedCriteria.map((criterion) => (
                  <Badge key={criterion} variant="secondary" className="text-xs">
                    {GEOGRAPHY_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)?.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3">{criteria.selectedCriteria.map(renderCriterionPanel)}</div>
          </div>
        )}

        {criteria.selectedCriteria.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select geographic criteria above to begin filtering properties by location attributes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Helper Components
interface StateCountySelectorProps {
  selectedState: string
  onStateChange: (state: string) => void
  selectedCounty: string
  onCountyChange: (county: string) => void
  showCounty: boolean
}

function StateCountySelector({
  selectedState,
  onStateChange,
  selectedCounty,
  onCountyChange,
  showCounty,
}: StateCountySelectorProps) {
  // Mock county data - in real app, this would be fetched based on state
  const counties = selectedState ? ["County A", "County B", "County C", "County D", "County E"] : []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select State</Label>
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a state..." />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCounty && selectedState && (
        <div className="space-y-2">
          <Label>Select County</Label>
          <Select value={selectedCounty} onValueChange={onCountyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a county..." />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

interface ZipRadiusSelectorProps {
  criteria: GeographyCriteria
  onUpdate: (values: Partial<GeographyCriteria>) => void
}

function ZipRadiusSelector({ criteria, onUpdate }: ZipRadiusSelectorProps) {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState("5")

  const addZipRadius = () => {
    if (zipCode && /^\d{5}$/.test(zipCode) && radius) {
      const newEntry = { zip: zipCode, radius: Number(radius) }
      const existing = criteria.zipRadius.find((zr) => zr.zip === zipCode)

      if (!existing) {
        onUpdate({ zipRadius: [...criteria.zipRadius, newEntry] })
        setZipCode("")
        setRadius("5")
      }
    }
  }

  const removeZipRadius = (zipToRemove: string) => {
    onUpdate({ zipRadius: criteria.zipRadius.filter((zr) => zr.zip !== zipToRemove) })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label htmlFor="zip-radius-code">ZIP Code</Label>
          <Input
            id="zip-radius-code"
            placeholder="90210"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
            pattern="\d{5}"
          />
        </div>
        <div>
          <Label htmlFor="radius-miles">Radius (miles)</Label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => i + 1).map((mile) => (
                <SelectItem key={mile} value={mile.toString()}>
                  {mile} mile{mile !== 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={addZipRadius} disabled={!zipCode || !/^\d{5}$/.test(zipCode)} className="w-full">
        Add ZIP + Radius
      </Button>

      {criteria.zipRadius.length > 0 && (
        <div className="space-y-2">
          <Label>Selected ZIP + Radius Combinations</Label>
          <div className="space-y-2">
            {criteria.zipRadius.map((zr, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">
                  {zr.zip} + {zr.radius} mile{zr.radius !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeZipRadius(zr.zip)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CitySelectorProps {
  state: string
  criteria: GeographyCriteria
  onUpdate: (values: Partial<GeographyCriteria>) => void
}

function CitySelector({ state, criteria, onUpdate }: CitySelectorProps) {
  // Mock city data - in real app, this would be fetched based on state
  const availableCities = ["City A", "City B", "City C", "City D", "City E", "City F", "City G", "City H"]

  const handleCityChange = (city: string, checked: boolean) => {
    const newCities = checked ? [...criteria.cities, city] : criteria.cities.filter((c) => c !== city)
    onUpdate({ cities: newCities })
  }

  return (
    <div className="space-y-4">
      <Label>Available Cities in {state}</Label>
      <div className="grid grid-cols-2 gap-4 p-4 border rounded-md max-h-48 overflow-y-auto">
        {availableCities.map((city) => (
          <div key={city} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`city-${city}`}
              checked={criteria.cities.includes(city)}
              onChange={(e) => handleCityChange(city, e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor={`city-${city}`} className="text-sm font-medium leading-none cursor-pointer">
              {city}
            </label>
          </div>
        ))}
      </div>

      {criteria.cities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {criteria.cities.map((city) => (
            <Badge key={city} variant="secondary">
              {city}
              <button
                onClick={() => handleCityChange(city, false)}
                className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                aria-label={`Remove ${city}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
