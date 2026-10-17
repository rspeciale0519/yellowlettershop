"use client"

import { useEffect, useMemo, useState } from 'react'
import { OrderStepProps } from '@/types/orders'
import { createClient } from '@/utils/supabase/client'
import { canonicalDocumentContent } from '@/lib/designer/content-revision'
import { readOrderDraft, readOrderDesign } from '@/lib/designer/draft-context'
import { verifySavedDesignReference } from '@/lib/designer/verified-handoff'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Palette, ExternalLink, Type, CheckCircle, AlertCircle } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'

export function DesignCustomizerStep({ orderState }: OrderStepProps) {
  const { nextStep, previousStep, updateOrderState } = useOrderWorkflow()
  const database = useMemo(() => createClient(), [])
  const [verifiedId, setVerifiedId] = useState<string | null>(null)
  const [openError, setOpenError] = useState('')
  const design = orderState.designAndContent?.design ?? orderState.design
  const variables = design?.variablesUsed ?? []
  let contentIdentity = ''
  try { if (design?.designJson) contentIdentity = `${design.designId}:${canonicalDocumentContent(design.designJson)}` } catch { /* Unsupported designs cannot continue. */ }
  const hasDesign = Boolean(design?.designId && contentIdentity && verifiedId === contentIdentity)

  useEffect(() => {
    let active = true
    let generation = 0
    const syncPendingDesign = async () => {
      const current = ++generation
      const isCurrent = () => active && generation === current
      try {
        const { data: { user } } = await database.auth.getUser()
        if (!isCurrent() || !user) return
        const reference = await readOrderDesign(window.localStorage, user.id, orderState.orderId)
        if (reference) {
          const nextDesign = await verifySavedDesignReference(database, user.id, reference, orderState.orderId)
          if (!isCurrent() || !nextDesign) { if (isCurrent()) setVerifiedId(null); return }
          setVerifiedId(`${nextDesign.designId}:${canonicalDocumentContent(nextDesign.designJson)}`)
          if (nextDesign.designId !== design?.designId || JSON.stringify(nextDesign.designJson) !== JSON.stringify(design?.designJson)) {
            updateOrderState({ design: nextDesign, designAndContent: { ...orderState.designAndContent, design: nextDesign } })
          }
        } else if (design?.designId && design.designJson) {
          const localDraft = readOrderDraft(window.localStorage, user.id, orderState.orderId)
          if (localDraft && canonicalDocumentContent(localDraft.document) !== canonicalDocumentContent(design.designJson)) {
            if (isCurrent()) setVerifiedId(null)
            return
          }
          // Existing server-loaded order design is verified too; local-only ids fail.
          const { documentRevision } = await import('@/lib/designer/content-revision')
          const revision = await documentRevision(design.designJson)
          const verified = await verifySavedDesignReference(database, user.id, {
            context: { userId: user.id, orderId: orderState.orderId, templateId: design.designJson.templateId },
            designId: design.designId, revision, document: design.designJson as import('@/types/designer-document').DesignerDocumentV2, savedAt: '',
          }, orderState.orderId)
          if (isCurrent()) setVerifiedId(verified ? `${verified.designId}:${canonicalDocumentContent(verified.designJson)}` : null)
        } else if (isCurrent()) setVerifiedId(null)
      } catch { if (isCurrent()) setVerifiedId(null) }
    }
    void syncPendingDesign()
    const sync = () => { void syncPendingDesign() }
    const onVisibility = () => { if (document.visibilityState === 'visible') sync() }
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [database, design, orderState.orderId, orderState.designAndContent, updateOrderState])

  const openFullDesigner = async () => {
    setOpenError('')
    // Reserve the tab during the click so async draft persistence does not trigger a popup block.
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    try {
      let orderId = orderState.orderId
      if (!orderId) {
        const response = await fetch('/api/orders/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderState }) })
        if (!response.ok) throw new Error('Save this order draft before opening the designer. Please retry.')
        const saved = await response.json()
        if (typeof saved.orderId !== 'string') throw new Error('The order draft could not be confirmed. Please retry.')
        orderId = saved.orderId
        updateOrderState({ orderId })
      }
      const params = new URLSearchParams()
      params.set('orderId', orderId!)
      if (design?.designId) params.set('designId', design.designId)
      if (design?.templateId) params.set('templateId', design.templateId)
      const url = `/design/customize?${params}`
      if (tab) tab.location.href = url
      else window.location.assign(url)
    } catch (error) {
      tab?.close()
      setOpenError(error instanceof Error ? error.message : 'Unable to open the designer. Please retry.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Design Your Mail Piece</h2>
        <p className="text-gray-600">
          Create or edit your design in the full designer, then return here to continue.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Design</span>
          </CardTitle>
          <CardDescription>
            The designer opens in a new tab. Your work is saved automatically and
            comes back to this order when you return.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasDesign ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Design saved. {variables.length} personalization variable
                {variables.length === 1 ? '' : 's'} detected.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No design yet — open the designer and save before continuing.
              </AlertDescription>
            </Alert>
          )}
          {openError && <p role="alert" className="text-sm text-red-600">{openError}</p>}
          <Button onClick={openFullDesigner} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Designer
          </Button>
        </CardContent>
      </Card>

      {variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Type className="h-5 w-5" />
              <span>Personalization Variables</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {variables.map((variable) => (
                <Badge key={variable} variant="outline" className="font-mono text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!hasDesign}>
          Continue to Mailing Options
        </Button>
      </div>
    </div>
  )
}
