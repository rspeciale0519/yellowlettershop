"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  Grid,
  List,
  Filter,
  MoreHorizontal,
  Trash,
  Download,
  Edit,
  Copy,
  ImageIcon,
  File,
  FileText,
  FileImage,
  FileIcon as FilePdf,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data for media files
const mockMediaFiles = [
  {
    id: "m1",
    name: "Property Photo 1",
    type: "image",
    size: 1024000,
    created: "2023-11-15",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["property", "exterior"],
  },
  {
    id: "m2",
    name: "Investment Brochure",
    type: "pdf",
    size: 2048000,
    created: "2023-11-10",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["marketing", "brochure"],
  },
  {
    id: "m3",
    name: "Company Logo",
    type: "image",
    size: 512000,
    created: "2023-10-20",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["logo", "branding"],
  },
  {
    id: "m4",
    name: "Property Listing Document",
    type: "document",
    size: 1536000,
    created: "2023-11-05",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["property", "listing"],
  },
  {
    id: "m5",
    name: "Team Photo",
    type: "image",
    size: 1843200,
    created: "2023-10-25",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["team", "people"],
  },
  {
    id: "m6",
    name: "Market Analysis",
    type: "spreadsheet",
    size: 1228800,
    created: "2023-11-12",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["analysis", "data"],
  },
  {
    id: "m7",
    name: "Property Photo 2",
    type: "image",
    size: 921600,
    created: "2023-11-15",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["property", "interior"],
  },
  {
    id: "m8",
    name: "Client Contract Template",
    type: "document",
    size: 819200,
    created: "2023-10-30",
    url: "/placeholder.svg?height=200&width=300",
    tags: ["legal", "contract"],
  },
]

// All unique tags from media files
const allTags = Array.from(new Set(mockMediaFiles.flatMap((file) => file.tags)))

export default function MediaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<(typeof mockMediaFiles)[0] | null>(null)
  const [fileDetailsOpen, setFileDetailsOpen] = useState(false)

  // Filter media files based on search query, type, and tags
  const filteredMediaFiles = mockMediaFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || file.type === selectedType
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => file.tags.includes(tag))
    return matchesSearch && matchesType && matchesTags
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-6 w-6 text-blue-500" />
      case "pdf":
        return <FilePdf className="h-6 w-6 text-red-500" />
      case "document":
        return <FileText className="h-6 w-6 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-6 w-6 text-green-500" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-4 text-lg font-medium">Tags</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {allTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedTags.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelectedTags([])}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 md:col-span-9">
          {filteredMediaFiles.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No files found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || selectedType !== "all" || selectedTags.length > 0
                  ? "Try adjusting your search or filters"
                  : "Upload files to your media library"}
              </p>
              <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMediaFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden">
                  <div
                    className="relative aspect-[3/2] bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedFile(file)
                      setFileDetailsOpen(true)
                    }}
                  >
                    {file.type === "image" ? (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">{getFileIcon(file.type)}</div>
                    )}
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
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold truncate" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.created).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMediaFiles.map((file) => (
                    <tr key={file.id} className="border-b">
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSelectedFile(file)
                            setFileDetailsOpen(true)
                          }}
                        >
                          {getFileIcon(file.type)}
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{file.type}</td>
                      <td className="px-4 py-3">{formatFileSize(file.size)}</td>
                      <td className="px-4 py-3">{new Date(file.created).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>Upload files to your media library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Drag and drop files here or click to browse</p>
              <Input id="file-upload" type="file" className="hidden" multiple />
              <Label htmlFor="file-upload" className="mt-2 cursor-pointer text-sm text-primary hover:underline">
                Browse Files
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="e.g. property, marketing, logo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fileDetailsOpen} onOpenChange={setFileDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-center justify-center rounded-md border bg-muted p-2">
                {selectedFile.type === "image" ? (
                  <img
                    src={selectedFile.url || "/placeholder.svg"}
                    alt={selectedFile.name}
                    className="max-h-[200px] w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-[200px] w-full items-center justify-center">
                    {getFileIcon(selectedFile.type)}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedFile.type} file</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Created:</span>
                    <span>{new Date(selectedFile.created).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tags:</span>
                    <span>{selectedFile.tags.join(", ")}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
