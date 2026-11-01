import Module, { createRequire } from 'module'
const loader = createRequire(__filename)

/** Scoped dependency replacement at the HTTP/SDK boundary; restore the module cache. */
export function loadWithMocks<T>(target: string, mocks: Record<string, unknown>): T {
  const previous = new Map<string, NodeModule | undefined>()
  try {
    for (const [name, exports] of Object.entries(mocks)) {
      const path = loader.resolve(name)
      previous.set(path, loader.cache[path])
      const entry = new Module(path); entry.exports = exports; loader.cache[path] = entry
    }
    const path = loader.resolve(target)
    delete loader.cache[path]
    return loader(target) as T
  } finally {
    for (const [path, entry] of previous) {
      if (entry) loader.cache[path] = entry
      else delete loader.cache[path]
    }
  }
}
