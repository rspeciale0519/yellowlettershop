import { describe, it } from 'mocha'
import { strict as assert } from 'node:assert'
import path from 'node:path'
import {
  createMigration,
  findTopLevelTransactionControls,
  loadMigrationCatalog,
  parseMigrationFilename,
  sha256,
} from '../../scripts/prod-migrations/catalog.mjs'
import { parseCliArgs, planMigrations } from '../../scripts/prod-migrations/planner.mjs'

const entry = name => ({ name, isFile: () => true })

describe('production migration arguments', () => {
  it('accepts only one optional dry-run flag', () => {
    assert.deepEqual(parseCliArgs([]), { dryRun: false })
    assert.deepEqual(parseCliArgs(['--dry-run']), { dryRun: true })
    for (const args of [
      ['--dry-run', '--dry-run'], ['--unknown'], ['value'], ['--backfill'],
      ['--backfill=20260101000000:abc'],
    ]) {
      assert.throws(() => parseCliArgs(args))
    }
  })
})

describe('production migration catalog', () => {
  it('computes SHA-256 from exact bytes', () => {
    assert.equal(
      sha256(Buffer.from('abc')),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })

  it('uses the same migration checksum for LF and CRLF checkouts', () => {
    const options = { transactionAllowlist: new Map() }
    const lf = createMigration('20270101000000_lines.sql', 'select 1;\nselect 2;\n', options)
    const crlf = createMigration(
      '20270101000000_lines.sql', 'select 1;\r\nselect 2;\r\n', options
    )
    assert.equal(lf.checksum, crlf.checksum)
    assert.equal(lf.sql, crlf.sql)
  })

  it('validates filenames and version dates', () => {
    assert.deepEqual(parseMigrationFilename('20260616000360_invitation_rpcs.sql'), {
      filename: '20260616000360_invitation_rpcs.sql',
      version: '20260616000360',
      name: 'invitation_rpcs',
    })
    for (const filename of [
      'migration.sql', '20261301000000_bad_date.sql', '20260230000000_bad_date.sql',
      '20260101000000_Bad_Name.sql', '2026010100000_short.sql',
    ]) {
      assert.throws(() => parseMigrationFilename(filename))
    }
  })

  it('rejects malformed migration content', () => {
    const filename = '20270101000000_bad.sql'
    for (const content of [
      '', '  \n', '; ;', '-- comment only', '/* comment only */',
      'select 1;\0', "select 'unterminated", '/* open',
    ]) {
      assert.throws(() => createMigration(filename, content, { transactionAllowlist: new Map() }))
    }
    assert.throws(() => createMigration(filename, Buffer.from([0xc3, 0x28])))
  })

  it('sorts by validated version and rejects duplicate versions', async () => {
    const files = new Map([
      ['20270103000000_third.sql', 'select 3;'],
      ['20270101000000_first.sql', 'select 1;'],
      ['20270102000000_second.sql', 'select 2;'],
    ])
    const catalog = await loadMigrationCatalog('virtual', {
      readdirFn: async () => [...files.keys()].map(entry),
      readFileFn: async filename => Buffer.from(files.get(path.basename(filename))),
      transactionAllowlist: new Map(),
    })
    assert.deepEqual(catalog.map(item => item.name), ['first', 'second', 'third'])

    await assert.rejects(() => loadMigrationCatalog('virtual', {
      readdirFn: async () => [entry('20270101000000_first.sql'), entry('20270101000000_again.sql')],
      readFileFn: async () => Buffer.from('select 1;'),
      transactionAllowlist: new Map(),
    }), /Duplicate migration version/)
  })

  it('rejects top-level transaction control', () => {
    const commands = [
      'begin; select 1; commit;', 'rollback;', 'savepoint one;',
      'release savepoint one;', 'prepare transaction \'one\';', 'set transaction read only;',
    ]
    for (const sql of commands) {
      assert.throws(() => createMigration(
        '20270101000000_control.sql', sql, { transactionAllowlist: new Map() }
      ))
    }
  })

  it('ignores transaction words in comments, strings, and dollar quotes', () => {
    const sql = `-- begin;\nselect 'commit;';\n/* rollback; */\n      create function f() returns void language plpgsql as $$ begin null; end; $$;`
    const migration = createMigration(
      '20270101000000_safe.sql', sql, { transactionAllowlist: new Map() }
    )
    assert.equal(findTopLevelTransactionControls(migration.executionSql).controls.length, 0)
  })

  it('strips only an exact allowlisted outer wrapper', () => {
    const sql = 'begin;\nselect 1;\ncommit;'
    const checksum = sha256(Buffer.from(sql))
    const allowed = new Map([['20270101000000', checksum]])
    const migration = createMigration('20270101000000_legacy.sql', sql, {
      transactionAllowlist: allowed,
    })
    assert.equal(findTopLevelTransactionControls(migration.executionSql).controls.length, 0)
    assert.match(migration.executionSql, /select 1/)
    assert.throws(() => createMigration(
      '20270101000000_legacy.sql', `${sql}\n-- changed`, { transactionAllowlist: allowed }
    ))
    assert.throws(() => createMigration(
      '20270101000000_legacy.sql', 'select 1;', { transactionAllowlist: allowed }
    ), /Historical migration checksum changed/)
  })

  it('does not let a standard string hide a transaction command', () => {
    assert.throws(() => createMigration(
      '20270101000000_escape.sql', String.raw`select '\'; commit;`,
      { transactionAllowlist: new Map() }
    ))
    const safe = createMigration(
      '20270101000000_escape.sql', String.raw`select E'\'; commit;'; select 1;`,
      { transactionAllowlist: new Map() }
    )
    assert.equal(findTopLevelTransactionControls(safe.sql).controls.length, 0)
  })

  it('ends line comments on CR and CRLF', () => {
    for (const newline of ['\r', '\r\n']) {
      assert.throws(() => createMigration(
        '20270101000000_cr_comment.sql', `select 1; -- comment${newline}commit;`,
        { transactionAllowlist: new Map() }
      ))
    }
  })

  it('validates the complete historical catalog and its 12 wrappers', async () => {
    const catalog = await loadMigrationCatalog(path.resolve('supabase/migrations'))
    assert.ok(catalog.length > 0)
    assert.deepEqual(
      catalog.map(item => item.version),
      [...catalog.map(item => item.version)].sort()
    )
    assert.equal(catalog.filter(item => item.sql !== item.executionSql).length, 12)
    assert.ok(catalog.every(item => /^[0-9a-f]{64}$/.test(item.checksum)))
  })
})

describe('production migration planning', () => {
  const first = createMigration('20270101000000_first.sql', 'select 1;', {
    transactionAllowlist: new Map(),
  })
  const second = createMigration('20270102000000_second.sql', 'select 2;', {
    transactionAllowlist: new Map(),
  })

  it('handles empty and pending catalogs', () => {
    assert.deepEqual(planMigrations([], []).pending, [])
    assert.deepEqual(planMigrations([first, second], []).pending, [first, second])
  })

  it('skips matching applied migrations', () => {
    const plan = planMigrations([first], [{
      version: first.version, name: first.name, checksum: first.checksum,
    }])
    assert.equal(plan.pending.length, 0)
    assert.equal(plan.applied[0].verified, true)
  })

  it('fails closed on checksum drift', () => {
    assert.throws(() => planMigrations([first], [{
      version: first.version, name: first.name, checksum: 'a'.repeat(64),
    }]), /Checksum drift/)
  })

  it('keeps checksum-free rows legacy and unverified', () => {
    const rows = [{ version: first.version, name: first.name, checksum: null }]
    const plan = planMigrations([first, second], rows)
    assert.equal(plan.legacy.length, 1)
    assert.equal(plan.applied[0].verified, false)
    assert.deepEqual(plan.pending, [second])
    assert.equal(rows[0].checksum, null)
  })

  it('rejects malformed and duplicate ledger rows', () => {
    assert.throws(() => planMigrations([first], [{ version: 'bad', checksum: null }]))
    assert.throws(() => planMigrations([first], [{ version: first.version, checksum: '' }]))
    assert.throws(() => planMigrations([first], [{ version: first.version }]))
    assert.throws(() => planMigrations([first], [
      { version: first.version, checksum: null },
      { version: first.version, checksum: null },
    ]))
  })
})
