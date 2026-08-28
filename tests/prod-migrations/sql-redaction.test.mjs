import { describe, it } from 'mocha'
import { strict as assert } from 'node:assert'
import { createMigration, findTopLevelTransactionControls } from '../../scripts/prod-migrations/catalog.mjs'
import { redactSensitive } from '../../scripts/prod-migrations/redaction.mjs'
import {
  buildApplyMigrationSql,
  buildLedgerInspectionSql,
  buildLedgerRowsSql,
  buildPrepareLedgerSql,
} from '../../scripts/prod-migrations/sql.mjs'
import { createManagementApiTransport } from '../../scripts/prod-migrations/transport.mjs'

describe('production migration SQL', () => {
  const migration = createMigration(
    '20270101000000_safe_name.sql',
    'create table safe_table(id integer);',
    { transactionAllowlist: new Map() }
  )

  it('keeps the lock, recheck, ledger insert, and migration in one transaction', () => {
    const sql = buildApplyMigrationSql(migration)
    const controls = findTopLevelTransactionControls(sql).controls
    assert.deepEqual(controls.map(control => control.command), ['begin', 'set transaction', 'commit'])
    const lock = sql.indexOf('pg_advisory_xact_lock')
    const isolation = sql.indexOf('SET TRANSACTION ISOLATION LEVEL READ COMMITTED')
    const recheck = sql.indexOf('IF EXISTS')
    const abort = sql.indexOf("RAISE EXCEPTION 'migration ledger history changed'")
    const ledger = sql.indexOf('INSERT INTO supabase_migrations.schema_migrations')
    const migrationSql = sql.indexOf('create table safe_table')
    const commit = sql.lastIndexOf('COMMIT;')
    assert.ok(isolation > 0)
    assert.ok(lock > isolation)
    assert.ok(recheck > lock)
    assert.ok(abort > recheck)
    assert.ok(ledger > abort)
    assert.ok(migrationSql > ledger)
    assert.ok(commit > migrationSql)
    assert.match(sql, new RegExp(migration.checksum))
    assert.match(sql, /WHERE version >= '20270101000000'/)
    assert.doesNotMatch(sql, /ON CONFLICT/i)
  })

  it('uses SELECT-only metadata SQL for dry-run reads', () => {
    for (const sql of [buildLedgerInspectionSql(), buildLedgerRowsSql()]) {
      assert.match(sql.trim(), /^select/i)
      assert.doesNotMatch(sql, /\b(?:insert|update|delete|create|alter|drop|truncate)\b/i)
    }
  })

  it('prepares the checksum ledger under a transaction lock', () => {
    const sql = buildPrepareLedgerSql()
    assert.match(sql, /^BEGIN;/)
    assert.match(sql, /SET TRANSACTION ISOLATION LEVEL READ COMMITTED/)
    assert.match(sql, /pg_catalog\.pg_advisory_xact_lock/)
    assert.match(sql, /ADD COLUMN IF NOT EXISTS checksum text/)
    assert.doesNotMatch(sql, /CREATE (?:SCHEMA|TABLE)/)
    assert.match(sql, /COMMIT;$/)
  })
})

describe('production migration redaction', () => {
  it('removes tokens and credential URLs', () => {
    const secret = 'sbp_abcdefghijklmnopqrstuvwxyz'
    const input = `Bearer "${secret}" postgresql://user:pass@db.test/x?access_token=${secret} https://opaque-user@example.test/x`
    const output = redactSensitive(input, { secrets: [secret] })
    assert.doesNotMatch(output, /abcdefghijklmnopqrstuvwxyz|user:pass|opaque-user/)
    assert.match(output, /REDACTED/)
  })

  it('removes SQL and sensitive response bodies', () => {
    const sql = redactSensitive('Request echoed: insert into customers(secret) values (\'x\');')
    assert.equal(sql, 'Request echoed: [REDACTED SQL]')
    const body = redactSensitive('Response body: {"token":"top-secret"}')
    assert.equal(body, 'Response body: [REDACTED]')
    for (const statement of [
      'WITH x AS (VALUES (\'secret\')) SELECT * FROM x;',
      'VALUES (\'opaque-secret\');',
      'NOTIFY private_channel, \'opaque-secret\';',
      'SELECT secret,\npassword\nFROM customers;',
      'TRUNCATE customer_data;',
      'CALL rotate_credentials();',
      'GRANT SELECT ON secrets TO public;',
    ]) {
      assert.equal(redactSensitive(`Echo: ${statement}`), 'Echo: [REDACTED SQL]')
    }
  })

  it('keeps safe diagnostic context', () => {
    assert.equal(
      redactSensitive('Migration 20270101000000_safe.sql failed with HTTP 503.'),
      'Migration 20270101000000_safe.sql failed with HTTP 503.'
    )
  })
})

describe('production migration transport', () => {
  const config = {
    token: 'sbp_abcdefghijklmnopqrstuvwxyz',
    projectRef: 'abcdefghijklmnopqrst',
  }

  it('never includes a sensitive response body in an HTTP error', async () => {
    const transport = createManagementApiTransport({
      ...config,
      fetchFn: async () => ({
        ok: false,
        status: 500,
        text: async () => 'insert into secrets values (\'token\')',
      }),
    })
    await assert.rejects(
      () => transport.execute({ kind: 'apply-migration', sql: 'select secret from users;' }),
      error => error.message === 'Management API apply-migration failed with HTTP 500.'
    )
  })

  it('sends SQL without logging it and parses row results', async () => {
    let request
    const transport = createManagementApiTransport({
      ...config,
      fetchFn: async (_url, options) => {
        request = options
        return { ok: true, status: 200, text: async () => '[{"version":"20270101000000"}]' }
      },
    })
    const rows = await transport.execute({ kind: 'read-ledger', sql: 'select version from ledger;' })
    assert.equal(rows[0].version, '20270101000000')
    assert.match(request.headers.Authorization, /^Bearer /)
    assert.match(request.body, /select version from ledger/)
  })

  it('hides a successful but malformed response body', async () => {
    const transport = createManagementApiTransport({
      ...config,
      fetchFn: async () => ({ ok: true, status: 200, text: async () => 'secret response' }),
    })
    await assert.rejects(
      () => transport.execute({ kind: 'read-ledger', sql: 'select 1;' }),
      error => !error.message.includes('secret response')
    )
  })
})
