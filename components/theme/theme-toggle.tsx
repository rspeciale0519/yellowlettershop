"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sun, Moon, Monitor, Check } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const themes = [
    {
      name: "Light",
      value: "light",
      icon: Sun,
      description: "Light theme",
    },
    {
      name: "Dark",
      value: "dark",
      icon: Moon,
      description: "Dark theme",
    },
    {
      name: "System",
      value: "system",
      icon: Monitor,
      description: "Follow system preference",
    },
  ]

  const currentTheme = themes.find((t) => t.value === theme)
  const CurrentIcon = currentTheme?.icon || Sun

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                aria-label={`Current theme: ${currentTheme?.name || "Unknown"}. Click to change theme.`}
              >
                <CurrentIcon className="h-4 w-4 transition-all" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            <p>Switch theme</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isSelected = theme === themeOption.value
            const isCurrentlyActive =
              (themeOption.value === "system" && theme === "system") ||
              (themeOption.value === resolvedTheme && theme !== "system") ||
              themeOption.value === theme

            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className="flex items-center justify-between cursor-pointer focus:bg-yellow-50 dark:focus:bg-yellow-900/20"
                role="menuitemradio"
                aria-checked={isSelected}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{themeOption.name}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
