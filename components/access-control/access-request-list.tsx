'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, CheckCircle, Clock, Eye, MessageSquare, UserCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AccessRequest } from '@/lib/access-control/time-based-permissions'

interface AccessRequestListProps {
  requests: AccessRequest[]
  onApprove: (id: string, notes?: string) => Promise<void>
  onDeny: (id: string, notes?: string) => Promise<void>
  onWithdraw?: (id: string) => Promise<void>
  isManager?: boolean
  isLoading?: boolean
}

export default function AccessRequestList({ 
  requests, 
  onApprove, 
  onDeny, 
  onWithdraw,
  isManager = false,
  isLoading = false 
}: AccessRequestListProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'deny' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'denied':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Denied</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-gray-500"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>
      case 'withdrawn':
        return <Badge variant="outline" className="text-gray-500">Withdrawn</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPermissionBadge = (level: string) => {
    const colors = {
      'view_only': 'bg-blue-100 text-blue-800',
      'edit': 'bg-green-100 text-green-800',
      'admin': 'bg-purple-100 text-purple-800',
      'owner': 'bg-red-100 text-red-800'
    }
    return (
      <Badge variant="secondary" className={colors[level as keyof typeof colors] || ''}>
        {level.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const handleReview = async () => {
    if (!selectedRequest || !reviewAction) return

    setIsSubmitting(true)
    try {
      if (reviewAction === 'approve') {
        await onApprove(selectedRequest.id, reviewNotes)
      } else {
        await onDeny(selectedRequest.id, reviewNotes)
      }
      setSelectedRequest(null)
      setReviewAction(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error reviewing request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (request: AccessRequest) => {
    if (!onWithdraw) return
    
    setIsSubmitting(true)
    try {
      await onWithdraw(request.id)
    } catch (error) {
      console.error('Error withdrawing request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Access Requests</h3>
            <p>There are no access requests at this time.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>
            {isManager ? 'Review and manage team access requests' : 'Track your access requests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.resource_type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500 truncate max-w-32">
                        {request.resource_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPermissionBadge(request.requested_permission)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {/* Will show requester email when user data is loaded */}
                      Requester
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.requested_duration_days 
                        ? `${request.requested_duration_days} days`
                        : 'Permanent'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {isManager && request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request)
                              setReviewAction('approve')
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request)
                              setReviewAction('deny')
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {!isManager && request.status === 'pending' && onWithdraw && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWithdraw(request)}
                          className="text-gray-600 hover:text-gray-700"
                          disabled={isSubmitting}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null)
        setReviewAction(null)
        setReviewNotes('')
      }}>
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Access Request Details
                  {reviewAction && (
                    <span className="ml-2 text-sm font-normal">
                      - {reviewAction === 'approve' ? 'Approve' : 'Deny'} Request
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Request submitted {formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Resource Type</Label>
                    <div className="mt-1 text-sm">{selectedRequest.resource_type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Permission Level</Label>
                    <div className="mt-1">{getPermissionBadge(selectedRequest.requested_permission)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Resource ID</Label>
                  <div className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">
                    {selectedRequest.resource_id}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="mt-1 text-sm">
                    {selectedRequest.requested_duration_days 
                      ? `${selectedRequest.requested_duration_days} days`
                      : 'Permanent access'
                    }
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Business Justification</Label>
                  <div className="mt-1 text-sm bg-gray-50 p-3 rounded">
                    {selectedRequest.justification}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                {selectedRequest.reviewed_at && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Review Details</Label>
                    <div className="mt-1 text-sm text-gray-600">
                      Reviewed {formatDistanceToNow(new Date(selectedRequest.reviewed_at), { addSuffix: true })}
                    </div>
                    {selectedRequest.review_notes && (
                      <div className="mt-2 text-sm bg-gray-50 p-3 rounded">
                        {selectedRequest.review_notes}
                      </div>
                    )}
                  </div>
                )}

                {reviewAction && (
                  <div className="border-t pt-4">
                    <Label htmlFor="review-notes" className="text-sm font-medium">
                      Review Notes {reviewAction === 'deny' && <span className="text-red-500">*</span>}
                    </Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={
                        reviewAction === 'approve' 
                          ? 'Optional: Add notes about the approval...'
                          : 'Please explain why this request is being denied...'
                      }
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null)
                    setReviewAction(null)
                    setReviewNotes('')
                  }}
                >
                  {reviewAction ? 'Cancel' : 'Close'}
                </Button>
                
                {reviewAction && (
                  <Button
                    onClick={handleReview}
                    disabled={isSubmitting || (reviewAction === 'deny' && !reviewNotes.trim())}
                    variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                  >
                    {isSubmitting ? 'Processing...' : 
                     reviewAction === 'approve' ? 'Approve Request' : 'Deny Request'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
