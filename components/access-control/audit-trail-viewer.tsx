'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Activity, Filter, Search, Calendar, User, Shield } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { AuditLogEntry, AuditActionType } from '@/lib/audit/enhanced-audit-logger-client'
import { AuditTrailFormatter } from '@/lib/audit/enhanced-audit-logger-client'

interface AuditTrailViewerProps {
  teamId: string
  onLoadActivities: (filters: ActivityFilters) => Promise<AuditLogEntry[]>
  isLoading?: boolean
}

export interface ActivityFilters {
  action_types?: AuditActionType[]
  actor_id?: string
  target_user_id?: string
  resource_type?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

const ACTION_TYPE_CATEGORIES = {
  'Permission Management': [
    'permission_granted',
    'permission_revoked', 
    'permission_auto_revoked'
  ],
  'Access Requests': [
    'access_request_created',
    'access_request_approved',
    'access_request_denied',
    'access_request_withdrawn'
  ],
  'Templates': [
    'permission_template_created',
    'permission_template_applied',
    'permission_template_updated'
  ],
  'Team Management': [
    'user_invited',
    'user_removed',
    'team_settings_updated'
  ],
  'Resource Management': [
    'resource_created',
    'resource_updated',
    'resource_deleted',
    'resource_shared'
  ],
  'Data Operations': [
    'bulk_operation_performed',
    'data_exported',
    'data_imported'
  ],
  'Security': [
    'login_activity',
    'suspicious_activity'
  ]
}

export default function AuditTrailViewer({ 
  teamId, 
  onLoadActivities,
  isLoading = false 
}: AuditTrailViewerProps) {
  const [activities, setActivities] = useState<AuditLogEntry[]>([])
  const [filters, setFilters] = useState<ActivityFilters>({ limit: 50, offset: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [teamId])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const data = await onLoadActivities(filters)
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }))
  }

  const applyFilters = () => {
    loadActivities()
  }

  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 })
    loadActivities()
  }

  const getActivityIcon = (actionType: string) => {
    if (actionType.includes('permission')) return <Shield className="h-4 w-4" />
    if (actionType.includes('request')) return <User className="h-4 w-4" />
    if (actionType.includes('suspicious')) return <AlertTriangle className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getActivityColor = (actionType: string) => {
    if (actionType.includes('denied') || actionType.includes('revoked') || actionType.includes('suspicious')) {
      return 'text-red-600'
    }
    if (actionType.includes('approved') || actionType.includes('granted')) {
      return 'text-green-600'
    }
    if (actionType.includes('pending') || actionType.includes('created')) {
      return 'text-yellow-600'
    }
    return 'text-blue-600'
  }

  const getRiskLevelBadge = (metadata: any) => {
    if (!metadata?.risk_level) return null
    
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge variant="secondary" className={colors[metadata.risk_level as keyof typeof colors]}>
        {metadata.risk_level.toUpperCase()} RISK
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Activity Log
            </CardTitle>
            <CardDescription>
              Comprehensive audit trail of all team activities and permission changes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={loadActivities} size="sm" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="border-t bg-gray-50">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Action Category</Label>
              <Select onValueChange={(value) => {
                const category = value as keyof typeof ACTION_TYPE_CATEGORIES
                updateFilter('action_types', ACTION_TYPE_CATEGORIES[category] || [])
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {Object.keys(ACTION_TYPE_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date From</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => updateFilter('date_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date To</Label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => updateFilter('date_to', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Limit</Label>
              <Select 
                value={filters.limit?.toString() || '50'} 
                onValueChange={(value) => updateFilter('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                  <SelectItem value="200">200 items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
      
      <CardContent>
        {loading || isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
            <p className="text-gray-500">No team activities match the current filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={getActivityColor(activity.action_type)}>
                        {getActivityIcon(activity.action_type)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {AuditTrailFormatter.formatActionType(activity.action_type)}
                        </div>
                        {getRiskLevelBadge(activity.metadata)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {activity.actor?.email || 'System'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {activity.target_user?.email || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {activity.resource_type && (
                        <Badge variant="outline">
                          {AuditTrailFormatter.formatResourceType(activity.resource_type)}
                        </Badge>
                      )}
                      {activity.permission_level && (
                        <Badge variant="secondary" className="ml-1">
                          {AuditTrailFormatter.formatPermissionLevel(activity.permission_level)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-48">
                      {activity.duration_days && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {activity.duration_days} days
                        </div>
                      )}
                      {activity.metadata?.reason && (
                        <div className="text-xs text-gray-600 truncate">
                          {activity.metadata.reason}
                        </div>
                      )}
                      {activity.ip_address && (
                        <div className="text-xs text-gray-400 font-mono">
                          {activity.ip_address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activities.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {activities.length} activities
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updateFilter('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))
                  loadActivities()
                }}
                disabled={(filters.offset || 0) === 0}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  updateFilter('offset', (filters.offset || 0) + (filters.limit || 50))
                  loadActivities()
                }}
                disabled={activities.length < (filters.limit || 50)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
