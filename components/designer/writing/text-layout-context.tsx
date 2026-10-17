"use client"
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePrintFonts } from '@/hooks/use-print-fonts'
import { layoutDesignerDocument } from '@/lib/designer/text/layout'
import { SAMPLE_VALUES } from '@/lib/designer/text/resolve-values'
import type { DocumentLayout, ResolvedValues } from '@/lib/designer/text/types'
import type { DesignerDocument, DesignerPage } from '@/types/designer'
interface LayoutContext { document: DesignerDocument; pageId: DesignerPage; layout?: DocumentLayout; error: string | null }
const TextLayoutContext = createContext<LayoutContext | null>(null)
export function DesignerTextProvider({ document, pageId, values = SAMPLE_VALUES, children }: { document: DesignerDocument; pageId: DesignerPage; values?: ResolvedValues; children: ReactNode }) {
  const { metrics, error } = usePrintFonts()
  const layout = useMemo(() => metrics ? layoutDesignerDocument(document, values, metrics) : undefined, [document, metrics, values])
  return <TextLayoutContext.Provider value={{ document, pageId, layout, error }}>{children}</TextLayoutContext.Provider>
}
export function useDesignerTextLayout() { return useContext(TextLayoutContext) }
