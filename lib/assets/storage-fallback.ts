import type { SupabaseClient } from "@supabase/supabase-js"

export type AssetRecord = {
  id: string
  user_id: string
  team_id: string | null
  uploaded_by: string
  filename: string
  original_filename: string
  file_type: string
  mime_type: string
  file_size: number
  file_path: string
  file_url: string | null
  is_public: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type StorageFile = {
  name: string
  id?: string | null
  updated_at?: string | null
  created_at?: string | null
  metadata?: { size?: number; mimetype?: string; cacheControl?: string; friendlyName?: string }
}

export function isMissingUserAssetsTable(error: unknown) {
  if (!error || typeof error !== "object") return false
  const details = error as { code?: string; message?: string }
  return details.code === "PGRST205" && Boolean(details.message?.includes("user_assets"))
}

export function storageAssetId(filePath: string) {
  return `storage--${Buffer.from(filePath, "utf8").toString("base64url")}`
}

export function filePathFromStorageAssetId(assetId: string) {
  if (!assetId.startsWith("storage--")) return null
  try {
    return Buffer.from(assetId.replace("storage--", ""), "base64url").toString("utf8")
  } catch {
    return null
  }
}

export async function withSignedAssetUrl(client: SupabaseClient, bucket: string, asset: AssetRecord) {
  const { data } = await client.storage.from(bucket).createSignedUrl(asset.file_path, 3600)
  return { ...asset, file_url: data?.signedUrl ?? asset.file_url }
}

export async function listStorageImageAssets(client: SupabaseClient, bucket: string, userId: string) {
  const { data, error } = await client.storage.from(bucket).list(userId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  })
  if (error) throw error

  const imageFiles = (data ?? []).filter((file: StorageFile) => {
    const mimeType = file.metadata?.mimetype ?? ""
    return mimeType.startsWith("image/") || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name)
  })

  return Promise.all(
    imageFiles.map(async (file: StorageFile) => {
      const filePath = `${userId}/${file.name}`
      const createdAt = file.created_at ?? file.updated_at ?? new Date().toISOString()
      return withSignedAssetUrl(client, bucket, {
        id: storageAssetId(filePath),
        user_id: userId,
        team_id: null,
        uploaded_by: userId,
        filename: file.metadata?.friendlyName ?? file.name,
        original_filename: file.name,
        file_type: "image",
        mime_type: file.metadata?.mimetype ?? "image/*",
        file_size: file.metadata?.size ?? 0,
        file_path: filePath,
        file_url: null,
        is_public: false,
        metadata: { storageOnly: true },
        created_at: createdAt,
        updated_at: file.updated_at ?? createdAt,
      })
    }),
  )
}
