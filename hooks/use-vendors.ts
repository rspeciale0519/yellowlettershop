import { useState, useCallback } from 'react'
import { Vendor } from '@/types/supabase'
import { CreateVendorRequest, UpdateVendorRequest, VendorPerformanceData, CommunicationRecord } from '@/lib/vendors/vendor-service'

export function useVendors() {
  const [isLoading, setIsLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [performance, setPerformance] = useState<VendorPerformanceData | null>(null)
  const [communications, setCommunications] = useState<CommunicationRecord[]>([])

  const getVendors = useCallback(async (filters?: {
    type?: string
    status?: string
    services?: string[]
  }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.services) params.append('services', filters.services.join(','))

      const response = await fetch(`/api/vendors?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get vendors')
      }

      const vendorList = await response.json()
      setVendors(vendorList)
      return vendorList
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createVendor = useCallback(async (request: CreateVendorRequest): Promise<Vendor> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create vendor')
      }

      const vendor = await response.json()
      setVendors(prev => [vendor, ...prev])
      return vendor
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateVendor = useCallback(async (vendorId: string, request: UpdateVendorRequest): Promise<Vendor> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId, ...request }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update vendor')
      }

      const vendor = await response.json()
      setVendors(prev => prev.map(v => v.id === vendorId ? vendor : v))
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor(vendor)
      }
      return vendor
    } finally {
      setIsLoading(false)
    }
  }, [selectedVendor])

  const deleteVendor = useCallback(async (vendorId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete vendor')
      }

      setVendors(prev => prev.filter(v => v.id !== vendorId))
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedVendor])

  const getVendorPerformance = useCallback(async (vendorId: string): Promise<VendorPerformanceData> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/performance`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get vendor performance')
      }

      const performanceData = await response.json()
      setPerformance(performanceData)
      return performanceData
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recordPerformanceMetric = useCallback(async (
    vendorId: string,
    metricType: string,
    value: number,
    orderId?: string,
    notes?: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metricType, value, orderId, notes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record performance metric')
      }

      // Refresh performance data
      await getVendorPerformance(vendorId)
    } catch (error) {
      console.error('Error recording performance metric:', error)
      throw error
    }
  }, [getVendorPerformance])

  const getCommunicationHistory = useCallback(async (vendorId: string): Promise<CommunicationRecord[]> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/communications`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get communication history')
      }

      const commHistory = await response.json()
      setCommunications(commHistory)
      return commHistory
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recordCommunication = useCallback(async (
    vendorId: string,
    type: 'email' | 'phone' | 'meeting' | 'note',
    subject: string,
    content: string,
    direction: 'inbound' | 'outbound' = 'outbound'
  ): Promise<CommunicationRecord> => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/communications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, subject, content, direction }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record communication')
      }

      const communication = await response.json()
      setCommunications(prev => [communication, ...prev])
      return communication
    } catch (error) {
      console.error('Error recording communication:', error)
      throw error
    }
  }, [])

  return {
    vendors,
    selectedVendor,
    performance,
    communications,
    isLoading,
    setSelectedVendor,
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorPerformance,
    recordPerformanceMetric,
    getCommunicationHistory,
    recordCommunication
  }
}
