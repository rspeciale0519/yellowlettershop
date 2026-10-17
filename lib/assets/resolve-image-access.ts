import { filePathFromStorageAssetId } from './storage-fallback'
import {
  evaluateAssetAccess,
  isOwnedStoragePath,
  type AssetAccessDecision,
  type AssetAccessRecord,
} from './image-access'

export type AssetQueryClient = { from: (table: string) => any }

const ASSET_COLS = 'file_path, file_type, user_id, uploaded_by, is_public'

async function loadAssetBy(
  supabase: AssetQueryClient,
  column: 'id' | 'file_path',
  value: string
): Promise<AssetAccessRecord | null> {
  const { data, error } = await supabase.from('user_assets').select(ASSET_COLS).eq(column, value).maybeSingle()
  if (error || !data) return null
  return data
}

export async function resolveImageAccess(
  supabase: AssetQueryClient,
  assetId: string,
  userId: string | null
): Promise<AssetAccessDecision> {
  if (!userId) return { ok: false, status: 401, error: 'Authentication required' }
  const storagePath = filePathFromStorageAssetId(assetId)
  if (assetId.startsWith('storage--')) {
    if (storagePath && isOwnedStoragePath(userId, storagePath) && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(storagePath)) {
      return { ok: true, filePath: storagePath }
    }
    return { ok: false, status: 404, error: 'Image not found' }
  }

  const byId = await loadAssetBy(supabase, 'id', assetId)
  return evaluateAssetAccess(userId, byId)
}
