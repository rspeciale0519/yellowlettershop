'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Users, 
  Calendar, 
  DollarSign,
  History,
  Tag as TagIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MailingList } from '@/types/supabase'
import { formatDistanceToNow, format } from 'date-fns'

interface MailingListCardProps {
  mailingList: MailingList
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onViewHistory?: (id: string) => void
  onCreateCampaign?: (id: string) => void
}

export function MailingListCard({
  mailingList,
  onEdit,
  onDelete,
  onDuplicate,
  onViewHistory,
  onCreateCampaign,
}: MailingListCardProps) {
  const formattedCreatedAt = formatDistanceToNow(new Date(mailingList.created_at), { addSuffix: true })
  const lastUsed = mailingList.last_used_at 
    ? formatDistanceToNow(new Date(mailingList.last_used_at), { addSuffix: true })
    : 'Never used'

  const sourceTypeLabels = {
    upload: 'File Upload',
    list_builder: 'List Builder',
    manual: 'Manual Entry',
    imported: 'Imported'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold truncate">{mailingList.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(mailingList.id)}>
                Edit Details
              </DropdownMenuItem>
            )}
            {onViewHistory && (
              <DropdownMenuItem onClick={() => onViewHistory(mailingList.id)}>
                <History className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
            )}
            {onCreateCampaign && (
              <DropdownMenuItem onClick={() => onCreateCampaign(mailingList.id)}>
                Create Campaign
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(mailingList.id)}>
                Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(mailingList.id)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        {mailingList.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {mailingList.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-medium">{mailingList.record_count.toLocaleString()}</span>
            <span className="text-muted-foreground">records</span>
          </div>
          {mailingList.estimated_cost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">${mailingList.estimated_cost.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {mailingList.source_type && (
            <Badge variant="secondary" className="text-xs">
              {sourceTypeLabels[mailingList.source_type]}
            </Badge>
          )}
          
          {mailingList.tags && mailingList.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon className="h-3 w-3" />
              <div className="flex flex-wrap gap-1">
                {mailingList.tags.slice(0, 2).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {mailingList.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{mailingList.tags.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formattedCreatedAt}</span>
          </div>
          <div className="flex justify-between">
            <span>Last used:</span>
            <span>{lastUsed}</span>
          </div>
          {mailingList.updated_at && (
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{format(new Date(mailingList.updated_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {onCreateCampaign && (
          <Button 
            className="w-full mt-3" 
            onClick={() => onCreateCampaign(mailingList.id)}
          >
            Create Campaign
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
