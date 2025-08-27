"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/list-builder/demographics/SectionHeader"

export interface DemographicsGroupProps {
  title: string
  icon?: React.ReactNode
  description?: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function DemographicsGroup({ title, icon, description, expanded, onToggle, children }: DemographicsGroupProps) {
  return (
    <Card>
      <SectionHeader title={title} icon={icon} description={description} expanded={expanded} onToggle={onToggle} />
      {expanded ? <CardContent className="space-y-6">{children}</CardContent> : null}
    </Card>
  )
}
