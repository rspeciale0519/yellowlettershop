import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PRINT_FONT_KEYS } from './font-manifest'
import { createFontMetrics } from './font-metrics'
let pending: Promise<Record<string, Uint8Array>> | undefined
export function getPrintFontBinaries(): Promise<Record<string, Uint8Array>> {
  pending ??= Promise.all(PRINT_FONT_KEYS.map(async key => [key, new Uint8Array(await readFile(join(process.cwd(), 'public', 'fonts', 'print', `${key}.ttf`)))] as const)).then(entries => Object.fromEntries(entries))
  return pending
}
export async function getServerFontMetrics() { return createFontMetrics(await getPrintFontBinaries()) }
