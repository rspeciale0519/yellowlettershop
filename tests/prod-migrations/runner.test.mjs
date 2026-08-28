import { describe, it } from 'mocha'
import { strict as assert } from 'node:assert'
import { createMigration } from '../../scripts/prod-migrations/catalog.mjs'
import { runCli } from '../../scripts/prod-migrations/cli.mjs'
import { runMigrationRunner } from '../../scripts/prod-migrations/runner.mjs'

function migration(version, name) {
  return createMigration(`${version}_${name}.sql`, `select '${name}';`, {
    transactionAllowlist: new Map(),
  })
}

function logger() {
  const messages = []
  return {
    messages,
    info: message => messages.push(`info:${message}`),
    warn: message => messages.push(`warn:${message}`),
    error: message => messages.push(`error:${message}`),
  }
}

class FakeTransport {
  constructor(options = {}) {
    this.operations = []
    this.effects = []
    this.ledger = new Map((options.rows ?? []).map(row => [row.version, { ...row }]))
    this.exists = options.exists ?? true
    this.checksumExists = options.checksumExists ?? true
    this.failLock = options.failLock ?? null
    this.failLedger = options.failLedger ?? null
    this.failMigration = options.failMigration ?? null
    this.falseSuccess = options.falseSuccess ?? null
    this.rowOnPrepare = options.rowOnPrepare ?? null
    this.rowBeforeApply = options.rowBeforeApply ?? null
    this.applyBarrier = options.applyBarrier ?? 0
    this.arrivals = 0
    this.lockTail = Promise.resolve()
    if (this.applyBarrier > 0) {
      this.barrier = new Promise(resolve => { this.releaseBarrier = resolve })
    }
  }

  async mutex(callback) {
    const previous = this.lockTail
    let release
    this.lockTail = new Promise(resolve => { release = resolve })
    await previous
    try {
      return await callback()
    } finally {
      release()
    }
  }

  async execute(operation) {
    this.operations.push(operation)
    if (operation.kind === 'inspect-ledger') {
      return [{ ledger_exists: this.exists, checksum_exists: this.checksumExists }]
    }
    if (operation.kind === 'read-ledger') return [...this.ledger.values()].map(row => ({ ...row }))
    if (operation.kind === 'prepare-ledger') {
      this.exists = true
      this.checksumExists = true
      if (this.rowOnPrepare) {
        this.ledger.set(this.rowOnPrepare.version, { ...this.rowOnPrepare })
      }
      return []
    }
    if (operation.kind !== 'apply-migration') throw new Error('unexpected fake operation')

    if (this.applyBarrier > 0) {
      this.arrivals += 1
      if (this.arrivals === this.applyBarrier) this.releaseBarrier()
      await this.barrier
    }
    return this.mutex(async () => {
      const item = operation.migration
      if (this.failLock === item.version) throw new Error('lock failed')
      if (this.rowBeforeApply) {
        this.ledger.set(this.rowBeforeApply.version, { ...this.rowBeforeApply })
        this.rowBeforeApply = null
      }
      if ([...this.ledger.keys()].some(version => version >= item.version)) {
        throw new Error('duplicate or later version')
      }
      if (this.failLedger === item.version) throw new Error('ledger insert failed')

      const stagedLedger = new Map(this.ledger)
      const stagedEffects = [...this.effects]
      stagedLedger.set(item.version, {
        version: item.version,
        name: item.name,
        checksum: item.checksum,
      })
      if (this.failMigration === item.version) throw new Error('migration failed')
      if (this.falseSuccess === item.version) return []
      stagedEffects.push(item.version)
      this.ledger = stagedLedger
      this.effects = stagedEffects
      return []
    })
  }
}

