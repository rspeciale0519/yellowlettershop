"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Type, ImageIcon, Palette, QrCode, Table, Shapes, LayoutTemplate } from "lucide-react"
import type { Tool } from "@/types/designer"

const tools: { id: Tool; label: string; icon: React.ElementType }[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "graphics", label: "Graphics", icon: Shapes },
  { id: "qr-codes", label: "QR Codes", icon: QrCode },
  { id: "tables", label: "Tables", icon: Table },
  { id: "colors", label: "Design Color", icon: Palette },
  { id: "background", label: "Background", icon: LayoutTemplate },
]

interface ToolsSidebarProps {
  activeTool: Tool
  onSelectTool: (tool: Tool) => void
}

export function ToolsSidebar({ activeTool, onSelectTool }: ToolsSidebarProps) {
  return (
    <TooltipProvider>
      <aside className="flex flex-col items-center w-20 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 py-4 space-y-2">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-16 w-16 rounded-lg ${
                  activeTool === tool.id
                    ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => onSelectTool(tool.id)}
                aria-pressed={activeTool === tool.id}
              >
                <tool.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}
      </aside>
    </TooltipProvider>
  )
}
