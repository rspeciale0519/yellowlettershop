"use client"

import type React from "react"
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface SectionHeaderProps {
  title: string
  icon?: React.ReactNode
  description?: string
  expanded: boolean
  onToggle: () => void
}

export function SectionHeader({ title, icon, description, expanded, onToggle }: SectionHeaderProps) {
  return (
    <CardHeader className="cursor-pointer" onClick={onToggle}>
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
  )
}
