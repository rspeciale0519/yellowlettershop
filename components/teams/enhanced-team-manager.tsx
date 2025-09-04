"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Shield, 
  Clock, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit3,
  Trash2,
  Plus,
  History
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AccessRequest, PermissionTemplate } from '@/lib/access-control/time-based-permissions'

interface EnhancedTeamManagerProps {
  teamId: string
  userId: string
  isManager: boolean
}

export function EnhancedTeamManager({ teamId, userId, isManager }: EnhancedTeamManagerProps) {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [templates, setTemplates] = useState<PermissionTemplate[]>([])
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [teamId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadAccessRequests(),
        loadPermissionTemplates(),
        loadActivityLog()
      ])
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccessRequests = async () => {
    try {
      const response = await fetch(`/api/access-control/requests?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setAccessRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading access requests:', error)
    }
  }

  const loadPermissionTemplates = async () => {
    try {
      const response = await fetch(`/api/access-control/templates?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading permission templates:', error)
    }
  }

  const loadActivityLog = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityLog(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activity log:', error)
    }
  }

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/access-control/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleDenyRequest = async (requestId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/access-control/requests/${requestId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error denying request:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'edit':
        return 'bg-blue-100 text-blue-800'
      case 'view_only':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const openReviewModal = (request: AccessRequest) => {
    setSelectedRequest(request)
    setReviewNotes('')
    setShowReviewModal(true)
  }

  const handleReviewSubmit = async (action: 'approve' | 'deny') => {
    if (!selectedRequest) return

    if (action === 'approve') {
      await handleApproveRequest(selectedRequest.id, reviewNotes)
    } else {
      await handleDenyRequest(selectedRequest.id, reviewNotes)
    }

    setShowReviewModal(false)
    setSelectedRequest(null)
    setReviewNotes('')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Enhanced Team Management
          </h2>
          <p className="text-muted-foreground">
            Manage access requests, permissions, and team activity
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Team Settings</TabsTrigger>
        </TabsList>

        {/* Access Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Pending Access Requests
              </CardTitle>
              <CardDescription>
                Review and manage team member access requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending access requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accessRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{request.requester_id}</div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <Badge className={getPermissionColor(request.requested_permission)}>
                            {request.requested_permission}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label className="text-sm font-medium">Resource</Label>
                          <p className="text-sm text-muted-foreground">
                            {request.resource_type}: {request.resource_id}
                          </p>
                        </div>
                        {request.requested_duration_days && (
                          <div>
                            <Label className="text-sm font-medium">Duration</Label>
                            <p className="text-sm text-muted-foreground">
                              {request.requested_duration_days} days
                            </p>
                          </div>
                        )}
                      </div>

                      {request.justification && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium">Justification</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.justification}
                          </p>
                        </div>
                      )}

                      {request.status === 'pending' && isManager && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openReviewModal(request)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Permission Templates
                  </CardTitle>
                  <CardDescription>
                    Create and manage reusable permission templates
                  </CardDescription>
                </div>
                {isManager && (
                  <Button onClick={() => setShowTemplateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No permission templates yet</p>
                  {isManager && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Template
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Used {template.usage_count} times</span>
                          {template.last_used_at && (
                            <span>
                              Last used {formatDistanceToNow(new Date(template.last_used_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="ml-auto flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-3 h-3" />
                            </Button>
                            {isManager && (
                              <>
                                <Button size="sm" variant="ghost">
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Team Activity Log
              </CardTitle>
              <CardDescription>
                Audit trail of team permission changes and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.action_type}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div>
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Team Settings
              </CardTitle>
              <CardDescription>
                Configure team-wide permissions and access policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Team settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Request Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Access Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div>
                  Request for <strong>{selectedRequest.requested_permission}</strong> access to{' '}
                  <strong>{selectedRequest.resource_type}</strong>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="review-notes">Review Notes (Optional)</Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleReviewSubmit('deny')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button onClick={() => handleReviewSubmit('approve')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}