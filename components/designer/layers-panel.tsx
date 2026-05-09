"use client"

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DesignElement } from "@/types/designer"

interface LayersPanelProps {
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement: (id: string) => void
  onMoveLayer: (id: string, direction: "up" | "down") => void
  onReorderLayers: (orderedIds: string[]) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function LayersPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onMoveLayer,
  onReorderLayers,
  onToggleHidden,
  onToggleLocked,
  onDuplicate,
  onDelete,
}: LayersPanelProps) {
  const layers = [...elements].sort((a, b) => b.zIndex - a.zIndex)
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const nextLayers = [...layers]
    const [movedLayer] = nextLayers.splice(result.source.index, 1)
    nextLayers.splice(result.destination.index, 0, movedLayer)
    onReorderLayers(nextLayers.map((layer) => layer.id))
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">Layers</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Control order, visibility, and locking for this page.
        </p>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="designer-layers">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {layers.map((element, index) => (
                <Draggable key={element.id} draggableId={element.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`rounded-md border p-2 ${
                        selectedElementId === element.id
                          ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                      } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          className="mt-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          aria-label={`Drag ${element.name} layer`}
                          {...dragProvided.dragHandleProps}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                          onClick={() => onSelectElement(element.id)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-gray-950 dark:text-gray-50">
                              {element.name}
                            </span>
                            <span className="block text-xs uppercase text-gray-500">{element.type}</span>
                          </span>
                          <span className="text-xs text-gray-400">#{element.zIndex}</span>
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMoveLayer(element.id, "up")}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMoveLayer(element.id, "down")}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleHidden(element.id)}>
                          {element.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleLocked(element.id)}>
                          {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(element.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDelete(element.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {layers.length === 0 && (
                <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  Add a module to start building this page.
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
