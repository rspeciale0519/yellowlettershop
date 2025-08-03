"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Type, FileText, Edit, Wand2, Database, Copy } from "lucide-react"
import { FormatDataModal } from "./format-data-modal"
import { FillDataModal } from "./fill-data-modal"
import { ReplaceDataModal } from "./replace-data-modal"
import { ParseDataModal } from "./parse-data-modal"
import { DuplicateManagementModal } from "./duplicate-management-modal"
import { useToast } from "@/components/ui/use-toast"
import type { ColumnDef } from "./customizable-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataOperationsDropdownProps {
  columns: ColumnDef[]
  records?: any[]
}

export function DataOperationsDropdown({ columns, records = [] }: DataOperationsDropdownProps) {
  const { toast } = useToast()
  const [formatModalOpen, setFormatModalOpen] = useState(false)
  const [fillModalOpen, setFillModalOpen] = useState(false)
  const [replaceModalOpen, setReplaceModalOpen] = useState(false)
  const [parseModalOpen, setParseModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)

  // Handle format data application
  const handleApplyFormat = (options: any) => {
    const { columns: selectedColumns, formatOption } = options

    toast({
      title: "Format applied",
      description: `Applied ${formatOption} formatting to ${selectedColumns.length} column(s)`,
    })

    console.log("Format options:", options)
  }

  // Handle fill data application
  const handleApplyFill = (options: any) => {
    const { columns: selectedColumns, fillValue } = options

    toast({
      title: "Fill operation applied",
      description: `Filled ${selectedColumns.length} column(s) with "${fillValue}"`,
    })

    console.log("Fill options:", options)
  }

  // Handle replace data application
  const handleApplyReplace = (options: any) => {
    const { columns: selectedColumns, searchText, replaceText } = options

    toast({
      title: "Replace operation applied",
      description: `Replaced "${searchText}" with "${replaceText}" in ${selectedColumns.length} column(s)`,
    })

    console.log("Replace options:", options)
  }

  // Handle parse data application
  const handleApplyParse = (options: any) => {
    const { sourceColumn, parseType } = options

    toast({
      title: "Parse operation applied",
      description: `Parsed data from ${sourceColumn} using ${parseType} pattern`,
    })

    console.log("Parse options:", options)
  }

  // Handle merge duplicates
  const handleMergeDuplicates = (duplicateGroups: any[]) => {
    toast({
      title: "Duplicates merged",
      description: `Successfully merged ${duplicateGroups.length} groups of duplicate records.`,
    })

    console.log("Merged duplicate groups:", duplicateGroups)
  }

  // Handle delete duplicates
  const handleDeleteDuplicates = (recordIds: string[]) => {
    toast({
      title: "Duplicates deleted",
      description: `Successfully deleted ${recordIds.length} duplicate records.`,
    })

    console.log("Deleted duplicate records:", recordIds)
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="yellow-hover-button">
                  <Database className="h-4 w-4 mr-2" />
                  Data Operations
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage data operations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuLabel>Data Operations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setFormatModalOpen(true)}>
            <Type className="h-4 w-4 mr-2" />
            Format Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFillModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Fill
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReplaceModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Replace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setParseModalOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Parse
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDuplicateModalOpen(true)} data-duplicate-modal>
            <Copy className="h-4 w-4 mr-2" />
            Manage Duplicates
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Format Data Modal */}
      <FormatDataModal
        open={formatModalOpen}
        onOpenChange={setFormatModalOpen}
        columns={columns}
        onApplyFormat={handleApplyFormat}
      />

      {/* Fill Data Modal */}
      <FillDataModal
        open={fillModalOpen}
        onOpenChange={setFillModalOpen}
        columns={columns}
        onApplyFill={handleApplyFill}
      />

      {/* Replace Data Modal */}
      <ReplaceDataModal
        open={replaceModalOpen}
        onOpenChange={setReplaceModalOpen}
        columns={columns}
        onApplyReplace={handleApplyReplace}
      />

      {/* Parse Data Modal */}
      <ParseDataModal
        open={parseModalOpen}
        onOpenChange={setParseModalOpen}
        columns={columns}
        onApplyParse={handleApplyParse}
      />

      {/* Duplicate Management Modal */}
      <DuplicateManagementModal
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        records={records}
        onMergeDuplicates={handleMergeDuplicates}
        onDeleteDuplicates={handleDeleteDuplicates}
      />
    </>
  )
}
