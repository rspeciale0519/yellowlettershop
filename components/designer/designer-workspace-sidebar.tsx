"use client"

import { AlertTriangle, Layers, PackagePlus, PaintBucket, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { designerBorder, designerSurface } from "@/components/designer/ui/designer-tokens"
import { InspectorPanel } from "@/components/designer/inspector-panel"
import { LayersPanel } from "@/components/designer/layers-panel"
import { ModulesPanel } from "@/components/designer/modules-panel"
import { PreflightPanel } from "@/components/designer/preflight-panel"
import { BackgroundPanel } from "@/components/designer/background-panel"
import type { SpecRects } from "@/components/designer/mail-spec"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import type { CanvasSize, DesignElement, DesignerImageAsset, DesignerPage, PageBackground, Tool, WorkspacePanel } from "@/types/designer"

interface DesignerWorkspaceSidebarProps {
  activePanel: WorkspacePanel
  activeTool: Tool
  elements: DesignElement[]
  canvasSize: CanvasSize
  fonts: DesignerFont[]
  selectedElement: DesignElement | null
  selectedElementId: string | null
  savedImages: DesignerImageAsset[]
  imageLibraryError: string | null
  isLoadingImages: boolean
  isUploadingImage: boolean
  imagePickerMode: "insert" | "replace"
  onPanelChange: (panel: WorkspacePanel) => void
  onToolChange: (tool: Tool) => void
  onAddModule: (moduleId: string) => void
  onUploadImage: (file: File, name: string) => Promise<void>
  onInsertImage: (asset: DesignerImageAsset) => void
  onSelectElement: (id: string) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onReplaceImageRequest?: (id: string) => void
  onMoveLayer: (id: string, direction: "up" | "down") => void
  onReorderLayers: (orderedIds: string[]) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  activePage: DesignerPage
  pageBackground?: PageBackground
  onBackgroundChange: (next: PageBackground | undefined) => void
  specRects?: SpecRects
}

const panelOptions: { id: WorkspacePanel; label: string; icon: typeof PackagePlus }[] = [
  { id: "modules", label: "Modules", icon: PackagePlus },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "inspector", label: "Inspector", icon: SlidersHorizontal },
  { id: "background", label: "Background", icon: PaintBucket },
  { id: "preflight", label: "Check", icon: AlertTriangle },
]

export function DesignerWorkspaceSidebar(props: DesignerWorkspaceSidebarProps) {
  return (
    <aside className="flex h-full">
      <div className={cn("flex w-20 flex-col items-center gap-2 border-r px-2 py-4", designerBorder.rail, designerSurface.rail)}>
        {panelOptions.map((panel) => {
          const Icon = panel.icon
          const isActive = props.activePanel === panel.id
          return (
            <Button
              key={panel.id}
              variant="ghost"
              className={`relative h-16 w-16 flex-col gap-1 rounded-lg border text-[11px] transition ${
                isActive
                  ? "border-yellow-400 bg-yellow-400 text-slate-950 shadow-[0_0_0_3px_rgba(250,204,21,0.16)] hover:bg-yellow-400"
                  : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-yellow-200"
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => props.onPanelChange(panel.id)}
            >
              <Icon className="h-5 w-5" />
              <span>{panel.label}</span>
            </Button>
          )
        })}
      </div>
      <div className={cn("w-80 overflow-y-auto border-r", designerBorder.base, designerSurface.panel)}>
        {props.activePanel === "modules" && (
          <ModulesPanel
            activeTool={props.activeTool}
            elements={props.elements}
            onSelectTool={props.onToolChange}
            onAddModule={props.onAddModule}
            savedImages={props.savedImages}
            imageLibraryError={props.imageLibraryError}
            isLoadingImages={props.isLoadingImages}
            isUploadingImage={props.isUploadingImage}
            imagePickerMode={props.imagePickerMode}
            onUploadImage={props.onUploadImage}
            onInsertImage={props.onInsertImage}
          />
        )}
        {props.activePanel === "layers" && (
          <LayersPanel
            elements={props.elements}
            selectedElementId={props.selectedElementId}
            onSelectElement={props.onSelectElement}
            onMoveLayer={props.onMoveLayer}
            onReorderLayers={props.onReorderLayers}
            onToggleHidden={props.onToggleHidden}
            onToggleLocked={props.onToggleLocked}
            onDuplicate={props.onDuplicate}
            onDelete={props.onDelete}
          />
        )}
        {props.activePanel === "inspector" && (
          <InspectorPanel
            element={props.selectedElement}
            fonts={props.fonts}
            canvasSize={props.canvasSize}
            onUpdateElement={props.onUpdateElement}
            onReplaceImageRequest={props.onReplaceImageRequest}
          />
        )}
        {props.activePanel === "background" && (
          <BackgroundPanel
            page={props.activePage}
            background={props.pageBackground}
            savedImages={props.savedImages}
            imageLibraryError={props.imageLibraryError}
            isLoadingImages={props.isLoadingImages}
            isUploadingImage={props.isUploadingImage}
            onUploadImage={props.onUploadImage}
            onChange={props.onBackgroundChange}
          />
        )}
        {props.activePanel === "preflight" && (
          <PreflightPanel
            elements={props.elements}
            canvasSize={props.canvasSize}
            specRects={props.specRects}
            onSelectElement={props.onSelectElement}
          />
        )}
      </div>
    </aside>
  )
}
