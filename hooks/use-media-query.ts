"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  // Initialize with null to avoid hydration mismatch
  const [matches, setMatches] = useState<boolean | null>(null)

  useEffect(() => {
    // Set initial value once mounted to avoid hydration issues
    setMatches(window.matchMedia(query).matches)

    // Use a more efficient approach with event listener
    const media = window.matchMedia(query)

    // Define the handler
    const handleChange = () => {
      setMatches(media.matches)
    }

    // Add the listener
    if (media.addEventListener) {
      media.addEventListener("change", handleChange)
      return () => media.removeEventListener("change", handleChange)
    } else {
      // Fallback for older browsers
      media.addListener(handleChange)
      return () => media.removeListener(handleChange)
    }
  }, [query])

  // Return false during SSR, actual value after hydration
  return matches ?? false
}
