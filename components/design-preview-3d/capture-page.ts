"use client"

import { toCanvas } from "html-to-image"
import type { DesignElement } from "@/types/designer"

// DOM → bitmap capture for the 3D preview. Wraps html-to-image with the
// readiness gates and image-source fixes the designer's content needs.

/** 1×1 transparent PNG shown where an image genuinely cannot be fetched. */
const IMAGE_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

const READY_TIMEOUT_MS = 4000

/**
 * Supabase asset srcs are SIGNED urls with a 1h expiry — stale after a long
 * editing session, and capture would silently render a hole. Rewriting to the
 * relative same-origin proxy (`/assets/images/{assetId}` → 302 to a FRESH
 * signed url) sidesteps expiry entirely. External `sourceUrl` images and
 * data:/placeholder srcs pass through unchanged.
 */
export function withCaptureSafeImageSrcs(elements: DesignElement[]): DesignElement[] {
  return elements.map((element) => {
    if (element.type !== "image") return element
    if (element.src.startsWith("placeholder:") || element.src.startsWith("data:")) return element
    if (element.assetId) {
      return { ...element, src: `/assets/images/${encodeURIComponent(element.assetId)}` }
    }
    const storageAssetId = storageAssetIdFromUrl(element.src)
    return storageAssetId ? { ...element, src: `/assets/images/${storageAssetId}` } : element
  })
}

// Same derivation as components/designer/image-source-url.ts, but emitting a
// RELATIVE path: capture must stay same-origin (the absolute production host
// that helper prefixes would be cross-origin in dev).
function storageAssetIdFromUrl(src: string): string | null {
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

/**
 * Wait until the node is truly paintable:
 *  - document.fonts.ready (system stacks resolve immediately);
 *  - every <img> in the subtree complete with real dimensions — this
 *    includes QR codes, whose <img> only APPEARS after QRCode.toDataURL
 *    resolves (QrRenderer shows a blank div first), hence the bounded
 *    rAF polling rather than a one-shot check.
 */
export async function waitForPaintable(node: HTMLElement): Promise<void> {
  await document.fonts.ready
  const deadline = performance.now() + READY_TIMEOUT_MS
  await new Promise<void>((resolve) => {
    const check = () => {
      const images = Array.from(node.querySelectorAll("img"))
      const pending = images.filter((img) => !img.complete || img.naturalWidth === 0)
      if (pending.length === 0 || performance.now() > deadline) {
        resolve()
        return
      }
      requestAnimationFrame(check)
    }
    check()
  })
}

/**
 * Rasterize a page node. pixelRatio is clamped so the largest face texture
 * stays ≤2048px (safe floor for old mobile GPUs) while small formats keep
 * the full 2× sharpness.
 */
export async function capturePageCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const rect = node.getBoundingClientRect()
  const pixelRatio = Math.min(2, 2048 / Math.max(rect.width, rect.height))
  const options = {
    pixelRatio,
    backgroundColor: "#ffffff",
    // Fonts are plain system CSS stacks (designer-fonts.ts) — skipping the
    // webfont-embed pass avoids pointless CSS fetches during capture.
    skipFonts: true,
    imagePlaceholder: IMAGE_PLACEHOLDER,
  }
  try {
    return await toCanvas(node, options)
  } catch {
    // One retry: transient decode/fetch hiccups, and Safari's known
    // first-capture-blank foreignObject quirk.
    return toCanvas(node, options)
  }
}
