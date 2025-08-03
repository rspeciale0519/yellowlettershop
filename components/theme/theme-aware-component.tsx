"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface ThemeAwareComponentProps {
  children: React.ReactNode
  className?: string
}

export function ThemeAwareComponent({ children, className = "" }: ThemeAwareComponentProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={`${className} theme-aware`}
      data-theme={resolvedTheme}
      style={{
        colorScheme: resolvedTheme === "dark" ? "dark" : "light",
      }}
    >
      {children}
    </div>
  )
}
