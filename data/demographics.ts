// Shared Demographics option constants
// Purpose: Centralize label/value pairs for demographics filters so they can be reused across domains.
// No runtime behavior; pure data only.

export type Option = { value: string; label: string }

export const GENDER_OPTIONS: Option[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer-not-to-say", label: "Prefer Not to Say" },
]

export const MARITAL_STATUS_OPTIONS: Option[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
  { value: "domestic-partnership", label: "Domestic Partnership" },
]

export const EDUCATION_LEVELS: Option[] = [
  { value: "less-than-high-school", label: "Less than High School" },
  { value: "high-school", label: "High School Graduate" },
  { value: "some-college", label: "Some College" },
  { value: "associates", label: "Associate's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate/PhD" },
  { value: "professional", label: "Professional Degree" },
]

export const OCCUPATION_CATEGORIES: Option[] = [
  { value: "management", label: "Management & Executive" },
  { value: "professional", label: "Professional & Technical" },
  { value: "sales", label: "Sales & Marketing" },
  { value: "administrative", label: "Administrative Support" },
  { value: "service", label: "Service Industry" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "construction", label: "Construction & Trades" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "transportation", label: "Transportation" },
  { value: "agriculture", label: "Agriculture" },
  { value: "military", label: "Military" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
  { value: "unemployed", label: "Unemployed" },
]

export const EMPLOYMENT_STATUS: Option[] = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "self-employed", label: "Self-Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
  { value: "homemaker", label: "Homemaker" },
  { value: "disabled", label: "Disabled" },
]

export const HOME_OWNERSHIP: Option[] = [
  { value: "own", label: "Own Home" },
  { value: "rent", label: "Rent" },
  { value: "live-with-family", label: "Live with Family" },
  { value: "other", label: "Other" },
]

export const CREDIT_RATINGS: Option[] = [
  { value: "excellent", label: "Excellent (750+)" },
  { value: "good", label: "Good (700-749)" },
  { value: "fair", label: "Fair (650-699)" },
  { value: "poor", label: "Poor (600-649)" },
  { value: "very-poor", label: "Very Poor (<600)" },
]

export const INTERESTS: Option[] = [
  { value: "sports", label: "Sports" },
  { value: "fitness", label: "Fitness & Health" },
  { value: "travel", label: "Travel" },
  { value: "cooking", label: "Cooking" },
  { value: "technology", label: "Technology" },
  { value: "arts", label: "Arts & Culture" },
  { value: "music", label: "Music" },
  { value: "reading", label: "Reading" },
  { value: "gardening", label: "Gardening" },
  { value: "automotive", label: "Automotive" },
  { value: "fashion", label: "Fashion" },
  { value: "home-improvement", label: "Home Improvement" },
  { value: "investing", label: "Investing & Finance" },
  { value: "pets", label: "Pets" },
  { value: "outdoor-activities", label: "Outdoor Activities" },
]

export const PURCHASING_BEHAVIOR: Option[] = [
  { value: "luxury-buyer", label: "Luxury Buyer" },
  { value: "bargain-hunter", label: "Bargain Hunter" },
  { value: "brand-loyal", label: "Brand Loyal" },
  { value: "early-adopter", label: "Early Adopter" },
  { value: "online-shopper", label: "Online Shopper" },
  { value: "impulse-buyer", label: "Impulse Buyer" },
  { value: "research-oriented", label: "Research-Oriented" },
  { value: "eco-conscious", label: "Eco-Conscious" },
]

export const ETHNICITY_OPTIONS: Option[] = [
  { value: "white", label: "White/Caucasian" },
  { value: "black", label: "Black/African American" },
  { value: "hispanic", label: "Hispanic/Latino" },
  { value: "asian", label: "Asian" },
  { value: "native-american", label: "Native American" },
  { value: "pacific-islander", label: "Pacific Islander" },
  { value: "mixed", label: "Mixed/Multiracial" },
  { value: "other", label: "Other" },
]

export const LANGUAGE_OPTIONS: Option[] = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "chinese", label: "Chinese" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "arabic", label: "Arabic" },
  { value: "hindi", label: "Hindi" },
  { value: "other", label: "Other" },
]

export const POLITICAL_AFFILIATIONS: Option[] = [
  { value: "democrat", label: "Democrat" },
  { value: "republican", label: "Republican" },
  { value: "independent", label: "Independent" },
  { value: "libertarian", label: "Libertarian" },
  { value: "green", label: "Green Party" },
  { value: "other", label: "Other" },
  { value: "no-affiliation", label: "No Political Affiliation" },
]

export const VETERAN_STATUS: Option[] = [
  { value: "veteran", label: "Veteran" },
  { value: "active-duty", label: "Active Duty" },
  { value: "reserves", label: "Reserves/National Guard" },
  { value: "non-military", label: "Non-Military" },
]

export const CHILDREN_AGE_RANGES: Option[] = [
  { value: "0-2", label: "Infants (0-2 years)" },
  { value: "3-5", label: "Preschool (3-5 years)" },
  { value: "6-12", label: "Elementary (6-12 years)" },
  { value: "13-17", label: "Teenagers (13-17 years)" },
  { value: "18+", label: "Adult Children (18+ years)" },
]
