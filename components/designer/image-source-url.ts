import type { DesignElement } from "@/types/designer"

const APP_ASSET_BASE_URL = (() => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  return configuredUrl && !configuredUrl.includes("localhost") ? configuredUrl : "https://www.yellowlettershop.com"
})()

function storageAssetIdFromUrl(src: string) {
  try {
    const path = new URL(src).pathname
    const marker = "/storage/v1/object/sign/assets/"
    if (!path.includes(marker)) return null
    const filePath = decodeURIComponent(path.slice(path.indexOf(marker) + marker.length))
    return `storage--${btoa(filePath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`
  } catch {
    return null
  }
}

export function imageSourceUrl(element: DesignElement) {
  if (element.type !== "image") return ""
  if (element.src.startsWith("placeholder:")) return element.src.replace("placeholder:", "")
  if (element.sourceUrl) return element.sourceUrl
  if (element.assetId) return `${APP_ASSET_BASE_URL}/assets/images/${encodeURIComponent(element.assetId)}`
  const storageAssetId = storageAssetIdFromUrl(element.src)
  return storageAssetId ? `${APP_ASSET_BASE_URL}/assets/images/${storageAssetId}` : ""
}
