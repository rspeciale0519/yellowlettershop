"use client"

import { useState } from "react"
import { toast } from "sonner"
import { TagFormModal, TagData } from "./tag-form-modal"
import { TagDeleteModal } from "./tag-delete-modal"
import { EnhancedTagSelector } from "./enhanced-tag-selector"

interface TagManagerProps {
  selectedTags: string[]
  onSelectedTagsChange: (tags: string[]) => void
  disabled?: boolean
  className?: string
  onTagsUpdated?: () => void
}

export function TagManager({
  selectedTags,
  onSelectedTagsChange,
  disabled = false,
  className = "",
  onTagsUpdated
}: TagManagerProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagData | null>(null)
  const [tagToDelete, setTagToDelete] = useState<TagData | null>(null)

  const handleCreateTag = () => {
    setEditingTag(null)
    setCreateModalOpen(true)
  }

  const handleEditTag = (tag: TagData) => {
    setEditingTag(tag)
    setEditModalOpen(true)
  }

  const handleDeleteTag = (tag: TagData) => {
    setTagToDelete(tag)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!tagToDelete) return

    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete tag')

      toast.success('Tag deleted successfully')
      setDeleteModalOpen(false)
      setTagToDelete(null)
      
      // Remove deleted tag from selected tags if it was selected
      if (selectedTags.includes(tagToDelete.name)) {
        onSelectedTagsChange(selectedTags.filter(tag => tag !== tagToDelete.name))
      }
      
      onTagsUpdated?.()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    }
  }

  const handleModalSuccess = () => {
    onTagsUpdated?.()
  }

  return (
    <>
      <EnhancedTagSelector
        selectedTags={selectedTags}
        onSelectedTagsChange={onSelectedTagsChange}
        onCreateTag={handleCreateTag}
        onEditTag={handleEditTag}
        disabled={disabled}
        className={className}
      />

      <TagFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <TagFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingTag={editingTag}
        onSuccess={handleModalSuccess}
      />

      <TagDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        tagToDelete={tagToDelete}
        onConfirm={confirmDelete}
      />
    </>
  )
}