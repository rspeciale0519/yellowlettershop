import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple date formatter used across UI tables
export function formatDate(
  input: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  try {
    const d = input instanceof Date ? input : new Date(input)
    if (Number.isNaN(d.getTime())) return ""
    return new Intl.DateTimeFormat(locale, options).format(d)
  } catch {
    return ""
  }
}

// Returns ISO yyyy-mm-dd from a Date, or empty string if invalid/empty
export function toISODateString(d?: Date | null): string {
  if (!d) return ""
  if (Number.isNaN(d.getTime())) return ""
  // Use UTC getters to ensure consistency across timezones
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// Parses ISO-like string to Date, returns undefined on invalid input
export function parseISODate(s?: string | null): Date | undefined {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}
