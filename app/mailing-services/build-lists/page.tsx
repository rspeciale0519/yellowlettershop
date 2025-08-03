"use client"

import { useState, useMemo } from "react"
import { ListSummary } from "@/components/list-builder/list-summary"
import { CriteriaAccordion } from "@/components/list-builder/criteria-accordion"
import { GeographyFilters } from "@/components/list-builder/geography-filters"
import { PropertyFilters } from "@/components/list-builder/property-filters"
import { DemographicsFilters } from "@/components/list-builder/demographics-filters"
import { MortgageFilters } from "@/components/list-builder/mortgage-filters"
import { ForeclosureFilters } from "@/components/list-builder/foreclosure-filters"
import { PredictiveFilters } from "@/components/list-builder/predictive-filters"
import { OptionsFilters } from "@/components/list-builder/options-filters"
import { Button } from "@/components/ui/button"
import { Save, ShoppingCart, Trash2 } from "lucide-react"
import type { Criteria, ListCriteria } from "@/types/list-builder"

const initialCriteria: ListCriteria = {
  geography: {
    states: [],
    zipCodes: [],
    cities: [],
    counties: [],
    areaCodes: [],
    censusTract: [],
    fipsCodes: [],
    msa: [],
    mapBookPage: [],
    mapSearch: [],
    municipality: [],
    parcelIdRange: [],
    scf: [],
    streetName: [],
    subdivision: [],
    taxRateArea: [],
    townshipRangeSection: [],
    tract: [],
    zipRadius: [],
    selectedCriteria: [],
  },
  property: {
    propertyTypes: [],
    yearBuilt: [1900, new Date().getFullYear()],
    squareFootage: [500, 10000],
    bedrooms: [1, 8],
    bathrooms: [1, 8],
    lotSize: [0.1, 10],
    propertyValue: [50000, 2000000],
  },
  demographics: {
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
  },
  mortgage: {
    lienPosition: "all",
    selectedCriteria: [],
    mortgageAmount: null,
    interestRate: null,
    loanToValue: null,
    mortgageOriginationDate: null,
    maturityDate: null,
    mortgageTerm: [],
    primaryLoanType: [],
    lenderOrigination: [],
    lenderAssigned: [],
    adjustableRateRider: {
      selectedSubCriteria: null,
      interestOnly: "no-preference",
      interestRateChangeLimit: [],
      interestRateChange: [],
      interestRateChangeDate: { type: "initial", dates: [] },
      interestRateChangeFrequency: [],
      interestRateIndexType: [],
      interestRateMaximum: [],
      negativeAmortization: "no-preference",
      paymentOption: "no-preference",
      prepaymentPenalty: "no-preference",
      prepaymentPenaltyExpireDate: [],
    },
    balloonLoan: "no-preference",
    creditLineLoan: "no-preference",
    equityLoan: "no-preference",
    maturedMortgage: "no-preference",
  },
  foreclosure: {
    selectedCriteria: [],
    foreclosureStatus: [],
    foreclosureDate: null,
    foreclosureAmount: null,
    lenderNames: [],
    currentOwners: [],
    propertyAddresses: [],
    auctionDate: null,
    noticeTypes: [],
    trusteeNames: [],
    caseNumbers: [],
  },
  predictive: {
    selectedModel: null,
    modelScores: {},
    selectedCriteria: [],
  },
  options: {
    selectedCriteria: [],
    listCleaning: {
      removeDuplicates: false,
      removeDeceased: false,
      removePrisonersInmates: false,
      removeBusinesses: false,
      removeVacantProperties: false,
    },
    dataQuality: {
      requirePhoneNumbers: false,
      requireEmailAddresses: false,
      requireCompleteAddresses: false,
      minimumConfidenceScore: 50,
    },
    deliveryPreferences: {
      excludePoBoxes: false,
      excludeApartments: false,
      excludeCondos: false,
      excludeMobileHomes: false,
      requireCarrierRoute: false,
    },
    suppressionLists: {
      nationalDoNotMail: false,
      customSuppressionList: [],
      previousMailings: false,
      competitors: false,
    },
    dataFreshness: {
      maxAge: 12,
      requireRecentUpdate: false,
    },
    additionalData: {
      appendPhoneNumbers: false,
      appendEmailAddresses: false,
      appendPropertyDetails: false,
      appendDemographics: false,
      appendLifestyleData: false,
    },
    exportOptions: {
      format: "csv",
      includeHeaders: true,
      sortBy: "address",
      maxRecordsPerFile: 10000,
    },
  },
}

