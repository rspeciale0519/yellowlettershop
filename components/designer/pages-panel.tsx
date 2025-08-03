"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PagesPanelProps {
  activePage: "front" | "back"
  onPageChange: (page: "front" | "back") => void
}

export function PagesPanel({ activePage, onPageChange }: PagesPanelProps) {
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
          <div className="w-24 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=100&width=80&text=Front"
              alt="Front page preview"
              width={80}
              height={100}
              unoptimized // Added unoptimized prop
            />
          </div>
          <span className="text-xs">Front</span>
        </Button>
        <Button
          variant="ghost"
          className={`w-full h-auto p-2 flex flex-col items-center gap-2 border-2 ${
            activePage === "back" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "border-transparent"
          }`}
          onClick={() => onPageChange("back")}
        >
          <div className="w-24 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=100&width=80&text=Back"
              alt="Back page preview"
              width={80}
              height={100}
              unoptimized // Added unoptimized prop
            />
          </div>
          <span className="text-xs">Back</span>
        </Button>
      </div>
    </div>
  )
}
