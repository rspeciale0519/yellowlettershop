import { strict as assert } from 'assert'
import { asRole, otherId, ownerId, teamRpcDatabase } from '../helpers/team-rpc-database'

const joinerId = '00000000-0000-4000-8000-000000000003'

describe('team write RPCs after authenticated writes were revoked', function () {
  this.timeout(30000)
  let db: Awaited<ReturnType<typeof teamRpcDatabase>>
  before(async () => { db = await teamRpcDatabase() })
  after(async () => { await db?.close() })

  it('lets an owner create, invite and add a member, and denies a non-admin', async () => {
    const teamId = await asRole(db, 'authenticated', async () => {
      const created = await db.query<{ create_team_and_owner: string }>('select create_team_and_owner($1) as create_team_and_owner', ['Acme'])
      const id = created.rows[0].create_team_and_owner
      const invited = await db.query<{ invite_member: { mode: string } }>(
        'select invite_member($1,$2,$3,$4) as invite_member',
        [id, 'new@example.test', 'member', 'invite-token']
      )
      assert.equal(invited.rows[0].invite_member.mode, 'invited')
      const added = await db.query<{ add_team_member: string }>(
        'select add_team_member($1,$2,$3) as add_team_member',
        [id, otherId, 'member']
      )
      assert.ok(added.rows[0].add_team_member)
      return id
    })

    const invitations = await db.query('select email, status from team_invitations')
    assert.equal(invitations.rows.length, 1)
    const members = await db.query<{ user_id: string; role: string }>('select user_id, role from team_members order by role')
    assert.deepEqual(members.rows.map((row) => row.role).sort(), ['member', 'owner'])

    await asRole(db, 'authenticated', async () => {
      await assert.rejects(
        db.query('select invite_member($1,$2,$3,$4)', [teamId, 'denied@example.test', 'member', 'nope']),
        /not authorized/
      )
      await assert.rejects(
        db.query('select add_team_member($1,$2,$3)', [teamId, ownerId, 'member']),
        /not authorized|already belongs/
      )
      await assert.rejects(
        db.query('select lookup_user_by_email($1)', ['owner@example.test']),
        /does not exist|not authorized|permission denied/
      )
    }, otherId)
  })

  it('lets only the invitee accept, and only an owner/admin change roles', async () => {
    const ownerB = '00000000-0000-4000-8000-000000000004'
    await db.exec(`insert into auth.users(id, email) values ('${ownerB}', 'ownerb@example.test')`)
    await db.exec(`insert into public.user_profiles(user_id, first_name) values ('${ownerB}', 'OwnerB')`)
    const teamId = await asRole(db, 'authenticated', async () => {
      const created = await db.query<{ create_team_and_owner: string }>('select create_team_and_owner($1)', ['Invite Co'])
      return created.rows[0].create_team_and_owner
    }, ownerB)

    await asRole(db, 'authenticated', async () => {
      await db.query('select invite_member($1,$2,$3,$4)', [teamId, 'join@example.test', 'member', 'join-token'])
    }, ownerB)

    const invitationId = (await db.query<{ id: string }>("select id from team_invitations where email='join@example.test'")).rows[0].id
    await db.exec(`insert into auth.users(id, email) values ('${joinerId}', 'join@example.test')`)
    await db.exec(`insert into public.user_profiles(user_id, first_name) values ('${joinerId}', 'Joiner')`)

    await asRole(db, 'authenticated', async () => {
      await assert.rejects(db.query('select accept_team_invitation($1)', [invitationId]), /not authorized/)
    }, otherId)

    const memberId = await asRole(db, 'authenticated', async () => {
      const accepted = await db.query<{ accept_team_invitation: string }>('select accept_team_invitation($1)', [invitationId])
      return accepted.rows[0].accept_team_invitation
    }, joinerId)
    assert.ok(memberId)

    await asRole(db, 'authenticated', async () => {
      await assert.rejects(
        db.query('select update_team_member_permissions($1,$2,$3)', [teamId, memberId, 'admin']),
        /not authorized/
      )
    }, joinerId)

    await asRole(db, 'authenticated', async () => {
      await db.query('select update_team_member_permissions($1,$2,$3)', [teamId, memberId, 'admin'])
    }, ownerB)
    const role = (await db.query<{ role: string }>(`select role from team_members where id='${memberId}'`)).rows[0].role
    assert.equal(role, 'admin')
  })

  it('denies anon execute on the write RPCs', async () => {
    await asRole(db, 'anon', async () => {
      await assert.rejects(db.query("select create_team_and_owner('Nope')"), /permission denied|not authorized|unauthenticated/)
      await assert.rejects(db.query('select lookup_user_by_email($1)', ['owner@example.test']), /does not exist|permission denied/)
    })
  })
})
