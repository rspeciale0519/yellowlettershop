import { extractAssetImageId, isOwnedStoragePath, ownedPathFromAssetId } from '@/lib/assets/image-access'
import { filePathFromStorageAssetId } from '@/lib/assets/storage-fallback'
import { isSafeOutboundUrl } from '@/lib/security/safe-fetch-url'
import { createServiceClient } from '@/utils/supabase/service'

export type ImageBytes = { bytes: Uint8Array; kind: 'png' | 'jpg' }

function asImageBytes(buf: Uint8Array): ImageBytes {
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8
  return { bytes: buf, kind: isJpg ? 'jpg' : 'png' }
}

async function downloadOwnedAsset(userId: string, assetId: string): Promise<ImageBytes | null> {
  const supabase = createServiceClient()
  const storagePath = filePathFromStorageAssetId(assetId)
  let filePath = storagePath && isOwnedStoragePath(userId, storagePath) ? storagePath : null
  if (!filePath) {
    if (!ownedPathFromAssetId(userId, assetId) || storagePath) return null
    const { data: asset } = await supabase
      .from('user_assets')
      .select('file_path, file_type, user_id, uploaded_by')
      .eq('id', assetId)
      .single()
    const ownerId = asset?.user_id || asset?.uploaded_by
    if (!asset?.file_path || ownerId !== userId) return null
    filePath = asset.file_path
  }
  const { data, error } = await supabase.storage.from('assets').download(filePath)
  if (error || !data) return null
  return asImageBytes(new Uint8Array(await data.arrayBuffer()))
}

export async function fetchImageBytes(
  src: string,
  ownerUserId?: string
): Promise<ImageBytes | null> {
  try {
    if (src.startsWith('placeholder:')) return null
    if (src.startsWith('data:')) {
      const [meta, b64] = src.split(',')
      const bytes = Uint8Array.from(Buffer.from(b64, 'base64'))
      return { bytes, kind: meta.includes('jpeg') || meta.includes('jpg') ? 'jpg' : 'png' }
    }
    const assetId = extractAssetImageId(src)
    if (assetId && ownerUserId) {
      return downloadOwnedAsset(ownerUserId, assetId)
    }
    if (!isSafeOutboundUrl(src)) return null
    const res = await fetch(src)
    if (!res.ok) return null
    return asImageBytes(new Uint8Array(await res.arrayBuffer()))
  } catch {
    return null
  }
}
