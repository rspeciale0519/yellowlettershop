import { strict as assert } from 'assert'
import { applyMigrationsOnDisposablePostgres } from '../helpers/real-postgres-migrations'
import { migrationFiles } from '../helpers/apply-all-migrations'

describe('disposable Postgres applies every migration in order', function () {
  this.timeout(120000)
  it('replays the full supabase/migrations chain', () => {
    const result = applyMigrationsOnDisposablePostgres()
    assert.deepEqual(result.files, migrationFiles().map((file) => file.name))
    assert.ok(result.files.includes('20261017120000_orders_payment_intent_unique.sql'))
    assert.ok(result.files.includes('20261017120100_team_write_rpcs.sql'))
    assert.ok(result.files.includes('20261017120200_share_tokens_identity_pricing.sql'))
  })
})
