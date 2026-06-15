'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Shield, Settings, Activity, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react'

import AccessRequestForm, { type AccessRequestFormData } from '@/components/access-control/access-request-form'
import AccessRequestList from '@/components/access-control/access-request-list'
import PermissionTemplateForm, { type PermissionTemplateFormData } from '@/components/access-control/permission-template-form'
import PermissionTemplateList from '@/components/access-control/permission-template-list'
import AuditTrailViewer from '@/components/access-control/audit-trail-viewer'
import type { ActivityFilters } from '@/lib/audit/enhanced-audit-logger-client'
import { MembersTab, type TeamMemberRow, type InvitationRow } from '@/components/team/members-tab'
import { TeamEmptyState } from '@/components/team/empty-state'

import { clientTimeBasedPermissions } from '@/lib/access-control/time-based-permissions-client'
import { clientAuditLogger } from '@/lib/audit/enhanced-audit-logger-client'
import type { AccessRequest, PermissionTemplate } from '@/lib/access-control/time-based-permissions-client'
import type { AuditLogEntry } from '@/lib/audit/enhanced-audit-logger-client'
import { createClient } from '@/utils/supabase/client'

interface TeamInfo {
  teamId: string | null
  role: 'owner' | 'admin' | 'member' | null
  members: TeamMemberRow[]
  invitations: InvitationRow[]
  maxSeats: number | null
}

interface ActivityRow {
  id: string
  action_type: string
  resource_type: string | null
  created_at: string
}

