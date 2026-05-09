"use client"

import { Button } from "@/components/ui/button"
import type { DesignerOrientation } from "@/types/designer"

interface PagesPanelProps {
  activePage: "front" | "back"
  onPageChange: (page: "front" | "back") => void
  orientation?: DesignerOrientation
}

function PageThumbnail({ label, orientation = "portrait" }: { label: "Front" | "Back"; orientation?: DesignerOrientation }) {
  const sizeClass = orientation === "portrait" ? "h-32 w-24" : "h-24 w-32"

  return (
    <div className={`relative overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-300 ${sizeClass}`}>
      <div className="absolute left-0 top-0 h-full w-1.5 bg-yellow-400" />
      <div className="absolute inset-3 border border-dashed border-gray-200" />
      <div className="absolute left-4 top-5 h-2 w-12 rounded bg-gray-800" />
      <div className="absolute left-4 top-10 h-1.5 w-16 rounded bg-gray-300" />
      <div className="absolute left-4 top-14 h-1.5 w-10 rounded bg-gray-300" />
      <div className="absolute bottom-4 left-4 right-4 border-t border-gray-200 pt-2 text-[10px] font-semibold text-gray-500">
        {label}
      </div>
    </div>
  )
}

export function PagesPanel({ activePage, onPageChange, orientation }: PagesPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-center">Pages</h3>
      <div className="space-y-2">
        <Button
          variant="ghost"
          className={`w-full h-auto p-2 flex flex-col items-center gap-2 border-2 ${
            activePage === "front" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "border-transparent"
          }`}
          onClick={() => onPageChange("front")}
        >
          <PageThumbnail label="Front" orientation={orientation} />
          <span className="text-xs">Front</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full h-auto p-2 flex flex-col items-center gap-2 border-2 ${
            activePage === "back" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "border-transparent"
          }`}
          onClick={() => onPageChange("back")}
        >
          <PageThumbnail label="Back" orientation={orientation} />
          <span className="text-xs">Back</span>
        </Button>
      </div>
    </div>
  )
}
