"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ManagerHeaderProps {
  viewMode: "lists" | "records"
  onViewModeChange: () => void
  onAddClick: () => void
  isAddDisabled?: boolean
  isViewChangeDisabled?: boolean
}

export const ManagerHeader = ({
  viewMode,
  onViewModeChange,
  onAddClick,
  isAddDisabled = false,
  isViewChangeDisabled = false,
}: ManagerHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
      <h1 className="text-2xl font-bold">Mailing List Manager</h1>
      <div className="flex items-center space-x-2">
                <Button onClick={onViewModeChange} disabled={isViewChangeDisabled} data-testid="view-mode-toggle">
          {viewMode === 'lists' ? 'View Records' : 'View Lists'}
        </Button>
                <Button onClick={onAddClick} disabled={isAddDisabled} data-testid="add-button">
          <Plus className="mr-2 h-4 w-4" /> {viewMode === 'lists' ? 'Add List' : 'Add Record'}
        </Button>
      </div>
    </div>
  )
}
