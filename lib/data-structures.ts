// Data structure definitions without mock data

// User types
export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

// List types
export interface MailingList {
  id: string
  name: string
  recordCount: number
  dateCreated: string
  lastModified: string
  tags: string[]
}

export interface MailingRecord {
  id: string
  firstName?: string
  lastName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  email?: string
  phone?: string
  [key: string]: any
}

// Order types
export interface Order {
  id: string
  customer: string
  date: string
  status: string
  total: number
  items: number
}

// Template types
export interface Template {
  id: string
  name: string
  category: string
  thumbnail: string
  dateCreated: string
}

// Media types
export interface MediaItem {
  id: string
  name: string
  type: string
  size: string
  url: string
  dateUploaded: string
}

// Activity types
export interface ActivityItem {
  id: string
  user: string
  action: string
  target: string
  date: string
  icon?: string
}

// API Key types
export interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed?: string
  permissions: string[]
}

// Empty data arrays
export const users: User[] = []
export const mailingLists: MailingList[] = []
export const mailingRecords: Record<string, MailingRecord[]> = {}
export const orders: Order[] = []
export const templates: Template[] = []
export const mediaItems: MediaItem[] = []
export const activityItems: ActivityItem[] = []
export const apiKeys: ApiKey[] = []
