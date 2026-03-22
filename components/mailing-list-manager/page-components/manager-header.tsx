"use client"

import { Button } from "@/components/ui/button"
import { Plus, Upload, Package } from "lucide-react"
import Link from "next/link"

interface ManagerHeaderProps {
  viewMode: "lists" | "records"
  onViewModeChange: () => void
  onAddClick: () => void
  onUploadClick?: () => void
  isAddDisabled?: boolean
  isViewChangeDisabled?: boolean
  selectedListId?: string // For order creation when viewing records
}

export const ManagerHeader = ({
  viewMode,
  onViewModeChange,
  onAddClick,
  onUploadClick,
  isAddDisabled = false,
  isViewChangeDisabled = false,
  selectedListId,
}: ManagerHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Mailing List Manager</h1>
      </div>
      <div className="flex items-center space-x-2">
        {viewMode === 'records' && selectedListId && (
          <Button asChild variant="default">
            <Link href={`/orders/new?listId=${selectedListId}&source=mailing_list_manager`}>
              <Package className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
        )}
        <Button onClick={onViewModeChange} disabled={isViewChangeDisabled} data-testid="view-mode-toggle">
          {viewMode === 'lists' ? 'View Records' : 'View Lists'}
        </Button>
        <Button onClick={onAddClick} disabled={isAddDisabled} data-testid="add-button">
          <Plus className="mr-2 h-4 w-4" /> {viewMode === 'lists' ? 'Add List' : 'Add Record'}
        </Button>
        {onUploadClick && (
          <Button onClick={onUploadClick} variant="outline" data-testid="upload-button">
            <Upload className="mr-2 h-4 w-4" /> Upload List
          </Button>
        )}
      </div>
    </div>
  )
}
