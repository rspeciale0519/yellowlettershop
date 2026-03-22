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

// Smooth scroll utility for scrolling to elements by ID or element reference
export function smoothScrollToElement(
  target: string | HTMLElement,
  options: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  }
): boolean {
  try {
    let element: HTMLElement | null = null
    
    if (typeof target === 'string') {
      element = document.getElementById(target)
    } else {
      element = target
    }
    
    if (element) {
      element.scrollIntoView(options)
      return true
    }
    
    return false
  } catch (error) {
    console.warn('Error scrolling to element:', error)
    return false
  }
}

// Smooth scroll with delay utility - useful for scrolling after state updates
export function smoothScrollToElementWithDelay(
  target: string | HTMLElement,
  delay: number = 100,
  options?: ScrollIntoViewOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = smoothScrollToElement(target, options)
      resolve(success)
    }, delay)
  })
}
