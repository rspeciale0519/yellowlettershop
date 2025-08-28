// AccuZIP record conversion utilities
import type { MailingListRecord } from '@/types/supabase';

export interface AccuZIPRecord {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  estimatedValue?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  loanType?: string;
  loanAmount?: number;
  interestRate?: number;
  loanToValue?: number;
  originationDate?: string;
  maturityDate?: string;
  lenderName?: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
  income?: number;
  netWorth?: number;
  homeOwnership?: string;
  occupation?: string;
  educationLevel?: string;
  foreclosureStatus?: string;
  filingDate?: string;
  auctionDate?: string;
  likelyToMove?: boolean;
  likelyToSell?: boolean;
  likelyToRefinance?: boolean;
  motivationScore?: number;
}

/**
 * Convert AccuZIP record to our database format
 */
export function convertAccuZIPRecord(record: AccuZIPRecord): Partial<MailingListRecord> {
  return {
    external_id: record.id,
    first_name: record.firstName,
    last_name: record.lastName,
    middle_name: record.middleName,
    full_name: `${record.firstName} ${record.lastName}`.trim(),
    email: record.email,
    phone: record.phone,
    address_line1: record.addressLine1,
    address_line2: record.addressLine2,
    city: record.city,
    state: record.state,
    zip_code: record.zipCode,
    county: record.county,
    latitude: record.latitude,
    longitude: record.longitude,
    property_type: record.propertyType,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    square_feet: record.squareFeet,
    lot_size: record.lotSize,
    year_built: record.yearBuilt,
    estimated_value: record.estimatedValue,
    last_sale_date: record.lastSaleDate,
    last_sale_price: record.lastSalePrice,
    loan_type: record.loanType,
    loan_amount: record.loanAmount,
    interest_rate: record.interestRate,
    loan_to_value: record.loanToValue,
    origination_date: record.originationDate,
    maturity_date: record.maturityDate,
    lender_name: record.lenderName,
    age: record.age,
    gender: record.gender,
    marital_status: record.maritalStatus,
    income: record.income,
    net_worth: record.netWorth,
    home_ownership: record.homeOwnership,
    occupation: record.occupation,
    education_level: record.educationLevel,
    foreclosure_status: record.foreclosureStatus,
    filing_date: record.filingDate,
    auction_date: record.auctionDate,
    likely_to_move: record.likelyToMove,
    likely_to_sell: record.likelyToSell,
    likely_to_refinance: record.likelyToRefinance,
    motivation_score: record.motivationScore,
    data_source: 'AccuZIP',
    is_valid: true,
  };
}
