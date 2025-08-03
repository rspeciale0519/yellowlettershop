"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  itemsPerPageOptions: number[]
  onPageChange: (page: number) => void
  onItemsPerPageChange: (count: number) => void
  itemLabel: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange,
  itemLabel,
}: PaginationControlsProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            onItemsPerPageChange(Number(value))
          }}
        >
          <SelectTrigger className="w-[80px] h-8 yellow-hover-button">
            <span>{itemsPerPage}</span>
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        {totalItems > 0 ? (
          <>
            Showing {startItem} to {endItem} of {totalItems} {itemLabel}
          </>
        ) : (
          <>No {itemLabel} found</>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1 || totalPages === 0}
          className="yellow-hover-button"
        >
          Previous
        </Button>

        {totalPages > 7 ? (
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0 yellow-hover-button"
              onClick={() => onPageChange(1)}
              disabled={totalPages === 0}
            >
              1
            </Button>

            {/* Ellipsis or page numbers */}
            {currentPage > 4 && <span className="mx-1">...</span>}

            {/* Pages around current page */}
            {Array.from({ length: 5 }, (_, i) => {
              const pageNum = Math.max(2, currentPage - 2) + i
              if (pageNum > 1 && pageNum < totalPages) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 yellow-hover-button"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              }
              return null
            })}

            {/* Ellipsis or page numbers */}
            {currentPage < totalPages - 3 && totalPages > 2 && <span className="mx-1">...</span>}

            {/* Last page */}
            {totalPages > 1 && (
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 yellow-hover-button"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 yellow-hover-button"
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="yellow-hover-button"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
