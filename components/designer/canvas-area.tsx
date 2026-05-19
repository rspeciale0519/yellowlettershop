// Phase 2: implementation relocated to ./canvas/* (Rule 1 — file preserved,
// not deleted). This re-export keeps all import sites (page.tsx,
// preview-modal.tsx, DesignCustomizerStep.tsx) unchanged.
export { CanvasArea, type CanvasAreaProps } from "@/components/designer/canvas/canvas-area"
