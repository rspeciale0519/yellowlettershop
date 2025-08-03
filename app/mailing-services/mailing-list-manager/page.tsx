"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, SortDesc, Plus, X, ChevronRight, FileText, Users, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AddListModal } from "@/components/mailing-list/add-list-modal"
import { AddRecordModal } from "@/components/mailing-list/add-record-modal"
import { EditListModal } from "@/components/mailing-list/edit-list-modal"
import { DeleteConfirmModal } from "@/components/mailing-list/delete-confirm-modal"
import { MobileListCard } from "@/components/mailing-list/mobile-list-card"
import { MobileRecordCard } from "@/components/mailing-list/mobile-record-card"
import { useLists } from "@/hooks/use-lists"
import { useTags } from "@/hooks/use-tags"
import Link from "next/link"
import { PaginationControls } from "@/components/mailing-list/pagination-controls"
import { MobilePaginationControls } from "@/components/mailing-list/mobile-pagination-controls"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { CampaignUsageModal } from "@/components/mailing-list/campaign-usage-modal"
import { ListsTable } from "@/components/mailing-list/lists-table"
import { RecordsTable } from "@/components/mailing-list/records-table"
import { AdvancedSearch, type AdvancedSearchCriteria } from "@/components/mailing-list/advanced-search"

// Add custom styles for yellow hover effect
import "./mailing-list-manager.css"

// First, update the Record type definition to include the new fields
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

// Custom Button component with yellow hover effect
const YellowHoverButton = ({ children, className = "", ...props }) => {
  return (
    <Button className={`yellow-hover-button ${className}`} {...props}>
      {children}
    </Button>
  )
}