describe('production migration runner', () => {
  const previous = migration('20261201000000', 'previous')
  const first = migration('20270101000000', 'first')
  const second = migration('20270102000000', 'second')
  const previousRow = (checksum = previous.checksum) => ({
    version: previous.version,
    name: previous.name,
    checksum,
  })

  it('uses read-only metadata operations during dry-run', async () => {
    const transport = new FakeTransport({ rows: [previousRow()] })
    const output = logger()
    const result = await runMigrationRunner({
      catalog: [previous, first], transport, dryRun: true, logger: output,
    })
    assert.equal(result.pending, 1)
    assert.deepEqual(transport.operations.map(item => item.kind), ['inspect-ledger', 'read-ledger'])
    assert.equal(transport.effects.length, 0)
    assert.ok(output.messages.some(message => message.includes('[dry-run] would apply')))
  })

  it('applies and records one migration atomically', async () => {
    const transport = new FakeTransport({ rows: [previousRow(null)], checksumExists: false })
    const output = logger()
    const result = await runMigrationRunner({ catalog: [previous, first], transport, logger: output })
    assert.equal(result.applied, 1)
    assert.deepEqual(transport.effects, [first.version])
    assert.equal(transport.ledger.get(first.version).checksum, first.checksum)
    const apply = transport.operations.find(item => item.kind === 'apply-migration')
    assert.match(apply.sql, /SET TRANSACTION ISOLATION LEVEL READ COMMITTED/)
    assert.match(apply.sql, /pg_catalog\.pg_advisory_xact_lock/)
    assert.match(apply.sql, /IF EXISTS/)
    assert.match(apply.sql, /WHERE version >=/)
    assert.match(apply.sql, /RAISE EXCEPTION 'migration ledger history changed'/)
    assert.match(apply.sql, new RegExp(first.checksum))
    assert.ok(output.messages.includes(`info:applied  ${first.filename}`))
  })

  it('does not apply a matching migration twice on repeated runs', async () => {
    const transport = new FakeTransport({ rows: [previousRow()] })
    await runMigrationRunner({ catalog: [previous, first], transport, logger: logger() })
    await runMigrationRunner({ catalog: [previous, first], transport, logger: logger() })
    assert.deepEqual(transport.effects, [first.version])
    assert.equal(transport.operations.filter(item => item.kind === 'apply-migration').length, 1)
  })

  it('serializes concurrent stale plans and applies one effect', async () => {
    const transport = new FakeTransport({ rows: [previousRow()], applyBarrier: 2 })
    const firstLog = logger()
    const secondLog = logger()
    await Promise.all([
      runMigrationRunner({ catalog: [previous, first], transport, logger: firstLog }),
      runMigrationRunner({ catalog: [previous, first], transport, logger: secondLog }),
    ])
    assert.deepEqual(transport.effects, [first.version])
    assert.equal(transport.ledger.size, 2)
    assert.equal(transport.operations.filter(item => item.kind === 'apply-migration').length, 2)
    assert.ok([...firstLog.messages, ...secondLog.messages]
      .some(message => message.includes('concurrent or uncertain request')))
  })

  it('stops later migrations after lock, ledger, or migration failure', async () => {
    for (const mode of ['failLock', 'failLedger', 'failMigration']) {
      const transport = new FakeTransport({ rows: [previousRow()], [mode]: first.version })
      const output = logger()
      await assert.rejects(
        () => runMigrationRunner({ catalog: [previous, first, second], transport, logger: output }),
        /Later migrations were not sent/
      )
      assert.equal(transport.ledger.size, 1, `${mode} changed the ledger`)
      assert.equal(transport.effects.length, 0, `${mode} left a migration effect`)
      assert.deepEqual(
        transport.operations.filter(item => item.kind === 'apply-migration')
          .map(item => item.migration.version),
        [first.version]
      )
      assert.ok(!output.messages.some(message => /applied|Done|rolled back/i.test(message)))
    }
  })

  it('stops when later history appears after the initial plan', async () => {
    const laterRow = { version: second.version, name: second.name, checksum: second.checksum }
    const transport = new FakeTransport({ rows: [previousRow()], rowBeforeApply: laterRow })
    const output = logger()
    await assert.rejects(
      () => runMigrationRunner({ catalog: [previous, first], transport, logger: output }),
      /Later migrations were not sent/
    )
    assert.deepEqual(transport.effects, [])
    assert.equal(transport.ledger.has(first.version), false)
    assert.equal(transport.ledger.has(second.version), true)
    assert.ok(!output.messages.some(message => /applied|Done/i.test(message)))
  })

  it('rejects a false success response without a matching ledger row', async () => {
    const transport = new FakeTransport({ rows: [previousRow()], falseSuccess: first.version })
    const output = logger()
    await assert.rejects(
      () => runMigrationRunner({ catalog: [previous, first], transport, logger: output }),
      /returned success without a matching ledger entry/
    )
    assert.equal(transport.ledger.size, 1)
    assert.ok(!output.messages.some(message => /applied|Done/i.test(message)))
  })

  it('reports legacy rows without changing them', async () => {
    const legacy = { version: first.version, name: first.name, checksum: null }
    const transport = new FakeTransport({ rows: [legacy], checksumExists: false })
    const output = logger()
    const result = await runMigrationRunner({ catalog: [first], transport, logger: output })
    assert.equal(result.applied, 0)
    assert.equal(transport.ledger.get(first.version).checksum, null)
    assert.ok(output.messages.some(message => message.includes('unverified')))
    assert.equal(transport.operations.some(item => item.kind === 'prepare-ledger'), false)
  })

  it('reports a legacy row found during the locked replan', async () => {
    const legacy = { version: first.version, name: first.name, checksum: null }
    const transport = new FakeTransport({
      rows: [previousRow(null)], checksumExists: false, rowOnPrepare: legacy,
    })
    const output = logger()
    const result = await runMigrationRunner({ catalog: [previous, first], transport, logger: output })
    assert.equal(result.applied, 0)
    assert.ok(output.messages.some(message => message.includes('unverified')))
    assert.equal(transport.operations.some(item => item.kind === 'apply-migration'), false)
  })

  it('fails closed on drift before a mutating operation', async () => {
    const transport = new FakeTransport({ rows: [{
      version: first.version,
      name: first.name,
      checksum: 'a'.repeat(64),
    }] })
    await assert.rejects(
      () => runMigrationRunner({ catalog: [first], transport, logger: logger() }),
      /Checksum drift/
    )
    assert.equal(transport.operations.some(item => item.kind === 'prepare-ledger'), false)
    assert.equal(transport.operations.some(item => item.kind === 'apply-migration'), false)
  })

  it('handles an empty catalog without writes', async () => {
    const transport = new FakeTransport({ exists: false, checksumExists: false })
    const result = await runMigrationRunner({ catalog: [], transport, logger: logger() })
    assert.equal(result.applied, 0)
    assert.deepEqual(transport.operations.map(item => item.kind), ['inspect-ledger'])
  })

  it('refuses missing, empty, and out-of-order ledger histories', async () => {
    const cases = [
      {
        catalog: [first],
        transport: new FakeTransport({ exists: false, checksumExists: false }),
        error: /Migration ledger is missing/,
      },
      {
        catalog: [first],
        transport: new FakeTransport(),
        error: /history is empty or out of order/,
      },
      {
        catalog: [first],
        transport: new FakeTransport({ rows: [{
          version: '20260101000000', name: 'remote_only', checksum: 'a'.repeat(64),
        }] }),
        error: /history is empty or out of order/,
      },
      {
        catalog: [previous, first, second],
        transport: new FakeTransport({ rows: [
          previousRow(),
          { version: second.version, name: second.name, checksum: second.checksum },
        ] }),
        error: /history is empty or out of order/,
      },
      {
        catalog: [previous, first],
        transport: new FakeTransport({ rows: [
          previousRow(),
          { version: second.version, name: second.name, checksum: second.checksum },
        ] }),
        error: /history is empty or out of order/,
      },
    ]
    for (const item of cases) {
      for (const dryRun of [true, false]) {
        const output = logger()
        await assert.rejects(
          () => runMigrationRunner({
            catalog: item.catalog, transport: item.transport, dryRun, logger: output,
          }),
          item.error
        )
        assert.ok(!output.messages.some(message => message.includes('[dry-run] would apply')))
        assert.equal(item.transport.operations.some(operation => operation.kind === 'prepare-ledger'), false)
        assert.equal(item.transport.operations.some(operation => operation.kind === 'apply-migration'), false)
      }
    }
  })

  it('rejects backfill and local validation errors before transport creation', async () => {
    let fetched = false
    let loaded = false
    const options = {
      env: {
        SUPABASE_ACCESS_TOKEN: 'sbp_abcdefghijklmnopqrstuvwxyz',
        SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
      },
      fetchFn: async () => { fetched = true; throw new Error('must not fetch') },
      catalogLoader: async () => { loaded = true; throw new Error('malformed migration') },
      logger: logger(),
    }
    assert.equal(await runCli({ ...options, argv: ['--backfill'] }), 1)
    assert.equal(loaded, false)
    assert.equal(fetched, false)
    assert.equal(await runCli({ ...options, argv: [] }), 1)
    assert.equal(loaded, true)
    assert.equal(fetched, false)
  })
})
