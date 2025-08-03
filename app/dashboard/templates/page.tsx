"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Search, Plus, MoreHorizontal, Filter, ArrowUpDown, Pencil, Copy, Trash, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data for templates
const mockTemplates = [
  {
    id: "t1",
    name: "Yellow Letter - Property Offer",
    type: "Yellow Letter",
    created: "2023-10-15",
    lastUsed: "2023-11-20",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "t2",
    name: "Postcard - Real Estate",
    type: "Postcard",
    created: "2023-09-05",
    lastUsed: "2023-11-18",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "t3",
    name: "Brochure - Investment Properties",
    type: "Brochure",
    created: "2023-11-01",
    lastUsed: "2023-11-15",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "t4",
    name: "Business Card - Real Estate Agent",
    type: "Business Card",
    created: "2023-08-22",
    lastUsed: "2023-10-30",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "t5",
    name: "Flyer - Open House",
    type: "Flyer",
    created: "2023-10-10",
    lastUsed: "2023-11-05",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "t6",
    name: "Letter - Follow Up",
    type: "Letter",
    created: "2023-09-18",
    lastUsed: "2023-11-10",
    thumbnail: "/placeholder.svg?height=200&width=300",
  },
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [templateType, setTemplateType] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Filter and sort templates
  const filteredTemplates = mockTemplates
    .filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = templateType === "all" || template.type.toLowerCase() === templateType.toLowerCase()
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      } else if (sortBy === "created") {
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      }
      return 0
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Saved Templates</h1>
        <Button asChild>
          <Link href="/dashboard/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="yellow letter">Yellow Letter</SelectItem>
              <SelectItem value="postcard">Postcard</SelectItem>
              <SelectItem value="brochure">Brochure</SelectItem>
              <SelectItem value="business card">Business Card</SelectItem>
              <SelectItem value="flyer">Flyer</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Used</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || templateType !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating a new template"}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="relative aspect-[3/2] bg-muted">
                <img
                  src={template.thumbnail || "/placeholder.svg"}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedTemplate(template.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{template.type}</span>
                    <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Handle delete logic here
                setDeleteDialogOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
