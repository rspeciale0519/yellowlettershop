import { filePathFromStorageAssetId } from './storage-fallback'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isOwnedStoragePath(userId: string, filePath: string): boolean {
  if (!userId || !filePath) return false
  if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) return false
  const parts = filePath.split('/')
  return parts.length === 2 && parts[0] === userId && parts[1].length > 0
}

export function ownedPathFromAssetId(userId: string, assetId: string): string | null {
  const storagePath = filePathFromStorageAssetId(assetId)
  if (storagePath) {
    return isOwnedStoragePath(userId, storagePath) ? storagePath : null
  }
  return UUID_RE.test(assetId) ? assetId : null
}

export function extractAssetImageId(src: string): string | null {
  try {
    const url = new URL(src, 'https://yls.invalid')
    const match = url.pathname.match(/\/assets\/images\/([^/]+)$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
