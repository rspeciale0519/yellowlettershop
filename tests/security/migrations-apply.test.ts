import { strict as assert } from 'assert'
import { applyMigrationsOnDisposablePostgres, canRunDisposablePostgres } from '../helpers/real-postgres-migrations'
import { migrationFiles } from '../helpers/apply-all-migrations'

const TEAM_FNS = [
  'public.create_team_and_owner(text)',
  'public.invite_member(uuid,text,text,text)',
  'public.add_team_member(uuid,uuid,text)',
  'public.accept_team_invitation(uuid)',
  'public.update_team_member_permissions(uuid,uuid,text)',
  'public.lookup_user_by_email(text)',
]

describe('disposable Postgres applies every migration in order', function () {
  this.timeout(180000)
  before(function () {
    if (!canRunDisposablePostgres()) this.skip()
  })

  it('replays the full supabase/migrations chain', () => {
    const result = applyMigrationsOnDisposablePostgres({
      afterApply: (sql) => assertAnonCannotExecuteTeamRpcs(sql),
    })
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
        assertAnonCannotExecuteTeamRpcs(sql)
      },
    })
    assert.ok(result.files.includes('20261017120200_share_tokens_identity_pricing.sql'))
  })
})

function assertAnonCannotExecuteTeamRpcs(sql: (query: string) => string) {
  assert.match(sql("select to_regprocedure('public.lookup_user_by_email(text)') is null as missing"), /t/)
  for (const fn of TEAM_FNS.filter((name) => !name.includes('lookup_user_by_email'))) {
    const privilege = sql(`select has_function_privilege('anon', '${fn}', 'EXECUTE') as allowed`)
    assert.match(privilege, /f/, fn)
  }
  const denied = sql(`
    set role anon;
    do $$
    begin
      begin
        perform public.create_team_and_owner('anon');
        raise exception 'anon should not execute create_team_and_owner';
      exception when insufficient_privilege then
        null;
      end;
      begin
        perform public.invite_member('00000000-0000-4000-8000-000000000099', 'a@b.c', 'member', 't');
        raise exception 'anon should not execute invite_member';
      exception when insufficient_privilege then
        null;
      end;
    end $$;
    reset role;
    select 'denied-ok';
  `)
  assert.match(denied, /denied-ok/)
}
