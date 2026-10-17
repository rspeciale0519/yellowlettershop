import Module, { createRequire } from 'module'
const loader = createRequire(__filename)

export const assetRuntime = {
  user: 'owner' as string | null,
  asset: { user_id: 'owner', file_path: 'owner/image.png', file_type: 'image' },
  signed: [] as string[], reads: 0,
}
export function loadAssetRoute() {
  const client = {
    auth: { getUser: async () => ({ data: { user: assetRuntime.user ? { id: assetRuntime.user } : null }, error: null }) },
    from: () => {
      assetRuntime.reads++
      const filters: Array<[string, unknown]> = []
      const query = { select: () => query, eq: (key: string, value: unknown) => { filters.push([key, value]); return query }, single: async () => ({ data: filters.every(([key, value]) => key === 'id' || assetRuntime.asset[key as keyof typeof assetRuntime.asset] === value) ? assetRuntime.asset : null, error: null }) }
      return query
    },
    storage: { from: () => ({ createSignedUrl: async (path: string) => { assetRuntime.signed.push(path); return { data: { signedUrl: 'https://example.test/signed' }, error: null } } }) },
  }
  const mocks = {
    '../../utils/supabase/server': { createClient: async () => client },
    '../../utils/supabase/service': { createServiceClient: () => client },
  }
  const previous = new Map<string, NodeModule | undefined>()
  try {
    for (const [name, value] of Object.entries(mocks)) {
      const path = loader.resolve(name)
      previous.set(path, loader.cache[path])
      const mod = new Module(path); mod.exports = value; loader.cache[path] = mod
    }
    const path = loader.resolve('../../app/assets/images/[assetId]/route')
    delete loader.cache[path]
    return loader(path) as { GET: (request: Request, context: { params: Promise<{ assetId: string }> }) => Promise<Response> }
  } finally {
    for (const [path, mod] of previous) {
      if (mod) loader.cache[path] = mod
      else delete loader.cache[path]
    }
  }
}
