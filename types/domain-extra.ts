// Domain contracts that were imported from '@/types/supabase' but never defined
// anywhere (lost without a recoverable source). Shapes derived from their active
// consumers. Part of the B8 type-layer reconciliation
// (docs/temp/typecheck-debt-finding.md).

// ---------------------------------------------------------------------------
// List-builder filter contracts — shapes per lib/list-builder/criteria-builder.ts
// (the active builder). NOTE: distinct from the legacy saved-record
// `ListBuilderCriteria` in supabase-domain.ts; the filter shape is canonical for
// the live list-builder + AccuZip/Melissa param mapping.
// ---------------------------------------------------------------------------
export interface DemographicFilters {
  age_range?: [number, number]
  income_range?: [number, number]
  home_value_range?: [number, number]
  credit_score_range?: [number, number]
  marital_status?: string[]
  presence_of_children?: boolean
  education_level?: string[]
  occupation?: string[]
  lifestyle_interests?: string[]
}

export interface GeographicFilters {
  states?: string[]
  counties?: string[]
  cities?: string[]
  zip_codes?: string[]
  radius_miles?: number
  center_point?: { lat: number; lng: number }
  exclude_po_boxes?: boolean
  rural_urban_classification?: string
}

export interface PropertyFilters {
  property_type?: string[]
  ownership_status?: string
  years_owned_range?: [number, number]
  mortgage_status?: string
  equity_range?: [number, number]
  square_footage_range?: [number, number]
  lot_size_range?: [number, number]
  year_built_range?: [number, number]
  bedrooms_range?: [number, number]
  bathrooms_range?: [number, number]
}

export interface ListBuilderCriteria {
  demographic: DemographicFilters
  geographic: GeographicFilters
  property: PropertyFilters
}

// ---------------------------------------------------------------------------
// Team membership — shape per lib/team/team-service.ts
// ---------------------------------------------------------------------------
export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  permissions?: string[]
  status?: string
  invited_by?: string
  invited_at?: string
  joined_at?: string
  created_at?: string
  updated_at?: string
}

// ---------------------------------------------------------------------------
// Engagement analytics event — shape per lib/analytics/engagement-tracker.ts
// ---------------------------------------------------------------------------
export interface EngagementEvent {
  id?: string
  event_type: string
  short_link_code?: string
  record_id?: string
  campaign_id?: string
  user_id?: string
  metadata?: Record<string, unknown>
  created_at?: string
}
