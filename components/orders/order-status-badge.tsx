import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_META: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  proof_ready: { label: 'Proof ready', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  processing: { label: 'Processing', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  in_production: { label: 'In production', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  mailed: { label: 'Mailed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  completed: { label: 'Completed', className: 'bg-emerald-600 text-white border-emerald-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-200 text-gray-700 border-gray-300' },
  rejected: { label: 'Proof rejected', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function orderStatusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status.replace(/_/g, ' ')
}

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? {
    label: orderStatusLabel(status),
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return (
    <Badge variant="outline" className={cn('font-medium', meta.className, className)}>
      {meta.label}
    </Badge>
  )
}
