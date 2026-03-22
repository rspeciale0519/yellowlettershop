"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { MappingValidation as ValidationResult } from './types'

interface MappingValidationProps {
  validation: ValidationResult
}

export function MappingValidation({ validation }: MappingValidationProps) {
  const { isValid, errors, warnings, requiredFieldsMapped } = validation

  if (errors.length === 0 && warnings.length === 0 && isValid) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Mapping Complete</span>
            <Badge variant="default" className="bg-green-600">
              Ready
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            All required fields are mapped and your data is ready for processing.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {errors.length} error{errors.length > 1 ? 's' : ''} must be fixed:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}



      {/* Next Steps */}
      {!isValid && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700 space-y-2">
              {!requiredFieldsMapped && (
                <p>• Map all required fields (marked with red badges) to continue</p>
              )}
              {errors.some(e => e.includes('Duplicate')) && (
                <p>• Remove duplicate column mappings</p>
              )}
              {warnings.length > 0 && (
                <p>• Consider mapping recommended fields for better results</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}