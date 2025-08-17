"use client"

import { ChevronRight } from "lucide-react"
import { MailingList } from "@/types/supabase"

interface BreadcrumbsProps {
  selectedList: MailingList | null
  onNavigateBack: () => void
}

export const Breadcrumbs = ({ selectedList, onNavigateBack }: BreadcrumbsProps) => {
  if (!selectedList) return null

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <button onClick={onNavigateBack} className="hover:underline">
        All Lists
      </button>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span>{selectedList.name}</span>
    </div>
  )
}
