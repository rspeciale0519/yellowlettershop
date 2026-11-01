import { extractAssetImageId } from '@/lib/assets/image-access'
import { resolveImageAccess } from '@/lib/assets/resolve-image-access'
import { safeFetch } from '@/lib/security/safe-fetch'
import { createServiceClient } from '@/utils/supabase/service'

export type ImageBytes = { bytes: Uint8Array; kind: 'png' | 'jpg' }

function asImageBytes(buf: Uint8Array): ImageBytes {
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8
  return { bytes: buf, kind: isJpg ? 'jpg' : 'png' }
}

async function bytesFromBlob(data: Blob): Promise<Uint8Array> {
  const ab = await new Response(data).arrayBuffer()
  return new Uint8Array(ab)
}

async function downloadAccessibleAsset(
  assetId: string,
  userId: string | null
): Promise<ImageBytes | null> {
  const supabase = createServiceClient()
  const access = await resolveImageAccess(supabase, assetId, userId)
  if (!access.ok) return null
  const { data, error } = await supabase.storage.from('assets').download(access.filePath)
  if (error || !data) return null
  return asImageBytes(await bytesFromBlob(data))
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
    if (assetId) {
      return downloadAccessibleAsset(assetId, ownerUserId ?? null)
    }
    const res = await safeFetch(src)
    if (!res.ok) return null
    return asImageBytes(new Uint8Array(await res.arrayBuffer()))
  } catch {
    return null
  }
}
