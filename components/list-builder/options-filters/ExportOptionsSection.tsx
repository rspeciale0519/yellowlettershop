"use client"

import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OptionsCriteria } from "@/types/list-builder"

interface ExportOptionsSectionProps {
  criteria: OptionsCriteria
  onUpdate: (field: keyof OptionsCriteria["exportOptions"], value: string | boolean | number) => void
}

export function ExportOptionsSection({ criteria, onUpdate }: ExportOptionsSectionProps) {
  return (
    <CardContent className="pt-0">
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure how your list will be exported and delivered.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <Select
              value={criteria.exportOptions.format}
              onValueChange={(value) => onUpdate("format", value)}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="txt">Text File (Tab Delimited)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-headers" className="text-sm font-medium">
              Include Column Headers
            </Label>
            <Switch
              id="include-headers"
              checked={criteria.exportOptions.includeHeaders}
              onCheckedChange={(checked) => onUpdate("includeHeaders", checked)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Sort Records By</Label>
            <Select
              value={criteria.exportOptions.sortBy}
              onValueChange={(value) => onUpdate("sortBy", value)}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="address">Address</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="zip">ZIP Code</SelectItem>
                <SelectItem value="value">Property Value</SelectItem>
                <SelectItem value="date">Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              id="max-records-label"
              className="text-sm font-medium"
            >
              Maximum Records Per File
            </Label>
            <Select
              value={criteria.exportOptions.maxRecordsPerFile.toString()}
              onValueChange={(value) => {
                const n = Number.parseInt(value, 10);
                if (!Number.isNaN(n)) onUpdate("maxRecordsPerFile", n);
              }}
            >
              <SelectTrigger
                className="w-full mt-2"
                aria-labelledby="max-records-label"
                aria-describedby="max-records-help"
              >
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1,000 records</SelectItem>
                <SelectItem value="5000">5,000 records</SelectItem>
                <SelectItem value="10000">10,000 records</SelectItem>
                <SelectItem value="25000">25,000 records</SelectItem>
                <SelectItem value="50000">50,000 records</SelectItem>
                <SelectItem value="100100">100,000 records</SelectItem>
              </SelectContent>
            </Select>
            <p
              id="max-records-help"
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              Large lists will be split into multiple files for easier handling.
            </p>
          </div>          </div>
        </div>
      </div>
    </CardContent>
  )
}