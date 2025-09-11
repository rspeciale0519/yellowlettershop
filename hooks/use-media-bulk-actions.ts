"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

interface UseMediaBulkActionsArgs<TAsset> {
  selectedFiles: Set<string>
  setSelectedFiles: (s: Set<string>) => void
  setBulkSelectMode: (b: boolean) => void
  mediaFiles: TAsset[]
  deleteAsset: (id: string) => Promise<void>
  updateAsset: (id: string, updates: { tags?: string[]; name?: string }) => Promise<any>
  getAssets: () => Promise<any>
  getAssetStats: () => Promise<any>
}

export function useMediaBulkActions<TAsset extends { id: string; metadata?: any }>(args: UseMediaBulkActionsArgs<TAsset>) {
  const { selectedFiles, setSelectedFiles, setBulkSelectMode, mediaFiles, deleteAsset, updateAsset, getAssets, getAssetStats } = args
  const [isDownloading, setIsDownloading] = useState(false)

  const handleBulkDelete = useCallback(async () => {
    const toDelete = Array.from(selectedFiles)
    try {
      await Promise.all(toDelete.map(id => deleteAsset(id)))
      toast.success(`${toDelete.length} files deleted successfully`)
      setSelectedFiles(new Set())
      setBulkSelectMode(false)
      await getAssets()
      await getAssetStats()
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast.error("Failed to delete some files")
    }
  }, [selectedFiles, deleteAsset, setSelectedFiles, setBulkSelectMode, getAssets, getAssetStats])

  const handleBulkTag = useCallback(async (tags: string[], action: 'add' | 'remove') => {
    const toTag = Array.from(selectedFiles)
    try {
      let successCount = 0
      for (const id of toTag) {
        const file = mediaFiles.find((f: any) => f.id === id)
        if (!file) continue
        const existing = file.metadata?.tags || []
        let next = [...existing]
        if (action === 'add') next = Array.from(new Set([...existing, ...tags]))
        else next = existing.filter((t: string) => !tags.includes(t))
        await updateAsset(id, { tags: next })
        successCount++
      }
      toast.success(`Tags ${action === 'add' ? 'added to' : 'removed from'} ${successCount} files`)
      setSelectedFiles(new Set())
      setBulkSelectMode(false)
      await getAssets()
    } catch (error) {
      console.error("Bulk tag error:", error)
      toast.error("Failed to update tags for some files")
    }
  }, [selectedFiles, mediaFiles, updateAsset, setSelectedFiles, setBulkSelectMode, getAssets])

  const handleBulkDownload = useCallback(async () => {
    const toDownload = Array.from(selectedFiles)
    if (toDownload.length === 0) {
      toast.error("No files selected for download")
      return
    }
    setIsDownloading(true)
    try {
      toast.info("Creating zip file...")
      const response = await fetch('/api/assets/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: toDownload }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create zip file')
      }
      const zipBlob = await response.blob()
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      const cd = response.headers.get('content-disposition')
      let filename = 'media-files.zip'
      if (cd) {
        const m = cd.match(/filename=\"([^\"]+)\"/)
        if (m && m[1]) filename = m[1]
      }
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(`Downloaded ${toDownload.length} files as ${filename}`)
    } catch (error: any) {
      console.error("Bulk download error:", error)
      toast.error(error?.message || "Failed to download files")
    } finally {
      setIsDownloading(false)
    }
  }, [selectedFiles])

  return { isDownloading, handleBulkDelete, handleBulkTag, handleBulkDownload }
}

