"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { deduplicateList } from '@/lib/supabase/mailing-lists-extended'
import { Loader2, AlertCircle, CheckCircle, Users, UserX } from "lucide-react"

interface DeduplicationModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
  recordCount: number
  onDeduplicationComplete?: (removedCount: number) => void
}

export function DeduplicationModal({ 
  isOpen, 
  onClose, 
  listId, 
  listName,
  recordCount,
  onDeduplicationComplete 
}: DeduplicationModalProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [deduplicationField, setDeduplicationField] = useState<'address' | 'name' | 'phone' | 'email'>('address')
  const [matchingStrategy, setMatchingStrategy] = useState<'exact' | 'fuzzy'>('exact')
  const [keepStrategy, setKeepStrategy] = useState<'first' | 'last' | 'most_complete'>('most_complete')
  const [createBackup, setCreateBackup] = useState(true)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'removing' | 'complete' | 'error'>('idle')
  const [results, setResults] = useState<{
    duplicatesFound: number
    recordsRemoved: number
    recordsRetained: number
    processingTime: number
  } | null>(null)

  const handleDeduplicate = async () => {
    setIsProcessing(true)
    setStatus('scanning')
    setProgress(20)
    const startTime = Date.now()

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      // Perform deduplication
      setStatus('removing')
      const result = await deduplicateList(
        listId,
        deduplicationField,
        {
          matchingStrategy,
          keepStrategy,
          createBackup
        }
      )

      clearInterval(progressInterval)
      setProgress(100)
      setStatus('complete')

      const processingTime = (Date.now() - startTime) / 1000

      setResults({
        duplicatesFound: result.duplicatesFound,
        recordsRemoved: result.removed,
        recordsRetained: recordCount - result.removed,
        processingTime
      })

      toast({
        title: "Deduplication complete",
        description: `Removed ${result.removed} duplicate records.`
      })

      if (onDeduplicationComplete) {
        onDeduplicationComplete(result.removed)
      }

      // Auto-close after success if no duplicates
      if (result.removed === 0) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }

    } catch (error) {
      console.error('Deduplication error:', error)
      setStatus('error')
      toast({
        title: "Deduplication failed",
        description: error instanceof Error ? error.message : "An error occurred during deduplication.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setProgress(0)
    setResults(null)
  }

  const getFieldDescription = (field: string) => {
    switch (field) {
      case 'address':
        return 'Match records with identical street addresses'
      case 'name':
        return 'Match records with identical first and last names'
      case 'phone':
        return 'Match records with identical phone numbers'
      case 'email':
        return 'Match records with identical email addresses'
      default:
        return ''
    }
  }

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'first':
        return 'Keep the first occurrence, remove later duplicates'
      case 'last':
        return 'Keep the most recent occurrence, remove earlier duplicates'
      case 'most_complete':
        return 'Keep the record with the most complete information'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deduplicate {listName}</DialogTitle>
          <DialogDescription>
            Remove duplicate records from your mailing list based on matching criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'idle' && (
            <>
              {/* Deduplication Field */}
              <div>
                <Label>Match Duplicates By</Label>
                <RadioGroup 
                  value={deduplicationField} 
                  onValueChange={(value: any) => setDeduplicationField(value)}
                  className="mt-2"
                >
                  {(['address', 'name', 'phone', 'email'] as const).map(field => (
                    <div key={field} className="flex items-start space-x-2 mb-2">
                      <RadioGroupItem value={field} id={field} className="mt-0.5" />
                      <div className="flex-1">
                        <label htmlFor={field} className="text-sm font-medium cursor-pointer capitalize">
                          {field}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {getFieldDescription(field)}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Matching Strategy */}
              <div>
                <Label>Matching Strategy</Label>
                <RadioGroup 
                  value={matchingStrategy} 
                  onValueChange={(value: any) => setMatchingStrategy(value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exact" id="exact" />
                    <label htmlFor="exact" className="text-sm cursor-pointer">
                      Exact Match - Only identical values
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fuzzy" id="fuzzy" />
                    <label htmlFor="fuzzy" className="text-sm cursor-pointer">
                      Fuzzy Match - Similar values (typos, variations)
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Keep Strategy */}
              <div>
                <Label>Which Record to Keep</Label>
                <RadioGroup 
                  value={keepStrategy} 
                  onValueChange={(value: any) => setKeepStrategy(value)}
                  className="mt-2"
                >
                  {(['first', 'last', 'most_complete'] as const).map(strategy => (
                    <div key={strategy} className="flex items-start space-x-2 mb-2">
                      <RadioGroupItem value={strategy} id={`keep-${strategy}`} className="mt-0.5" />
                      <div className="flex-1">
                        <label htmlFor={`keep-${strategy}`} className="text-sm font-medium cursor-pointer">
                          {strategy === 'first' && 'First Record'}
                          {strategy === 'last' && 'Last Record'}
                          {strategy === 'most_complete' && 'Most Complete Record'}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {getStrategyDescription(strategy)}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-backup"
                  checked={createBackup}
                  onCheckedChange={(checked) => setCreateBackup(checked as boolean)}
                />
                <label htmlFor="create-backup" className="text-sm cursor-pointer">
                  Create backup before deduplication
                </label>
              </div>

              {/* Current Stats */}
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Current records: {recordCount.toLocaleString()}
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Processing Status */}
          {(status === 'scanning' || status === 'removing') && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm font-medium">
                  {status === 'scanning' ? 'Scanning for duplicates...' : 'Removing duplicate records...'}
                </p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {status === 'complete' && results && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="font-medium text-green-900">Deduplication Complete!</p>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Duplicates Found</p>
                  <p className="text-2xl font-bold">{results.duplicatesFound}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Records Removed</p>
                  <p className="text-2xl font-bold text-red-600">{results.recordsRemoved}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Records Retained</p>
                  <p className="text-2xl font-bold text-green-600">{results.recordsRetained}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                  <p className="text-2xl font-bold">{results.processingTime.toFixed(1)}s</p>
                </div>
              </div>

              {createBackup && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A backup of your list has been created in the version history.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <Alert className="border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deduplication failed. Please try again or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleDeduplicate}>
                <UserX className="mr-2 h-4 w-4" />
                Start Deduplication
              </Button>
            </>
          )}
          
          {(status === 'scanning' || status === 'removing') && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}

          {(status === 'complete' || status === 'error') && (
            <>
              {status === 'complete' && results && results.recordsRemoved > 0 && (
                <Button variant="outline" onClick={handleReset}>
                  Run Again
                </Button>
              )}
              <Button onClick={onClose}>
                {status === 'complete' ? 'Done' : 'Close'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
