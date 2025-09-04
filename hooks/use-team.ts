import { useState, useCallback } from 'react'
import { Team, TeamMember, TeamInvitation } from '@/types/supabase'
import { CreateTeamRequest, InviteTeamMemberRequest } from '@/lib/team/team-service'

export function useTeam() {
  const [isLoading, setIsLoading] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])

  const createTeam = useCallback(async (request: CreateTeamRequest): Promise<Team> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create team')
      }

      const newTeam = await response.json()
      setTeam(newTeam)
      return newTeam
    } finally {
      setIsLoading(false)
    }
  }, [])

  const inviteMember = useCallback(async (
    teamId: string,
    request: InviteTeamMemberRequest
  ): Promise<TeamInvitation> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, ...request }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite team member')
      }

      const invitation = await response.json()
      setInvitations(prev => [invitation, ...prev])
      return invitation
    } finally {
      setIsLoading(false)
    }
  }, [])

  const acceptInvitation = useCallback(async (invitationId: string): Promise<TeamMember> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept invitation')
      }

      const member = await response.json()
      setMembers(prev => [...prev, member])
      return member
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getTeamMembers = useCallback(async (teamId: string): Promise<TeamMember[]> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/team/members?teamId=${teamId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get team members')
      }

      const teamMembers = await response.json()
      setMembers(teamMembers)
      return teamMembers
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateMemberPermissions = useCallback(async (
    teamId: string,
    memberId: string,
    permissions: string[],
    role?: 'member' | 'admin'
  ): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, memberId, permissions, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member permissions')
      }

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, permissions, ...(role && { role }) }
          : member
      ))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeMember = useCallback(async (teamId: string, memberId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, memberId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove team member')
      }

      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const shareResource = useCallback(async (
    resourceType: string,
    resourceId: string,
    teamId: string,
    permissions: string[] = ['read']
  ): Promise<void> => {
    try {
      const response = await fetch('/api/team/share-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceType, resourceId, teamId, permissions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to share resource')
      }
    } catch (error) {
      console.error('Error sharing resource:', error)
      throw error
    }
  }, [])

  return {
    team,
    members,
    invitations,
    isLoading,
    createTeam,
    inviteMember,
    acceptInvitation,
    getTeamMembers,
    updateMemberPermissions,
    removeMember,
    shareResource
  }
}