export default function MailingListsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Add a mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true)

  // Add this more comprehensive global error handler for ResizeObserver errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.message && event.message.includes("ResizeObserver")) {
        // Prevent the error from showing in console
        event.preventDefault()
        event.stopPropagation()
        console.log("Suppressed ResizeObserver error")
      }
    }

    // Add a handler for unhandled promise rejections that might be related to ResizeObserver
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes("ResizeObserver")) {
        event.preventDefault()
        console.log("Suppressed ResizeObserver promise rejection")
      }
    }

    window.addEventListener("error", errorHandler, { capture: true })
    window.addEventListener("unhandledrejection", rejectionHandler)

    return () => {
      window.removeEventListener("error", errorHandler, { capture: true })
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])

  // Also, patch the ResizeObserver prototype to catch errors
  if (typeof window !== "undefined") {
    // Override the error event to catch and suppress ResizeObserver errors
    window.addEventListener(
      "error",
      (event) => {
        if (event.message && event.message.includes("ResizeObserver")) {
          event.stopImmediatePropagation()
          event.preventDefault()
          console.log("Suppressed ResizeObserver error")
          return false
        }
      },
      true,
    )

    // Also handle unhandled promise rejections
    window.addEventListener(
      "unhandledrejection",
      (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes("ResizeObserver")) {
          event.stopImmediatePropagation()
          event.preventDefault()
          console.log("Suppressed ResizeObserver promise rejection")
          return false
        }
      },
      true,
    )

    // Patch the ResizeObserver prototype to catch errors
    if (typeof ResizeObserver !== "undefined") {
      const originalObserve = ResizeObserver.prototype.observe
      ResizeObserver.prototype.observe = function (target, options) {
        try {
          return originalObserve.call(this, target, options)
        } catch (error) {
          if (error.message && error.message.includes("ResizeObserver")) {
            console.log("Caught and suppressed ResizeObserver error in observe")
            return null
          }
          throw error
        }
      }

      const originalUnobserve = ResizeObserver.prototype.unobserve
      ResizeObserver.prototype.unobserve = function (target) {
        try {
          return originalUnobserve.call(this, target)
        } catch (error) {
          if (error.message && error.message.includes("ResizeObserver")) {
            console.log("Caught and suppressed ResizeObserver error in unobserve")
            return null
          }
          throw error
        }
      }
    }
  }

  // Add a ref to track if we're currently updating selection state
  const isUpdatingSelectionRef = useRef(false)

  // View mode state (lists or records)
  const [viewMode, setViewMode] = useState<"lists" | "records">("lists")

  // State for selected records
  const [selectedRecords, setSelectedRecords] = useState<Record["id"][]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Advanced search state
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<AdvancedSearchCriteria>({
    columnFilters: [],
    tagFilter: null,
    mailingHistoryFilter: null,
    recordCountFilter: null,
    listFilter: null,
    logicalOperator: "AND",
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // State for modals
  const [addListOpen, setAddListOpen] = useState(false)
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [editListId, setEditListId] = useState<string | null>(null)
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<{ id: string; orderId: string; mailedDate: string }[]>([])
  const [campaignModalTitle, setCampaignModalTitle] = useState("")

  // State for filters and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<{
    tags: string[]
    dateRange: string | null
    campaignUsage: string | null
    lists: string[] // For filtering records by list
  }>({
    tags: [],
    dateRange: null,
    campaignUsage: null,
    lists: [],
  })
  const [sortBy, setSortBy] = useState<{
    column: string
    direction: "asc" | "desc"
  }>({
    column: "createdAt",
    direction: "desc",
  })

  // Fetch data
  const { lists, isLoading, error, mutate } = useLists()
  const { tags } = useTags()

  // Handle inline name editing
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null)

  // Add this after the editingName state
  const [editingRecord, setEditingRecord] = useState<{
    id: string
    field: string
    value: string
  } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>("mailing-list-items-per-page", 10)
  const itemsPerPageOptions = [10, 25, 50, 100, 250, 500]

  // Toggle view mode
  const toggleViewMode = () => {
    if (!isMountedRef.current) return
    setViewMode(viewMode === "lists" ? "records" : "lists")
    // Reset pagination when switching views
    setCurrentPage(1)
    // Clear selections when switching views
    setSelectedRecords([])
    setSelectAll(false)
    // Close advanced search when switching views
    setAdvancedSearchOpen(false)
  }

  // Update the generateRecords function to include tags and campaigns
  const generateRecords = (): Record[] => {
    if (!lists) return []

    // Create a flat array of all records from all lists
    const allRecords: Record[] = []

    lists.forEach((list) => {
      // For each list, generate mock records based on the record count
      // In a real implementation, this would fetch actual records from the database
      const recordCount = Math.min(list.recordCount, 100) // Limit to 100 records per list for demo purposes

      for (let i = 0; i < recordCount; i++) {
        // Generate mock data for each record
        const states = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"]
        const cities = [
          "New York",
          "Los Angeles",
          "Chicago",
          "Houston",
          "Phoenix",
          "Philadelphia",
          "San Antonio",
          "San Diego",
          "Dallas",
          "San Jose",
        ]

        // Randomly assign some of the list's tags to each record
        const recordTags = list.tags.filter(() => Math.random() > 0.5)

        // Randomly assign some of the list's campaigns to each record
        const recordCampaigns = list.campaigns.filter(() => Math.random() > 0.5)

        // Randomly assign a status (mostly active, but some with other statuses)
        const statuses: ("active" | "doNotContact" | "returnedMail")[] = [
          "active",
          "active",
          "active",
          "active",
          "doNotContact",
          "returnedMail",
        ]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

        allRecords.push({
          id: `${list.id}-record-${i}`,
          firstName: [
            "John",
            "Jane",
            "Michael",
            "Emily",
            "David",
            "Sarah",
            "Robert",
            "Jennifer",
            "William",
            "Elizabeth",
          ][i % 10],
          lastName: ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"][
            i % 10
          ],
          address: `${1000 + i} ${["Main", "Oak", "Maple", "Cedar", "Pine", "Elm", "Washington", "Park", "Lake", "Hill"][i % 10]} ${["St", "Ave", "Blvd", "Dr", "Ln", "Rd", "Way", "Pl", "Ct", "Ter"][i % 10]}`,
          city: cities[i % 10],
          state: states[i % 10],
          zipCode: `${10000 + i * 100}`.substring(0, 5),
          listId: list.id,
          listName: list.name,
          tags: recordTags,
          campaigns: recordCampaigns,
          status: randomStatus,
          createdDate: list.createdAt, // Use the list's creation date
          createdBy: ["Admin", "John Doe", "Jane Smith", "System", "Import Tool"][Math.floor(Math.random() * 5)],
          // Only add modification details for some records to simulate that not all records have been modified
          ...(Math.random() > 0.5
            ? {
                modifiedDate: new Date(
                  new Date(list.createdAt).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                modifiedBy: ["Admin", "John Doe", "Jane Smith", "System", "Data Cleaner"][
                  Math.floor(Math.random() * 5)
                ],
              }
            : {}),
        })
      }
    })

    return allRecords
  }

  // Get all records
  const allRecords = generateRecords()

  // Apply advanced search criteria to records
  const applyAdvancedSearch = (records: Record[]): Record[] => {
    if (!advancedSearchCriteria) return records

    return records.filter((record) => {
      const results: boolean[] = []

      // Apply column filters
      if (advancedSearchCriteria.columnFilters.length > 0) {
        advancedSearchCriteria.columnFilters.forEach((filter) => {
          let result = false
          const value = record[filter.column as keyof Record]

          if (typeof value === "string") {
            switch (filter.operator) {
              case "contains":
                result = value.toLowerCase().includes((filter.value as string).toLowerCase())
                break
              case "equals":
                result = value.toLowerCase() === (filter.value as string).toLowerCase()
                break
              case "startsWith":
                result = value.toLowerCase().startsWith((filter.value as string).toLowerCase())
                break
              case "endsWith":
                result = value.toLowerCase().endsWith((filter.value as string).toLowerCase())
                break
              case "empty":
                result = value === ""
                break
              case "notEmpty":
                result = value !== ""
                break
            }
          } else if (typeof value === "number") {
            switch (filter.operator) {
              case "equals":
                result = value === Number(filter.value)
                break
              case "greaterThan":
                result = value > Number(filter.value)
                break
              case "lessThan":
                result = value < Number(filter.value)
                break
              case "between":
                const [min, max] = filter.value as [number, number]
                result = value >= min && value <= max
                break
              case "empty":
                result = value === undefined || value === null
                break
              case "notEmpty":
                result = value !== undefined && value !== null
                break
            }
          } else if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
            const dateValue = value instanceof Date ? value : new Date(value)
            const filterDate = filter.value instanceof Date ? filter.value : new Date(filter.value as string)

            switch (filter.operator) {
              case "equals":
                result = dateValue.toDateString() === filterDate.toDateString()
                break
              case "greaterThan":
                result = dateValue > filterDate
                break
              case "lessThan":
                result = dateValue < filterDate
                break
              case "between":
                const [startDate, endDate] = filter.value as [Date, Date]
                result = dateValue >= startDate && dateValue <= endDate
                break
              case "empty":
                result = value === undefined || value === null
                break
              case "notEmpty":
                result = value !== undefined && value !== null
                break
            }
          }

          results.push(result)
        })
      }

      // Apply list filter
      if (advancedSearchCriteria.listFilter && advancedSearchCriteria.listFilter.listIds.length > 0) {
        results.push(advancedSearchCriteria.listFilter.listIds.includes(record.listId))
      }

      // Apply tag filter
      if (advancedSearchCriteria.tagFilter && advancedSearchCriteria.tagFilter.tagIds.length > 0) {
        const recordTagIds = record.tags.map((tag) => tag.id)
        const filterTagIds = advancedSearchCriteria.tagFilter.tagIds

        switch (advancedSearchCriteria.tagFilter.operator) {
          case "hasAll":
            results.push(filterTagIds.every((id) => recordTagIds.includes(id)))
            break
          case "hasAny":
            results.push(filterTagIds.some((id) => recordTagIds.includes(id)))
            break
          case "hasNone":
            results.push(!filterTagIds.some((id) => recordTagIds.includes(id)))
            break
          case "hasOnly":
            results.push(
              filterTagIds.every((id) => recordTagIds.includes(id)) &&
                recordTagIds.every((id) => filterTagIds.includes(id)),
            )
            break
        }
      }

      // Apply mailing history filter
      if (advancedSearchCriteria.mailingHistoryFilter) {
        const { operator, value } = advancedSearchCriteria.mailingHistoryFilter

        if (operator === "notMailed") {
          results.push(record.campaigns.length === 0)
        } else if (record.campaigns.length > 0) {
          // Get the most recent mailing date
          const mailingDates = record.campaigns.map((c) => new Date(c.mailedDate))
          const mostRecentMailingDate = new Date(Math.max(...mailingDates.map((d) => d.getTime())))
          const today = new Date()

          switch (operator) {
            case "mailedInLast":
              const daysAgo = new Date()
              daysAgo.setDate(today.getDate() - (value as number))
              results.push(mostRecentMailingDate >= daysAgo)
              break
            case "mailedMoreThan":
              const cutoffDate = new Date()
              cutoffDate.setDate(today.getDate() - (value as number))
              results.push(mostRecentMailingDate < cutoffDate)
              break
            case "mailedBetween":
              const [startDate, endDate] = value as [Date, Date]
              results.push(mostRecentMailingDate >= startDate && mostRecentMailingDate <= endDate)
              break
          }
        } else {
          // If no campaigns and the filter is not 'notMailed', this record doesn't match
          if (operator !== "notMailed") {
            results.push(false)
          }
        }
      }

      // Apply logical operator to all results
      if (results.length === 0) return true // No filters applied

      return advancedSearchCriteria.logicalOperator === "AND" ? results.every((r) => r) : results.some((r) => r)
    })
  }

  // Apply advanced search criteria to lists
  const applyAdvancedSearchToLists = (listsToFilter: any[]): any[] => {
    if (!advancedSearchCriteria) return listsToFilter

    return listsToFilter.filter((list) => {
      const results: boolean[] = []

      // Apply column filters
      if (advancedSearchCriteria.columnFilters.length > 0) {
        advancedSearchCriteria.columnFilters.forEach((filter) => {
          let result = false
          const value = list[filter.column as keyof typeof list]

          if (typeof value === "string") {
            switch (filter.operator) {
              case "contains":
                result = value.toLowerCase().includes((filter.value as string).toLowerCase())
                break
              case "equals":
                result = value.toLowerCase() === (filter.value as string).toLowerCase()
                break
              case "startsWith":
                result = value.toLowerCase().startsWith((filter.value as string).toLowerCase())
                break
              case "endsWith":
                result = value.toLowerCase().endsWith((filter.value as string).toLowerCase())
                break
              case "empty":
                result = value === ""
                break
              case "notEmpty":
                result = value !== ""
                break
            }
          } else if (typeof value === "number") {
            switch (filter.operator) {
              case "equals":
                result = value === Number(filter.value)
                break
              case "greaterThan":
                result = value > Number(filter.value)
                break
              case "lessThan":
                result = value < Number(filter.value)
                break
              case "between":
                const [min, max] = filter.value as [number, number]
                result = value >= min && value <= max
                break
              case "empty":
                result = value === undefined || value === null
                break
              case "notEmpty":
                result = value !== undefined && value !== null
                break
            }
          } else if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
            const dateValue = value instanceof Date ? value : new Date(value)
            const filterDate = filter.value instanceof Date ? filter.value : new Date(filter.value as string)

            switch (filter.operator) {
              case "equals":
                result = dateValue.toDateString() === filterDate.toDateString()
                break
              case "greaterThan":
                result = dateValue > filterDate
                break
              case "lessThan":
                result = dateValue < filterDate
                break
              case "between":
                const [startDate, endDate] = filter.value as [Date, Date]
                result = dateValue >= startDate && dateValue <= endDate
                break
              case "empty":
                result = value === undefined || value === null
                break
              case "notEmpty":
                result = value !== undefined && value !== null
                break
            }
          }

          results.push(result)
        })
      }

      // Apply tag filter
      if (advancedSearchCriteria.tagFilter && advancedSearchCriteria.tagFilter.tagIds.length > 0) {
        const listTagIds = list.tags.map((tag: any) => tag.id)
        const filterTagIds = advancedSearchCriteria.tagFilter.tagIds

        switch (advancedSearchCriteria.tagFilter.operator) {
          case "hasAll":
            results.push(filterTagIds.every((id) => listTagIds.includes(id)))
            break
          case "hasAny":
            results.push(filterTagIds.some((id) => listTagIds.includes(id)))
            break
          case "hasNone":
            results.push(!filterTagIds.some((id) => listTagIds.includes(id)))
            break
          case "hasOnly":
            results.push(
              filterTagIds.every((id) => listTagIds.includes(id)) &&
                listTagIds.every((id) => filterTagIds.includes(id)),
            )
            break
        }
      }

      // Apply logical operator to all results
      if (results.length === 0) return true // No filters applied

      return advancedSearchCriteria.logicalOperator === "AND" ? results.every((r) => r) : results.some((r) => r)
    })
  }

  // Filter and sort lists
  let filteredLists = lists
    ? lists
        .filter((list) => {
          // Search filter
          if (
            searchQuery &&
            !list.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !list.tags.some((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ) {
            return false
          }

          // Tag filter
          if (
            activeFilters.tags.length > 0 &&
            !activeFilters.tags.some((tagId) => list.tags.some((tag) => tag.id === tagId))
          ) {
            return false
          }

          // Date range filter
          if (activeFilters.dateRange) {
            const date = new Date(list.createdAt)
            const now = new Date()

            if (activeFilters.dateRange === "last30days") {
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(now.getDate() - 30)
              if (date < thirtyDaysAgo) return false
            } else if (activeFilters.dateRange === "last90days") {
              const ninetyDaysAgo = new Date()
              ninetyDaysAgo.setDate(now.getDate() - 90)
              if (date < ninetyDaysAgo) return false
            }
          }

          // Campaign usage filter
          if (activeFilters.campaignUsage) {
            if (activeFilters.campaignUsage === "used" && list.campaigns.length === 0) return false
            if (activeFilters.campaignUsage === "unused" && list.campaigns.length > 0) return false
          }

          return true
        })
        .sort((a, b) => {
          // Sort by selected column
          if (sortBy.column === "name") {
            return sortBy.direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
          } else if (sortBy.column === "recordCount") {
            return sortBy.direction === "asc" ? a.recordCount - b.recordCount : b.recordCount - a.recordCount
          } else if (sortBy.column === "createdAt") {
            return sortBy.direction === "asc"
              ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          } else if (sortBy.column === "createdBy") {
            return sortBy.direction === "asc"
              ? (a.createdBy || "").localeCompare(b.createdBy || "")
              : (b.createdBy || "").localeCompare(a.createdBy || "")
          } else if (sortBy.column === "modifiedDate") {
            // Handle null/undefined modifiedDate values
            if (!a.modifiedDate && !b.modifiedDate) return 0
            if (!a.modifiedDate) return sortBy.direction === "asc" ? -1 : 1
            if (!b.modifiedDate) return sortBy.direction === "asc" ? 1 : -1

            return sortBy.direction === "asc"
              ? new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime()
              : new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime()
          } else if (sortBy.column === "modifiedBy") {
            return sortBy.direction === "asc"
              ? (a.modifiedBy || "").localeCompare(b.modifiedBy || "")
              : (b.modifiedBy || "").localeCompare(a.modifiedBy || "")
          }
          return 0
        })
    : []

  // Apply advanced search if we're in lists view
  if (viewMode === "lists") {
    filteredLists = applyAdvancedSearchToLists(filteredLists)
  }

  // Apply basic filters and advanced search to records
  let filteredRecords = allRecords.filter((record) => {
    // Search filter
    if (
      searchQuery &&
      !`${record.firstName} ${record.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.state.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !record.zipCode.includes(searchQuery) &&
      !record.listName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // List filter
    if (activeFilters.lists.length > 0 && !activeFilters.lists.includes(record.listId)) {
      return false
    }

    return true
  })

  // Apply advanced search if we're in records view
  if (viewMode === "records") {
    filteredRecords = applyAdvancedSearch(filteredRecords)
  }

  // Apply sorting to records
  filteredRecords = filteredRecords.sort((a, b) => {
    // Sort by selected column
    if (sortBy.column === "name") {
      const nameA = `${a.lastName}, ${a.firstName}`
      const nameB = `${b.lastName}, ${b.firstName}`
      return sortBy.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    } else if (sortBy.column === "address") {
      return sortBy.direction === "asc" ? a.address.localeCompare(b.address) : b.address.localeCompare(a.address)
    } else if (sortBy.column === "city") {
      return sortBy.direction === "asc" ? a.city.localeCompare(b.city) : b.city.localeCompare(a.city)
    } else if (sortBy.column === "state") {
      return sortBy.direction === "asc" ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state)
    } else if (sortBy.column === "zipCode") {
      return sortBy.direction === "asc" ? a.zipCode.localeCompare(b.zipCode) : b.zipCode.localeCompare(a.zipCode)
    } else if (sortBy.column === "listName") {
      return sortBy.direction === "asc" ? a.listName.localeCompare(b.listName) : b.listName.localeCompare(a.listName)
    } else if (sortBy.column === "createdDate") {
      return sortBy.direction === "asc"
        ? new Date(a.createdDate || "").getTime() - new Date(b.createdDate || "").getTime()
        : new Date(b.createdDate || "").getTime() - new Date(a.createdDate || "").getTime()
    } else if (sortBy.column === "createdBy") {
      return sortBy.direction === "asc"
        ? (a.createdBy || "").localeCompare(b.createdBy || "")
        : (b.createdBy || "").localeCompare(a.createdBy || "")
    } else if (sortBy.column === "modifiedDate") {
      // Handle null/undefined modifiedDate values
      if (!a.modifiedDate && !b.modifiedDate) return 0
      if (!a.modifiedDate) return sortBy.direction === "asc" ? -1 : 1
      if (!b.modifiedDate) return sortBy.direction === "asc" ? 1 : -1

      return sortBy.direction === "asc"
        ? new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime()
        : new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime()
    } else if (sortBy.column === "modifiedBy") {
      return sortBy.direction === "asc"
        ? (a.modifiedBy || "").localeCompare(b.modifiedBy || "")
        : (b.modifiedBy || "").localeCompare(a.modifiedBy || "")
    }
    return 0
  })

  // Apply record count filter if present
  if (viewMode === "records" && advancedSearchCriteria.recordCountFilter) {
    const { operator, value } = advancedSearchCriteria.recordCountFilter

    switch (operator) {
      case "topRecords":
        filteredRecords = filteredRecords.slice(0, value as number)
        break
      case "randomRecords":
        // Shuffle the array and take the first n elements
        const shuffled = [...filteredRecords].sort(() => 0.5 - Math.random())
        filteredRecords = shuffled.slice(0, Math.min(value as number, shuffled.length))
        break
      case "recordRange":
        const [start, end] = value as [number, number]
        // Adjust for 0-based indexing
        const adjustedStart = Math.max(0, start - 1)
        const adjustedEnd = Math.min(filteredRecords.length, end)
        filteredRecords = filteredRecords.slice(adjustedStart, adjustedEnd)
        break
    }
  }

  // Paginate lists or records based on view mode
  const paginatedItems =
    viewMode === "lists"
      ? filteredLists.length > 0
        ? filteredLists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : []
      : filteredRecords.length > 0
        ? filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : []

  const totalPages = Math.ceil((viewMode === "lists" ? filteredLists.length : filteredRecords.length) / itemsPerPage)

  // Memoize the current page IDs to prevent unnecessary recalculations
  const currentPageIds = useCallback(() => {
    return paginatedItems.map((item) => item.id)
  }, [paginatedItems])

  // Handle select all checkbox - use a more stable approach
  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (isUpdatingSelectionRef.current) return
      isUpdatingSelectionRef.current = true

      try {
        setSelectAll(checked)

        if (checked) {
          // Select all items on the current page
          setSelectedRecords((prev) => {
            const ids = currentPageIds()
            // Keep previously selected items that aren't on this page
            const itemsNotOnCurrentPage = prev.filter((id) => !ids.includes(id))
            return [...itemsNotOnCurrentPage, ...ids]
          })
        } else {
          // Deselect all items on the current page
          setSelectedRecords((prev) => {
            const ids = currentPageIds()
            return prev.filter((id) => !ids.includes(id))
          })
        }
      } finally {
        // Use setTimeout to ensure we don't set this back to false too early
        setTimeout(() => {
          isUpdatingSelectionRef.current = false
        }, 0)
      }
    },
    [currentPageIds],
  )

  // Update selectAll state when page changes
  useEffect(() => {
    if (isUpdatingSelectionRef.current) return

    const ids = currentPageIds()
    if (ids.length === 0) return

    const allSelected = ids.every((id) => selectedRecords.includes(id))
    if (allSelected !== selectAll) {
      setSelectAll(allSelected)
    }
  }, [currentPageIds, selectedRecords, selectAll])

  // Handle checkbox toggle for individual record
  const handleCheckboxToggle = useCallback((id: string) => {
    if (isUpdatingSelectionRef.current) return
    isUpdatingSelectionRef.current = true

    try {
      setSelectedRecords((prev) => {
        const newSelected = prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]

        return newSelected
      })
    } finally {
      setTimeout(() => {
        isUpdatingSelectionRef.current = false
      }, 0)
    }
  }, [])

  // Handle sorting
  const handleSort = (column: string) => {
    if (!isMountedRef.current) return
    setSortBy((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Handle inline name edit
  const handleNameEdit = (id: string, name: string) => {
    if (!isMountedRef.current) return
    setEditingName({ id, value: name })
  }

  const saveNameEdit = async () => {
    if (!editingName || !isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await updateListName(editingName.id, editingName.value)

      // Optimistic update
      mutate(lists?.map((list) => (list.id === editingName.id ? { ...list, name: editingName.value } : list)))

      if (isMountedRef.current) {
        toast({
          title: "List updated",
          description: `List "${editingName.value}" has been updated.`,
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to update list name. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setEditingName(null)
      }
    }
  }

  // Add this after the saveNameEdit function
  const handleRecordFieldEdit = (id: string, field: string, value: string) => {
    if (!isMountedRef.current) return
    setEditingRecord({ id, field, value })
  }

  const saveRecordFieldEdit = async () => {
    if (!editingRecord || !isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await updateRecordField(editingRecord.id, editingRecord.field, editingRecord.value)

      // For this demo, we'll just show a success toast
      if (isMountedRef.current) {
        toast({
          title: "Record updated",
          description: `Record field has been updated.`,
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to update record. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setEditingRecord(null)
      }
    }
  }

  // Add a function to handle status updates after the saveRecordFieldEdit function
  const handleUpdateRecordStatus = async (recordId: string, status: "active" | "doNotContact" | "returnedMail") => {
    if (!isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await updateRecordStatus(recordId, status)

      // For this demo, we'll just show a success toast
      const statusText =
        status === "doNotContact" ? "Do Not Contact" : status === "returnedMail" ? "Returned Mail" : "Active"

      if (isMountedRef.current) {
        toast({
          title: "Record status updated",
          description: `Record has been marked as "${statusText}".`,
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to update record status. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle tag management
  const handleAddTag = async (listId: string, tagId: string) => {
    if (!isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await addTagToList(listId, tagId)

      // Optimistic update
      const tagToAdd = tags?.find((tag) => tag.id === tagId)
      if (!tagToAdd) return

      mutate(lists?.map((list) => (list.id === listId ? { ...list, tags: [...list.tags, tagToAdd] } : list)))

      if (isMountedRef.current) {
        toast({
          title: "Tag added",
          description: `Tag "${tagToAdd.name}" has been added to the list.`,
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to add tag. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveTag = async (listId: string, tagId: string) => {
    if (!isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await removeTagFromList(listId, tagId)

      // Optimistic update
      mutate(
        lists?.map((list) =>
          list.id === listId ? { ...list, tags: list.tags.filter((tag) => tag.id !== tagId) } : list,
        ),
      )

      if (isMountedRef.current) {
        toast({
          title: "Tag removed",
          description: "Tag has been removed from the list.",
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to remove tag. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle list deletion
  const handleDeleteList = async (id: string) => {
    if (!isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // await deleteList(id)

      // Optimistic update
      mutate(lists?.filter((list) => list.id !== id))

      if (isMountedRef.current) {
        toast({
          title: "List deleted",
          description: "The mailing list has been deleted.",
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to delete list. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setDeleteListId(null)
      }
    }
  }

  // Handle "Use in Order" action
  const handleUseInOrder = (id: string) => {
    if (!isMountedRef.current) return
    router.push(`/order/new?listId=${id}`)
  }

  // Handle creating a new list for a record
  const handleCreateNewList = async (listName: string) => {
    if (!isMountedRef.current) return

    try {
      // In a real implementation, this would be an API call
      // const newList = await createList(listName)

      // Create a mock list object
      const newList = {
        id: `new-${Date.now()}`,
        name: listName,
        recordCount: 1, // Starting with 1 record
        createdAt: new Date().toISOString(),
        createdBy: "Current User", // Add this line
        tags: [],
        campaigns: [],
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update lists with the new list
      mutate([...(lists || []), newList])

      if (isMountedRef.current) {
        toast({
          title: "List created",
          description: `List "${listName}" has been created.`,
        })
      }

      return newList
    } catch (error) {
      console.error("Error creating list:", error)
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to create list. Please try again.",
          variant: "destructive",
        })
      }
      throw error
    }
  }

  // Clear all filters
  const clearFilters = () => {
    if (!isMountedRef.current) return
    setSearchQuery("")
    setActiveFilters({
      tags: [],
      dateRange: null,
      campaignUsage: null,
      lists: [],
    })
    setAdvancedSearchCriteria({
      columnFilters: [],
      tagFilter: null,
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      logicalOperator: "AND",
    })
    // Close advanced search panel when clearing filters
    setAdvancedSearchOpen(false)
  }

  // Handle advanced search
  const handleAdvancedSearch = (criteria: AdvancedSearchCriteria) => {
    setAdvancedSearchCriteria(criteria)
    setCurrentPage(1) // Reset to first page when applying advanced search
  }

  // Clear advanced search
  const clearAdvancedSearch = () => {
    setAdvancedSearchCriteria({
      columnFilters: [],
      tagFilter: null,
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      logicalOperator: "AND",
    })
  }

  const handleOpenCampaignModal = (
    campaigns: { id: string; orderId: string; mailedDate: string }[],
    title: string,
    isList = false,
    recordCount = 0,
  ) => {
    setSelectedCampaigns(campaigns)
    setCampaignModalTitle(title)
    setCampaignModalOpen(true)
  }

  const handleCreateCampaignList = () => {
    if (!isMountedRef.current) return

    // For now, just show a toast notification
    toast({
      title: "Create Campaign List",
      description: "Campaign list creation functionality will be implemented soon.",
    })

    // In a real implementation, this would open a modal or navigate to a campaign creation page
    // router.push(`/mailing-services/create-campaign?selectedRecords=${selectedRecords.join(',')}`)
  }

  // Define column definitions for advanced search
  const recordColumns = [
    { id: "firstName", name: "First Name", type: "text", autoSize: true },
    { id: "lastName", name: "Last Name", type: "text", autoSize: true },
    { id: "address", name: "Address", type: "text", autoSize: true },
    { id: "city", name: "City", type: "text", autoSize: true },
    { id: "state", name: "State", type: "text", autoSize: true },
    { id: "zipCode", name: "Zip Code", type: "text", autoSize: true },
    { id: "listName", name: "List Name", type: "text", autoSize: true },
    { id: "status", name: "Status", type: "select", autoSize: true },
    { id: "createdDate", name: "Created Date", type: "date", autoSize: true },
    { id: "createdBy", name: "Created By", type: "text", autoSize: true },
    { id: "modifiedDate", name: "Modified Date", type: "date", autoSize: true },
    { id: "modifiedBy", name: "Modified By", type: "text", autoSize: true },
  ]

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Error loading mailing lists</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 flex-wrap">
            <li className="inline-flex items-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <li className="inline-flex items-center">
              <Link
                href="/mailing-services"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Mailing Services
              </Link>
            </li>
            <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <li className="inline-flex items-center">
              <span className="text-sm font-medium text-foreground">Mailing List Manager</span>
            </li>
          </ol>
        </nav>
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{viewMode === "lists" ? "Mailing Lists" : "All Records"}</h1>
        <div className="flex gap-2">
          <YellowHoverButton variant="outline" onClick={toggleViewMode} className="flex items-center gap-2">
            {viewMode === "lists" ? (
              <>
                <Users className="h-4 w-4" />
                View Records
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                View Lists
              </>
            )}
          </YellowHoverButton>
          <YellowHoverButton onClick={() => (viewMode === "lists" ? setAddListOpen(true) : setAddRecordOpen(true))}>
            <Plus className="mr-2 h-4 w-4" />
            {viewMode === "lists" ? "Add New List" : "Add New Record"}
          </YellowHoverButton>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-2 bg-card p-4 rounded-md border">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Search bar with fixed width */}
            <div className="relative w-full md:w-[300px] flex-shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  viewMode === "lists" ? "Search lists by name or tag" : "Search records by name, address, or list"
                }
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Advanced Search controls - Show for both Lists and Records views */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <YellowHoverButton
                variant="outline"
                size="icon"
                onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                className={advancedSearchOpen ? "bg-primary text-primary-foreground" : "bg-background"}
                aria-label="Advanced Search"
                title="Advanced Search"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </YellowHoverButton>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <YellowHoverButton variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(activeFilters.tags.length > 0 ||
                    activeFilters.dateRange ||
                    activeFilters.campaignUsage ||
                    activeFilters.lists.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilters.tags.length +
                        (activeFilters.dateRange ? 1 : 0) +
                        (activeFilters.campaignUsage ? 1 : 0) +
                        activeFilters.lists.length}
                    </Badge>
                  )}
                </YellowHoverButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {viewMode === "lists" ? (
                  <>
                    <div className="p-2">
                      <p className="font-medium mb-2">Filter by tag</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {tags?.map((tag) => (
                          <div key={tag.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tag-${tag.id}`}
                              className="mr-2"
                              checked={activeFilters.tags.includes(tag.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    tags: [...prev.tags, tag.id],
                                  }))
                                } else {
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    tags: prev.tags.filter((id) => id !== tag.id),
                                  }))
                                }
                              }}
                            />
                            <label htmlFor={`tag-${tag.id}`} className="text-sm">
                              {tag.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <p className="font-medium mb-2">Filter by date</p>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="date-all"
                            name="date-filter"
                            className="mr-2"
                            checked={!activeFilters.dateRange}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                dateRange: null,
                              }))
                            }}
                          />
                          <label htmlFor="date-all" className="text-sm">
                            All time
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="date-30"
                            name="date-filter"
                            className="mr-2"
                            checked={activeFilters.dateRange === "last30days"}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                dateRange: "last30days",
                              }))
                            }}
                          />
                          <label htmlFor="date-30" className="text-sm">
                            Last 30 days
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="date-90"
                            name="date-filter"
                            className="mr-2"
                            checked={activeFilters.dateRange === "last90days"}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                dateRange: "last90days",
                              }))
                            }}
                          />
                          <label htmlFor="date-90" className="text-sm">
                            Last 90 days
                          </label>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <div className="p-2">
                      <p className="font-medium mb-2">Filter by usage</p>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="usage-all"
                            name="usage-filter"
                            className="mr-2"
                            checked={!activeFilters.campaignUsage}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                campaignUsage: null,
                              }))
                            }}
                          />
                          <label htmlFor="usage-all" className="text-sm">
                            All lists
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="usage-used"
                            name="usage-filter"
                            className="mr-2"
                            checked={activeFilters.campaignUsage === "used"}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                campaignUsage: "used",
                              }))
                            }}
                          />
                          <label htmlFor="usage-used" className="text-sm">
                            Used in campaigns
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="usage-unused"
                            name="usage-filter"
                            className="mr-2"
                            checked={activeFilters.campaignUsage === "unused"}
                            onChange={() => {
                              setActiveFilters((prev) => ({
                                ...prev,
                                campaignUsage: "unused",
                              }))
                            }}
                          />
                          <label htmlFor="usage-unused" className="text-sm">
                            Unused
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-2">
                    <p className="font-medium mb-2">Filter by list</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {lists?.map((list) => (
                        <div key={list.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`list-${list.id}`}
                            className="mr-2"
                            checked={activeFilters.lists.includes(list.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  lists: [...prev.lists, list.id],
                                }))
                              } else {
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  lists: prev.lists.filter((id) => id !== list.id),
                                }))
                              }
                            }}
                          />
                          <label htmlFor={`list-${list.id}`} className="text-sm">
                            {list.name} ({list.recordCount.toLocaleString()} records)
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem className="justify-center text-center" onClick={clearFilters}>
                  Clear all filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <Select
              value={`${sortBy.column}-${sortBy.direction}`}
              onValueChange={(value) => {
                const [column, direction] = value.split("-") as [string, "asc" | "desc"]
                setSortBy({ column, direction })
              }}
            >
              <SelectTrigger className="w-[180px] yellow-hover-button">
                <div className="flex items-center">
                  <SortDesc className="mr-2 h-4 w-4" />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {viewMode === "lists" ? (
                  <>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="recordCount-desc">Record Count (High-Low)</SelectItem>
                    <SelectItem value="recordCount-asc">Record Count (Low-High)</SelectItem>
                    <SelectItem value="createdAt-desc">Created Date (Newest-Oldest)</SelectItem>
                    <SelectItem value="createdAt-asc">Created Date (Oldest-Newest)</SelectItem>
                    <SelectItem value="createdBy-asc">Created By A-Z</SelectItem>
                    <SelectItem value="createdBy-desc">Created By Z-A</SelectItem>
                    <SelectItem value="modifiedDate-desc">Modified Date (Newest-Oldest)</SelectItem>
                    <SelectItem value="modifiedDate-asc">Modified Date (Oldest-Newest)</SelectItem>
                    <SelectItem value="modifiedBy-asc">Modified By A-Z</SelectItem>
                    <SelectItem value="modifiedBy-desc">Modified By Z-A</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="address-asc">Address A-Z</SelectItem>
                    <SelectItem value="address-desc">Address Z-A</SelectItem>
                    <SelectItem value="city-asc">City A-Z</SelectItem>
                    <SelectItem value="city-desc">City Z-A</SelectItem>
                    <SelectItem value="state-asc">State A-Z</SelectItem>
                    <SelectItem value="state-desc">State Z-A</SelectItem>
                    <SelectItem value="zipCode-asc">Zip Code (Low-High)</SelectItem>
                    <SelectItem value="zipCode-desc">Zip Code (High-Low)</SelectItem>
                    <SelectItem value="listName-asc">List Name A-Z</SelectItem>
                    <SelectItem value="listName-desc">List Name Z-A</SelectItem>
                    <SelectItem value="createdDate-asc">Created Date (Oldest-Newest)</SelectItem>
                    <SelectItem value="createdDate-desc">Created Date (Newest-Oldest)</SelectItem>
                    <SelectItem value="createdBy-asc">Created By A-Z</SelectItem>
                    <SelectItem value="createdBy-desc">Created By Z-A</SelectItem>
                    <SelectItem value="modifiedDate-desc">Modified Date (Newest-Oldest)</SelectItem>
                    <SelectItem value="modifiedDate-asc">Modified Date (Oldest-Newest)</SelectItem>
                    <SelectItem value="modifiedBy-asc">Modified By A-Z</SelectItem>
                    <SelectItem value="modifiedBy-desc">Modified By Z-A</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Clear Basic Filters Button (only shown when basic filters are active) */}
            {(activeFilters.tags.length > 0 ||
              activeFilters.dateRange ||
              activeFilters.campaignUsage ||
              activeFilters.lists.length > 0 ||
              searchQuery) && (
              <YellowHoverButton variant="ghost" onClick={clearFilters} className="h-10">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </YellowHoverButton>
            )}
          </div>
        </div>

        {/* Advanced Search Section - Show for both Lists and Records views */}
        <div className="-mt-2">
          <AdvancedSearch
            isOpen={advancedSearchOpen}
            lists={lists || []}
            tags={tags || []}
            columns={
              viewMode === "records"
                ? recordColumns
                : [
                    { id: "name", name: "List Name", type: "text" },
                    { id: "recordCount", name: "Record Count", type: "number" },
                    { id: "createdAt", name: "Created Date", type: "date" },
                    { id: "createdBy", name: "Created By", type: "text" },
                    { id: "modifiedDate", name: "Modified Date", type: "date" },
                    { id: "modifiedBy", name: "Modified By", type: "text" },
                  ]
            }
            initialCriteria={advancedSearchCriteria}
            onCriteriaChange={(criteria) => {
              setAdvancedSearchCriteria(criteria)
              // Reset to first page when applying advanced search
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Mobile List View */}
      {isMobile && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : viewMode === "lists" ? (
            paginatedItems.length === 0 ? (
              <div className="text-center p-8 border rounded-md">
                <p className="text-muted-foreground">No mailing lists found</p>
                {(activeFilters.tags.length > 0 ||
                  activeFilters.dateRange ||
                  activeFilters.campaignUsage ||
                  searchQuery) && (
                  <YellowHoverButton variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </YellowHoverButton>
                )}
              </div>
            ) : (
              paginatedItems.map((list) => (
                <MobileListCard
                  key={list.id}
                  list={list}
                  onEdit={() => setEditListId(list.id)}
                  onDelete={() => setDeleteListId(list.id)}
                  onUseInOrder={() => handleUseInOrder(list.id)}
                  onNameEdit={() => handleNameEdit(list.id, list.name)}
                  onAddTag={(tagId) => handleAddTag(list.id, tagId)}
                  onRemoveTag={(tagId) => handleRemoveTag(list.id, tagId)}
                  availableTags={tags || []}
                />
              ))
            )
          ) : // Records view for mobile
          paginatedItems.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No records found</p>
              {(activeFilters.lists.length > 0 ||
                searchQuery ||
                advancedSearchCriteria.columnFilters.length > 0 ||
                advancedSearchCriteria.tagFilter ||
                advancedSearchCriteria.mailingHistoryFilter ||
                advancedSearchCriteria.recordCountFilter ||
                advancedSearchCriteria.listFilter) && (
                <YellowHoverButton variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </YellowHoverButton>
              )}
            </div>
          ) : (
            paginatedItems.map((record: Record) => (
              <MobileRecordCard
                key={record.id}
                record={record}
                onDelete={() => setDeleteListId(record.listId)}
                onUseInOrder={() => handleUseInOrder(record.listId)}
                onAddTag={(tagId) => handleAddTag(record.listId, tagId)}
                onRemoveTag={(tagId) => handleRemoveTag(record.listId, tagId)}
                onFieldEdit={(id, field, value) => {
                  // In a real implementation, this would update the record in the database
                  toast({
                    title: "Record updated",
                    description: `Record field "${field}" has been updated.`,
                  })
                }}
                onUpdateStatus={(id, status) => handleUpdateRecordStatus(id, status)}
                availableTags={tags || []}
              />
            ))
          )}
        </div>
      )}

      {/* Mobile Pagination Controls */}
      {isMobile && (
        <MobilePaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={viewMode === "lists" ? filteredLists.length : filteredRecords.length}
          itemsPerPageOptions={itemsPerPageOptions}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count)
            setCurrentPage(1) // Reset to first page when changing items per page
          }}
        />
      )}

      {/* Top Pagination Controls (Desktop Only) */}
      {!isMobile && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={viewMode === "lists" ? filteredLists.length : filteredRecords.length}
          itemsPerPageOptions={itemsPerPageOptions}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count)
            setCurrentPage(1) // Reset to first page when changing items per page
          }}
          itemLabel={viewMode === "lists" ? "lists" : "records"}
        />
      )}

      {/* Desktop Table View */}
      {!isMobile && (
        <div className="rounded-md border overflow-hidden">
          {viewMode === "lists" ? (
            <ListsTable
              lists={paginatedItems}
              selectedRecords={selectedRecords}
              onCheckboxToggle={handleCheckboxToggle}
              selectAll={selectAll}
              onSelectAllChange={handleSelectAllChange}
              sortBy={sortBy}
              onSort={handleSort}
              onEdit={(id) => setEditListId(id)}
              onDelete={(id) => setDeleteListId(id)}
              onNameEdit={handleNameEdit}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              availableTags={tags || []}
              editingName={editingName}
              saveNameEdit={saveNameEdit}
              setEditingName={setEditingName}
              onOpenCampaignModal={handleOpenCampaignModal}
            />
          ) : (
            <RecordsTable
              records={paginatedItems}
              selectedRecords={selectedRecords}
              onCheckboxToggle={handleCheckboxToggle}
              selectAll={selectAll}
              onSelectAllChange={handleSelectAllChange}
              sortBy={sortBy}
              onSort={handleSort}
              onDelete={(id) => setDeleteListId(id)}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onUpdateStatus={handleUpdateRecordStatus}
              onRecordFieldEdit={handleRecordFieldEdit}
              editingRecord={editingRecord}
              saveRecordFieldEdit={saveRecordFieldEdit}
              setEditingRecord={setEditingRecord}
              availableTags={tags || []}
              onOpenCampaignModal={handleOpenCampaignModal}
              onCreateCampaignList={handleCreateCampaignList}
            />
          )}
        </div>
      )}

      {/* Bottom Pagination Controls */}
      {!isMobile && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={viewMode === "lists" ? filteredLists.length : filteredRecords.length}
          itemsPerPageOptions={itemsPerPageOptions}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count)
            setCurrentPage(1) // Reset to first page when changing items per page
          }}
          itemLabel={viewMode === "lists" ? "lists" : "records"}
        />
      )}

      {/* Modals */}
      <AddListModal
        open={addListOpen}
        onOpenChange={setAddListOpen}
        onSuccess={(newList) => {
          mutate([...(lists || []), newList])
          toast({
            title: "List added",
            description: `List "${newList.name}" has been added.`,
          })
        }}
      />

      <AddRecordModal
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        lists={lists}
        onCreateNewList={handleCreateNewList}
        onSuccess={(newRecord) => {
          // In a real implementation, this would update the database
          // For this demo, we'll just show a success toast
          toast({
            title: "Record added",
            description: `Record for ${newRecord.firstName} ${newRecord.lastName} has been added to ${newRecord.listName}.`,
          })
        }}
      />

      <EditListModal
        open={!!editListId}
        onOpenChange={() => setEditListId(null)}
        listId={editListId}
        onSuccess={(updatedList) => {
          mutate(lists?.map((list) => (list.id === updatedList.id ? updatedList : list)))
          toast({
            title: "List updated",
            description: `List "${updatedList.name}" has been updated.`,
          })
          setEditListId(null)
        }}
      />

      <DeleteConfirmModal
        open={!!deleteListId}
        onOpenChange={() => setDeleteListId(null)}
        onConfirm={() => deleteListId && handleDeleteList(deleteListId)}
      />

      <CampaignUsageModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        campaigns={selectedCampaigns}
        title={campaignModalTitle}
        isList={campaignModalTitle.includes("List") || campaignModalTitle.includes("list")}
        recordCount={lists?.find((list) => campaignModalTitle.includes(list.name))?.recordCount || 0}
      />
    </div>
  )
}
