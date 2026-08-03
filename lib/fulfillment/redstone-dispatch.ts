import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'
import { deriveDueDate, type RedstoneRawResponse } from './redstone-core'
import { submitRedstoneOrder } from './redstone-client'

/**
 * The Redstone leg of dispatchOrder: submit the job over the API instead of
 * emailing a human, and record the outcome on the dispatch row.
 *
 * Kept out of dispatch-service.ts so that file stays near the 350-line
 * guideline and the email path remains readable as the fallback it is.
 */

type ServiceClient = ReturnType<typeof createServiceClient>

export interface RedstoneHandoffInput {
  supabase: ServiceClient
  orderId: string
  dispatchId: string
  shortId: string
  recordCount: number
  csvUrl: string
  proofUrl: string | null
  mailPieceFormat?: string | null
  postageType?: string | null
  serviceLevel?: string | null
}

async function markDispatchFailed(
  supabase: ServiceClient,
  dispatchId: string,
  reason: string,
  response?: RedstoneRawResponse | null
): Promise<void> {
  // Merge rather than replace: csvPath/proofPath were written at insert and
  // PostgREST overwrites a jsonb column wholesale.
  const { data: existing } = await supabase
    .from('order_dispatches')
    .select('package')
    .eq('id', dispatchId)
    .maybeSingle()
  const staged = ((existing as { package?: unknown } | null)?.package ?? {}) as Record<
    string,
    unknown
  >

  await supabase
    .from('order_dispatches')
    .update({
      status: 'failed',
      error: reason,
      package: { ...staged, ...(response ? { lastResponse: response } : {}) },
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatchId)
}

/**
 * Throws on any outcome that is not accepted-or-duplicate, after marking the
 * dispatch failed so the admin panel offers a retry. A rejected payload is
 * never retried automatically: the deployed Redstone build answers a bad body
 * with an opaque HTML 500, so re-sending it would fail identically.
 */
export async function handOffToRedstone(input: RedstoneHandoffInput): Promise<string> {
  const {
    supabase,
    orderId,
    dispatchId,
    shortId,
    recordCount,
    csvUrl,
    proofUrl,
    mailPieceFormat,
    postageType,
    serviceLevel,
  } = input

  let submission
  try {
    submission = await submitRedstoneOrder({
      orderId,
      campaignName: `YLS order #${shortId}`,
      recordCount,
      dataUrl: csvUrl,
      artUrl: proofUrl,
      mailPieceFormat,
      postageType,
      serviceLevel,
      dueDate: deriveDueDate(new Date(), serviceLevel),
      // Overwritten by the client from REDSTONE_API_TEST; never trust this.
      apiTest: true,
    })
  } catch (error) {
    // Thrown before any request went out (e.g. an unreachable storage URL).
    const reason = error instanceof Error ? error.message : 'Redstone submission failed'
    await markDispatchFailed(supabase, dispatchId, reason)
    throw new Error(`Redstone dispatch failed: ${reason}`)
  }

  const { outcome, payload, attempts, response } = submission

  if (outcome.kind !== 'accepted' && outcome.kind !== 'duplicate') {
    // Persist the verbatim response alongside the failure. Redstone's build
    // answers rejections with an opaque HTML page and their own logs came back
    // empty, so this is the only record of what actually came back.
    await markDispatchFailed(supabase, dispatchId, outcome.message, response)
    if (response) {
      console.error(
        `Redstone rejected order ${orderId} (HTTP ${response.status}):`,
        response.body.slice(0, 2000)
      )
    }
    throw new Error(
      outcome.kind === 'retryable'
        ? `Redstone was unreachable after ${attempts} attempts: ${outcome.message}`
        : `Redstone rejected this order: ${outcome.message}`
    )
  }

  // PostgREST replaces a jsonb column wholesale rather than merging it, so read
  // the package dispatchOrder just wrote and spread it — csvPath and proofPath
  // are the only record of what we actually staged, and the migration documents
  // them as part of this column's shape.
  const { data: existing } = await supabase
    .from('order_dispatches')
    .select('package')
    .eq('id', dispatchId)
    .maybeSingle()
  const staged = ((existing as { package?: unknown } | null)?.package ?? {}) as Record<
    string,
    unknown
  >

  await supabase
    .from('order_dispatches')
    .update({
      package: {
        ...staged,
        provider: 'redstone',
        outcome: outcome.kind,
        message: outcome.message,
        apiTest: payload.api_test === true,
        dueDate: payload.duedate,
        jobType: payload.jobtype,
        recordCount,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', dispatchId)

  return outcome.message
}
