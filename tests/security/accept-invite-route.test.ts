import { strict as assert } from 'assert'
import { loadWithMocks } from '../helpers/module-mocks'

describe('accept-invite route', () => {
  it('calls accept_team_invitation with the token and hides RPC details', async () => {
    const calls: Array<{ fn: string; args: Record<string, unknown> }> = []
    const route = loadWithMocks<{ POST: (req: Request) => Promise<Response> }>('../../app/api/teams/accept-invite/route', {
      '../../utils/supabase/server': {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'ignored@example.test' } } }) },
          rpc: async (fn: string, args: Record<string, unknown>) => {
            calls.push({ fn, args })
            return { data: 'team-1', error: null }
          },
        }),
      },
    })
    const ok = await route.POST(new Request('http://localhost/api/teams/accept-invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'invite-token-value' }),
    }))
    assert.equal(ok.status, 200)
    assert.deepEqual(await ok.json(), { teamId: 'team-1' })
    assert.deepEqual(calls, [{ fn: 'accept_team_invitation', args: { p_token: 'invite-token-value' } }])

    const failing = loadWithMocks<{ POST: (req: Request) => Promise<Response> }>('../../app/api/teams/accept-invite/route', {
      '../../utils/supabase/server': {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'ignored@example.test' } } }) },
          rpc: async () => ({ data: null, error: { message: 'invitation email mismatch for secret@example.test' } }),
        }),
      },
    })
    const denied = await failing.POST(new Request('http://localhost/api/teams/accept-invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'invite-token-value' }),
    }))
    assert.equal(denied.status, 400)
    assert.deepEqual(await denied.json(), { error: 'Failed to accept invitation' })
  })
})
