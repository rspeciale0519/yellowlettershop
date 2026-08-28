import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { TextDecoder } from 'node:util'

const FILE_RE = /^(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/
const HASH_RE = /^[0-9a-f]{64}$/

export const LEGACY_TRANSACTION_ALLOWLIST = new Map([
  ['20260613000000', 'ac3d94b78e4d0981c609ed15f526c18964ca06c548f523f52de7c4beb481ebd7'],
  ['20260613010000', 'be3bb982ae53bd6b564caed5d101cf5b88fda3b6d9b7b25766d94672bea5bc56'],
  ['20260613030000', '4edace214e2eaa122815a8c133f852b52c6265110f3e1e8a6cb9758060f84ffe'],
  ['20260613040000', 'd8037d07a761bf113ac4142a6a59934b91926d7cc89ec379620d6a6ef4614490'],
  ['20260613050000', '075fb4c25eed5859cfc4b20c4bee0514adfa3d785caa762fe1aef43a516ca44c'],
  ['20260613060000', '41ee5ce2f151713f43874711b02924987f7f565ba1c1f28dff68881e8b706777'],
  ['20260613070000', '05991a00245eba041e8f8bfbf9fde7e2ca24da4be3421f5cefbc35e21e8aa609'],
  ['20260613100000', 'ebd9404599f91491ba991829a8a3f73b6a2fe916e4e7a012a50c84dca52b8173'],
  ['20260616000500', '22265e0e8a74b40ccc5973103507c7c960a0351520448b70e963cff2440adaad'],
  ['20260801010000', '0bc428929f714d68926c66a6c3aa118b5b33488ad666420342519b43ed5687bb'],
  ['20260801020000', '1d4c961c471e320fc80c6ed4eb2a82f8022866865574a66ef2c27eae39b1e70f'],
  ['20260803000000', 'f87683b8d4bf2b81cf016ef40476c0f86138ed647a0ffdb0b9543b3d274ee124'],
])

export class MigrationValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MigrationValidationError'
  }
}

export function validateVersion(version, label = 'Migration version') {
  if (!/^\d{14}$/.test(version)) {
    throw new MigrationValidationError(`${label} must contain exactly 14 digits.`)
  }
  const parts = [version.slice(0, 4), version.slice(4, 6), version.slice(6, 8)].map(Number)
  const [year, month, day] = parts
  const date = new Date(Date.UTC(year, month - 1, day))
  const actual = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
  if (year < 2000 || year > 2999 || actual.some((value, index) => value !== parts[index])) {
    throw new MigrationValidationError(`${label} does not start with a valid UTC date.`)
  }
  return version
}

export function parseMigrationFilename(filename) {
  const match = FILE_RE.exec(filename)
  if (!match) {
    throw new MigrationValidationError(`Malformed migration filename: ${filename}`)
  }
  const [, version, name] = match
  validateVersion(version, `Version in ${filename}`)
  return { filename, version, name }
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function canonicalizeSql(sql) {
  return sql.replace(/\r\n?/g, '\n')
}

function dollarDelimiterAt(sql, index) {
  const match = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(index))
  return match?.[0] ?? null
}

function skipQuoted(sql, index, quote, escapeBackslash = false) {
  for (let i = index + 1; i < sql.length; i += 1) {
    if (escapeBackslash && sql[i] === '\\') {
      i += 1
    } else if (sql[i] === quote) {
      if (sql[i + 1] === quote) i += 1
      else return i + 1
    }
  }
  throw new MigrationValidationError('Migration contains an unterminated quoted string.')
}

function skipBlockComment(sql, index) {
  let depth = 1
  for (let i = index + 2; i < sql.length; i += 1) {
    if (sql.startsWith('/*', i)) {
      depth += 1
      i += 1
    } else if (sql.startsWith('*/', i)) {
      depth -= 1
      if (depth === 0) return i + 2
      i += 1
    }
  }
  throw new MigrationValidationError('Migration contains an unterminated block comment.')
}

export function scanTopLevelStatements(sql) {
  const statements = []
  let tokens = []
  let index = 0
  while (index < sql.length) {
    if (/\s/.test(sql[index])) {
      index += 1
    } else if (sql.startsWith('--', index)) {
      const lineBreak = sql.slice(index + 2).search(/[\r\n]/)
      index = lineBreak === -1 ? sql.length : index + lineBreak + 3
    } else if (sql.startsWith('/*', index)) {
      index = skipBlockComment(sql, index)
    } else if (sql[index] === "'" || sql[index] === '"') {
      const escapePrefix = sql[index] === "'" && /[Ee]/.test(sql[index - 1] ?? '')
        && !/[A-Za-z0-9_$]/.test(sql[index - 2] ?? '')
      index = skipQuoted(sql, index, sql[index], escapePrefix)
    } else {
      const delimiter = sql[index] === '$' ? dollarDelimiterAt(sql, index) : null
      if (delimiter) {
        const close = sql.indexOf(delimiter, index + delimiter.length)
        if (close === -1) {
          throw new MigrationValidationError('Migration contains an unterminated dollar quote.')
        }
        index = close + delimiter.length
      } else if (/[A-Za-z_]/.test(sql[index])) {
        const start = index
        while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index])) index += 1
        tokens.push({ word: sql.slice(start, index).toUpperCase(), start, end: index })
      } else if (sql[index] === ';') {
        if (tokens.length > 0) {
          statements.push({ tokens, start: tokens[0].start, end: index + 1 })
          tokens = []
        }
        index += 1
      } else {
        index += 1
      }
    }
  }
  if (tokens.length > 0) statements.push({ tokens, start: tokens[0].start, end: sql.length })
  return statements
}

