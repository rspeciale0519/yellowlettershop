import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { loadMigrationCatalog } from './catalog.mjs'
import { parseCliArgs } from './planner.mjs'
import { redactSensitive, safeErrorMessage } from './redaction.mjs'
import { runMigrationRunner } from './runner.mjs'
import { createManagementApiTransport } from './transport.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function safeLogger(logger, secrets) {
  const emit = level => message => {
    const method = logger?.[level] ?? logger?.log
    if (typeof method === 'function') {
      method.call(logger, redactSensitive(message, { secrets }))
    }
  }
  return { info: emit('info'), warn: emit('warn'), error: emit('error') }
}

export async function runCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2)
  const env = options.env ?? process.env
  const logger = options.logger ?? console
  const migrationDir = options.migrationDir ?? path.join(root, 'supabase', 'migrations')
  const secrets = []

  try {
    const { dryRun } = parseCliArgs(argv)
    const catalogLoader = options.catalogLoader ?? loadMigrationCatalog
    const catalog = await catalogLoader(migrationDir)

    const token = env.SUPABASE_ACCESS_TOKEN
    const projectRef = env.SUPABASE_PROJECT_REF
    if (typeof token === 'string') secrets.push(token)
    if (typeof projectRef === 'string') secrets.push(projectRef)
    const transport = createManagementApiTransport({
      token,
      projectRef,
      fetchFn: options.fetchFn,
    })
    await runMigrationRunner({
      catalog,
      transport,
      dryRun,
      logger: safeLogger(logger, secrets),
    })
    return 0
  } catch (error) {
    safeLogger(logger, secrets).error(safeErrorMessage(error, { secrets }))
    return 1
  }
}
