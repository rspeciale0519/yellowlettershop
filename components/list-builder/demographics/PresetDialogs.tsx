"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Save } from "lucide-react"

interface PresetDialogsProps {
  showPresetDialog: boolean
  setShowPresetDialog: (show: boolean) => void
  presetName: string
  setPresetName: (name: string) => void
  deletePresetId: string | null
  setDeletePresetId: (id: string | null) => void
  onSavePreset: () => void
  onDeletePreset: (id: string) => void
}

export function PresetDialogs({
  showPresetDialog,
  setShowPresetDialog,
  presetName,
  setPresetName,
  deletePresetId,
  setDeletePresetId,
  onSavePreset,
  onDeletePreset
}: PresetDialogsProps) {
  return (
    <>
      {/* Save Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Demographic Preset</DialogTitle>
            <DialogDescription>
              Enter a name for this preset to save your current demographic criteria for future use.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSavePreset()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onSavePreset} disabled={!presetName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Preset Confirmation */}
      <AlertDialog open={!!deletePresetId} onOpenChange={() => setDeletePresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the preset "{deletePresetId}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePresetId && onDeletePreset(deletePresetId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}