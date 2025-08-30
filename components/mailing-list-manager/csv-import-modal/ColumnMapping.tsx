"use client"

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ColumnMappingProps {
  skipDuplicates: boolean
  onSkipDuplicatesChange: (checked: boolean) => void
  deduplicationField: 'address' | 'name' | 'phone' | 'email'
  onDeduplicationFieldChange: (field: 'address' | 'name' | 'phone' | 'email') => void
  validateData: boolean
  onValidateDataChange: (checked: boolean) => void
  isImporting: boolean
}

export function ColumnMapping({
  skipDuplicates,
  onSkipDuplicatesChange,
  deduplicationField,
  onDeduplicationFieldChange,
  validateData,
  onValidateDataChange,
  isImporting,
}: ColumnMappingProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="skip-duplicates"
          checked={skipDuplicates}
          onCheckedChange={(checked) => onSkipDuplicatesChange(checked as boolean)}
          disabled={isImporting}
        />
        <label htmlFor="skip-duplicates" className="text-sm">
          Skip duplicate records
        </label>
      </div>

      {skipDuplicates && (
        <div className="ml-6">
          <Label htmlFor="dedup-field" className="text-xs">
            Deduplicate by
          </Label>
          <Select
            value={deduplicationField}
            onValueChange={(value: any) => onDeduplicationFieldChange(value)}
            disabled={isImporting}
          >
            <SelectTrigger id="dedup-field" className="w-[200px] h-8 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="address">Address</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="validate-data"
          checked={validateData}
          onCheckedChange={(checked) => onValidateDataChange(checked as boolean)}
          disabled={isImporting}
        />
        <label htmlFor="validate-data" className="text-sm">
          Validate data during import
        </label>
      </div>
    </div>
  )
}