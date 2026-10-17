import { strict as assert } from 'assert'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { applyMigrationsOnDisposablePostgres } from '../helpers/real-postgres-migrations'
import { asRole, migrationSql, ownerId, securityDatabase } from '../helpers/security-database'

const forwardPath = resolve(__dirname, '../../supabase/migrations/20261017120300_secure_share_tokens.sql')

describe('share-link permissions and read-only release preflight', function () {
  this.timeout(120000)

  it('replaces an already-recorded weak generator using the same built-in CSPRNG and service-only execution', async () => {
    const db = await securityDatabase()
    try {
      await db.exec(`create function public.generate_share_token() returns text language sql as $$
        select md5(clock_timestamp()::text)||md5(clock_timestamp()::text)
      $$; grant execute on function public.generate_share_token() to public, authenticated`)
      await db.exec(readFileSync(forwardPath, 'utf8'))
      const definition = (await db.query<{ source: string }>("select prosrc as source from pg_proc where oid='public.generate_share_token()'::regprocedure")).rows[0].source
      assert.match(definition, /pg_catalog\.gen_random_uuid/)
      assert.doesNotMatch(definition, /md5|clock_timestamp|gen_random_bytes/i)
      await asRole(db, 'authenticated', async () => {
        await assert.rejects(db.query('select generate_share_token()'), /permission denied/i)
      })
      await asRole(db, 'service_role', async () => {
        const rows = (await db.query<{ token: string }>('select generate_share_token() as token from generate_series(1,20)')).rows
        rows.forEach(row => assert.match(row.token, /^[a-f0-9]{64}$/))
        assert.equal(new Set(rows.map(row => row.token)).size, 20)
      })
    } finally { await db.close() }
  })

  it('executes the hosted preflight query file against a disposable full schema without changing rows', () => {
    applyMigrationsOnDisposablePostgres({ afterApply: query => {
      query('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text,name text)')
      const before = query('select count(*) from public.orders')
      const sql = readFileSync(resolve(__dirname, '../../docs/superpowers/reports/2026-10-17-security-preflight-readonly.sql'), 'utf8')
      assert.match(query(sql), /pgcrypto/)
      assert.equal(query('select count(*) from public.orders'), before)
    } })
  })

  it('blocks direct client token/expiry writes including legacy column grants, preserving owner reads and service writes', async () => {
    const db = await securityDatabase()
    try {
      await db.exec(migrationSql())
      await db.exec(`grant update (expires_at) on public.asset_share_links to public, authenticated`)
      if (existsSync(forwardPath)) await db.exec(readFileSync(forwardPath, 'utf8'))
      await db.exec(`insert into asset_share_links(asset_id,share_token,created_by,expires_at)
        select id,'fixture-hash','${ownerId}',now()+interval '7 days' from user_assets where user_id='${ownerId}'`)
      await asRole(db, 'authenticated', async () => {
        assert.equal((await db.query('select * from asset_share_links')).rows.length, 1)
        for (const sql of [
          `insert into asset_share_links(asset_id,share_token,created_by,expires_at)
            select id,'chosen-hash','${ownerId}',null from user_assets where user_id='${ownerId}'`,
          'update asset_share_links set expires_at=null',
          'delete from asset_share_links',
        ]) await assert.rejects(db.exec(sql), /permission denied/i)
      })
      await asRole(db, 'service_role', async () => {
        await db.exec('update asset_share_links set is_active=false')
        assert.equal((await db.query<{ is_active: boolean }>('select is_active from asset_share_links')).rows[0].is_active, false)
      })
    } finally { await db.close() }
  })
})
