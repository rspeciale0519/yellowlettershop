import { strict as assert } from 'assert'
import { applyMigrationsOnDisposablePostgres } from '../helpers/real-postgres-migrations'
import { migrationFiles } from '../helpers/apply-all-migrations'

describe('disposable Postgres applies every migration in order', function () {
  this.timeout(180000)
  it('replays the full supabase/migrations chain', () => {
    const result = applyMigrationsOnDisposablePostgres()
    assert.deepEqual(result.files, migrationFiles().map((file) => file.name))
    assert.ok(result.files.includes('20261017120000_orders_payment_intent_unique.sql'))
    assert.ok(result.files.includes('20261017120100_team_write_rpcs.sql'))
    assert.ok(result.files.includes('20261017120200_share_tokens_identity_pricing.sql'))
  })

  it('applies when pgcrypto already lives in extensions, and generate_share_token still works', () => {
    const result = applyMigrationsOnDisposablePostgres({
      pgcryptoSchema: 'extensions',
      afterApply: (sql) => {
        const schemas = sql(`
          select n.nspname
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where p.proname = 'gen_random_bytes'
        `)
        assert.match(schemas, /extensions/)
        assert.doesNotMatch(schemas, /public/)
        const def = sql("select pg_get_functiondef('public.generate_share_token()'::regprocedure)")
        assert.doesNotMatch(def, /md5\s*\(/i)
        assert.doesNotMatch(def, /clock_timestamp/i)
        const tokens = sql('select generate_share_token() from generate_series(1, 20)')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^[0-9a-f]{64}$/.test(line))
        assert.equal(tokens.length, 20)
        assert.equal(new Set(tokens).size, 20)
      },
    })
    assert.ok(result.files.includes('20261017120200_share_tokens_identity_pricing.sql'))
  })
})
