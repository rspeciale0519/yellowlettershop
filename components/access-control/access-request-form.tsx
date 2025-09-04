'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ResourceType, PermissionLevel } from '@/lib/access-control/time-based-permissions'

interface AccessRequestFormProps {
  onSubmit: (data: AccessRequestFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export interface AccessRequestFormData {
  resource_type: ResourceType
  resource_id: string
  resource_name?: string
  requested_permission: PermissionLevel
  justification: string
  requested_duration_days?: number
}

const PERMISSION_LEVELS: { value: PermissionLevel; label: string; description: string }[] = [
  { value: 'view_only', label: 'View Only', description: 'Can view but not edit' },
  { value: 'edit', label: 'Edit', description: 'Can view and edit' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' }
]

const DURATION_OPTIONS = [
  { value: 7, label: '1 Week' },
  { value: 30, label: '1 Month' },
  { value: 90, label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: null, label: 'Permanent' }
]

export default function AccessRequestForm({ onSubmit, onCancel, isSubmitting = false }: AccessRequestFormProps) {
  const [formData, setFormData] = useState<AccessRequestFormData>({
    resource_type: 'mailing_list',
    resource_id: '',
    resource_name: '',
    requested_permission: 'view_only',
    justification: '',
    requested_duration_days: 30
  })
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.resource_id || !formData.justification.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  const updateField = (field: keyof AccessRequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Request Access
        </CardTitle>
        <CardDescription>
          Submit a request to access a team resource. Your request will be reviewed by a team manager.
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
              <Label htmlFor="resource_type">Resource Type *</Label>
              <Select 
                value={formData.resource_type} 
                onValueChange={(value) => updateField('resource_type', value as ResourceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailing_list">Mailing List</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="contact_card">Contact Card</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_permission">Permission Level *</Label>
              <Select 
                value={formData.requested_permission} 
                onValueChange={(value) => updateField('requested_permission', value as PermissionLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_id">Resource ID *</Label>
            <Input
              id="resource_id"
              value={formData.resource_id}
              onChange={(e) => updateField('resource_id', e.target.value)}
              placeholder="Enter the resource ID you need access to"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_name">Resource Name (Optional)</Label>
            <Input
              id="resource_name"
              value={formData.resource_name || ''}
              onChange={(e) => updateField('resource_name', e.target.value)}
              placeholder="Friendly name to help identify the resource"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Access Duration</Label>
            <Select 
              value={formData.requested_duration_days?.toString() || 'null'} 
              onValueChange={(value) => updateField('requested_duration_days', value === 'null' ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
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
            {formData.requested_duration_days && (
              <Badge variant="secondary" className="text-xs">
                Access will expire automatically after {formData.requested_duration_days} days
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Business Justification *</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => updateField('justification', e.target.value)}
              placeholder="Explain why you need access to this resource and how it will be used..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your business need. This will help managers review your request faster.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
