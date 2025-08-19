export interface GeographyCriteria {
  states: string[]
  zipCodes: string[]
  cities: string[]
  counties: string[]
  areaCodes: string[]
  censusTract: string[]
  fipsCodes: string[]
  msa: string[]
  mapBookPage: { county: string; page: string; grid: string }[]
  mapSearch: { type: "polygon" | "radius"; coordinates: number[]; radius?: number }[]
  municipality: string[]
  parcelIdRange: { county: string; ranges: string[] }[]
  scf: string[]
  streetName: { county: string; city?: string; street: string; lowNumber?: string; highNumber?: string }[]
  subdivision: { county: string; subdivisions: string[] }[]
  taxRateArea: { county: string; codes: string[] }[]
  townshipRangeSection: { county: string; township: string; range: string; section: string }[]
  tract: { county: string; tracts: string[] }[]
  zipRadius: { zip: string; radius: number }[]
  selectedCriteria: string[]
}

export interface PropertyCriteria {
  propertyTypes: string[]
  yearBuilt: number[]
  squareFootage: number[]
  bedrooms: number[]
  bathrooms: number[]
  lotSize: number[]
  propertyValue: number[]
}

export interface DemographicsCriteria {
  selectedCriteria: string[]
  age: number[]
  gender: string[]
  maritalStatus: string[]
  householdSize: number[]
  income: number[]
  educationLevel: string[]
  occupation: string[]
  employmentStatus: string[]
  homeOwnership: string[]
  creditRating: string[]
  lifestyle: {
    interests: string[]
    hobbies: string[]
    purchasingBehavior: string[]
  }
  ethnicity: string[]
  language: string[]
  religion: string[]
  politicalAffiliation: string[]
  veteranStatus: string[]
  childrenInHousehold: {
    hasChildren: string // "yes" | "no" | "any"
    ageRanges: string[]
    numberOfChildren: number[]
  }
  presets: {
    name: string
    criteria: Partial<DemographicsCriteria>
  }[]
  activePreset: string | null
}

export interface MortgageCriteria {
  lienPosition: "all" | "first" | "junior"
  selectedCriteria: string[]
  mortgageAmount: { min: number; max: number } | null
  interestRate: { min: number; max: number } | null
  loanToValue: { min: number; max: number } | null
  mortgageOriginationDate: { from: string; to: string } | null
  maturityDate: { from: string; to: string } | null
  mortgageTerm: { terms: number[] } | null
  primaryLoanType: string[]
  lenderOrigination: string[]
  lenderAssigned: string[]
  adjustableRateRider: {
    selectedSubCriteria: string | null
    interestOnly: "only" | "exclude" | "no-preference"
    interestRateChangeLimit: string[]
    interestRateChange: string[]
    interestRateChangeDate: { type: "initial" | "next"; dates: string[] }
    interestRateChangeFrequency: string[]
    interestRateIndexType: string[]
    interestRateMaximum: string[]
    negativeAmortization: "only" | "exclude" | "no-preference"
    paymentOption: "only" | "exclude" | "no-preference"
    prepaymentPenalty: "only" | "exclude" | "no-preference"
    prepaymentPenaltyExpireDate: string[]
  }
  balloonLoan: "only" | "exclude" | "no-preference"
  creditLineLoan: "only" | "exclude" | "no-preference"
  equityLoan: "only" | "exclude" | "no-preference"
  maturedMortgage: "only" | "exclude" | "no-preference"
}

export interface ForeclosureCriteria {
  selectedCriteria: string[]
  foreclosureStatus: string[]
  foreclosureDate: { type: string; from: string; to: string } | null
  foreclosureAmount: { min: number; max: number } | null
  lenderNames: string[]
  currentOwners: string[]
  propertyAddresses: string[]
  auctionDate: { from: string; to: string } | null
  noticeTypes: string[]
  trusteeNames: string[]
  caseNumbers: string[]
}

export interface PredictiveCriteria {
  selectedModel?: string | null
  modelScores?: {
    heloc?: string[]
    purchase?: string[]
    refinance?: string[]
    rent?: string[]
    sale?: string[]
  }
  selectedCriteria?: string[]
}

export interface OptionsCriteria {
  selectedCriteria: string[]
  listCleaning: {
    removeDuplicates: boolean
    removeDeceased: boolean
    removePrisonersInmates: boolean
    removeBusinesses: boolean
    removeVacantProperties: boolean
  }
  dataQuality: {
    requirePhoneNumbers: boolean
    requireEmailAddresses: boolean
    requireCompleteAddresses: boolean
    minimumConfidenceScore: number
  }
  deliveryPreferences: {
    excludePoBoxes: boolean
    excludeApartments: boolean
    excludeCondos: boolean
    excludeMobileHomes: boolean
    requireCarrierRoute: boolean
  }
  suppressionLists: {
    nationalDoNotMail: boolean
    customSuppressionList: string[]
    previousMailings: boolean
    competitors: boolean
  }
  dataFreshness: {
    maxAge: number // in months
    requireRecentUpdate: boolean
  }
  additionalData: {
    appendPhoneNumbers: boolean
    appendEmailAddresses: boolean
    appendPropertyDetails: boolean
    appendDemographics: boolean
    appendLifestyleData: boolean
  }
  exportOptions: {
    format: string
    includeHeaders: boolean
    sortBy: string
    maxRecordsPerFile: number
  }
}

export type Criteria =
  | GeographyCriteria
  | PropertyCriteria
  | DemographicsCriteria
  | MortgageCriteria
  | ForeclosureCriteria
  | PredictiveCriteria
  | OptionsCriteria

export interface ListCriteria {
  geography: GeographyCriteria
  property: PropertyCriteria
  demographics: DemographicsCriteria
  mortgage: MortgageCriteria
  foreclosure: ForeclosureCriteria
  predictive: PredictiveCriteria
  options: OptionsCriteria
}
