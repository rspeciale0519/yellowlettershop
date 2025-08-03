"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, Save, Undo, Redo, Eye, LayoutPanelLeft, Replace } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DesignerHeaderProps {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function DesignerHeader({ onUndo, onRedo, canUndo, canRedo }: DesignerHeaderProps) {
  return (
    <TooltipProvider>
      <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-4">
          
          <div className="flex items-center gap-2">
            {/* Corrected the syntax error here */}
            <Button variant="ghost" className="p-1 h-auto">
              <span className="font-semibold">Real Estate Flyer</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => alert("Save functionality placeholder")}>
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                  <Undo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                  <Redo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex bg-transparent">
            <LayoutPanelLeft className="h-4 w-4 mr-2" />
            Change Orientation
          </Button>
          <Button variant="outline" size="sm" className="hidden md:inline-flex bg-transparent">
            <Replace className="h-4 w-4 mr-2" />
            Change Template
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            Next
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
