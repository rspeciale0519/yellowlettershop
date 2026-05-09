"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { CheckCircle, Loader2 } from "lucide-react"
import { CanvasArea } from "@/components/designer/canvas-area"
import { DesignerHeader } from "@/components/designer/designer-header"
import { DesignerWorkspaceSidebar } from "@/components/designer/designer-workspace-sidebar"
import { HelpButton } from "@/components/designer/help-button"
import { createModuleElement } from "@/components/designer/module-definitions"
import { PagesPanel } from "@/components/designer/pages-panel"
import { PreviewModal } from "@/components/designer/preview-modal"
import { CANVAS_SIZES, DESIGN_TEMPLATES, DESIGNER_STORAGE_KEY, createDesignerDocument } from "@/components/designer/designer-templates"
import { createClient } from "@/utils/supabase/client"
import { useDesignerFonts } from "@/hooks/use-designer-fonts"
import { useDesignerImages } from "@/hooks/use-designer-images"
import { useDesignerShortcuts } from "@/hooks/use-designer-shortcuts"
import type { DesignElement, DesignerDocument, DesignerImageAsset, DesignerMode, DesignerPage, Tool, WorkspacePanel } from "@/types/designer"

type StoredDesignerState = { document: DesignerDocument }
function loadStoredDesignerState(): StoredDesignerState | null {
  try {
    const raw = window.localStorage.getItem(DESIGNER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredDesignerState) : null
  } catch {
    return null
  }
}
function normalizeElements(elements: DesignElement[]) {
  return elements.map((element, index) => ({
    ...element,
    name: element.name || `${element.type} ${index + 1}`,
    zIndex: element.zIndex || index + 1,
  })) as DesignElement[]
}
export default function DesignCustomizerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<Tool>("text")
  const [activePanel, setActivePanel] = useState<WorkspacePanel>("modules")
  const [documentState, setDocumentState] = useState<DesignerDocument>(() => createDesignerDocument())
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [history, setHistory] = useState<DesignerDocument[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [zoom, setZoom] = useState(70)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [mode, setMode] = useState<DesignerMode>("select")
  const [activePage, setActivePage] = useState<DesignerPage>("front")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Draft not saved")
  const [imageReplaceTarget, setImageReplaceTarget] = useState<string | null>(null)
  const router = useRouter()
  const fonts = useDesignerFonts()
  const designerImages = useDesignerImages(Boolean(user))
  const supabase = useMemo(() => createClient(), [])
  const activeElements = documentState.pages[activePage]
  const canvasSize = CANVAS_SIZES[documentState.orientation]
  const selectedElementData = activeElements.find((element) => element.id === selectedElement) ?? null
  const templateOptions = useMemo(() => DESIGN_TEMPLATES.map(({ id, name }) => ({ id, name })), [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!data.user || error) {
          router.replace("/?auth=login&redirectedFrom=/design/customize")
          return
        }
        const stored = loadStoredDesignerState()
        const initialDocument = stored?.document ?? createDesignerDocument()
        const normalizedDocument = {
          ...initialDocument,
          pages: {
            front: normalizeElements(initialDocument.pages.front),
            back: normalizeElements(initialDocument.pages.back),
          },
        }
        setDocumentState(normalizedDocument)
        setHistory([normalizedDocument])
        setStatusMessage(stored ? `Recovered ${new Date(initialDocument.updatedAt).toLocaleTimeString()}` : "Draft not saved")
        setUser(data.user)
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.replace("/?auth=login&redirectedFrom=/design/customize")
      } finally { setIsLoading(false) }
    }
    checkAuth()
  }, [router, supabase])

  const commitDocument = useCallback((nextDocument: DesignerDocument) => {
    setDocumentState(nextDocument)
    setHistory((currentHistory) => {
      const nextHistory = currentHistory.slice(0, historyIndex + 1)
      nextHistory.push(nextDocument)
      setHistoryIndex(nextHistory.length - 1)
      return nextHistory
    })
    setStatusMessage("Unsaved changes")
  }, [historyIndex])

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
  }, [activeElements, activePage, canvasSize.height, canvasSize.width, commitDocument, documentState])

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
  }, [activeElements, activePage, canvasSize.height, canvasSize.width, commitDocument, documentState])

  const applyDesignerImage = useCallback((asset: DesignerImageAsset) => {
    if (imageReplaceTarget) {
      updateElement(imageReplaceTarget, { src: asset.url, name: asset.name, assetId: asset.id, sourceUrl: asset.sourceUrl })
      setSelectedElement(imageReplaceTarget)
      setImageReplaceTarget(null)
      setActivePanel("inspector")
      return
    }
    insertImage(asset)
  }, [imageReplaceTarget, insertImage, updateElement])

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
  }, [activeElements, activePage, commitDocument, documentState])

  const deleteElement = useCallback((id: string) => {
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: activeElements.filter((element) => element.id !== id) },
      updatedAt: new Date().toISOString(),
    })
    if (selectedElement === id) setSelectedElement(null)
  }, [activeElements, activePage, commitDocument, documentState, selectedElement])

  const reorderLayers = (orderedIds: string[]) => {
    const nextElements = activeElements.map((element) => {
      const topFirstIndex = orderedIds.indexOf(element.id)
      return topFirstIndex < 0 ? element : ({ ...element, zIndex: orderedIds.length - topFirstIndex } as DesignElement)
    })
    commitDocument({
      ...documentState,
      pages: { ...documentState.pages, [activePage]: nextElements },
      updatedAt: new Date().toISOString(),
    })
  }
  const moveLayer = (id: string, direction: "up" | "down") => {
    const topFirst = [...activeElements].sort((a, b) => b.zIndex - a.zIndex)
    const currentIndex = topFirst.findIndex((element) => element.id === id)
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= topFirst.length) return
    const reordered = [...topFirst]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, moved)
    reorderLayers(reordered.map((element) => element.id))
  }

  const saveDesign = useCallback(async () => {
    const nextDocument = { ...documentState, updatedAt: new Date().toISOString() }
    const payload: StoredDesignerState = { document: nextDocument }
    window.localStorage.setItem(DESIGNER_STORAGE_KEY, JSON.stringify(payload))
    window.sessionStorage.setItem("yls.pendingOrderDesign", JSON.stringify(nextDocument))

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) { setStatusMessage("Saved locally; sign in to sync"); return }
      const response = await fetch("/api/design/save", {
        method: nextDocument.designId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          designId: nextDocument.designId,
          designState: nextDocument,
          name: nextDocument.templateName,
          templateId: nextDocument.templateId,
        }),
      })
      const result = (await response.json()) as { designId?: string; error?: string }
      if (!response.ok) throw new Error(result.error ?? "Design save failed")
      const savedDocument = { ...nextDocument, designId: result.designId ?? nextDocument.designId }
      setDocumentState(savedDocument)
      window.sessionStorage.setItem("yls.pendingOrderDesign", JSON.stringify(savedDocument))
      setStatusMessage(`Saved ${new Date(savedDocument.updatedAt).toLocaleTimeString()}`)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.info("Server save skipped:", error instanceof Error ? error.message : error)
      }
      setStatusMessage("Saved locally; server save failed")
    }
  }, [documentState, supabase])

  useEffect(() => {
    if (!user || statusMessage !== "Unsaved changes") return
    const timeout = window.setTimeout(() => {
      void saveDesign()
    }, 3000)
    return () => window.clearTimeout(timeout)
  }, [saveDesign, statusMessage, user])

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setDocumentState(history[nextIndex])
    setStatusMessage("Unsaved changes")
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setDocumentState(history[nextIndex])
    setStatusMessage("Unsaved changes")
  }, [history, historyIndex])

  useDesignerShortcuts({
    selectedElement,
    onClearSelection: () => setSelectedElement(null),
    onDelete: deleteElement,
    onDuplicate: duplicateElement,
    onUndo: handleUndo,
    onRedo: handleRedo,
  })

  const handleTemplateChange = (templateId: string) => {
    const nextDocument = { ...createDesignerDocument(templateId), orientation: documentState.orientation }
    commitDocument(nextDocument)
    setActivePage("front")
    setSelectedElement(null)
  }

  const continueToOrder = async () => {
    await saveDesign()
    router.push("/orders/new?source=design_tool")
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading...</div>
  if (!user) return null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-50">
      <DesignerHeader
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={saveDesign}
        onPreview={() => setIsPreviewOpen(true)}
        onNext={continueToOrder}
        onToggleOrientation={() => commitDocument({ ...documentState, orientation: documentState.orientation === "portrait" ? "landscape" : "portrait" })}
        onTemplateChange={handleTemplateChange}
        onCycleTemplate={() => {
          const index = DESIGN_TEMPLATES.findIndex((template) => template.id === documentState.templateId)
          handleTemplateChange(DESIGN_TEMPLATES[(index + 1) % DESIGN_TEMPLATES.length].id)
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        templateId={documentState.templateId}
        templates={templateOptions}
      />
      <div className="flex h-9 items-center gap-2 border-b border-gray-200 bg-white px-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <CheckCircle className="h-4 w-4 text-yellow-500" />
        <span>{documentState.templateName}</span>
        <span className="text-gray-400">/</span>
        <span className="capitalize">{documentState.orientation}</span>
        <span className="ml-auto">{statusMessage}</span>
      </div>
      <main className="flex flex-1 overflow-hidden">
        <DesignerWorkspaceSidebar
          activePanel={activePanel}
          activeTool={activeTool}
          elements={activeElements}
          canvasSize={canvasSize}
          fonts={fonts}
          selectedElement={selectedElementData}
          selectedElementId={selectedElement}
          savedImages={designerImages.images}
          imageLibraryError={designerImages.error}
          isLoadingImages={designerImages.isLoading}
          isUploadingImage={designerImages.isUploading}
          imagePickerMode={imageReplaceTarget ? "replace" : "insert"}
          onPanelChange={setActivePanel}
          onToolChange={(tool) => { setActiveTool(tool); if (tool !== "images") setImageReplaceTarget(null) }}
          onAddModule={addElement}
          onUploadImage={async (file, name) => applyDesignerImage(await designerImages.uploadImage(file, name))}
          onInsertImage={applyDesignerImage}
          onSelectElement={(id) => { setSelectedElement(id); setActivePanel("inspector") }}
          onUpdateElement={updateElement}
          onMoveLayer={moveLayer}
          onReorderLayers={reorderLayers}
          onToggleHidden={(id) => updateElement(id, { hidden: !activeElements.find((element) => element.id === id)?.hidden })}
          onToggleLocked={(id) => updateElement(id, { locked: !activeElements.find((element) => element.id === id)?.locked })}
          onDuplicate={duplicateElement}
          onDelete={deleteElement}
        />
        <CanvasArea
          elements={activeElements}
          fonts={fonts}
          selectedElement={selectedElement}
          mode={mode}
          onModeChange={setMode}
          onSelectElement={(id) => {
            setSelectedElement(id)
            if (id) setActivePanel("inspector")
          }}
          zoom={zoom}
          onZoomChange={setZoom}
          pan={pan}
          onPanChange={setPan}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onDropModule={addElement}
          canvasSize={canvasSize}
          onReplaceImageRequest={(id) => { setSelectedElement(id); setImageReplaceTarget(id); setActiveTool("images"); setActivePanel("modules") }}
        />
        <div className="w-48 border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <PagesPanel activePage={activePage} onPageChange={setActivePage} orientation={documentState.orientation} />
        </div>
      </main>
      {isPreviewOpen && <PreviewModal documentState={documentState} canvasSize={canvasSize} onClose={() => setIsPreviewOpen(false)} />}
      <HelpButton />
    </div>
  )
}
