"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Clock, Undo2, Redo2, Trash2 } from 'lucide-react'
import { getUserChangeHistory, clearUndoHistory } from '@/lib/version-history/change-tracker'
import { undoLastChange, redoLastChange } from '@/lib/version-history/undo-redo'
import type { ChangeHistory, ResourceType } from '@/types/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ChangeHistoryPanelProps {
  resourceType?: ResourceType
  resourceId?: string
  onClose?: () => void
}

export function ChangeHistoryPanel({ resourceType, resourceId, onClose }: ChangeHistoryPanelProps) {
  const [changes, setChanges] = useState<ChangeHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  const loadChanges = async () => {
    try {
      setIsLoading(true)
      const history = await getUserChangeHistory(100, resourceType, resourceId)
      setChanges(history)
    } catch (error) {
      console.error('Error loading change history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChanges()
  }, [resourceType, resourceId])

  const handleUndo = async (changeId: string) => {
    try {
      const success = await undoLastChange()
      if (success) {
        await loadChanges()
      }
    } catch (error) {
      console.error('Error undoing change:', error)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all change history? This cannot be undone.')) {
      return
    }

    try {
      setIsClearing(true)
      await clearUndoHistory()
      await loadChanges()
    } catch (error) {
      console.error('Error clearing history:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'import': return 'bg-purple-100 text-purple-800'
      case 'export': return 'bg-orange-100 text-orange-800'
      case 'deduplicate': return 'bg-yellow-100 text-yellow-800'
      case 'merge': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatChangeDescription = (change: ChangeHistory) => {
    const resourceName = change.resource_type.replace('_', ' ')
    let description = `${change.change_type} ${resourceName}`
    
    if (change.field_name) {
      description += ` (${change.field_name})`
    }
    
    if (change.description) {
      description += `: ${change.description}`
    }
    
    return description
  }

  const formatChangeDetails = (change: ChangeHistory) => {
    if (!change.field_name || !change.old_value || !change.new_value) return null
    
    try {
      const oldVal = JSON.parse(change.old_value as unknown as string)
      const newVal = JSON.parse(change.new_value as unknown as string)
      
      return (
        <div className="text-xs text-muted-foreground mt-1">
          <span className="line-through">{String(oldVal)}</span>
          {' → '}
          <span>{String(newVal)}</span>
        </div>
      )
    } catch {
      return null
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Change History</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={isClearing || changes.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading change history...</div>
          </div>
        ) : changes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No changes recorded yet</div>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {changes.map((change, index) => (
                <div key={change.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getChangeTypeColor(change.change_type)}>
                        {change.change_type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatChangeDescription(change)}
                      </span>
                    </div>
                    
                    {formatChangeDetails(change)}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                      </span>
                      
                      {change.undone_at && (
                        <Badge variant="secondary" className="text-xs">
                          Undone
                        </Badge>
                      )}
                      
                      {change.batch_id && (
                        <Badge variant="outline" className="text-xs">
                          Batch
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {index === 0 && !change.undone_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUndo(change.id)}
                      className="flex-shrink-0"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
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
