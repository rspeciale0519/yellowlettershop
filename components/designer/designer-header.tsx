"use client"

import { Button } from "@/components/ui/button"
import { Save, Undo, Redo, Eye, LayoutPanelLeft, Replace } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DesignerHeaderProps {
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onPreview: () => void
  onNext: () => void
  onToggleOrientation: () => void
  onTemplateChange: (templateId: string) => void
  onCycleTemplate: () => void
  canUndo: boolean
  canRedo: boolean
  templateId: string
  templates: { id: string; name: string }[]
}

export function DesignerHeader({
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onNext,
  onToggleOrientation,
  onTemplateChange,
  onCycleTemplate,
  canUndo,
  canRedo,
  templateId,
  templates,
}: DesignerHeaderProps) {
  return (
    <TooltipProvider>
      <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={templateId}
              onChange={(event) => onTemplateChange(event.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-transparent px-2 text-sm font-semibold dark:border-gray-700"
              aria-label="Design template"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onSave} aria-label="Save design">
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
                  <Undo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
                  <Redo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex bg-transparent" onClick={onToggleOrientation}>
            <LayoutPanelLeft className="h-4 w-4 mr-2" />
            Change Orientation
          </Button>
          <Button variant="outline" size="sm" className="hidden md:inline-flex bg-transparent" onClick={onCycleTemplate}>
            <Replace className="h-4 w-4 mr-2" />
            Change Template
          </Button>
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm" 
            className=""
            onClick={onNext}
            style={{ backgroundColor: '#E0B431', color: '#000' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6CF62'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0B431'}
          >
            Next
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
