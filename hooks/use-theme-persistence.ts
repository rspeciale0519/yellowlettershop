"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function useThemePersistence() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        // Force a re-render when system theme changes
        const newSystemTheme = e.matches ? "dark" : "light"
        document.documentElement.classList.toggle("dark", e.matches)

        // Dispatch custom event for components that need to react to theme changes
        window.dispatchEvent(
          new CustomEvent("theme-change", {
            detail: { theme: "system", resolvedTheme: newSystemTheme },
          }),
        )
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  // Persist theme preference
  useEffect(() => {
    if (!mounted || !theme) return

    try {
      localStorage.setItem("yls-theme", theme)

      // Update CSS custom properties
      const root = document.documentElement
      const isDark = resolvedTheme === "dark"

      root.style.setProperty("--theme-bg", isDark ? "222.2 84% 4.9%" : "0 0% 100%")
      root.style.setProperty("--theme-fg", isDark ? "210 40% 98%" : "222.2 84% 4.9%")
      root.style.setProperty("--theme-accent", isDark ? "217.2 32.6% 17.5%" : "210 40% 96%")

      // Dispatch theme change event
      window.dispatchEvent(
        new CustomEvent("theme-change", {
          detail: { theme, resolvedTheme },
        }),
      )
    } catch (error) {
      console.warn("Failed to persist theme preference:", error)
    }
  }, [theme, resolvedTheme, mounted])

  return {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    mounted,
  }
}
