import { isSha256, MigrationValidationError, validateVersion } from './catalog.mjs'

export function parseCliArgs(args) {
  let dryRun = false
  for (const argument of args) {
    if (argument === '--dry-run') {
      if (dryRun) throw new MigrationValidationError('Duplicate flag: --dry-run')
      dryRun = true
    } else if (argument === '--backfill' || argument.startsWith('--backfill=')) {
      throw new MigrationValidationError('Backfill is disabled because it cannot verify historical execution.')
    } else if (argument.startsWith('-')) {
      throw new MigrationValidationError(`Unknown flag: ${argument}`)
    } else {
      throw new MigrationValidationError(`Unexpected argument: ${argument}`)
    }
  }
  return { dryRun }
}

function normalizeLedgerRows(rows) {
  if (!Array.isArray(rows)) throw new MigrationValidationError('Migration ledger returned an invalid result.')
  const versions = new Set()
  return rows.map(row => {
    if (!row || typeof row !== 'object' || typeof row.version !== 'string') {
      throw new MigrationValidationError('Migration ledger contains an invalid row.')
    }
    validateVersion(row.version, 'Ledger version')
    if (versions.has(row.version)) {
      throw new MigrationValidationError(`Migration ledger contains duplicate version ${row.version}.`)
    }
    versions.add(row.version)
    let checksum
    if (row.checksum === null) checksum = null
    else if (typeof row.checksum === 'string') checksum = row.checksum.toLowerCase()
    else throw new MigrationValidationError(`Migration ledger has an invalid checksum for ${row.version}.`)
    if (checksum !== null && !isSha256(checksum)) {
      throw new MigrationValidationError(`Migration ledger has an invalid checksum for ${row.version}.`)
    }
    return { version: row.version, name: typeof row.name === 'string' ? row.name : null, checksum }
  })
}

export function planMigrations(catalog, ledgerRows) {
  const rows = normalizeLedgerRows(ledgerRows)
  const byVersion = new Map(rows.map(row => [row.version, row]))
  const pending = []
  const applied = []
  const legacy = rows.filter(row => row.checksum === null)
  const drifted = []

  for (const migration of catalog) {
    const row = byVersion.get(migration.version)
    if (!row) pending.push(migration)
    else if (row.checksum === null) applied.push({ migration, row, verified: false })
    else if (row.checksum === migration.checksum) applied.push({ migration, row, verified: true })
    else drifted.push({ migration, row })
  }

  if (drifted.length > 0) {
    const filenames = drifted.map(item => item.migration.filename).join(', ')
    throw new MigrationValidationError(`Checksum drift detected: ${filenames}`)
  }

  const localVersions = new Set(catalog.map(migration => migration.version))
  const remoteOnly = rows.filter(row => !localVersions.has(row.version))
  return { pending, applied, legacy, remoteOnly }
}
