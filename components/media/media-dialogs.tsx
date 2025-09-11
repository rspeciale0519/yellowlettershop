"use client"

import { UploadDialog } from "@/components/media/upload-dialog"
import { ImagePreviewModal } from "@/components/media/image-preview-modal"
import { FileDetailsModal } from "@/components/media/file-details-modal"
import { RenameFileModal } from "@/components/media/rename-file-modal"
import { DeleteConfirmDialog } from "@/components/media/delete-confirm-dialog"

interface MediaDialogsProps {
  uploadOpen: boolean
  setUploadOpen: (v: boolean) => void
  isUploading: boolean
  onUpload: (files: File[], tags: string[]) => Promise<void>

  lightboxOpen: boolean
  setLightboxOpen: (v: boolean) => void
  lightboxAsset: any
  lightboxImages: any[]
  lightboxIndex: number
  onNavigateImage: (dir: 'prev' | 'next') => void

  fileDetailsOpen: boolean
  setFileDetailsOpen: (v: boolean) => void
  selectedFile: any

  renameOpen: boolean
  setRenameOpen: (v: boolean) => void
  fileToRename: any
  onRename: (asset: any, newName: string) => Promise<void>

  deleteOpen: boolean
  setDeleteOpen: (v: boolean) => void
  fileToDelete: any
  onConfirmDelete: () => Promise<void>
  formatFileSize: (n: number) => string
}

export function MediaDialogs(props: MediaDialogsProps) {
  const {
    uploadOpen, setUploadOpen, isUploading, onUpload,
    lightboxOpen, setLightboxOpen, lightboxAsset, lightboxImages, lightboxIndex, onNavigateImage,
    fileDetailsOpen, setFileDetailsOpen, selectedFile,
    renameOpen, setRenameOpen, fileToRename, onRename,
    deleteOpen, setDeleteOpen, fileToDelete, onConfirmDelete, formatFileSize,
  } = props

  return (
    <>
      <UploadDialog isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={onUpload} isUploading={isUploading} />

      <ImagePreviewModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        asset={lightboxAsset}
        allAssets={lightboxImages}
        currentIndex={lightboxIndex}
        onNavigate={onNavigateImage}
      />

      <FileDetailsModal isOpen={fileDetailsOpen} onClose={() => setFileDetailsOpen(false)} asset={selectedFile} />

      <RenameFileModal isOpen={renameOpen} onClose={() => setRenameOpen(false)} asset={fileToRename} onSubmit={onRename} />

      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        asset={fileToDelete}
        formatFileSize={formatFileSize}
      />
    </>
  )
}

