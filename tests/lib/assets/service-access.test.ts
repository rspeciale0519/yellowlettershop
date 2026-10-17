import { strict as assert } from 'assert'
import { assetStats } from '../../../lib/assets/service-access'

describe('assetStats', () => {
  it('always queries the session user and ignores a caller-supplied id', async () => {
    const seen: string[] = []
    const client = {
      auth: { getUser: async () => ({ data: { user: { id: 'session-user' } } }) },
      from: () => ({
        select: () => ({
          eq: (_column: string, value: string) => {
            seen.push(value)
            return Promise.resolve({ data: [], error: null })
          },
        }),
      }),
    }
    await assetStats(client as never, 'forged-user')
    assert.deepEqual(seen, ['session-user'])
  })
})
