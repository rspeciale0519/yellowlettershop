/**
 * Phase 1 spec-verification probe. Dev-only — never imported by the app.
 *
 * Calls the AccuZip Account Info endpoint (spec §3) and reports account level
 * and remaining credits. The spec is stale-bannered and the Redstone spec in
 * this same repo documented a deprecated process, so nothing here is trusted
 * until a real call proves it.
 *
 * The spec says only 'Body (Required): <apiKey>' without naming an encoding,
 * so this tries each plausible shape and reports which one the deployed
 * service actually accepts.
 *
 * Run: npx tsx scripts/accuzip-probe.ts
 *
 * The API key is never printed. It is redacted out of every response body
 * before display, because the documented error response echoes it back.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const INFO_URL = 'https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO'

function loadApiKey(): string {
  const envPath = resolve(process.cwd(), '.env.local')
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => /^\s*ACCUZIP_API_KEY\s*=/.test(l))
  if (!line) throw new Error('ACCUZIP_API_KEY not found in .env.local')
  const value = line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
  if (!value) throw new Error('ACCUZIP_API_KEY is empty')
  return value
}

/** Never let the key reach stdout, including via an echoed error message. */
function redact(text: string, key: string): string {
  return text.split(key).join('[REDACTED_API_KEY]')
}

interface Attempt {
  label: string
  contentType: string
  body: string
}

function attempts(key: string): Attempt[] {
  return [
    { label: 'raw body', contentType: 'text/plain', body: key },
    {
      label: 'form-encoded apiKey=',
      contentType: 'application/x-www-form-urlencoded',
      body: `apiKey=${encodeURIComponent(key)}`,
    },
    { label: 'json {apiKey}', contentType: 'application/json', body: JSON.stringify({ apiKey: key }) },
  ]
}

async function probe(attempt: Attempt, key: string): Promise<boolean> {
  console.log(`\n--- attempt: ${attempt.label} (${attempt.contentType}) ---`)
  let response: Response
  try {
    response = await fetch(INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': attempt.contentType },
      body: attempt.body,
    })
  } catch (error) {
    console.log(`network error: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }

  const text = await response.text()
  console.log(`HTTP ${response.status} ${response.statusText}`)
  console.log(`content-type: ${response.headers.get('content-type') ?? '(none)'}`)
  console.log('body:')
  console.log(redact(text, key))

  try {
    const json = JSON.parse(text) as Record<string, unknown>
    if (json.success === true) {
      console.log('\n>>> THIS SHAPE WORKS <<<')
      console.log(`account_type      : ${String(json.account_type)}`)
      console.log(`level             : ${String(json.level)}`)
      console.log(`active            : ${String(json.active)}`)
      console.log(`services          : ${String(json.services)}`)
      console.log(`credits_remaining : ${JSON.stringify(json.credits_remaining)}`)
      console.log(`credits_used      : ${JSON.stringify(json.credits_used)}`)
      return true
    }
  } catch {
    console.log('(body is not JSON)')
  }
  return false
}

async function main(): Promise<void> {
  const key = loadApiKey()
  console.log(`AccuZip INFO probe — key loaded, ${key.length} chars, never printed.`)
  console.log(`POST ${INFO_URL}`)

  for (const attempt of attempts(key)) {
    if (await probe(attempt, key)) {
      process.exit(0)
    }
  }

  console.log('\nNo request shape succeeded. See §9 Phase 1 gate: this is blocked-on-vendor.')
  process.exit(1)
}

void main()
