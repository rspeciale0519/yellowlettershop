'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  RotateCcw, 
  Clock, 
  Users,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { getVersionHistory, restoreFromSnapshot, createSnapshot } from '@/lib/supabase/version-history'
import type { MailingListVersion } from '@/types/supabase'
import { formatDistanceToNow, format } from 'date-fns'

interface VersionHistoryPanelProps {
  mailingListId: string
  mailingListName: string
  onVersionRestored?: () => void
}

export function VersionHistoryPanel({
  mailingListId,
  mailingListName,
  onVersionRestored,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<MailingListVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadVersionHistory()
  }, [mailingListId])

  const loadVersionHistory = async () => {
    try {
      const data = await getVersionHistory(mailingListId)
      setVersions(data)
    } catch (error) {
      console.error('Error loading version history:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSnapshot = async () => {
    setCreating(true)
    try {
      await createSnapshot(mailingListId, 'manual', {
        created_by_user: true,
        description: 'Manual snapshot created by user'
      })
      toast.success('Snapshot created successfully')
      await loadVersionHistory()
    } catch (error) {
      console.error('Error creating snapshot:', error)
      toast.error('Failed to create snapshot')
    } finally {
      setCreating(false)
    }
  }

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore to version ${versionNumber}? This will replace all current records with the snapshot data.`)) {
      return
    }

    setRestoring(versionId)
    try {
      await restoreFromSnapshot(mailingListId, versionId)
      toast.success(`Successfully restored to version ${versionNumber}`)
      await loadVersionHistory()
      onVersionRestored?.()
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Failed to restore version')
    } finally {
      setRestoring(null)
    }
  }

  const getSnapshotTypeLabel = (type: string) => {
    const labels = {
      manual: 'Manual',
      auto_save: 'Auto Save',
      before_dedup: 'Before Dedup',
      before_merge: 'Before Merge',
      before_delete: 'Before Delete'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getSnapshotTypeColor = (type: string) => {
    const colors = {
      manual: 'bg-blue-100 text-blue-800',
      auto_save: 'bg-green-100 text-green-800',
      before_dedup: 'bg-yellow-100 text-yellow-800',
      before_merge: 'bg-purple-100 text-purple-800',
      before_delete: 'bg-red-100 text-red-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <Button
            onClick={handleCreateSnapshot}
            disabled={creating}
            size="sm"
          >
            {creating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Create Snapshot
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Version history for "{mailingListName}"
        </p>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No version history available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first snapshot to start tracking changes
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        v{version.version_number}
                      </Badge>
                      <Badge 
                        className={getSnapshotTypeColor(version.snapshot_type)}
                      >
                        {getSnapshotTypeLabel(version.snapshot_type)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreVersion(version.id, version.version_number)}
                      disabled={restoring !== null}
                    >
                      {restoring === version.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Restore
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{version.record_count.toLocaleString()} records</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Created on {format(new Date(version.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>

                  {version.metadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {version.metadata.description && (
                        <p>{version.metadata.description}</p>
                      )}
                      {version.metadata.action && (
                        <p>Action: {version.metadata.action}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
