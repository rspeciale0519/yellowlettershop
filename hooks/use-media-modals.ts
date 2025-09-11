"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

export function useMediaModals(
  filteredMediaFiles: any[],
  updateAsset: (id: string, updates: { name?: string }) => Promise<any>,
  getAssets: () => Promise<any>
) {
  // Image preview (lightbox)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxAsset, setLightboxAsset] = useState<any>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleImageClick = useCallback((asset: any) => {
    if (asset.file_type === "image") {
      const imageAssets = filteredMediaFiles.filter(file => file.file_type === "image")
      const index = imageAssets.findIndex(file => file.id === asset.id)
      setLightboxAsset(asset)
      setLightboxIndex(index)
      setLightboxOpen(true)
    }
  }, [filteredMediaFiles])

  const handleNavigateImage = useCallback((direction: 'prev' | 'next') => {
    const imageAssets = filteredMediaFiles.filter(file => file.file_type === "image")
    let newIndex = lightboxIndex
    if (direction === 'prev' && newIndex > 0) newIndex--
    else if (direction === 'next' && newIndex < imageAssets.length - 1) newIndex++
    setLightboxIndex(newIndex)
    setLightboxAsset(imageAssets[newIndex])
  }, [filteredMediaFiles, lightboxIndex])

  // File details
  const [fileDetailsOpen, setFileDetailsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const handleShowDetails = useCallback((asset: any) => {
    setSelectedFile(asset)
    setFileDetailsOpen(true)
  }, [])

  // Rename
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<any>(null)

  const handleOpenRenameModal = useCallback((asset: any) => {
    setFileToRename(asset)
    setRenameModalOpen(true)
  }, [])

  const handleRename = useCallback(async (asset: any, newName: string) => {
    try {
      await updateAsset(asset.id, { name: newName })
      toast.success("File renamed successfully")
      await getAssets()
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename file")
    }
  }, [updateAsset, getAssets])

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<any>(null)

  const handleDeleteClick = useCallback((asset: any) => {
    setFileToDelete(asset)
    setDeleteDialogOpen(true)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }, [])

  return {
    // lightbox
    lightboxOpen,
    setLightboxOpen,
    lightboxAsset,
    lightboxIndex,
    handleImageClick,
    handleNavigateImage,
    // details
    fileDetailsOpen,
    setFileDetailsOpen,
    selectedFile,
    handleShowDetails,
    // rename
    renameModalOpen,
    setRenameModalOpen,
    fileToRename,
    handleOpenRenameModal,
    handleRename,
    // delete
    deleteDialogOpen,
    setDeleteDialogOpen,
    fileToDelete,
    handleDeleteClick,
    closeDeleteDialog,
  }
}

