import { MigrationValidationError } from './catalog.mjs'
import { planMigrations } from './planner.mjs'
import {
  buildApplyMigrationSql,
  buildLedgerInspectionSql,
  buildLedgerRowsSql,
  buildPrepareLedgerSql,
} from './sql.mjs'

export class MigrationRunnerError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MigrationRunnerError'
  }
}

function write(logger, level, message) {
  const method = logger?.[level] ?? logger?.log
  if (typeof method === 'function') method.call(logger, message)
}

function requireRows(value, operation) {
  if (!Array.isArray(value)) {
    throw new MigrationRunnerError(`${operation} returned an invalid result.`)
  }
  return value
}

export async function readLedgerState(transport) {
  const inspectionRows = requireRows(await transport.execute({
    kind: 'inspect-ledger',
    sql: buildLedgerInspectionSql(),
  }), 'Ledger inspection')
  const inspection = inspectionRows[0]
  if (!inspection || typeof inspection.ledger_exists !== 'boolean'
    || typeof inspection.checksum_exists !== 'boolean') {
    throw new MigrationRunnerError('Ledger inspection returned an invalid result.')
  }
  if (!inspection.ledger_exists) {
    return { exists: false, checksumExists: false, rows: [] }
  }
  const rows = requireRows(await transport.execute({
    kind: 'read-ledger',
    sql: buildLedgerRowsSql(),
  }), 'Ledger read')
  return { exists: true, checksumExists: inspection.checksum_exists, rows }
}

function reportLegacy(plan, catalog, logger, reportedVersions) {
  const filenames = new Map(catalog.map(migration => [migration.version, migration.filename]))
  for (const row of plan.legacy) {
    if (reportedVersions.has(row.version)) continue
    reportedVersions.add(row.version)
    const label = filenames.get(row.version) ?? row.version
    write(logger, 'warn', `Legacy migration ${label} is unverified because its ledger row has no checksum.`)
  }
}

function reportPending(plan, logger) {
  if (plan.pending.length === 0) return
  write(logger, 'info', `${plan.pending.length} pending migration(s):`)
  for (const migration of plan.pending) write(logger, 'info', `  - ${migration.filename}`)
}

function assertSafePendingHistory(catalog, state, plan) {
  if (plan.pending.length === 0) return
  if (!state.exists) {
    throw new MigrationRunnerError('Migration ledger is missing. Migration history cannot be verified.')
  }
  const pendingVersions = new Set(plan.pending.map(migration => migration.version))
  const firstPending = catalog.findIndex(migration => pendingVersions.has(migration.version))
  const firstPendingVersion = catalog[firstPending]?.version
  const pendingIsSuffix = firstPending > 0
    && catalog.slice(firstPending).every(migration => pendingVersions.has(migration.version))
  const remoteHistoryIsEarlier = plan.remoteOnly.every(row => row.version < firstPendingVersion)
  if (!pendingIsSuffix || !remoteHistoryIsEarlier) {
    throw new MigrationRunnerError(
      'Migration ledger history is empty or out of order. Refusing to execute migration SQL.'
    )
  }
}

function exactLedgerMatch(rows, migration) {
  return rows.some(row => row?.version === migration.version
    && typeof row?.checksum === 'string'
    && row.checksum.toLowerCase() === migration.checksum)
}

async function verifyAfterApply(transport, catalog, migration, failure) {
  let state
  let plan
  try {
    state = await readLedgerState(transport)
    plan = planMigrations(catalog, state.rows)
  } catch (error) {
    if (error instanceof MigrationValidationError) throw error
    const outcome = failure ? 'request outcome' : 'successful response'
    throw new MigrationRunnerError(
      `Migration ${migration.filename} ${outcome} is unknown because ledger verification failed.`
    )
  }
  if (exactLedgerMatch(state.rows, migration)) return { matched: true, plan }
  const row = state.rows.find(item => item?.version === migration.version)
  if (row && row.checksum == null) {
    throw new MigrationRunnerError(
      `Migration ${migration.filename} stopped because its ledger row is legacy and unverified.`
    )
  }
  if (failure) {
    throw new MigrationRunnerError(
      `Migration ${migration.filename} failed. No matching ledger entry was found. Later migrations were not sent.`
    )
  }
  throw new MigrationRunnerError(
    `Migration ${migration.filename} returned success without a matching ledger entry.`
  )
}

export async function runMigrationRunner(options) {
  const { catalog, transport, dryRun = false, logger = console } = options
  const reportedLegacyVersions = new Set()
  let state = await readLedgerState(transport)
  let plan = planMigrations(catalog, state.rows)
  reportLegacy(plan, catalog, logger, reportedLegacyVersions)
  reportPending(plan, logger)
  assertSafePendingHistory(catalog, state, plan)

  if (dryRun) {
    for (const migration of plan.pending) {
      write(logger, 'info', `[dry-run] would apply ${migration.filename}`)
    }
    if (plan.pending.length === 0) write(logger, 'info', 'No pending migrations.')
    return { mode: 'dry-run', pending: plan.pending.length, legacy: plan.legacy.length }
  }

  if (plan.pending.length === 0) {
    write(logger, 'info', 'No pending migrations.')
    return { mode: 'apply', applied: 0, legacy: plan.legacy.length }
  }

  await transport.execute({ kind: 'prepare-ledger', sql: buildPrepareLedgerSql() })
  state = await readLedgerState(transport)
  if (!state.exists || !state.checksumExists) {
    throw new MigrationRunnerError('Migration ledger preparation was not verified.')
  }
  plan = planMigrations(catalog, state.rows)
  reportLegacy(plan, catalog, logger, reportedLegacyVersions)
  assertSafePendingHistory(catalog, state, plan)

  let applied = 0
  for (const migration of plan.pending) {
    let requestFailed = false
    try {
      await transport.execute({
        kind: 'apply-migration',
        sql: buildApplyMigrationSql(migration),
        migration,
      })
    } catch {
      requestFailed = true
    }

    const verification = await verifyAfterApply(transport, catalog, migration, requestFailed)
    reportLegacy(verification.plan, catalog, logger, reportedLegacyVersions)
    if (requestFailed && verification.matched) {
      write(logger, 'info', `verified ${migration.filename} in the ledger after a concurrent or uncertain request`)
    } else {
      write(logger, 'info', `applied  ${migration.filename}`)
    }
    applied += 1
  }
  write(logger, 'info', 'Done.')
  return { mode: 'apply', applied, legacy: plan.legacy.length }
}
