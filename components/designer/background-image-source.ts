import type { PageBackgroundImage } from "@/types/designer"

// Resolve a page background image to a canonical URL for the server-PDF
// renderer (mirrors image-source-url.ts for elements). The client layer can
// use `image.src` directly; the renderer needs the routable canonical URL.
const APP_ASSET_BASE_URL = (() => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  return configuredUrl && !configuredUrl.includes("localhost")
    ? configuredUrl
    : "https://www.yellowlettershop.com"
})()

export function backgroundImageSource(
  image: Pick<PageBackgroundImage, "assetId" | "src" | "sourceUrl">,
): string {
  if (image.src.startsWith("placeholder:")) return ""
  if (image.sourceUrl) return image.sourceUrl
  if (image.assetId) {
    return `${APP_ASSET_BASE_URL}/assets/images/${encodeURIComponent(image.assetId)}`
  }
  return image.src
}
