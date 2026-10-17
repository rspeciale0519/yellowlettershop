import { strict as assert } from 'assert'
import { securityDatabase, migrationSql, asRole, ownerId, otherId } from '../helpers/security-database'

describe('local PostgreSQL financial and administrative RLS migration', function () {
  this.timeout(30000)
  let db: Awaited<ReturnType<typeof securityDatabase>>
  before(async () => { db = await securityDatabase(); await db.exec(migrationSql()) })
  after(async () => { await db?.close() })
  it('enables RLS on every public table and is repeatable', async () => {
    const result = await db.query<{ relname: string }>(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity`)
    assert.deepEqual(result.rows, [])
    await db.exec(migrationSql())
  })
  it('allows users to read only their credits and orders', async () => {
    await asRole(db, 'authenticated', async () => {
      assert.equal((await db.query('select * from user_credits')).rows.length, 1)
      const orders = await db.query<{ created_by: string }>('select * from orders')
      assert.deepEqual(orders.rows.map(r => r.created_by), [ownerId])
    })
  })
  it('rejects credit insertion, update and deletion, including old column grants', async () => {
    await asRole(db, 'authenticated', async () => {
      for (const sql of [
        `update user_credits set amount=999`, `delete from user_credits`,
        `insert into user_credits(user_id,amount,type,description,balance_after,created_by) values ('${ownerId}',999,'credit','forged',999,'${ownerId}')`,
      ]) await assert.rejects(db.exec(sql), /permission denied|row-level security/)
    })
  })
  it('allows public price reads but rejects price and admin writes', async () => {
    await asRole(db, 'anon', async () => assert.equal((await db.query('select * from pricing_config')).rows.length, 1))
    await asRole(db, 'authenticated', async () => {
      for (const sql of ["update pricing_config set unit_amount=1", "delete from pricing_config", "insert into pricing_config(category,key,display_name) values ('mail_piece','forged','Forged')", 'delete from admin_audit_log', 'delete from user_notes', 'delete from pricing_change_log', 'delete from vendors']) {
        await assert.rejects(db.exec(sql), /permission denied|row-level security/)
      }
    })
  })
  it('blocks payment state and validation snapshot forgery through direct database access', async () => {
    await asRole(db, 'authenticated', async () => {
      for (const sql of ["update orders set payment_status='captured',total_cost=1", 'delete from orders', 'update accuzip_validation_jobs set deliverable_count=999', "insert into orders(created_by,total_cost) values ('" + ownerId + "',1)"]) {
        await assert.rejects(db.exec(sql), /permission denied|row-level security/)
      }
    })
  })
  it('preserves safe self-profile edits but blocks self-elevation and other users’ updates', async () => {
    await asRole(db, 'authenticated', async () => {
      await db.exec(`update user_profiles set first_name='Safe edit' where user_id='${ownerId}'`)
      for (const sql of ["update user_profiles set role='super_admin'", "update user_profiles set stripe_customer_id='cus_forged'", `update user_profiles set team_id='${otherId}'`]) await assert.rejects(db.exec(sql), /permission denied|row-level security/)
      await db.exec(`update user_profiles set first_name='Attacker edit' where user_id='${otherId}'`)
      assert.equal((await db.query('select * from user_profiles')).rows.length, 1)
    })
    assert.equal((await db.query<{ first_name: string }>(`select first_name from user_profiles where user_id='${otherId}'`)).rows[0].first_name, 'Other')
  })
  it('preserves existing business-profile and notification preferences', async () => {
    await asRole(db, 'authenticated', () => db.exec(`update user_profiles set job_title='Owner', street_address='123 Main',city='Austin',state='TX',zip_code='78701',country='US',email_notifications=true,sms_notifications=false,marketing_emails=false where user_id='${ownerId}'`))
  })
  it('allows team owners to change their name while blocking billing and other-team changes', async () => {
    await asRole(db, 'authenticated', async () => {
      await db.exec("update teams set name='Renamed'")
      await assert.rejects(db.exec("update teams set stripe_customer_id='cus_forged'"), /permission denied/)
    })
    assert.deepEqual((await db.query<{ name: string }>('select name from teams order by name')).rows.map(r => r.name), ['Other team','Renamed'])
  })
  it('retains service-role financial writes while anonymous users cannot read credits', async () => {
    await asRole(db, 'service_role', () => db.exec('update user_credits set amount=30'))
    await asRole(db, 'anon', async () => assert.rejects(db.query('select * from user_credits'), /permission denied/))
  })
  it('prevents asset namespace forgery despite a legacy permissive storage policy', async () => {
    await asRole(db, 'authenticated', async () => {
      await db.exec(`insert into storage.objects values ('assets','${ownerId}/allowed.png')`)
      await assert.rejects(db.exec(`insert into storage.objects values ('assets','${otherId}/forged.png')`), /row-level security/)
      await assert.rejects(db.exec(`update storage.objects set name='${otherId}/moved.png' where name='${ownerId}/own.png'`), /row-level security/)
      assert.equal((await db.query('select * from storage.objects')).rows.length, 2)
    })
  })
  it('blocks foreign-path asset metadata, traversal and identity reassignment before share creation', async () => {
    await asRole(db, 'authenticated', async () => {
      for (const path of [`${otherId}/private.pdf`, `${ownerId}/../${otherId}/private.pdf`, `${ownerId}/%2e%2e/private.pdf`]) {
        await assert.rejects(db.exec(`insert into user_assets(user_id,uploaded_by,filename,original_filename,file_path) values ('${ownerId}','${ownerId}','forged','forged','${path}')`), /row-level security/)
        await assert.rejects(db.exec(`update user_assets set file_path='${path}' where user_id='${ownerId}'`), /row-level security/)
      }
      await assert.rejects(db.exec(`update user_assets set user_id='${otherId}',file_path='${otherId}/private.pdf'`), /identity|ownership|permission|row-level security/)
      await db.exec(`insert into asset_share_links(asset_id, share_token,created_by) select id,'valid-sample','${ownerId}' from user_assets where user_id='${ownerId}'`)
      assert.equal((await db.query('select * from asset_share_links')).rows.length, 1)
    })
  })
})
