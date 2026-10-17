import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { createClient } from "@/utils/supabase/server"
import { filePathFromStorageAssetId, isMissingUserAssetsTable } from "@/lib/assets/storage-fallback"

async function signedRedirect(filePath: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from("assets").createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Image is unavailable" }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl, { status: 302 })
}

function ownedImagePath(path: string, userId: string) {
  const parts = path.split('/')
  const owned = parts[0] === userId || parts[0] === 'assets' && parts[1] === userId
  return owned && parts.every(part => part && part !== '.' && part !== '..' && !/[\\%\x00-\x1f]/.test(part)) && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(path)
}

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  const { assetId } = await params
  const storageFilePath = filePathFromStorageAssetId(assetId)
  if (assetId.startsWith('storage--')) {
    if (!storageFilePath || !ownedImagePath(storageFilePath, user.id)) return NextResponse.json({ error: "Image not found" }, { status: 404 })
    return signedRedirect(storageFilePath)
  }

  const supabase = createServiceClient()
  const { data: asset, error } = await supabase
    .from("user_assets")
    .select("user_id, file_path, file_type")
    .eq("id", assetId)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (isMissingUserAssetsTable(error)) {
      return NextResponse.json({ error: "Image metadata is unavailable" }, { status: 404 })
    }
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  if (asset?.user_id !== user.id || !asset?.file_path || asset.file_type !== "image" || !ownedImagePath(asset.file_path, user.id)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  return signedRedirect(asset.file_path)
}
