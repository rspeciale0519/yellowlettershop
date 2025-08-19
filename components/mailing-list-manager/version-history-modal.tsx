"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { getListVersionHistory } from '@/lib/supabase/mailing-lists'
import { restoreListVersion } from '@/lib/supabase/mailing-lists-extended'
import { format } from 'date-fns'
import { Clock, RotateCcw, User, FileText, AlertCircle, Loader2 } from "lucide-react"

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
  currentVersion: number
  onVersionRestore?: () => void
}

interface ListVersion {
  id: string
  version_number: number
  name: string
  description?: string
  record_count: number
  criteria?: any
  created_at: string
  created_by?: {
    id: string
    email: string
    name?: string
  }
  change_description?: string
}

export function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  listId, 
  listName,
  currentVersion,
  onVersionRestore 
}: VersionHistoryModalProps) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<ListVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<ListVersion | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadVersionHistory()
    }
  }, [isOpen, listId])

  const loadVersionHistory = async () => {
    setIsLoading(true)
    try {
      const history = await getListVersionHistory(listId)
      setVersions(history)
    } catch (error) {
      console.error('Failed to load version history:', error)
      toast({
        title: "Failed to load history",
        description: "Could not retrieve version history for this list.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedVersion) return

    setIsRestoring(true)
    try {
      await restoreListVersion(listId, selectedVersion.version_number)
      
      toast({
        title: "Version restored",
        description: `List has been restored to version ${selectedVersion.version_number}.`
      })

      if (onVersionRestore) {
        onVersionRestore()
      }

      onClose()
    } catch (error) {
      console.error('Failed to restore version:', error)
      toast({
        title: "Restore failed",
        description: "Could not restore the selected version.",
        variant: "destructive"
      })
    } finally {
      setIsRestoring(false)
      setShowRestoreConfirm(false)
    }
  }

  const getChangeTypeIcon = (description?: string) => {
    if (!description) return <FileText className="h-4 w-4" />
    
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('import')) return <FileText className="h-4 w-4 text-green-500" />
    if (lowerDesc.includes('delete') || lowerDesc.includes('remove')) return <FileText className="h-4 w-4 text-red-500" />
    if (lowerDesc.includes('update') || lowerDesc.includes('edit')) return <FileText className="h-4 w-4 text-blue-500" />
    return <FileText className="h-4 w-4" />
  }

  const getChangeTypeBadge = (description?: string) => {
    if (!description) return null
    
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('import')) return <Badge variant="secondary" className="bg-green-100">Import</Badge>
    if (lowerDesc.includes('export')) return <Badge variant="secondary" className="bg-blue-100">Export</Badge>
    if (lowerDesc.includes('delete') || lowerDesc.includes('remove')) return <Badge variant="secondary" className="bg-red-100">Delete</Badge>
    if (lowerDesc.includes('update') || lowerDesc.includes('edit')) return <Badge variant="secondary" className="bg-blue-100">Update</Badge>
    if (lowerDesc.includes('deduplicate')) return <Badge variant="secondary" className="bg-yellow-100">Deduplicate</Badge>
    if (lowerDesc.includes('criteria')) return <Badge variant="secondary" className="bg-purple-100">Criteria Change</Badge>
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Version History - {listName}</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this mailing list.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No version history available for this list.
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {versions.map((version) => {
                  const isCurrent = version.version_number === currentVersion
                  const isSelected = selectedVersion?.id === version.id

                  return (
                    <div
                      key={version.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        isCurrent 
                          ? 'border-primary bg-primary/5' 
                          : isSelected 
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => !isCurrent && setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getChangeTypeIcon(version.change_description)}
                            <span className="font-medium">
                              Version {version.version_number}
                            </span>
                            {isCurrent && (
                              <Badge variant="default" className="ml-2">Current</Badge>
                            )}
                            {getChangeTypeBadge(version.change_description)}
                          </div>

                          {version.change_description && (
                            <p className="text-sm text-muted-foreground">
                              {version.change_description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                            </div>
                            {version.created_by && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {version.created_by.name || version.created_by.email}
                              </div>
                            )}
                            <div>
                              {version.record_count.toLocaleString()} records
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "ghost"}
                            className="ml-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVersion(version)
                              setShowRestoreConfirm(true)
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {showRestoreConfirm && selectedVersion && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Restore to Version {selectedVersion.version_number}?
                    </p>
                    <p className="text-sm">
                      This will replace the current list configuration with the selected version. 
                      The current version will be saved in history.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleRestore}
                        disabled={isRestoring}
                      >
                        {isRestoring && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Confirm Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRestoreConfirm(false)}
                        disabled={isRestoring}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
