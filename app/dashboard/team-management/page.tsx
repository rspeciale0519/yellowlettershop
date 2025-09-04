'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Shield, Settings, Activity, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react'

import AccessRequestForm, { type AccessRequestFormData } from '@/components/access-control/access-request-form'
import AccessRequestList from '@/components/access-control/access-request-list'
import PermissionTemplateForm, { type PermissionTemplateFormData } from '@/components/access-control/permission-template-form'
import PermissionTemplateList from '@/components/access-control/permission-template-list'
import AuditTrailViewer from '@/components/access-control/audit-trail-viewer'
import type { ActivityFilters } from '@/lib/audit/enhanced-audit-logger-client'

import { clientTimeBasedPermissions } from '@/lib/access-control/time-based-permissions-client'
import { clientAuditLogger } from '@/lib/audit/enhanced-audit-logger-client'
import type { AccessRequest, PermissionTemplate } from '@/lib/access-control/time-based-permissions-client'
import type { AuditLogEntry } from '@/lib/audit/enhanced-audit-logger-client'

interface TeamStats {
  pending_requests: number
  active_templates: number
  recent_activities: number
  expired_permissions: number
}

export default function TeamManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [teamStats, setTeamStats] = useState<TeamStats>({
    pending_requests: 0,
    active_templates: 0,
    recent_activities: 0,
    expired_permissions: 0
  })

  // Access Requests State
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Permission Templates State
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([])
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Team Members (mock data - would come from API)
  const [teamMembers] = useState([
    { id: '1', email: 'john@example.com', name: 'John Doe' },
    { id: '2', email: 'jane@example.com', name: 'Jane Smith' },
    { id: '3', email: 'bob@example.com', name: 'Bob Johnson' }
  ])

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadAccessRequests(),
        loadPermissionTemplates(),
        loadTeamStats()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load team management data')
    }
  }

  const loadTeamStats = async () => {
    // Mock stats - would come from API
    setTeamStats({
      pending_requests: 3,
      active_templates: 5,
      recent_activities: 12,
      expired_permissions: 2
    })
  }

  const loadAccessRequests = async () => {
    setRequestsLoading(true)
    try {
      const requests = await clientTimeBasedPermissions.getUserAccessRequests()
      setAccessRequests(requests)
      setTeamStats(prev => ({ ...prev, pending_requests: requests.filter(r => r.status === 'pending').length }))
    } catch (error) {
      console.error('Error loading access requests:', error)
    } finally {
      setRequestsLoading(false)
    }
  }

  const loadPermissionTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const response = await fetch('/api/access-control/templates')
      if (!response.ok) throw new Error('Failed to load templates')
      const { templates } = await response.json()
      setPermissionTemplates(templates)
      setTeamStats(prev => ({ ...prev, active_templates: templates.filter((t: any) => t.is_active).length }))
    } catch (error) {
      console.error('Error loading permission templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleCreateAccessRequest = async (data: AccessRequestFormData) => {
    try {
      await clientTimeBasedPermissions.createAccessRequest(data)
      setSuccess('Access request submitted successfully')
      setShowCreateRequest(false)
      await loadAccessRequests()
    } catch (error) {
      throw new Error('Failed to create access request')
    }
  }

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/access-control/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', review_notes: notes })
      })
      if (!response.ok) throw new Error('Failed to approve request')
      
      setSuccess('Access request approved successfully')
      await loadAccessRequests()
    } catch (error) {
      setError('Failed to approve access request')
    }
  }

  const handleDenyRequest = async (requestId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/access-control/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny', review_notes: notes })
      })
      if (!response.ok) throw new Error('Failed to deny request')
      
      setSuccess('Access request denied')
      await loadAccessRequests()
    } catch (error) {
      setError('Failed to deny access request')
    }
  }

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      await clientTimeBasedPermissions.withdrawAccessRequest(requestId)
      setSuccess('Access request withdrawn')
      await loadAccessRequests()
    } catch (error) {
      setError('Failed to withdraw access request')
    }
  }

  const handleCreateTemplate = async (data: PermissionTemplateFormData) => {
    try {
      const response = await fetch('/api/access-control/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create template')
      
      setSuccess('Permission template created successfully')
      setShowCreateTemplate(false)
      await loadPermissionTemplates()
    } catch (error) {
      throw new Error('Failed to create permission template')
    }
  }

  const handleEditTemplate = (template: PermissionTemplate) => {
    setEditingTemplate(template)
    setShowCreateTemplate(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/access-control/templates/${templateId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete template')
      
      setSuccess('Permission template deleted')
      await loadPermissionTemplates()
    } catch (error) {
      setError('Failed to delete permission template')
    }
  }

  const handleApplyTemplate = async (templateId: string, targetUserId: string) => {
    try {
      const response = await fetch(`/api/access-control/templates/${templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId })
      })
      if (!response.ok) throw new Error('Failed to apply template')
      
      setSuccess('Permission template applied successfully')
    } catch (error) {
      setError('Failed to apply permission template')
    }
  }

  const handleLoadActivities = async (filters: ActivityFilters): Promise<AuditLogEntry[]> => {
    try {
      const teamId = 'current-team-id' // Would get from context
      return await clientAuditLogger.getTeamActivityLogs(teamId, filters)
    } catch (error) {
      console.error('Error loading activities:', error)
      return []
    }
  }

  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage access control, permissions, and team activities
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearAlerts} className="ml-auto">
            ×
          </Button>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearAlerts} className="ml-auto">
            ×
          </Button>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="audit">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Team Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.pending_requests}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.active_templates}</div>
                <p className="text-xs text-muted-foreground">
                  Ready to use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.recent_activities}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Permissions</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{teamStats.expired_permissions}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common team management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => setShowCreateRequest(true)} className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  Request Access
                </Button>
                <Button 
                  onClick={() => setShowCreateTemplate(true)} 
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  <Settings className="h-6 w-6 mb-2" />
                  Create Template
                </Button>
                <Button 
                  onClick={() => setActiveTab('audit')} 
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  <Activity className="h-6 w-6 mb-2" />
                  View Activity Log
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Team Activity</CardTitle>
              <CardDescription>Latest permission changes and team actions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simplified activity list for overview */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Access granted to Marketing List for jane@example.com</span>
                  <Badge variant="secondary" className="ml-auto">2h ago</Badge>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Sales Team template applied to john@example.com</span>
                  <Badge variant="secondary" className="ml-auto">5h ago</Badge>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">New access request from bob@example.com</span>
                  <Badge variant="secondary" className="ml-auto">1d ago</Badge>
                </div>
              </div>
              <Button variant="link" onClick={() => setActiveTab('audit')} className="mt-4 p-0">
                View full activity log →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {showCreateRequest ? (
            <AccessRequestForm
              onSubmit={handleCreateAccessRequest}
              onCancel={() => setShowCreateRequest(false)}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Access Requests</h2>
                  <p className="text-muted-foreground">Manage team member access requests</p>
                </div>
                <Button onClick={() => setShowCreateRequest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>

              <AccessRequestList
                requests={accessRequests}
                onApprove={handleApproveRequest}
                onDeny={handleDenyRequest}
                onWithdraw={handleWithdrawRequest}
                isManager={true}
                isLoading={requestsLoading}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {showCreateTemplate ? (
            <PermissionTemplateForm
              onSubmit={handleCreateTemplate}
              onCancel={() => {
                setShowCreateTemplate(false)
                setEditingTemplate(null)
              }}
              initialData={editingTemplate ? {
                name: editingTemplate.name,
                description: editingTemplate.description || '',
                team_id: editingTemplate.team_id,
                template_permissions: editingTemplate.template_permissions
              } : undefined}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Permission Templates</h2>
                  <p className="text-muted-foreground">Create and manage reusable permission sets</p>
                </div>
                <Button onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>

              <PermissionTemplateList
                templates={permissionTemplates}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onApplyTemplate={handleApplyTemplate}
                onCreate={() => setShowCreateTemplate(true)}
                teamMembers={teamMembers}
                isLoading={templatesLoading}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="audit">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Activity Log</h2>
              <p className="text-muted-foreground">Comprehensive audit trail of team activities</p>
            </div>

            <AuditTrailViewer
              teamId="current-team-id"
              onLoadActivities={handleLoadActivities}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure team access control settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Team settings configuration will be implemented in future phases.
                    Current Phase 3 focuses on access control and audit features.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