export default function TeamManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [team, setTeam] = useState<TeamInfo>({ teamId: null, role: null, members: [], invitations: [], maxSeats: null })
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([])
  const [teamName, setTeamName] = useState('')

  // Access Requests State
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Permission Templates State
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([])
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const pendingCount = accessRequests.filter((r) => r.status === 'pending').length
  const activeTemplateCount = permissionTemplates.filter((t) => t.is_active).length
  const seatsUsed = team.members.length + team.invitations.length

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/teams/members')
      const data = await res.json()
      setTeam({
        teamId: data.role ? data.members?.[0]?.team_id ?? null : null,
        role: data.role,
        members: data.members ?? [],
        invitations: data.invitations ?? [],
        maxSeats: data.maxSeats ?? null,
      })
    } catch {
      setError('Failed to load team')
    }
  }, [])

  const loadAccessRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const requests = await clientTimeBasedPermissions.getUserAccessRequests()
      setAccessRequests(requests)
    } catch (e) {
      console.error('Error loading access requests:', e)
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  const loadPermissionTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    try {
      const response = await fetch('/api/access-control/templates')
      if (!response.ok) throw new Error('Failed to load templates')
      const { templates } = await response.json()
      setPermissionTemplates(templates)
    } catch (e) {
      console.error('Error loading permission templates:', e)
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const loadRecentActivity = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('team_activity_log')
        .select('id, action_type, resource_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentActivity((data as ActivityRow[]) ?? [])
    } catch {
      setRecentActivity([])
    }
  }, [])

  useEffect(() => {
    loadTeam()
    loadAccessRequests()
    loadPermissionTemplates()
    loadRecentActivity()
  }, [loadTeam, loadAccessRequests, loadPermissionTemplates, loadRecentActivity])

  const handleCreateAccessRequest = async (data: AccessRequestFormData) => {
    await clientTimeBasedPermissions.createAccessRequest(data)
    setSuccess('Access request submitted successfully')
    setShowCreateRequest(false)
    await loadAccessRequests()
  }

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    const response = await fetch(`/api/access-control/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', review_notes: notes }),
    })
    if (!response.ok) return setError('Failed to approve access request')
    setSuccess('Access request approved')
    await loadAccessRequests()
  }

  const handleDenyRequest = async (requestId: string, notes?: string) => {
    const response = await fetch(`/api/access-control/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deny', review_notes: notes }),
    })
    if (!response.ok) return setError('Failed to deny access request')
    setSuccess('Access request denied')
    await loadAccessRequests()
  }

  const handleWithdrawRequest = async (requestId: string) => {
    await clientTimeBasedPermissions.withdrawAccessRequest(requestId)
    setSuccess('Access request withdrawn')
    await loadAccessRequests()
  }

  const handleCreateTemplate = async (data: PermissionTemplateFormData) => {
    const response = await fetch('/api/access-control/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create template')
    setSuccess('Permission template created')
    setShowCreateTemplate(false)
    await loadPermissionTemplates()
  }

  const handleEditTemplate = (template: PermissionTemplate) => {
    setEditingTemplate(template)
    setShowCreateTemplate(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const response = await fetch(`/api/access-control/templates/${templateId}`, { method: 'DELETE' })
    if (!response.ok) return setError('Failed to delete template')
    setSuccess('Permission template deleted')
    await loadPermissionTemplates()
  }

  const handleApplyTemplate = async (templateId: string, targetUserId: string) => {
    const response = await fetch(`/api/access-control/templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: targetUserId }),
    })
    if (!response.ok) return setError('Failed to apply template')
    setSuccess('Permission template applied')
  }

  const handleLoadActivities = async (filters: ActivityFilters): Promise<AuditLogEntry[]> => {
    if (!team.teamId) return []
    try {
      return await clientAuditLogger.getTeamActivityLogs(team.teamId, filters)
    } catch {
      return []
    }
  }

  const saveTeamName = async () => {
    const res = await fetch('/api/teams/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName }),
    })
    if (!res.ok) return setError('Failed to save team name')
    setSuccess('Team name saved')
  }

  const deleteTeam = async () => {
    if (!confirm('Delete this team? Members are detached and grants revoked. Resources stay with their creators.')) return
    const res = await fetch('/api/teams/delete', { method: 'POST' })
    if (!res.ok) return setError('Failed to delete team')
    setSuccess('Team deleted')
    await loadTeam()
  }

  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  const teamMembersForTemplates = team.members.map((m) => ({ id: m.user_id, email: m.user_id.slice(0, 8), name: m.role }))
  const isSolo = !team.role

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Invite teammates and manage scoped access</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearAlerts} className="ml-auto">×</Button>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearAlerts} className="ml-auto">×</Button>
        </Alert>
      )}

      {isSolo ? (
        <TeamEmptyState onInvite={() => setActiveTab('members')} />
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="audit">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTemplateCount}</div>
                <p className="text-xs text-muted-foreground">Ready to use</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team.members.length}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seats Used</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{seatsUsed}{team.maxSeats ? ` / ${team.maxSeats}` : ''}</div>
                <p className="text-xs text-muted-foreground">Members + pending invites</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common team management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => { setShowCreateRequest(true); setActiveTab('requests') }} className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  Request Access
                </Button>
                <Button onClick={() => { setShowCreateTemplate(true); setActiveTab('templates') }} variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Create Template
                </Button>
                <Button onClick={() => setActiveTab('audit')} variant="outline" className="h-20 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  View Activity Log
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Team Activity</CardTitle>
              <CardDescription>Latest permission changes and team actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {a.action_type}
                        {a.resource_type ? ` · ${a.resource_type}` : ''}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {new Date(a.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <MembersTab
            members={team.members}
            invitations={team.invitations}
            role={team.role ?? 'member'}
            maxSeats={team.maxSeats}
            onChanged={loadTeam}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {showCreateRequest ? (
            <AccessRequestForm onSubmit={handleCreateAccessRequest} onCancel={() => setShowCreateRequest(false)} />
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
                isManager={team.role !== 'member'}
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
              initialData={
                editingTemplate
                  ? {
                      name: editingTemplate.name,
                      description: editingTemplate.description || '',
                      team_id: editingTemplate.team_id,
                      template_permissions: editingTemplate.template_permissions,
                    }
                  : undefined
              }
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
                teamMembers={teamMembersForTemplates}
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
            {team.teamId && <AuditTrailViewer teamId={team.teamId} onLoadActivities={handleLoadActivities} />}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Team name, seats, and ownership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Team name</label>
                <div className="flex gap-2">
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="My Team" />
                  <Button onClick={saveTeamName} disabled={team.role !== 'owner' || !teamName}>Save</Button>
                </div>
                {team.role !== 'owner' && (
                  <p className="text-xs text-muted-foreground">Only the team owner can rename the team.</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Seat usage</p>
                <p className="text-sm text-muted-foreground">
                  {seatsUsed}{team.maxSeats ? ` of ${team.maxSeats}` : ''} seats used. Contact support to raise your seat limit.
                </p>
              </div>
              {team.role === 'owner' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Danger zone</p>
                  <Button variant="destructive" onClick={deleteTeam}>Delete team</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
