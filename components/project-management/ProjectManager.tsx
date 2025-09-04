"use client"

import React, { useState, useEffect } from 'react'
import { Project, UserProject, ProjectRole } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Settings, Users, BarChart, Folder, Calendar, Archive } from 'lucide-react'

interface ProjectManagerProps {
  userId: string
  teamId?: string
}

export function ProjectManager({ userId, teamId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<UserProject | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadProjects()
  }, [userId])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role?: ProjectRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'contributor':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return <BarChart className="w-5 h-5" />
      case 'template_set':
        return <Folder className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true
    if (filter === 'owned') return project.user_role === 'owner'
    if (filter === 'active') return project.status === 'active'
    if (filter === 'archived') return project.status === 'archived'
    return project.type === filter
  })

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
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            Organize your campaigns and work into projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="owned">Owned by Me</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="campaign">Campaigns</SelectItem>
              <SelectItem value="template_set">Template Sets</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {filter === 'all' ? 'No projects yet.' : `No ${filter} projects found.`}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getProjectIcon(project.type)}
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className={getRoleColor(project.user_role)}>
                      {project.user_role}
                    </Badge>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge variant="outline">
                      {project.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{project.members?.length || 1}</span>
                  </div>
                </div>
                {project.member_since && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Member since {new Date(project.member_since).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadProjects}
        userId={userId}
        teamId={teamId}
      />

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={loadProjects}
        />
      )}
    </div>
  )
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  teamId?: string
}

function CreateProjectModal({ isOpen, onClose, onSuccess, userId, teamId }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    isPublic: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          teamId,
          isPublic: formData.isPublic
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setFormData({ name: '', description: '', type: 'general', isPublic: false })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create project')
      }
    } catch (err) {
      setError('Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Projects help organize your campaigns and work
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description (optional)"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="type">Project Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Project</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="template_set">Template Set</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ProjectDetailsModalProps {
  project: UserProject
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

function ProjectDetailsModal({ project, isOpen, onClose, onUpdate }: ProjectDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {project.name}
          </DialogTitle>
          <DialogDescription>
            {project.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {project.type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant="outline" className={`ml-2 ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Your Role</Label>
                <Badge variant="secondary" className={`ml-2 ${getRoleColor(project.user_role)}`}>
                  {project.user_role}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="text-center py-4 text-muted-foreground">
              Member management coming soon...
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-4 text-muted-foreground">
              Project settings coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleColor(role?: ProjectRole) {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-blue-100 text-blue-800'
    case 'contributor':
      return 'bg-green-100 text-green-800'
    case 'viewer':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}