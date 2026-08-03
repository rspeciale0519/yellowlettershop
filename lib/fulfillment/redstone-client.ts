import 'server-only'
import {
  buildOrderPayload,
  buildRawResponse,
  classifyRedstoneResponse,
  type RedstoneOrderInput,
  type RedstoneOutcome,
  type RedstoneRawResponse,
} from './redstone-core'

/**
 * Redstone Mail createOrder client (IO layer). Pure mapping lives in
 * redstone-core.ts.
 *
 * The key goes in the query string because that is the only auth the API
 * accepts (verified live: a bogus key and no key both answer
 * {"fail":true,"msg":"Where did you come from?"}). It must therefore never be
 * logged — every log line here uses redactKey().
 */

const DEFAULT_BASE_URL = 'https://redstonemail.com/apis'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3

export interface RedstoneConfig {
  apiKey: string
  baseUrl: string
  /** When true, orders are flagged as tests and never enter production. */
  testMode: boolean
}

/** Reads config without throwing, so callers can branch on availability. */
export function getRedstoneConfig(): RedstoneConfig | null {
  const apiKey = process.env.REDSTONE_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    baseUrl: (process.env.REDSTONE_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    // Fail safe: only an explicit "false" turns off test mode, so a missing or
    // misspelled env var can never silently start printing real mail.
    testMode: process.env.REDSTONE_API_TEST !== 'false',
  }
}

export function isRedstoneConfigured(): boolean {
  return getRedstoneConfig() !== null
}

/** Strips the key from anything we might log or surface in an error. */
function redactKey(text: string, apiKey: string): string {
  return apiKey ? text.split(apiKey).join('***') : text
}

export interface RedstoneSubmission {
  outcome: RedstoneOutcome
  /** The payload we sent, minus nothing — it contains no secrets. */
  payload: Record<string, unknown>
  attempts: number
  /**
   * The last response verbatim (status, headers, body), redacted and bounded.
   * Kept because Redstone's deployed build answers failures with an opaque
   * HTML page, and when they asked what their endpoint actually returned we
   * had discarded it. null only when no response was received at all.
   */
  response: RedstoneRawResponse | null
}

/**
 * Submit one order to Redstone. Retries only outcomes classified retryable
 * (throttling, maintenance, network) — a rejected payload is never re-sent,
 * because the deployed API cannot yet tell us what was wrong with it.
 */
export async function submitRedstoneOrder(
  input: RedstoneOrderInput
): Promise<RedstoneSubmission> {
  const config = getRedstoneConfig()
  if (!config) {
    throw new Error('REDSTONE_API_KEY is not configured')
  }

  // Throws on unreachable/oversized file URLs before we spend a request.
  const payload = buildOrderPayload({ ...input, apiTest: config.testMode })
  const url = `${config.baseUrl}/createOrder?API=${encodeURIComponent(config.apiKey)}`

  let outcome: RedstoneOutcome = { kind: 'retryable', message: 'not attempted' }
  let attempts = 0
  let lastResponse: RedstoneRawResponse | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const body = await response.text()
      // Capture BEFORE classifying. Classification is lossy by design; the
      // verbatim body is what a vendor asks for when their own logs are empty.
      lastResponse = buildRawResponse({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        apiKey: config.apiKey,
        at: new Date().toISOString(),
      })
      outcome = classifyRedstoneResponse(response.status, body)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'request failed'
      outcome = { kind: 'retryable', message: redactKey(message, config.apiKey) }
    }

    if (outcome.kind !== 'retryable') break

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)))
    }
  }

  return {
    outcome: { ...outcome, message: redactKey(outcome.message, config.apiKey) },
    payload,
    attempts,
    response: lastResponse,
  }
}
