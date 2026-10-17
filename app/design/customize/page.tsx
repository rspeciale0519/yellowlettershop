"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CanvasArea } from "@/components/designer/canvas-area"
import { DesignerHeader } from "@/components/designer/designer-header"
import { DesignerWorkspaceSidebar } from "@/components/designer/designer-workspace-sidebar"
import { EditorShell } from "@/components/designer/workspace/editor-shell"
import { HelpButton } from "@/components/designer/help-button"
import { PagesPanel } from "@/components/designer/pages-panel"
import { PreviewModal } from "@/components/designer/preview-modal"
import { ConfirmDialog } from "@/components/designer/ui/confirm-dialog"
import { DESIGN_TEMPLATES } from "@/components/designer/designer-templates"
import { specRectsPx } from "@/components/designer/mail-spec"
import { createClient } from "@/utils/supabase/client"
import { useDesignerFonts } from "@/hooks/use-designer-fonts"
import { useDesignerImages } from "@/hooks/use-designer-images"
import { useDesignerShortcuts } from "@/hooks/use-designer-shortcuts"
import { useDesignerSave } from "@/hooks/use-designer-save"
import { useDesignerBootstrap } from "@/hooks/use-designer-bootstrap"
import { DesignerTextProvider } from "@/components/designer/writing/text-layout-context"
import { DesignerPrintGate, type PrintGateState } from "@/components/designer/writing/print-gate"
import { DesignerOrderSummary } from "@/components/designer/workspace/order-summary"
import { asRecord } from "@/lib/orders/quote-inputs"
import type { SenderInput } from "@/components/designer/tokens/recipient-map"
import { useDesignerDocument } from "@/hooks/use-designer-document"
import { designerRootClass } from "@/components/designer/designer-type"
import { templateContextUrl, templateEntryUrl } from "@/lib/designer/template-entry"
import { TemplateEntryRecovery } from "@/components/designer/workspace/template-entry-recovery"
import { compatiblePaperSwitch, switchDesignerTemplate } from "@/lib/designer/template-switch"
import { writeDraft } from "@/lib/designer/draft-context"
import type { DesignerMode, DesignerPage, Tool, WorkspacePanel } from "@/types/designer"

const markDirty = () => undefined
export default function DesignCustomizerPage() {
  return <Suspense fallback={<div>Loading designer…</div>}><DesignCustomizerContent /></Suspense>
}

