// AccuZIP count estimation utilities
import type { ListCriteria } from '@/lib/supabase/mailing-lists'
import { criteriaToAccuZIPParams } from './params'

const ACCUZIP_API_BASE =
  process.env.NEXT_PUBLIC_ACCUZIP_API_URL || 'https://api.accuzip.com/v1'

import { requireAccuzipApiKey } from './count-guard'

function accuzipApiKey(): string {
  return requireAccuzipApiKey()
}

/**
 * Estimate the count of records matching the criteria.
 * Fails closed when the key is missing or the vendor call fails — never invents a count.
 */
export async function estimateRecordCount(criteria: ListCriteria): Promise<number> {
  const apiKey = accuzipApiKey()
  if (!apiKey) {
    throw new Error('AccuZIP is not configured')
  }

  const params = criteriaToAccuZIPParams(criteria)
  const response = await fetch(`${ACCUZIP_API_BASE}/count`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`AccuZIP count unavailable (${response.status})`)
  }

  const data: unknown = await response.json()
  const raw = (data as { count?: unknown })?.count
  const count = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(count)) {
    throw new Error('AccuZIP count unavailable')
  }
  return count
}
