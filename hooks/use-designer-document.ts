"use client"

import { useCallback, useState } from "react"
import { createModuleElement } from "@/components/designer/module-definitions"
import { CANVAS_SIZES, createDesignerDocument } from "@/components/designer/designer-templates"
import type {
  DesignElement,
  DesignerDocument,
  DesignerImageAsset,
  DesignerMode,
  DesignerPage,
  Tool,
  WorkspacePanel,
} from "@/types/designer"

// Owns document + undo/redo history + every element operation. Extracted
// verbatim from page.tsx (Phase 2 — behavior-preserving) so page.tsx is ≤350
// LOC; the only change is `markDirty()` replacing the status string.
export interface UseDesignerDocumentArgs {
  activePage: DesignerPage
  selectedElement: string | null
  imageReplaceTarget: string | null
  markDirty: () => void
  setSelectedElement: (id: string | null) => void
  setActivePanel: (panel: WorkspacePanel) => void
  setActiveTool: (tool: Tool) => void
  setMode: (mode: DesignerMode) => void
  setImageReplaceTarget: (id: string | null) => void
  setActivePage: (page: DesignerPage) => void
}

export function useDesignerDocument(args: UseDesignerDocumentArgs) {
  const {
    activePage,
    selectedElement,
    imageReplaceTarget,
    markDirty,
    setSelectedElement,
    setActivePanel,
    setActiveTool,
    setMode,
    setImageReplaceTarget,
    setActivePage,
  } = args

  const [documentState, setDocumentState] = useState<DesignerDocument>(() => createDesignerDocument())
  const [history, setHistory] = useState<DesignerDocument[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)

  const canvasSize = CANVAS_SIZES[documentState.orientation]
  const activeElements = documentState.pages[activePage]

  const hydrate = useCallback((nextDocument: DesignerDocument) => {
    setDocumentState(nextDocument)
    setHistory([nextDocument])
    setHistoryIndex(0)
  }, [])

  const commitDocument = useCallback((nextDocument: DesignerDocument) => {
    setDocumentState(nextDocument)
    setHistory((currentHistory) => {
      const nextHistory = currentHistory.slice(0, historyIndex + 1)
      nextHistory.push(nextDocument)
      setHistoryIndex(nextHistory.length - 1)
      return nextHistory
    })
    markDirty()
  }, [historyIndex, markDirty])

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    const nextElements = activeElements.map((element) => (element.id === id ? ({ ...element, ...updates } as DesignElement) : element))
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: nextElements },
      updatedAt: new Date().toISOString(),
    })
  }, [activeElements, activePage, commitDocument, documentState])

  const addElement = useCallback((moduleId: string, position?: { x: number; y: number }) => {
    if (moduleId === "image") {
      setActiveTool("images")
      setActivePanel("modules")
      setImageReplaceTarget(null)
      return
    }
    const nextZ = Math.max(0, ...activeElements.map((element) => element.zIndex)) + 1
    const nextElement = createModuleElement(moduleId, position ?? { x: canvasSize.width / 2 - 140, y: canvasSize.height / 2 - 60 }, nextZ)
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: [...activeElements, nextElement] },
      updatedAt: new Date().toISOString(),
    })
    setSelectedElement(nextElement.id)
    setActivePanel("inspector")
    setMode("select")
  }, [activeElements, activePage, canvasSize.height, canvasSize.width, commitDocument, documentState, setActivePanel, setActiveTool, setImageReplaceTarget, setMode, setSelectedElement])

  const insertImage = useCallback((asset: DesignerImageAsset) => {
    const nextZ = Math.max(0, ...activeElements.map((element) => element.zIndex)) + 1
    const imageElement = {
      ...createModuleElement("image", { x: canvasSize.width / 2 - 130, y: canvasSize.height / 2 - 90 }, nextZ),
      src: asset.url, name: asset.name, assetId: asset.id, sourceUrl: asset.sourceUrl,
    } as DesignElement
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: [...activeElements, imageElement] },
      updatedAt: new Date().toISOString(),
    })
    setSelectedElement(imageElement.id)
    setActivePanel("inspector")
  }, [activeElements, activePage, canvasSize.height, canvasSize.width, commitDocument, documentState, setActivePanel, setSelectedElement])

  const applyDesignerImage = useCallback((asset: DesignerImageAsset) => {
    if (imageReplaceTarget) {
      updateElement(imageReplaceTarget, { src: asset.url, name: asset.name, assetId: asset.id, sourceUrl: asset.sourceUrl })
      setSelectedElement(imageReplaceTarget)
      setImageReplaceTarget(null)
      setActivePanel("inspector")
      return
    }
    insertImage(asset)
  }, [imageReplaceTarget, insertImage, updateElement, setActivePanel, setImageReplaceTarget, setSelectedElement])

  const duplicateElement = useCallback((id: string) => {
    const source = activeElements.find((element) => element.id === id)
    if (!source) return
    const duplicate = {
      ...source,
      id: `${source.id}-copy-${Date.now()}`,
      name: `${source.name} Copy`,
      x: source.x + 24,
      y: source.y + 24,
      zIndex: Math.max(0, ...activeElements.map((element) => element.zIndex)) + 1,
    } as DesignElement
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: [...activeElements, duplicate] },
      updatedAt: new Date().toISOString(),
    })
    setSelectedElement(duplicate.id)
  }, [activeElements, activePage, commitDocument, documentState, setSelectedElement])

  const deleteElement = useCallback((id: string) => {
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: activeElements.filter((element) => element.id !== id) },
      updatedAt: new Date().toISOString(),
    })
    if (selectedElement === id) setSelectedElement(null)
  }, [activeElements, activePage, commitDocument, documentState, selectedElement, setSelectedElement])

  const reorderLayers = useCallback((orderedIds: string[]) => {
    const nextElements = activeElements.map((element) => {
      const topFirstIndex = orderedIds.indexOf(element.id)
      return topFirstIndex < 0 ? element : ({ ...element, zIndex: orderedIds.length - topFirstIndex } as DesignElement)
    })
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: nextElements },
      updatedAt: new Date().toISOString(),
    })
  }, [activeElements, activePage, commitDocument, documentState])

  const moveLayer = useCallback((id: string, direction: "up" | "down") => {
    const topFirst = [...activeElements].sort((a, b) => b.zIndex - a.zIndex)
    const currentIndex = topFirst.findIndex((element) => element.id === id)
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= topFirst.length) return
    const reordered = [...topFirst]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, moved)
    reorderLayers(reordered.map((element) => element.id))
  }, [activeElements, reorderLayers])

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setDocumentState(history[nextIndex])
    markDirty()
  }, [history, historyIndex, markDirty])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setDocumentState(history[nextIndex])
    markDirty()
  }, [history, historyIndex, markDirty])

  const handleTemplateChange = useCallback((templateId: string) => {
    const nextDocument = { ...createDesignerDocument(templateId), orientation: documentState.orientation }
    commitDocument(nextDocument)
    setActivePage("front")
    setSelectedElement(null)
  }, [commitDocument, documentState.orientation, setActivePage, setSelectedElement])

  return {
    documentState,
    setDocumentState,
    history,
    historyIndex,
    canvasSize,
    activeElements,
    hydrate,
    commitDocument,
    updateElement,
    addElement,
    insertImage,
    applyDesignerImage,
    duplicateElement,
    deleteElement,
    reorderLayers,
    moveLayer,
    handleUndo,
    handleRedo,
    handleTemplateChange,
  }
}
