"use client"

import { useState, useCallback } from "react"
import { DesignerHeader } from "@/components/designer/designer-header"
import { ToolsSidebar } from "@/components/designer/tools-sidebar"
import { TextToolPanel } from "@/components/designer/text-tool-panel"
import { ImageToolPanel } from "@/components/designer/image-tool-panel"
import { CanvasArea } from "@/components/designer/canvas-area"
import { PagesPanel } from "@/components/designer/pages-panel"
import { HelpButton } from "@/components/designer/help-button"
import type { DesignElement, Tool } from "@/types/designer"

const initialElements: DesignElement[] = [
  {
    id: "el-1",
    type: "text",
    content: "HEADLINE",
    x: 100,
    y: 150,
    width: 200,
    height: 40,
    fontSize: 36,
    fontWeight: "bold",
  },
  {
    id: "el-2",
    type: "text",
    content: "Your Text Here",
    x: 100,
    y: 200,
    width: 150,
    height: 20,
    fontSize: 14,
    fontWeight: "normal",
  },
  {
    id: "el-3",
    type: "image",
    src: "/placeholder.svg?height=120&width=300&text=Company+Logo",
    x: 50,
    y: 30,
    width: 300,
    height: 120,
  },
  {
    id: "el-4",
    type: "text",
    content: "COMPANY NAME",
    x: 100,
    y: 300,
    width: 150,
    height: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
]

export default function DesignCustomizerPage() {
  const [activeTool, setActiveTool] = useState<Tool>("text")
  const [elements, setElements] = useState<DesignElement[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [history, setHistory] = useState<DesignElement[][]>([initialElements])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [activePage, setActivePage] = useState<"front" | "back">("front")

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    const newElements = elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    setElements(newElements)
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, newElements])
    setHistoryIndex(newHistory.length)
  }

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  const renderToolPanel = () => {
    switch (activeTool) {
      case "text":
        return (
          <TextToolPanel
            elements={elements.filter((el) => el.type === "text")}
            selectedElementId={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
          />
        )
      case "images":
        return <ImageToolPanel />
      // Add cases for other tools here
      default:
        return <div className="p-4">Select a tool</div>
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 overflow-hidden">
      <DesignerHeader
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex h-full">
          <ToolsSidebar activeTool={activeTool} onSelectTool={setActiveTool} />
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {renderToolPanel()}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-200 dark:bg-gray-950 overflow-auto">
          <CanvasArea
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            zoom={zoom}
            onZoomChange={setZoom}
            onUpdateElement={updateElement}
          />
        </div>
        <div className="w-48 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
          <PagesPanel activePage={activePage} onPageChange={setActivePage} />
        </div>
      </main>
      <HelpButton />
    </div>
  )
}
