"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAsset } from '@/types/supabase'
import {
  Star,
  Clock,
  Copy,
  Download,
  Trash2,
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
  Heart,
  Activity,
} from "lucide-react"

interface OrganizationFeaturesProps {
  isOpen: boolean
  onClose: () => void
  allFiles: UserAsset[]
  favorites: Set<string>
  onToggleFavorite: (fileId: string) => void
  onBulkDownload: (fileIds: string[]) => void
  formatFileSize: (size: number) => string
  recentFiles: UserAsset[]
  duplicateGroups: UserAsset[][]
  storageStats: {
    used: number
    total: number
    byType: Record<string, number>
  }
}

export function OrganizationFeatures({
  isOpen,
  onClose,
  allFiles,
  favorites,
  onToggleFavorite,
  onBulkDownload,
  formatFileSize,
  recentFiles,
  duplicateGroups,
  storageStats
}: OrganizationFeaturesProps) {
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set())

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4 text-blue-500" />
      case "pdf":
        return <FilePdf className="h-4 w-4 text-red-500" />
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const favoriteFiles = allFiles.filter(file => favorites.has(file.id))

  const handleSelectDuplicate = (fileId: string, selected: boolean) => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  const handleBulkFavoriteDownload = () => {
    const favoriteIds = favoriteFiles.map(f => f.id)
    onBulkDownload(favoriteIds)
  }

  const calculateStoragePercentage = () => {
    return Math.round((storageStats.used / storageStats.total) * 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Media Organization
          </DialogTitle>
          <DialogDescription>
            Manage your favorites, recent files, duplicates, and storage usage
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              <Clock className="h-4 w-4 mr-1" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="text-xs">
              <Copy className="h-4 w-4 mr-1" />
              Duplicates
            </TabsTrigger>
            <TabsTrigger value="storage" className="text-xs">
              <Activity className="h-4 w-4 mr-1" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs">
              <Download className="h-4 w-4 mr-1" />
              Bulk Actions
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Favorite Files</h3>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {favoriteFiles.length} favorited
                </Badge>
                {favoriteFiles.length > 0 && (
                  <Button size="sm" onClick={handleBulkFavoriteDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[400px]">
              {favoriteFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Heart className="h-12 w-12 mb-4" />
                  <p>No favorite files yet</p>
                  <p className="text-sm">Star files to add them to your favorites</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteFiles.map((file) => (
                    <Card key={file.id} className="p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onToggleFavorite(file.id)}
                        >
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Recent Files Tab */}
          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recently Uploaded</h3>
              <Badge variant="secondary">
                Last 10 uploads
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {recentFiles.map((file) => (
                  <Card key={file.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onToggleFavorite(file.id)}
                      >
                        <Star className={`h-4 w-4 ${favorites.has(file.id) ? 'fill-current text-yellow-500' : ''}`} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Duplicates Tab */}
          <TabsContent value="duplicates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Duplicate Files</h3>
              <div className="flex gap-2">
                <Badge variant="destructive">
                  {duplicateGroups.length} groups found
                </Badge>
                {selectedDuplicates.size > 0 && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      // Handle bulk delete of selected duplicates
                      console.log('Delete selected duplicates:', Array.from(selectedDuplicates))
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected ({selectedDuplicates.size})
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[400px]">
              {duplicateGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Copy className="h-12 w-12 mb-4" />
                  <p>No duplicate files found</p>
                  <p className="text-sm">Your media library is well organized!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateGroups.map((group, groupIndex) => (
                    <Card key={groupIndex}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Duplicate Group {groupIndex + 1}
                          <Badge variant="outline" className="ml-2">
                            {group.length} files
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {group.map((file, fileIndex) => (
                          <div key={file.id} className="flex items-center gap-3 p-2 rounded border">
                            <input
                              type="checkbox"
                              checked={selectedDuplicates.has(file.id)}
                              onChange={(e) => handleSelectDuplicate(file.id, e.target.checked)}
                              className="rounded"
                            />
                            {getFileIcon(file.file_type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {fileIndex === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Keep Original
                              </Badge>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Storage Usage</CardTitle>
                  <CardDescription>
                    {formatFileSize(storageStats.used)} of {formatFileSize(storageStats.total)} used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Used Space</span>
                      <span>{calculateStoragePercentage()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          calculateStoragePercentage() > 90 
                            ? 'bg-red-500' 
                            : calculateStoragePercentage() > 75 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${calculateStoragePercentage()}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Storage by File Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(storageStats.byType).map(([type, size]) => (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getFileIcon(type)}
                          <span className="capitalize">{type}s</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatFileSize(size)}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((size / storageStats.used) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bulk Actions Tab */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Perform bulk operations on your media library
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => onBulkDownload(allFiles.map(f => f.id))}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All Files
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleBulkFavoriteDownload}
                    disabled={favoriteFiles.length === 0}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Download Favorites ({favoriteFiles.length})
                  </Button>

                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => onBulkDownload(recentFiles.map(f => f.id))}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Download Recent Files ({recentFiles.length})
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Files:</span>
                      <span className="ml-2">{allFiles.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Favorites:</span>
                      <span className="ml-2">{favoriteFiles.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">This Week:</span>
                      <span className="ml-2">{recentFiles.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duplicates:</span>
                      <span className="ml-2">{duplicateGroups.flat().length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}