function DesignCustomizerContent() {
  const searchParams = useSearchParams()
  const [actionError, setActionError] = useState<string | null>(null)
  const [errorAction,setErrorAction]=useState<'save'|'preflight'|'dismiss'>('save')
  const printGate = useRef<PrintGateState>({ready:false})
  const onPrintState = useCallback((state:PrintGateState) => { printGate.current=state },[])
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
  const supabase = useMemo(() => createClient(), [])

  const doc = useDesignerDocument({
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
  })

  const { documentState, canvasSize, activeElements } = doc
  const selectedElementData = activeElements.find((element) => element.id === selectedElement) ?? null
  const templateOptions = useMemo(() => DESIGN_TEMPLATES.map(({ id, name }) => ({ id, name })), [])
  const specRects = useMemo(
    () => specRectsPx(doc.formatId, documentState.orientation),
    [doc.formatId, documentState.orientation],
  )
  const activeBackground = documentState.backgrounds?.[activePage]

  const bootstrap = useDesignerBootstrap({supabase,query:searchParams.toString(),hydrate:doc.hydrate})
  const currentQuery=useRef(searchParams.toString())
  currentQuery.current=searchParams.toString()
  const continuing=useRef(false)
  const { user, orderId, orderState } = bootstrap
  const designerImages = useDesignerImages(Boolean(user))
  const saving = useDesignerSave({document:documentState,userId:user?.id,orderId,context:{designId:bootstrap.initialDesignId},enabled:Boolean(user) && !bootstrap.loading && !bootstrap.error && !bootstrap.entryIssue})
  const saveCurrentDesign=saving.save
  const saveDesign = useCallback(async () => {
    const result=await saveCurrentDesign()
    setErrorAction('save')
    setActionError(result.ok?null:result.message)
    return result
  },[saveCurrentDesign])
  useEffect(() => {
    if(bootstrap.loading || bootstrap.error || !user) return
    const timeout=window.setTimeout(()=>{void saveCurrentDesign()},3000)
    return()=>window.clearTimeout(timeout)
  },[documentState,bootstrap.loading,bootstrap.error,user,saveCurrentDesign])
  useEffect(() => {
    if(bootstrap.loading) return
    const candidate=activeElements.find(element=>element.type==='text' && !element.continuesFrom)
    if(candidate){setSelectedElement(candidate.id);setActivePanel("inspector")}
    // Choose a useful initial text box once after hydration; selection edits remain manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[bootstrap.loading])
  const sender=useMemo(()=>asRecord(asRecord(orderState.designAndContent).contactCard ?? orderState.contactCard).contactCardData as SenderInput | undefined ?? {},[orderState])

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
    if(continuing.current || bootstrap.loading) return
    if(!printGate.current.ready){setErrorAction('preflight');setActionError(printGate.current.error ?? "Resolve the print checks before continuing.");setActivePanel("preflight");return}
    continuing.current=true
    const query=currentQuery.current
    try {
      const result=await saveDesign()
      if(!result.ok || currentQuery.current!==query || !printGate.current.ready) return
      const params=new URLSearchParams({source:"design_tool",designId:result.designId,revision:result.revision})
      if(orderId) params.set("orderId",orderId)
      router.push(`/orders/new?${params}`)
    } finally {continuing.current=false}
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

  const changeTemplate=(id:string)=>{
    const preserved=saving.preserveBeforeReplace()
    if(!preserved && !saving.savedReference){setErrorAction('save');setActionError('Save your current design online before changing templates.');return}
    if(user && compatiblePaperSwitch(documentState.templateId,id)){
      let recovered=false
      try{recovered=writeDraft(localStorage,{userId:user.id,templateId:id,orderId},switchDesignerTemplate(documentState,id))}catch{/* Keep the current composition if recovery cannot be preserved. */}
      if(!recovered){setErrorAction('dismiss');setActionError('Your browser could not preserve this paper change. Your current design is unchanged.');return}
    }
    bootstrap.setInitialDesignId(undefined)
    doc.handleTemplateChange(id)
    window.history.replaceState(null,"",templateEntryUrl(id,searchParams.toString()))
  }

  if (bootstrap.loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading...</div>
  if (!user) return null
  if (bootstrap.entryIssue) return <TemplateEntryRecovery reason={bootstrap.entryIssue} context={searchParams.toString()} hasDraft={bootstrap.hasDraft} />
  if (bootstrap.error) return <div role="alert" className="p-8">{bootstrap.error}<button type="button" className="ml-3 underline" onClick={()=>window.location.reload()}>Retry loading</button></div>

  return (
    <DesignerTextProvider document={documentState} pageId={activePage} sender={sender} onFocusIssue={(page,id)=>{setActivePage(page);setSelectedElement(id ?? null);setActivePanel("inspector")}}>
    <DesignerPrintGate onChange={onPrintState}/>
    <div className={`relative ${designerRootClass}`}>
      {actionError && <div role="alert" className="flex flex-wrap items-center gap-2 border-b bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}<button type="button" className="underline" onClick={()=>errorAction==='save'?void saveDesign():errorAction==='preflight'?setActivePanel('preflight'):setActionError(null)}>{errorAction==='save'?'Retry saving':errorAction==='preflight'?'Show print checks':'Dismiss'}</button></div>}
      <EditorShell header={
      <DesignerHeader
        galleryHref={templateContextUrl("/templates", searchParams.toString())}
        onUndo={doc.handleUndo}
        onRedo={doc.handleRedo}
        onSave={()=>void saveDesign()}
        onPreview={() => setIsPreviewOpen(true)}
        onNext={continueToOrder}
        onToggleOrientation={() => doc.commitDocument({ ...documentState, orientation: documentState.orientation === "portrait" ? "landscape" : "portrait" })}
        onTemplateChange={changeTemplate}
        onFormatChange={(id)=>{saving.preserveBeforeReplace();const result=doc.setFormat(id);if(result && !result.ok){setErrorAction('dismiss');setActionError(result.error)}else setActionError(null)}}
        canUndo={doc.historyIndex > 0}
        canRedo={doc.historyIndex < doc.history.length - 1}
        orientation={documentState.orientation}
        templateId={documentState.templateId}
        formatId={doc.formatId}
        templates={templateOptions}
        savedLabel={saving.message}
      />
      } content={
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
      } canvas={
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
      } pages={
          <div className="space-y-4"><DesignerOrderSummary documentState={documentState} orderState={orderState}/><PagesPanel activePage={activePage} onPageChange={setActivePage} documentState={documentState} onDocumentChange={doc.commitDocument} /></div>
      } />
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
      <div className="[&>div]:bottom-20 lg:[&>div]:bottom-4"><HelpButton /></div>
    </div>
    </DesignerTextProvider>
  )
}