function transactionCommand(tokens) {
  const words = tokens.map(token => token.word)
  const first = words[0]
  if (first === 'BEGIN' || (first === 'START' && words[1] === 'TRANSACTION')) return 'begin'
  if (first === 'COMMIT' || first === 'END') return 'commit'
  if (first === 'ROLLBACK' || first === 'ABORT') return 'rollback'
  if (first === 'SAVEPOINT') return 'savepoint'
  if (first === 'RELEASE') return 'release savepoint'
  if (first === 'PREPARE' && words[1] === 'TRANSACTION') return 'prepare transaction'
  if (first === 'SET' && words[1] === 'TRANSACTION') return 'set transaction'
  if (first === 'SET' && words.slice(1, 5).join(' ') === 'SESSION CHARACTERISTICS AS TRANSACTION') {
    return 'set transaction'
  }
  return null
}

export function findTopLevelTransactionControls(sql) {
  const statements = scanTopLevelStatements(sql)
  const controls = []
  statements.forEach((statement, statementIndex) => {
    const command = transactionCommand(statement.tokens)
    if (command) controls.push({ ...statement, statementIndex, command })
  })
  return { statements, controls }
}

function removeRanges(sql, ranges) {
  return [...ranges]
    .sort((a, b) => b.start - a.start)
    .reduce((text, range) => text.slice(0, range.start) + text.slice(range.end), sql)
}

export function validateAndPrepareSql(migration, allowlist = LEGACY_TRANSACTION_ALLOWLIST) {
  const { statements, controls } = findTopLevelTransactionControls(migration.sql)
  const allowedHash = allowlist.get(migration.version)
  if (allowedHash && allowedHash !== migration.checksum) {
    throw new MigrationValidationError(
      `Historical migration checksum changed: ${migration.filename}`
    )
  }
  if (controls.length === 0) return migration.sql
  const [first, last] = controls
  const validLegacyWrapper = allowedHash === migration.checksum
    && controls.length === 2
    && first.command === 'begin'
    && last.command === 'commit'
    && first.statementIndex === 0
    && last.statementIndex === statements.length - 1
  if (!validLegacyWrapper) {
    throw new MigrationValidationError(
      `Top-level transaction control is not allowed in ${migration.filename}.`
    )
  }
  return removeRanges(migration.sql, [first, last])
}

export function createMigration(filename, bytes, options = {}) {
  const parsed = parseMigrationFilename(filename)
  const data = typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : Buffer.from(bytes)
  let sql
  try {
    sql = canonicalizeSql(new TextDecoder('utf-8', { fatal: true }).decode(data))
  } catch {
    throw new MigrationValidationError(`${filename} is not valid UTF-8.`)
  }
  if (!sql.trim()) throw new MigrationValidationError(`${filename} is empty.`)
  if (sql.includes('\0')) throw new MigrationValidationError(`${filename} contains a null byte.`)
  const checksum = sha256(Buffer.from(sql, 'utf8'))
  const migration = { ...parsed, checksum, sql }
  const executionSql = validateAndPrepareSql(migration, options.transactionAllowlist)
  if (scanTopLevelStatements(executionSql).length === 0) {
    throw new MigrationValidationError(`${filename} has no executable SQL statement.`)
  }
  return {
    ...migration,
    executionSql,
  }
}

export async function loadMigrationCatalog(directory, options = {}) {
  const readdirFn = options.readdirFn ?? readdir
  const readFileFn = options.readFileFn ?? readFile
  const entries = await readdirFn(directory, { withFileTypes: true })
  const sqlEntries = entries.filter(entry => entry.name.toLowerCase().endsWith('.sql'))
  const parsed = sqlEntries.map(entry => {
    if (typeof entry.isFile === 'function' && !entry.isFile()) {
      throw new MigrationValidationError(`Migration path is not a regular file: ${entry.name}`)
    }
    return { entry, ...parseMigrationFilename(entry.name) }
  })
  const versions = new Set()
  for (const migration of parsed) {
    if (versions.has(migration.version)) {
      throw new MigrationValidationError(`Duplicate migration version: ${migration.version}`)
    }
    versions.add(migration.version)
  }
  const catalog = []
  for (const migration of parsed.sort((a, b) => a.version.localeCompare(b.version))) {
    const bytes = await readFileFn(path.join(directory, migration.entry.name))
    catalog.push(createMigration(migration.entry.name, bytes, options))
  }
  return catalog
}

export function isSha256(value) {
  return HASH_RE.test(value)
}