export default function BuildListsPage() {
  const [listName, setListName] = useState("My New Mailing List")
  const [criteria, setCriteria] = useState<ListCriteria>(initialCriteria)
  const [activeCategory, setActiveCategory] = useState<string>("geography")

  const updateCriteria = (category: keyof ListCriteria, values: Partial<Criteria>) => {
    setCriteria((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...values },
    }))
  }

  const clearAllCriteria = () => {
    setCriteria(initialCriteria)
  }

  const recordCount = useMemo(() => {
    // This is a mock calculation. In a real app, this would be an API call.
    let count = 100000

    // Geography impact
    if (criteria.geography.states.length > 0) count /= Math.max(1, criteria.geography.states.length * 2)
    if (criteria.geography.zipCodes.length > 0) count /= Math.max(1, criteria.geography.zipCodes.length)
    if (criteria.geography.cities.length > 0) count /= Math.max(1, criteria.geography.cities.length * 3)
    if (criteria.geography.zipRadius.length > 0) count *= 0.6

    // Property impact
    if (criteria.property.propertyTypes.length > 0) count *= 0.3
    count -= (2024 - criteria.property.yearBuilt[1]) * 100
    count -= (criteria.property.yearBuilt[0] - 1900) * 50

    // Property value impact
    const avgValue = (criteria.property.propertyValue[0] + criteria.property.propertyValue[1]) / 2
    if (avgValue > 500000) count *= 0.7
    if (avgValue < 200000) count *= 1.2

    // Square footage impact
    const avgSqFt = (criteria.property.squareFootage[0] + criteria.property.squareFootage[1]) / 2
    if (avgSqFt > 3000) count *= 0.8
    if (avgSqFt < 1500) count *= 1.1

    // Mortgage criteria impact
    if (criteria.mortgage.selectedCriteria.length > 0) count *= 0.7
    if (criteria.mortgage.lienPosition === "first") count *= 0.8
    if (criteria.mortgage.lienPosition === "junior") count *= 0.2

    // Foreclosure criteria impact
    if (criteria.foreclosure.selectedCriteria.length > 0) count *= 0.1
    if (Array.isArray(criteria.foreclosure.foreclosureStatus) && criteria.foreclosure.foreclosureStatus.length > 0) {
      // Different statuses have different availability
      const statusMultiplier = criteria.foreclosure.foreclosureStatus.reduce((mult, status) => {
        switch (status) {
          case "pre-foreclosure":
          case "notice-of-default":
            return mult * 0.8
          case "reo":
            return mult * 0.3
          case "auction-scheduled":
            return mult * 0.2
          default:
            return mult * 0.5
        }
      }, 1)
      count *= statusMultiplier
    }

    // Predictive criteria impact
    const { modelScores, selectedCriteria } = criteria.predictive
    if (selectedCriteria && selectedCriteria.length > 0) {
      count *= 0.2 // Predictive filters are highly specific

      // Check if any high likelihood scores are selected
      const hasHighLikelihood = Object.values(modelScores || {}).some((scores) =>
        scores?.some((score) => score.includes("high")),
      )
      if (hasHighLikelihood) {
        count *= 0.5 // High likelihood scores are rarer
      }
    }

    return Math.max(0, Math.floor(count))
  }, [criteria])

  const totalCost = useMemo(() => {
    // Mock cost: $0.12 per record, but predictive data costs more
    let baseRate = 0.12
    if (criteria.predictive.selectedCriteria && criteria.predictive.selectedCriteria.length > 0) {
      baseRate = 0.2 // Premium for predictive data
    }
    return recordCount * baseRate
  }, [recordCount, criteria.predictive.selectedCriteria])

  const renderFilterPanel = () => {
    switch (activeCategory) {
      case "geography":
        return (
          <GeographyFilters criteria={criteria.geography} onUpdate={(values) => updateCriteria("geography", values)} />
        )
      case "property":
        return (
          <PropertyFilters criteria={criteria.property} onUpdate={(values) => updateCriteria("property", values)} />
        )
      case "demographics":
        return (
          <DemographicsFilters
            criteria={criteria.demographics}
            onUpdate={(values) => updateCriteria("demographics", values)}
          />
        )
      case "mortgage":
        return (
          <MortgageFilters criteria={criteria.mortgage} onUpdate={(values) => updateCriteria("mortgage", values)} />
        )
      case "foreclosure":
        return (
          <ForeclosureFilters
            criteria={criteria.foreclosure}
            onUpdate={(values) => updateCriteria("foreclosure", values)}
          />
        )
      case "predictive":
        return (
          <PredictiveFilters
            criteria={criteria.predictive}
            onUpdate={(values) => updateCriteria("predictive", values)}
          />
        )
      case "options":
        return <OptionsFilters />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Build Your Mailing List</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Use our powerful filters to create a perfectly targeted mailing list for your campaign.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6 sticky top-24">
            <CriteriaAccordion activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            <ListSummary
              listName={listName}
              onNameChange={setListName}
              recordCount={recordCount}
              totalCost={totalCost}
            />
            <Button variant="outline" onClick={clearAllCriteria} className="w-full bg-transparent">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Criteria
            </Button>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">{renderFilterPanel()}</main>
        </div>

        {/* Floating Action Bar */}
        <div className="sticky bottom-0 left-0 right-0 mt-8 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <div className="container mx-auto flex items-center justify-end gap-4">
            <div className="text-right">
              <p className="font-bold text-lg">{recordCount.toLocaleString()} Records</p>
              <p className="text-yellow-600 dark:text-yellow-400 font-semibold text-xl">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button variant="outline" size="lg" className="bg-transparent">
              <Save className="h-4 w-4 mr-2" />
              Save Criteria
            </Button>
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase List
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
