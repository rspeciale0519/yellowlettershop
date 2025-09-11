"use client"

import { useState, useCallback } from "react"
import { ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { UploadDialog } from "@/components/media/upload-dialog"
import { useAssets } from "@/hooks/use-assets"
import { toast } from "sonner"

const MediaUpload = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { uploadMultipleAssets, isUploading } = useAssets()

  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  const handleUpload = useCallback(
    async (files: File[], tags: string[]) => {
      try {
        const uploaded = await uploadMultipleAssets(files, {
          tags,
        })

        if (uploaded.length > 0) {
          toast.success(
            uploaded.length === 1
              ? "File uploaded successfully"
              : `${uploaded.length} files uploaded successfully`
          )
          handleClose()
          router.push("/dashboard/media")
        } else {
          toast.error("No files were uploaded")
        }
      } catch (error: any) {
        console.error("Upload error:", error)
        toast.error(error?.message || "Upload failed. Please try again.")
      }
    },
    [uploadMultipleAssets, router, handleClose]
  )

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
      >
        <ImageIcon className="mr-3 h-4 w-4 text-primary" />
        Upload Media
      </button>

      <UploadDialog
        isOpen={open}
        onClose={handleClose}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </>
  )
}

export default MediaUpload
