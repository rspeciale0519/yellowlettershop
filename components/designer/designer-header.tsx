"use client"

import { Button } from "@/components/ui/button"
import { Eye, Redo, RectangleHorizontal, RectangleVertical, Save, Undo } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MAIL_FORMATS, type MailFormatId } from "@/components/designer/mail-spec"
import type { DesignerOrientation } from "@/types/designer"

interface DesignerHeaderProps {
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onPreview: () => void
  onNext: () => void
  onToggleOrientation: () => void
  onTemplateChange: (templateId: string) => void
  onFormatChange: (formatId: MailFormatId) => void
  canUndo: boolean
  canRedo: boolean
  orientation: DesignerOrientation
  templateId: string
  formatId: MailFormatId
  templates: { id: string; name: string }[]
  savedLabel: string
}

export function DesignerHeader({
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onNext,
  onToggleOrientation,
  onTemplateChange,
  onFormatChange,
  canUndo,
  canRedo,
  orientation,
  templateId,
  formatId,
  templates,
  savedLabel,
}: DesignerHeaderProps) {
  const isPortrait = orientation === "portrait"
  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        {/* Left: what you're editing — template, size, orientation, history */}
        <div className="flex items-center gap-3">
          <Select value={templateId} onValueChange={onTemplateChange}>
            <SelectTrigger aria-label="Design template" className="h-9 w-[190px] text-sm font-medium">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatId} onValueChange={(value) => onFormatChange(value as MailFormatId)}>
            <SelectTrigger aria-label="Mail piece size" className="h-9 w-[150px] text-sm font-medium">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(MAIL_FORMATS).map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mx-1 h-6 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onSave} aria-label="Save design">
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save project</TooltipContent>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleOrientation}
                  aria-label={`Orientation: ${orientation}. Switch to ${isPortrait ? "landscape" : "portrait"}.`}
                >
                  {isPortrait ? <RectangleVertical className="h-5 w-5" /> : <RectangleHorizontal className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPortrait ? "Portrait — switch to landscape" : "Landscape — switch to portrait"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right: save status, then where you're going — proof, then order */}
        <div className="flex items-center gap-2">
          {savedLabel ? (
            <span className="mr-1 hidden text-xs font-medium text-muted-foreground sm:inline" aria-live="polite">
              {savedLabel}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" variant="brand" onClick={onNext}>
            Next
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
