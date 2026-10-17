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

export type AssetAccessOk = { ok: true; filePath: string }
export type AssetAccessErr = { ok: false; status: 401 | 403 | 404; error: string }
export type AssetAccessDecision = AssetAccessOk | AssetAccessErr

export interface AssetAccessRecord {
  file_path: string | null
  file_type?: string | null
  user_id?: string | null
  uploaded_by?: string | null
  is_public?: boolean | null
}

export function evaluateAssetAccess(
  userId: string | null,
  asset: AssetAccessRecord | null
): AssetAccessDecision {
  if (!asset?.file_path) {
    return { ok: false, status: 404, error: 'Image not found' }
  }
  if (asset.file_type && asset.file_type !== 'image') {
    return { ok: false, status: 404, error: 'Image not found' }
  }

  const ownerId = asset.user_id || asset.uploaded_by || null
  const isOwner = Boolean(userId && ownerId && userId === ownerId)
  const isPublic = Boolean(asset.is_public)

  if (isOwner || isPublic) {
    return { ok: true, filePath: asset.file_path }
  }
  if (!userId) {
    return { ok: false, status: 401, error: 'Authentication required' }
  }
  return { ok: false, status: 403, error: 'Access denied' }
}
