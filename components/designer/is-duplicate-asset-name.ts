import type { DesignerImageAsset } from "@/types/designer"

// Pure (unit-tested). Blank names are never "duplicates" (handled separately
// as "name required").
export function isDuplicateAssetName(
  name: string,
  assets: Pick<DesignerImageAsset, "name">[],
): boolean {
  const normalized = name.trim().toLocaleLowerCase()
  if (!normalized) return false
  return assets.some((asset) => asset.name.trim().toLocaleLowerCase() === normalized)
}
