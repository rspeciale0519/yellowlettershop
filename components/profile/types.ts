export interface UserProfile {
  id: string
  user_id: string
  email?: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  bio?: string
  company_name?: string
  job_title?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  avatar_url?: string
  email_notifications?: boolean
  sms_notifications?: boolean
  marketing_emails?: boolean
}