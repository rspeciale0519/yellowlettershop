// Types for dashboard-related UI state and data models.
// Keep this as a module to avoid polluting global scope.
export type DashboardSection =
  | 'overview'
  | 'activity'
  | 'orders'
  | 'api-keys'
  | 'media'
  | 'settings'

export interface DashboardBreadcrumb {
  label: string
  href?: string
}

export interface StatCard {
  title: string
  value: string | number
  change?: { value: number; direction: 'up' | 'down' | 'flat' }
}

export interface TimeSeriesPoint {
  date: string // ISO string
  value: number
}

export interface WidgetConfig {
  id: string
  title: string
  type: 'chart' | 'table' | 'stat'
  visible?: boolean
}

export {}
