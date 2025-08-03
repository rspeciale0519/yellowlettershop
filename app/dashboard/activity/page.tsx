"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  User,
  Package,
  Settings,
  Shield,
  Download,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data for activity logs
const mockActivityLogs = [
  {
    id: "a1",
    action: "Created template",
    details: "Yellow Letter - Property Offer",
    user: "John Doe",
    timestamp: "2023-11-20T14:30:25",
    category: "template",
    ip: "192.168.1.1",
  },
  {
    id: "a2",
    action: "Placed order",
    details: "Order #YLS-2023-0024",
    user: "John Doe",
    timestamp: "2023-11-20T12:15:10",
    category: "order",
    ip: "192.168.1.1",
  },
  {
    id: "a3",
    action: "Updated profile",
    details: "Changed email address",
    user: "John Doe",
    timestamp: "2023-11-19T09:45:33",
    category: "profile",
    ip: "192.168.1.1",
  },
  {
    id: "a4",
    action: "Uploaded media",
    details: "Property Photo 1.jpg",
    user: "John Doe",
    timestamp: "2023-11-18T16:20:45",
    category: "media",
    ip: "192.168.1.1",
  },
  {
    id: "a5",
    action: "Login",
    details: "Successful login",
    user: "John Doe",
    timestamp: "2023-11-18T08:05:12",
    category: "security",
    ip: "192.168.1.1",
  },
  {
    id: "a6",
    action: "Failed login attempt",
    details: "Invalid password",
    user: "Unknown",
    timestamp: "2023-11-17T22:30:18",
    category: "security",
    ip: "203.0.113.1",
  },
  {
    id: "a7",
    action: "Changed password",
    details: "Password updated successfully",
    user: "John Doe",
    timestamp: "2023-11-15T11:10:05",
    category: "security",
    ip: "192.168.1.1",
  },
  {
    id: "a8",
    action: "Invited user",
    details: "jane.smith@example.com",
    user: "John Doe",
    timestamp: "2023-11-14T14:25:30",
    category: "user",
    ip: "192.168.1.1",
  },
  {
    id: "a9",
    action: "Updated system settings",
    details: "Changed notification preferences",
    user: "John Doe",
    timestamp: "2023-11-12T10:40:15",
    category: "settings",
    ip: "192.168.1.1",
  },
  {
    id: "a10",
    action: "Deleted template",
    details: "Old Marketing Letter",
    user: "John Doe",
    timestamp: "2023-11-10T09:15:22",
    category: "template",
    ip: "192.168.1.1",
  },
]

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [dateRange, setDateRange] = useState("all")

  // Filter and sort activity logs
  const filteredLogs = mockActivityLogs
    .filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || log.category === categoryFilter

      const logDate = new Date(log.timestamp)
      const now = new Date()
      let matchesDateRange = true

      if (dateRange === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        matchesDateRange = logDate >= today
      } else if (dateRange === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        matchesDateRange = logDate >= weekAgo
      } else if (dateRange === "month") {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        matchesDateRange = logDate >= monthAgo
      }

      return matchesSearch && matchesCategory && matchesDateRange
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }
      return 0
    })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "template":
        return <FileText className="h-4 w-4" />
      case "order":
        return <Package className="h-4 w-4" />
      case "profile":
        return <User className="h-4 w-4" />
      case "media":
        return <FileText className="h-4 w-4" />
      case "security":
        return <Shield className="h-4 w-4" />
      case "user":
        return <User className="h-4 w-4" />
      case "settings":
        return <Settings className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "template":
        return "bg-blue-500"
      case "order":
        return "bg-green-500"
      case "profile":
        return "bg-purple-500"
      case "media":
        return "bg-yellow-500"
      case "security":
        return "bg-red-500"
      case "user":
        return "bg-indigo-500"
      case "settings":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getTimeSince = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) {
      return `${interval} year${interval === 1 ? "" : "s"} ago`
    }

    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) {
      return `${interval} month${interval === 1 ? "" : "s"} ago`
    }

    interval = Math.floor(seconds / 86400)
    if (interval >= 1) {
      return `${interval} day${interval === 1 ? "" : "s"} ago`
    }

    interval = Math.floor(seconds / 3600)
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? "" : "s"} ago`
    }

    interval = Math.floor(seconds / 60)
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? "" : "s"} ago`
    }

    return `${Math.floor(seconds)} second${seconds === 1 ? "" : "s"} ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="relative pl-6 border-l">
                  {filteredLogs.map((log, index) => (
                    <div key={log.id} className="mb-8 relative">
                      <div
                        className={`absolute -left-[13px] top-0 h-6 w-6 rounded-full ${getCategoryColor(log.category)} flex items-center justify-center text-white`}
                      >
                        {getCategoryIcon(log.category)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-base font-semibold">{log.action}</h3>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {log.category}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm">{log.details}</p>
                        <div className="mt-1 flex items-center text-xs text-muted-foreground">
                          <span>{log.user}</span>
                          <span className="mx-2">•</span>
                          <span title={formatTimestamp(log.timestamp)}>{getTimeSince(log.timestamp)}</span>
                          <span className="mx-2">•</span>
                          <span>IP: {log.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Table</CardTitle>
              <CardDescription>Detailed view of all activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.details}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 h-2 w-2 rounded-full ${getCategoryColor(log.category)}`} />
                            <span className="capitalize">{log.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell title={formatTimestamp(log.timestamp)}>{getTimeSince(log.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
