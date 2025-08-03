"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, AlertCircle, Trash2, MergeIcon, RefreshCw, Info, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { calculateSimilarity } from "@/utils/string-similarity"

// Define the Record type
type Record = {
  id: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  listId: string
  listName: string
  tags: { id: string; name: string }[]
  campaigns: { id: string; orderId: string; mailedDate: string }[]
  status?: "active" | "doNotContact" | "returnedMail"
  createdDate?: string
  createdBy?: string
  modifiedDate?: string
  modifiedBy?: string
}

// Define the DuplicateGroup type
type DuplicateGroup = {
  id: string
  records: Record[]
  matchScore: number
  matchFields: string[]
  primaryRecordId: string | null
}

interface DuplicateManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: Record[]
  onMergeDuplicates: (duplicateGroups: DuplicateGroup[]) => void
  onDeleteDuplicates: (recordIds: string[]) => void
}

export function DuplicateManagementModal({
  open,
  onOpenChange,
  records,
  onMergeDuplicates,
  onDeleteDuplicates,
}: DuplicateManagementModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("find")
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [showMergePreview, setShowMergePreview] = useState(false)
  const [mergePreviewGroup, setMergePreviewGroup] = useState<DuplicateGroup | null>(null)
  const [mergedRecord, setMergedRecord] = useState<Record | null>(null)

  // Search criteria state
  const [searchCriteria, setSearchCriteria] = useState({
    fields: ["firstName", "lastName", "address", "zipCode"],
    threshold: 80, // Similarity threshold (0-100)
    caseSensitive: false,
    ignoreSpaces: true,
    exactMatch: false,
    crossListSearch: true,
    maxGroupSize: 5, // Maximum number of records in a duplicate group
  })

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setActiveTab("find")
      setDuplicateGroups([])
      setSelectedGroups([])
      setIsSearching(false)
      setSearchProgress(0)
      setShowMergePreview(false)
      setMergePreviewGroup(null)
      setMergedRecord(null)
    }
  }, [open])

  // Toggle field selection in search criteria
  const toggleField = (field: string) => {
    setSearchCriteria((prev) => ({
      ...prev,
      fields: prev.fields.includes(field) ? prev.fields.filter((f) => f !== field) : [...prev.fields, field],
    }))
  }

  // Find duplicates based on search criteria
  const findDuplicates = () => {
    if (searchCriteria.fields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to search for duplicates.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setSearchProgress(0)
    setDuplicateGroups([])

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 200)

    // In a real implementation, this would be a more sophisticated algorithm
    // that efficiently finds duplicates based on the selected criteria
    setTimeout(() => {
      clearInterval(progressInterval)
      setSearchProgress(100)

      const groups: DuplicateGroup[] = []
      const processedIds = new Set<string>()

      // For each record, find potential duplicates
      records.forEach((record, index) => {
        if (processedIds.has(record.id)) return

        const potentialDuplicates: Record[] = [record]
        const matchFields: string[] = []

        // Compare with other records
        records.slice(index + 1).forEach((otherRecord) => {
          if (processedIds.has(otherRecord.id)) return
          if (!searchCriteria.crossListSearch && record.listId !== otherRecord.listId) return

          let isMatch = false
          let totalScore = 0
          let matchCount = 0

          // Check each selected field for similarity
          searchCriteria.fields.forEach((field) => {
            const fieldKey = field as keyof Record
            let value1 = String(record[fieldKey] || "")
            let value2 = String(otherRecord[fieldKey] || "")

            if (!searchCriteria.caseSensitive) {
              value1 = value1.toLowerCase()
              value2 = value2.toLowerCase()
            }

            if (searchCriteria.ignoreSpaces) {
              value1 = value1.replace(/\s+/g, "")
              value2 = value2.replace(/\s+/g, "")
            }

            if (searchCriteria.exactMatch) {
              if (value1 === value2 && value1.trim() !== "") {
                isMatch = true
                matchFields.push(field)
                totalScore += 100
                matchCount++
              }
            } else {
              const similarity = calculateSimilarity(value1, value2)
              if (similarity >= searchCriteria.threshold && value1.trim() !== "") {
                totalScore += similarity
                matchCount++
                if (!matchFields.includes(field)) {
                  matchFields.push(field)
                }
              }
            }
          })

          // If we have matches on any field, consider it a potential duplicate
          const averageScore = matchCount > 0 ? totalScore / matchCount : 0
          if (
            (searchCriteria.exactMatch && isMatch) ||
            (!searchCriteria.exactMatch && averageScore >= searchCriteria.threshold)
          ) {
            potentialDuplicates.push(otherRecord)
          }
        })

        // If we found duplicates, create a group
        if (potentialDuplicates.length > 1 && potentialDuplicates.length <= searchCriteria.maxGroupSize) {
          const groupId = `group-${groups.length + 1}`

          // Mark all records in this group as processed
          potentialDuplicates.forEach((r) => processedIds.add(r.id))

          groups.push({
            id: groupId,
            records: potentialDuplicates,
            matchScore: Math.round(
              potentialDuplicates.reduce((sum, r, i, arr) => {
                if (i === 0) return sum
                const prevRecord = arr[i - 1]
                let totalSim = 0
                let fieldCount = 0

                searchCriteria.fields.forEach((field) => {
                  const fieldKey = field as keyof Record
                  const val1 = String(prevRecord[fieldKey] || "")
                  const val2 = String(r[fieldKey] || "")
                  if (val1.trim() && val2.trim()) {
                    totalSim += calculateSimilarity(val1, val2)
                    fieldCount++
                  }
                })

                return sum + (fieldCount > 0 ? totalSim / fieldCount : 0)
              }, 0) /
                (potentialDuplicates.length - 1),
            ),
            matchFields,
            primaryRecordId: potentialDuplicates[0].id,
          })
        }
      })

      // Sort groups by match score (descending)
      groups.sort((a, b) => b.matchScore - a.matchScore)

      setDuplicateGroups(groups)
      setIsSearching(false)

      if (groups.length === 0) {
        toast({
          title: "No duplicates found",
          description: "No duplicate records were found with the current search criteria.",
        })
      } else {
        toast({
          title: "Duplicates found",
          description: `Found ${groups.length} groups of potential duplicate records.`,
        })
        setActiveTab("review")
      }
    }, 2000) // Simulate processing time
  }

  // Toggle selection of a duplicate group
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
  }

  // Select all duplicate groups
  const selectAllGroups = () => {
    if (selectedGroups.length === duplicateGroups.length) {
      setSelectedGroups([])
    } else {
      setSelectedGroups(duplicateGroups.map((group) => group.id))
    }
  }

  // Set the primary record in a duplicate group
  const setPrimaryRecord = (groupId: string, recordId: string) => {
    setDuplicateGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, primaryRecordId: recordId } : group)),
    )
  }

  // Generate a preview of the merged record
  const generateMergePreview = (group: DuplicateGroup) => {
    if (!group.primaryRecordId) return null

    const primaryRecord = group.records.find((r) => r.id === group.primaryRecordId)
    if (!primaryRecord) return null

    // Start with the primary record as the base
    const merged = { ...primaryRecord }

    // For each field, use the primary record's value if it exists,
    // otherwise use the first non-empty value from other records
    const fields = [
      "firstName",
      "lastName",
      "address",
      "city",
      "state",
      "zipCode",
      "status",
      "createdDate",
      "createdBy",
      "modifiedDate",
      "modifiedBy",
    ]

    fields.forEach((field) => {
      const fieldKey = field as keyof Record
      if (!merged[fieldKey]) {
        for (const record of group.records) {
          if (record.id !== group.primaryRecordId && record[fieldKey]) {
            merged[fieldKey] = record[fieldKey]
            break
          }
        }
      }
    })

    // Combine tags from all records (removing duplicates)
    const allTags = group.records.flatMap((r) => r.tags)
    const uniqueTags = allTags.filter((tag, index, self) => index === self.findIndex((t) => t.id === tag.id))
    merged.tags = uniqueTags

    // Combine campaigns from all records (removing duplicates)
    const allCampaigns = group.records.flatMap((r) => r.campaigns)
    const uniqueCampaigns = allCampaigns.filter(
      (campaign, index, self) => index === self.findIndex((c) => c.id === campaign.id),
    )
    merged.campaigns = uniqueCampaigns

    return merged
  }

  // Show merge preview for a group
  const showMergePreviewForGroup = (group: DuplicateGroup) => {
    if (!group.primaryRecordId) {
      toast({
        title: "No primary record selected",
        description: "Please select a primary record for this group before previewing the merge.",
        variant: "destructive",
      })
      return
    }

    const preview = generateMergePreview(group)
    if (preview) {
      setMergedRecord(preview)
      setMergePreviewGroup(group)
      setShowMergePreview(true)
    }
  }

  // Merge selected duplicate groups
  const mergeSelectedGroups = () => {
    if (selectedGroups.length === 0) {
      toast({
        title: "No groups selected",
        description: "Please select at least one duplicate group to merge.",
        variant: "destructive",
      })
      return
    }

    const groupsToMerge = duplicateGroups.filter((group) => selectedGroups.includes(group.id) && group.primaryRecordId)

    if (groupsToMerge.length === 0) {
      toast({
        title: "No valid groups to merge",
        description: "Please ensure all selected groups have a primary record selected.",
        variant: "destructive",
      })
      return
    }

    // In a real implementation, this would call an API to merge the records
    onMergeDuplicates(groupsToMerge)

    toast({
      title: "Duplicates merged",
      description: `Successfully merged ${groupsToMerge.length} groups of duplicate records.`,
    })

    // Remove merged groups from the list
    setDuplicateGroups((prev) => prev.filter((group) => !selectedGroups.includes(group.id)))
    setSelectedGroups([])
  }

  // Delete duplicate records (non-primary records in selected groups)
  const deleteSelectedDuplicates = () => {
    if (selectedGroups.length === 0) {
      toast({
        title: "No groups selected",
        description: "Please select at least one duplicate group to process.",
        variant: "destructive",
      })
      return
    }

    const groupsToProcess = duplicateGroups.filter(
      (group) => selectedGroups.includes(group.id) && group.primaryRecordId,
    )

    if (groupsToProcess.length === 0) {
      toast({
        title: "No valid groups to process",
        description: "Please ensure all selected groups have a primary record selected.",
        variant: "destructive",
      })
      return
    }

    // Collect all record IDs to delete (non-primary records)
    const recordsToDelete = groupsToProcess.flatMap((group) =>
      group.records.filter((record) => record.id !== group.primaryRecordId).map((record) => record.id),
    )

    if (recordsToDelete.length === 0) {
      toast({
        title: "No records to delete",
        description: "There are no duplicate records to delete in the selected groups.",
        variant: "destructive",
      })
      return
    }

    // In a real implementation, this would call an API to delete the records
    onDeleteDuplicates(recordsToDelete)

    toast({
      title: "Duplicates deleted",
      description: `Successfully deleted ${recordsToDelete.length} duplicate records.`,
    })

    // Update the groups to remove deleted records
    setDuplicateGroups((prev) =>
      prev.map((group) => {
        if (selectedGroups.includes(group.id)) {
          return {
            ...group,
            records: group.records.filter((record) => record.id === group.primaryRecordId),
          }
        }
        return group
      }),
    )
    setSelectedGroups([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Duplicate Record Management</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">Find Duplicates</TabsTrigger>
            <TabsTrigger value="review" disabled={duplicateGroups.length === 0 && !isSearching}>
              Review & Merge {duplicateGroups.length > 0 && `(${duplicateGroups.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Fields to Compare</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select which fields to use when searching for duplicates
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-firstName"
                        checked={searchCriteria.fields.includes("firstName")}
                        onCheckedChange={() => toggleField("firstName")}
                      />
                      <Label htmlFor="field-firstName">First Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-lastName"
                        checked={searchCriteria.fields.includes("lastName")}
                        onCheckedChange={() => toggleField("lastName")}
                      />
                      <Label htmlFor="field-lastName">Last Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-address"
                        checked={searchCriteria.fields.includes("address")}
                        onCheckedChange={() => toggleField("address")}
                      />
                      <Label htmlFor="field-address">Address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-city"
                        checked={searchCriteria.fields.includes("city")}
                        onCheckedChange={() => toggleField("city")}
                      />
                      <Label htmlFor="field-city">City</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-state"
                        checked={searchCriteria.fields.includes("state")}
                        onCheckedChange={() => toggleField("state")}
                      />
                      <Label htmlFor="field-state">State</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-zipCode"
                        checked={searchCriteria.fields.includes("zipCode")}
                        onCheckedChange={() => toggleField("zipCode")}
                      />
                      <Label htmlFor="field-zipCode">Zip Code</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Matching Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="option-caseSensitive"
                        checked={searchCriteria.caseSensitive}
                        onCheckedChange={(checked) =>
                          setSearchCriteria((prev) => ({ ...prev, caseSensitive: !!checked }))
                        }
                      />
                      <Label htmlFor="option-caseSensitive">Case sensitive matching</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="option-ignoreSpaces"
                        checked={searchCriteria.ignoreSpaces}
                        onCheckedChange={(checked) =>
                          setSearchCriteria((prev) => ({ ...prev, ignoreSpaces: !!checked }))
                        }
                      />
                      <Label htmlFor="option-ignoreSpaces">Ignore spaces when comparing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="option-exactMatch"
                        checked={searchCriteria.exactMatch}
                        onCheckedChange={(checked) => setSearchCriteria((prev) => ({ ...prev, exactMatch: !!checked }))}
                      />
                      <Label htmlFor="option-exactMatch">Require exact matches (ignores threshold)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="option-crossList"
                        checked={searchCriteria.crossListSearch}
                        onCheckedChange={(checked) =>
                          setSearchCriteria((prev) => ({ ...prev, crossListSearch: !!checked }))
                        }
                      />
                      <Label htmlFor="option-crossList">Search across different mailing lists</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium">Similarity Threshold</h3>
                    <span className="text-sm font-medium">{searchCriteria.threshold}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Set how similar fields must be to be considered a match (when not using exact matching)
                  </p>
                  <Slider
                    value={[searchCriteria.threshold]}
                    min={50}
                    max={100}
                    step={1}
                    onValueChange={(value) => setSearchCriteria((prev) => ({ ...prev, threshold: value[0] }))}
                    disabled={searchCriteria.exactMatch}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>More Results</span>
                    <span>Exact Match</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Maximum Group Size</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Limit the maximum number of records in a duplicate group
                  </p>
                  <Select
                    value={searchCriteria.maxGroupSize.toString()}
                    onValueChange={(value) =>
                      setSearchCriteria((prev) => ({ ...prev, maxGroupSize: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum group size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 records</SelectItem>
                      <SelectItem value="3">3 records</SelectItem>
                      <SelectItem value="5">5 records</SelectItem>
                      <SelectItem value="10">10 records</SelectItem>
                      <SelectItem value="20">20 records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Search Tips
                  </h3>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Select more fields for more accurate duplicate detection</li>
                    <li>• Lower the threshold to find more potential duplicates</li>
                    <li>• Use exact matching for strict duplicate detection</li>
                    <li>• Disable cross-list search if you only want to find duplicates within the same list</li>
                  </ul>
                </div>
              </div>
            </div>

            {isSearching ? (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Searching for duplicates...</h3>
                  <span className="text-sm font-medium">{Math.round(searchProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${searchProgress}%` }}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This may take a moment depending on the size of your data and search criteria.
                </p>
              </div>
            ) : (
              <div className="flex justify-end mt-4">
                <Button onClick={findDuplicates}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Duplicates
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="flex-1 flex flex-col">
            {duplicateGroups.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Checkbox
                      id="select-all-groups"
                      checked={selectedGroups.length === duplicateGroups.length && duplicateGroups.length > 0}
                      onCheckedChange={selectAllGroups}
                    />
                    <Label htmlFor="select-all-groups" className="ml-2">
                      Select All Groups
                    </Label>
                    {selectedGroups.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedGroups.length} selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={deleteSelectedDuplicates} disabled={selectedGroups.length === 0}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Duplicates
                    </Button>
                    <Button onClick={mergeSelectedGroups} disabled={selectedGroups.length === 0}>
                      <MergeIcon className="h-4 w-4 mr-2" />
                      Merge Selected
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                  <div className="space-y-4 p-4">
                    {duplicateGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`border rounded-md overflow-hidden ${
                          selectedGroups.includes(group.id) ? "border-primary" : ""
                        }`}
                      >
                        <div className="bg-muted p-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <Checkbox
                              id={`select-group-${group.id}`}
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={() => toggleGroupSelection(group.id)}
                            />
                            <Label htmlFor={`select-group-${group.id}`} className="ml-2 font-medium">
                              Duplicate Group {group.id.split("-")[1]}
                            </Label>
                            <Badge variant="outline" className="ml-2">
                              {group.records.length} records
                            </Badge>
                            <Badge variant={group.matchScore >= 90 ? "default" : "secondary"} className="ml-2">
                              {group.matchScore}% match
                            </Badge>
                            <div className="ml-3 text-sm text-muted-foreground">
                              Matched on: {group.matchFields.join(", ")}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => showMergePreviewForGroup(group)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Merge
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">Primary</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead>City</TableHead>
                              <TableHead>State</TableHead>
                              <TableHead>Zip</TableHead>
                              <TableHead>List</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.records.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={group.primaryRecordId === record.id}
                                    onCheckedChange={() => setPrimaryRecord(group.id, record.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {record.firstName} {record.lastName}
                                </TableCell>
                                <TableCell>{record.address}</TableCell>
                                <TableCell>{record.city}</TableCell>
                                <TableCell>{record.state}</TableCell>
                                <TableCell>{record.zipCode}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{record.listName}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Duplicates Found</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No duplicate records were found with the current search criteria. Try adjusting your search parameters
                  to find more potential duplicates.
                </p>
                <Button onClick={() => setActiveTab("find")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Modify Search Criteria
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Merge Preview Dialog */}
        {showMergePreview && mergePreviewGroup && mergedRecord && (
          <Dialog open={showMergePreview} onOpenChange={setShowMergePreview}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Merge Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <h3 className="font-medium mb-2">Merged Record Preview</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This is how the record will look after merging. The primary record's data is used when available,
                    with missing fields filled from other records.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {mergedRecord.firstName} {mergedRecord.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Address</Label>
                    <p className="font-medium">{mergedRecord.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">City</Label>
                    <p className="font-medium">{mergedRecord.city}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <p className="font-medium">{mergedRecord.state}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Zip Code</Label>
                    <p className="font-medium">{mergedRecord.zipCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">List</Label>
                    <p className="font-medium">{mergedRecord.listName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="font-medium">{mergedRecord.status || "Active"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mergedRecord.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                      {mergedRecord.tags.length === 0 && <span className="text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <h3 className="font-medium mb-2">Records to be Merged</h3>
                  <div className="space-y-2">
                    {mergePreviewGroup.records.map((record, index) => (
                      <div
                        key={record.id}
                        className={`p-2 rounded-md flex items-center justify-between ${
                          record.id === mergePreviewGroup.primaryRecordId
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-background"
                        }`}
                      >
                        <div>
                          <span className="font-medium">
                            {record.firstName} {record.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {record.address}, {record.city}, {record.state} {record.zipCode}
                          </span>
                        </div>
                        {record.id === mergePreviewGroup.primaryRecordId && <Badge>Primary Record</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMergePreview(false)}>
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    onMergeDuplicates([mergePreviewGroup])
                    setShowMergePreview(false)
                    setDuplicateGroups((prev) => prev.filter((group) => group.id !== mergePreviewGroup.id))
                    toast({
                      title: "Records merged",
                      description: "The selected duplicate records have been successfully merged.",
                    })
                  }}
                >
                  <MergeIcon className="h-4 w-4 mr-2" />
                  Merge Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
