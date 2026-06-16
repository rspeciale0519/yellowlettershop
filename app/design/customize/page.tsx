"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"
import { CanvasArea } from "@/components/designer/canvas-area"
import { DesignerHeader } from "@/components/designer/designer-header"
import { DesignerWorkspaceSidebar } from "@/components/designer/designer-workspace-sidebar"
import { HelpButton } from "@/components/designer/help-button"
import { PagesPanel } from "@/components/designer/pages-panel"
import { PreviewModal } from "@/components/designer/preview-modal"
import { ConfirmDialog } from "@/components/designer/ui/confirm-dialog"
import { DESIGN_TEMPLATES, DESIGNER_STORAGE_KEY, createDesignerDocument } from "@/components/designer/designer-templates"
import { specRectsPx, withFormatId } from "@/components/designer/mail-spec"
import { createClient } from "@/utils/supabase/client"
import { useDesignerFonts } from "@/hooks/use-designer-fonts"
import { useDesignerImages } from "@/hooks/use-designer-images"
import { useDesignerShortcuts } from "@/hooks/use-designer-shortcuts"
import { useDesignerAutosave } from "@/hooks/use-designer-autosave"
import { useDesignerDocument } from "@/hooks/use-designer-document"
import { designerRootClass } from "@/components/designer/designer-type"
import type { DesignElement, DesignerDocument, DesignerMode, DesignerPage, Tool, WorkspacePanel } from "@/types/designer"

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
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(70)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [mode, setMode] = useState<DesignerMode>("select")
  const [activePage, setActivePage] = useState<DesignerPage>("front")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [imageReplaceTarget, setImageReplaceTarget] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const router = useRouter()
  const fonts = useDesignerFonts()
  const designerImages = useDesignerImages(Boolean(user))
  const supabase = useMemo(() => createClient(), [])

  const saveDesignRef = useRef<() => Promise<void>>(async () => {})
  const autosave = useDesignerAutosave({
    enabled: Boolean(user),
    onSave: () => saveDesignRef.current(),
  })
  const doc = useDesignerDocument({
    activePage,
    selectedElement,
    imageReplaceTarget,
    markDirty: autosave.setDirty,
    setSelectedElement,
    setActivePanel,
    setActiveTool,
    setMode,
    setImageReplaceTarget,
    setActivePage,
  })

  const { documentState, canvasSize, activeElements } = doc
  const selectedElementData = activeElements.find((element) => element.id === selectedElement) ?? null
  const templateOptions = useMemo(() => DESIGN_TEMPLATES.map(({ id, name }) => ({ id, name })), [])
  const specRects = useMemo(
    () => specRectsPx(doc.formatId, documentState.orientation),
    [doc.formatId, documentState.orientation],
  )
  const activeBackground = documentState.backgrounds?.[activePage]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!data.user || error) {
          router.replace("/?auth=login&redirectedFrom=/design/customize")
          return
        }
        const stored = loadStoredDesignerState()
        const initialDocument = withFormatId(stored?.document ?? createDesignerDocument())
        const normalizedDocument = {
          ...initialDocument,
          pages: {
            front: normalizeElements(initialDocument.pages.front),
            back: normalizeElements(initialDocument.pages.back),
          },
        }
        doc.hydrate(normalizedDocument)
        if (stored) autosave.setRecovered(new Date(initialDocument.updatedAt).toLocaleTimeString())
        else autosave.setIdle()
        setUser(data.user)
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.replace("/?auth=login&redirectedFrom=/design/customize")
      } finally {
        setIsLoading(false)
      }
    }
    void checkAuth()
    // Mount-once auth bootstrap (matches prior behavior). doc.hydrate is stable;
    // autosave setters are intentionally not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase])

  const saveDesign = useCallback(async () => {
    const nextDocument = { ...documentState, updatedAt: new Date().toISOString() }
    const payload: StoredDesignerState = { document: nextDocument }
    window.localStorage.setItem(DESIGNER_STORAGE_KEY, JSON.stringify(payload))
    // localStorage (not sessionStorage) so the order tab — which the designer
    // opens in a SEPARATE tab — can pick the design up on focus.
    window.localStorage.setItem("yls.pendingOrderDesign", JSON.stringify(nextDocument))

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        autosave.setLocalOnly()
        return
      }
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
      doc.setDocumentState(savedDocument)
      window.localStorage.setItem("yls.pendingOrderDesign", JSON.stringify(savedDocument))
      autosave.setSaved(new Date(savedDocument.updatedAt).toLocaleTimeString())
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.info("Server save skipped:", error instanceof Error ? error.message : error)
      }
      autosave.setError()
    }
  }, [autosave, doc, documentState, supabase])

  useEffect(() => {
    saveDesignRef.current = saveDesign
  }, [saveDesign])

  // Guarded delete: postage (stamp/indicia) areas require explicit confirmation;
  // everything else deletes immediately. Routes every delete entry point.
  const requestDeleteElement = useCallback(
    (id: string) => {
      const el = activeElements.find((element) => element.id === id)
      if (el?.type === "postage") setPendingDelete(id)
      else doc.deleteElement(id)
    },
    [activeElements, doc],
  )

  useDesignerShortcuts({
    selectedElement,
    onClearSelection: () => setSelectedElement(null),
    onDelete: requestDeleteElement,
    onDuplicate: doc.duplicateElement,
    onUndo: doc.handleUndo,
    onRedo: doc.handleRedo,
    onNudge: (id, dx, dy) => {
      const el = activeElements.find((element) => element.id === id)
      if (el) doc.updateElement(id, { x: el.x + dx, y: el.y + dy })
    },
  })

  const continueToOrder = async () => {
    await saveDesign()
    router.push("/orders/new?source=design_tool")
  }

  const handleReplaceImageRequest = (id: string) => {
    setSelectedElement(id)
    setImageReplaceTarget(id)
    setActiveTool("images")
    setActivePanel("modules")
  }

  const handleBackgroundChange = (next: typeof activeBackground) => {
    doc.commitDocument({
      ...documentState,
      backgrounds: { ...documentState.backgrounds, [activePage]: next },
      updatedAt: new Date().toISOString(),
    })
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading...</div>
  if (!user) return null

  return (
    <div className={`flex h-screen flex-col overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-50 ${designerRootClass}`}>
      <DesignerHeader
        onUndo={doc.handleUndo}
        onRedo={doc.handleRedo}
        onSave={saveDesign}
        onPreview={() => setIsPreviewOpen(true)}
        onNext={continueToOrder}
        onToggleOrientation={() => doc.commitDocument({ ...documentState, orientation: documentState.orientation === "portrait" ? "landscape" : "portrait" })}
        onTemplateChange={doc.handleTemplateChange}
        onFormatChange={doc.setFormat}
        canUndo={doc.historyIndex > 0}
        canRedo={doc.historyIndex < doc.history.length - 1}
        orientation={documentState.orientation}
        templateId={documentState.templateId}
        formatId={doc.formatId}
        templates={templateOptions}
        savedLabel={autosave.label}
      />
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
          onAddModule={doc.addElement}
          onUploadImage={async (file, name) => doc.applyDesignerImage(await designerImages.uploadImage(file, name))}
          onInsertImage={doc.applyDesignerImage}
          onSelectElement={(id) => { setSelectedElement(id); setActivePanel("inspector") }}
          onUpdateElement={doc.updateElement}
          onMoveLayer={doc.moveLayer}
          onReorderLayers={doc.reorderLayers}
          onToggleHidden={(id) => doc.updateElement(id, { hidden: !activeElements.find((element) => element.id === id)?.hidden })}
          onToggleLocked={(id) => doc.updateElement(id, { locked: !activeElements.find((element) => element.id === id)?.locked })}
          onDuplicate={doc.duplicateElement}
          onDelete={requestDeleteElement}
          onReplaceImageRequest={handleReplaceImageRequest}
          activePage={activePage}
          pageBackground={activeBackground}
          onBackgroundChange={handleBackgroundChange}
          specRects={specRects}
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
          onUpdateElement={doc.updateElement}
          onDeleteElement={requestDeleteElement}
          onDuplicateElement={doc.duplicateElement}
          onToggleLock={(id) => doc.updateElement(id, { locked: !activeElements.find((element) => element.id === id)?.locked })}
          onDropModule={doc.addElement}
          onDropAsset={doc.dropAsset}
          canvasSize={canvasSize}
          specRects={specRects}
          background={activeBackground}
          onReplaceImageRequest={handleReplaceImageRequest}
        />
        <div className="w-48 border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <PagesPanel activePage={activePage} onPageChange={setActivePage} orientation={documentState.orientation} />
        </div>
      </main>
      {isPreviewOpen && <PreviewModal documentState={documentState} canvasSize={canvasSize} onClose={() => setIsPreviewOpen(false)} />}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this postage area?"
        description="Stamp and Indicia areas are postal-compliance elements. Removing this may affect how your mailpiece is processed — you can re-add it from the Postage tab."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (pendingDelete) doc.deleteElement(pendingDelete)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
      <HelpButton />
    </div>
  )
}
