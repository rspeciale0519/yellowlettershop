/** Both historical asset upload layouts bind the object path to its owner. */
export function isOwnedAssetPath(path: string, ownerId: string): boolean {
  if (!ownerId || typeof path !== 'string') return false
  const parts = path.split('/')
  const owned = parts[0] === ownerId || parts[0] === 'assets' && parts[1] === ownerId
  return owned && parts.length >= 2 && parts.every(part => part && part !== '.' && part !== '..' && !/[\\%\x00-\x1f]/.test(part))
}
