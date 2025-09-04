'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Trash2, Settings, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ResourceType, PermissionLevel, TemplatePermission } from '@/lib/access-control/time-based-permissions'

interface PermissionTemplateFormProps {
  onSubmit: (data: PermissionTemplateFormData) => Promise<void>
  onCancel: () => void
  initialData?: PermissionTemplateFormData
  isSubmitting?: boolean
}

export interface PermissionTemplateFormData {
  name: string
  description: string
  team_id?: string
  template_permissions: TemplatePermission[]
}

const PERMISSION_LEVELS: { value: PermissionLevel; label: string; description: string }[] = [
  { value: 'view_only', label: 'View Only', description: 'Can view but not edit' },
  { value: 'edit', label: 'Edit', description: 'Can view and edit' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' }
]

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'mailing_list', label: 'Mailing List' },
  { value: 'template', label: 'Template' },
  { value: 'design', label: 'Design' },
  { value: 'contact_card', label: 'Contact Card' },
  { value: 'asset', label: 'Asset' }
]

const DURATION_OPTIONS = [
  { value: 7, label: '1 Week' },
  { value: 30, label: '1 Month' },
  { value: 90, label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: null, label: 'Permanent' }
]

export default function PermissionTemplateForm({ 
  onSubmit, 
  onCancel, 
  initialData,
  isSubmitting = false 
}: PermissionTemplateFormProps) {
  const [formData, setFormData] = useState<PermissionTemplateFormData>(
    initialData || {
      name: '',
      description: '',
      template_permissions: []
    }
  )
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Template name is required')
      return
    }

    if (formData.template_permissions.length === 0) {
      setError('At least one permission must be added')
      return
    }

    // Validate all permissions have required fields
    const invalidPermission = formData.template_permissions.find(
      p => !p.resource_type || !p.resource_id || !p.permission_level
    )
    
    if (invalidPermission) {
      setError('All permissions must have resource type, resource ID, and permission level')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const updateField = (field: keyof PermissionTemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addPermission = () => {
    const newPermission: TemplatePermission = {
      resource_type: 'mailing_list',
      resource_id: '',
      permission_level: 'view_only',
      duration_days: 30
    }
    
    setFormData(prev => ({
      ...prev,
      template_permissions: [...prev.template_permissions, newPermission]
    }))
  }

  const updatePermission = (index: number, field: keyof TemplatePermission, value: any) => {
    const updatedPermissions = [...formData.template_permissions]
    updatedPermissions[index] = { ...updatedPermissions[index], [field]: value }
    setFormData(prev => ({ ...prev, template_permissions: updatedPermissions }))
  }

  const removePermission = (index: number) => {
    setFormData(prev => ({
      ...prev,
      template_permissions: prev.template_permissions.filter((_, i) => i !== index)
    }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {initialData ? 'Edit Permission Template' : 'Create Permission Template'}
        </CardTitle>
        <CardDescription>
          Create reusable permission templates to quickly grant consistent access to team members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Sales Team Access, Manager Permissions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this template's purpose"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Define the resources and permission levels included in this template
                </p>
              </div>
              <Button type="button" onClick={addPermission} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </div>

            {formData.template_permissions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Permissions Added</h3>
                  <p className="text-gray-500 mb-4">
                    Add permissions to define what access this template grants.
                  </p>
                  <Button type="button" onClick={addPermission} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Permission
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {formData.template_permissions.map((permission, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="secondary">Permission {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePermission(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Resource Type *</Label>
                          <Select 
                            value={permission.resource_type} 
                            onValueChange={(value) => updatePermission(index, 'resource_type', value as ResourceType)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Resource ID *</Label>
                          <Input
                            value={permission.resource_id}
                            onChange={(e) => updatePermission(index, 'resource_id', e.target.value)}
                            placeholder="Resource ID or pattern"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Permission Level *</Label>
                          <Select 
                            value={permission.permission_level} 
                            onValueChange={(value) => updatePermission(index, 'permission_level', value as PermissionLevel)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Select 
                            value={permission.duration_days?.toString() || 'null'} 
                            onValueChange={(value) => updatePermission(index, 'duration_days', value === 'null' ? null : parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DURATION_OPTIONS.map(option => (
                                <SelectItem key={option.value || 'null'} value={option.value?.toString() || 'null'}>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
