'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Settings, Users, Eye, Edit, Trash2, Plus, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PermissionTemplate, TemplatePermission } from '@/lib/access-control/time-based-permissions'

interface PermissionTemplateListProps {
  templates: PermissionTemplate[]
  onEdit: (template: PermissionTemplate) => void
  onDelete: (templateId: string) => Promise<void>
  onApplyTemplate: (templateId: string, targetUserId: string) => Promise<void>
  onCreate: () => void
  teamMembers?: Array<{ id: string; email: string; name?: string }>
  isLoading?: boolean
}

export default function PermissionTemplateList({
  templates,
  onEdit,
  onDelete,
  onApplyTemplate,
  onCreate,
  teamMembers = [],
  isLoading = false
}: PermissionTemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null)
  const [applyTemplateId, setApplyTemplateId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApplyTemplate = async () => {
    if (!applyTemplateId || !selectedUserId) return

    setIsSubmitting(true)
    try {
      await onApplyTemplate(applyTemplateId, selectedUserId)
      setApplyTemplateId(null)
      setSelectedUserId('')
    } catch (error) {
      console.error('Error applying template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this permission template?')) {
      await onDelete(templateId)
    }
  }

  const formatPermissionSummary = (permissions: TemplatePermission[]): string => {
    const resourceCounts = permissions.reduce((acc, perm) => {
      acc[perm.resource_type] = (acc[perm.resource_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(resourceCounts)
      .map(([type, count]) => `${count} ${type.replace('_', ' ')}${count > 1 ? 's' : ''}`)
      .join(', ')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading templates...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permission Templates
              </CardTitle>
              <CardDescription>
                Reusable permission sets for quick team member access management
              </CardDescription>
            </div>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Permission Templates</h3>
              <p className="text-gray-500 mb-4">
                Create reusable permission templates to streamline team access management.
              </p>
              <Button onClick={onCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 truncate max-w-64">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {template.template_permissions.length} permission{template.template_permissions.length !== 1 ? 's' : ''}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatPermissionSummary(template.template_permissions)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{template.usage_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {template.last_used_at 
                          ? formatDistanceToNow(new Date(template.last_used_at), { addSuffix: true })
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setApplyTemplateId(template.id)}
                          className="text-green-600 hover:text-green-700"
                          disabled={teamMembers.length === 0}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Details Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description || 'Permission template details'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Usage Count</div>
                    <div className="text-2xl font-bold">{selectedTemplate.usage_count}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Permissions</div>
                    <div className="text-2xl font-bold">{selectedTemplate.template_permissions.length}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Status</div>
                    <Badge variant={selectedTemplate.is_active ? 'default' : 'secondary'} className="mt-1">
                      {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Included Permissions</h4>
                  <div className="space-y-2">
                    {selectedTemplate.template_permissions.map((permission, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{permission.resource_type.replace('_', ' ')}</Badge>
                            <span className="font-mono text-sm">{permission.resource_id}</span>
                            <Badge variant="secondary">{permission.permission_level.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {permission.duration_days ? `${permission.duration_days} days` : 'Permanent'}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Created {formatDistanceToNow(new Date(selectedTemplate.created_at), { addSuffix: true })}
                  {selectedTemplate.last_used_at && (
                    <> • Last used {formatDistanceToNow(new Date(selectedTemplate.last_used_at), { addSuffix: true })}</>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setSelectedTemplate(null)
                  onEdit(selectedTemplate)
                }}>
                  Edit Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={!!applyTemplateId} onOpenChange={() => {
        setApplyTemplateId(null)
        setSelectedUserId('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Permission Template</DialogTitle>
            <DialogDescription>
              Select a team member to apply this permission template to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No team members available
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Member</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span>{member.name || member.email}</span>
                          {member.name && (
                            <span className="text-xs text-gray-500">{member.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setApplyTemplateId(null)
                setSelectedUserId('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyTemplate}
              disabled={!selectedUserId || isSubmitting}
            >
              {isSubmitting ? 'Applying...' : 'Apply Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
