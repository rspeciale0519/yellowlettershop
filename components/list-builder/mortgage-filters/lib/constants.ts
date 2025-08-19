import { MortgageCriteria } from "@/types/list-builder"
import { LucideIcon, DollarSign, Percent, CalendarIcon, Clock, Building2 } from "lucide-react"

export interface MortgageCriteriaOption {
  value: string
  label: string
  description: string
  category: string
  icon: LucideIcon
  validation?: { 
    min?: number
    max?: number
    minDate?: string
    maxDate?: string 
  }
}

// Enhanced mortgage criteria options with descriptions and validation
export const MORTGAGE_CRITERIA_OPTIONS: MortgageCriteriaOption[] = [
  {
    value: "mortgage-amount",
    label: "Mortgage Amount",
    description: "Filter by original loan amount or current balance",
    category: "financial",
    icon: DollarSign,
    validation: { min: 1000, max: 50000000 },
  },
  {
    value: "interest-rate",
    label: "Interest Rate",
    description: "Filter by current or original interest rate percentage",
    category: "financial",
    icon: Percent,
    validation: { min: 0.001, max: 30 },
  },
  {
    value: "loan-to-value",
    label: "Loan-to-Value Ratio",
    description: "Ratio of loan amount to property value",
    category: "financial",
    icon: Percent,
    validation: { min: 1, max: 200 },
  },
  {
    value: "mortgage-origination-date",
    label: "Mortgage Origination Date",
    description: "Date when the mortgage was originally created",
    category: "temporal",
    icon: CalendarIcon,
    validation: { minDate: "1950-01-01", maxDate: new Date().toISOString().split("T")[0] },
  },
  {
    value: "maturity-date",
    label: "Maturity Date",
    description: "Date when the mortgage is scheduled to be paid off",
    category: "temporal",
    icon: Clock,
    validation: { minDate: new Date().toISOString().split("T")[0], maxDate: "2080-12-31" },
  },
  {
    value: "mortgage-term",
    label: "Mortgage Term",
    description: "Length of the mortgage in years",
    category: "terms",
    icon: Clock,
  },
  {
    value: "primary-loan-type",
    label: "Primary Loan Type",
    description: "Type of mortgage loan (conventional, FHA, VA, etc.)",
    category: "terms",
    icon: Building2,
  },
  {
    value: "lender-origination",
    label: "Lender - Origination",
    description: "Original lender who issued the mortgage",
    category: "lender",
    icon: Building2,
  },
  {
    value: "lender-assigned",
    label: "Lender - Current/Assigned",
    description: "Current lender or servicer of the mortgage",
    category: "lender",
    icon: Building2,
  },
  {
    value: "adjustable-rate-rider",
    label: "Adjustable Rate Rider",
    description: "Properties with adjustable rate mortgage features",
    category: "special",
    icon: Percent,
  },
  {
    value: "balloon-loan",
    label: "Balloon Loan",
    description: "Mortgages with balloon payment features",
    category: "special",
    icon: DollarSign,
  },
  {
    value: "credit-line-loan",
    label: "Credit Line Loan",
    description: "Home equity lines of credit and similar products",
    category: "special",
    icon: DollarSign,
  },
  {
    value: "equity-loan",
    label: "Equity Loan",
    description: "Home equity loans and second mortgages",
    category: "special",
    icon: DollarSign,
  },
  {
    value: "matured-mortgage",
    label: "Matured Mortgage",
    description: "Mortgages that have reached their maturity date",
    category: "special",
    icon: Clock,
  },
]

export const LOAN_TYPE_OPTIONS = [
  { value: "conventional", label: "Conventional" },
  { value: "fha", label: "FHA" },
  { value: "va", label: "VA" },
  { value: "usda", label: "USDA" },
  { value: "jumbo", label: "Jumbo" },
  { value: "interest-only", label: "Interest Only" },
  { value: "adjustable-rate", label: "Adjustable Rate" },
  { value: "fixed-rate", label: "Fixed Rate" },
  { value: "other", label: "Other" },
]

// Saved criteria templates
export const MORTGAGE_TEMPLATES: { id: string; name: string; description: string; criteria: Partial<MortgageCriteria> }[] = [
  {
    id: "high-rate-loans",
    name: "High Interest Rate Loans",
    description: "Loans with interest rates above 6%",
    criteria: {
      selectedCriteria: ["interest-rate"],
      interestRate: { min: 6, max: 30 },
      mortgageAmount: null,
      loanToValue: null,
      mortgageOriginationDate: null,
      maturityDate: null,
    },
  },
  {
    id: "recent-originations",
    name: "Recent Originations",
    description: "Mortgages originated in the last 2 years",
    criteria: {
      selectedCriteria: ["mortgage-origination-date"],
      mortgageOriginationDate: {
        from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
      interestRate: null,
      mortgageAmount: null,
      loanToValue: null,
      maturityDate: null,
    },
  },
  {
    id: "large-mortgages",
    name: "Large Mortgages",
    description: "High-value mortgage loans over $500K",
    criteria: {
      selectedCriteria: ["mortgage-amount"],
      mortgageAmount: { min: 500000, max: 50000000 },
      interestRate: null,
      loanToValue: null,
      mortgageOriginationDate: null,
      maturityDate: null,
    },
  },
]
