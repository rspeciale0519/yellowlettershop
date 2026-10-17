"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { templateContextUrl } from '@/lib/designer/template-entry'

export function TemplateEntryRecovery({ reason, context, hasDraft }: { reason: 'unknown' | 'preview-only'; context: string; hasDraft: boolean }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Template unavailable</h1>
        <p className="text-muted-foreground">{reason === 'preview-only' ? 'This catalog design is available to preview. Choose an editable starter layout to begin designing.' : 'This template link is not recognized. Choose an editable template or return to your saved design.'}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="brand"><Link href={templateContextUrl('/templates', context)}>Choose a template</Link></Button>
          <Button asChild variant="outline"><Link href={templateContextUrl('/design/customize', context)}>{hasDraft ? 'Recover saved design' : 'Start a new design'}</Link></Button>
        </div>
      </div>
    </div>
  )
}
