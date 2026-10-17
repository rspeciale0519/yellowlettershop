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
  const storagePath = filePathFromStorageAssetId(assetId)
  if (storagePath) {
    if (userId && isOwnedStoragePath(userId, storagePath)) {
      return { ok: true, filePath: storagePath }
    }
    const byPath = await loadAssetBy(supabase, 'file_path', storagePath)
    if (byPath) return evaluateAssetAccess(userId, byPath)
    return evaluateAssetAccess(userId, {
      file_path: storagePath,
      file_type: 'image',
      user_id: storagePath.split('/')[0] ?? null,
      is_public: false,
    })
  }

  const byId = await loadAssetBy(supabase, 'id', assetId)
  return evaluateAssetAccess(userId, byId)
}
