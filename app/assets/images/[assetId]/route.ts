import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { filePathFromStorageAssetId, isMissingUserAssetsTable } from "@/lib/assets/storage-fallback"

async function signedRedirect(filePath: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from("assets").createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Image is unavailable" }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl, { status: 302 })
}

export async function GET(_: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params
  const storageFilePath = filePathFromStorageAssetId(assetId)
  if (storageFilePath) return signedRedirect(storageFilePath)

  const supabase = createServiceClient()
  const { data: asset, error } = await supabase
    .from("user_assets")
    .select("file_path, file_type")
    .eq("id", assetId)
    .single()

  if (error) {
    if (isMissingUserAssetsTable(error)) {
      return NextResponse.json({ error: "Image metadata is unavailable" }, { status: 404 })
    }
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  if (!asset?.file_path || asset.file_type !== "image") {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  return signedRedirect(asset.file_path)
}
