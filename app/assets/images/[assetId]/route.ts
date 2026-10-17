import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"
import { isOwnedStoragePath, ownedPathFromAssetId } from "@/lib/assets/image-access"
import { filePathFromStorageAssetId, isMissingUserAssetsTable } from "@/lib/assets/storage-fallback"
import { createServiceClient } from "@/utils/supabase/service"

async function signedRedirect(filePath: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from("assets").createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Image is unavailable" }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl, { status: 302 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { assetId } = await params
  const ownedHint = ownedPathFromAssetId(user.id, assetId)
  const storageFilePath = filePathFromStorageAssetId(assetId)
  if (storageFilePath) {
    if (!ownedHint || !isOwnedStoragePath(user.id, storageFilePath)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return signedRedirect(storageFilePath)
  }

  const supabase = createServiceClient()
  const { data: asset, error } = await supabase
    .from("user_assets")
    .select("file_path, file_type, user_id, uploaded_by")
    .eq("id", assetId)
    .single()

  if (error) {
    if (isMissingUserAssetsTable(error)) {
      return NextResponse.json({ error: "Image metadata is unavailable" }, { status: 404 })
    }
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  const ownerId = asset?.user_id || asset?.uploaded_by
  if (!asset?.file_path || asset.file_type !== "image" || ownerId !== user.id) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  return signedRedirect(asset.file_path)
}
