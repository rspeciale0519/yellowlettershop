"use client"

import { useState } from "react"
import { Search, Filter, ArrowUpDown, Download, Eye, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Update imports to use the new data structures file
import { orders } from "@/lib/data-structures"

// Mock data for orders
const mockOrders = orders

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Filter and sort orders
  const filteredOrders = mockOrders
    .filter((order) => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "total-high") {
        return b.total - a.total
      } else if (sortBy === "total-low") {
        return a.total - b.total
      }
      return 0
    })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-500"
      case "in transit":
        return "bg-blue-500"
      case "processing":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <Button asChild>
          <a href="/dashboard/orders/new">Place New Order</a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="in transit">In Transit</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <SelectItem value="total-high">Total (High to Low)</SelectItem>
              <SelectItem value="total-low">Total (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "You haven't placed any orders yet"}
          </p>
          <Button className="mt-4" asChild>
            <a href="/dashboard/orders/new">Place New Order</a>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`mr-2 h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                      {order.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        <Accordion type="single" collapsible className="w-full">
          {filteredOrders.map((order) => (
            <AccordionItem key={order.id} value={order.id}>
              <AccordionTrigger className="hover:bg-muted/50 px-4">
                <div className="flex items-center">
                  <span className="font-medium">{order.id}</span>
                  <Badge className="ml-4" variant={order.status.toLowerCase() === "delivered" ? "default" : "outline"}>
                    {order.status}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                      <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Items</h4>
                          <ul className="mt-2 space-y-2">
                            {order.items.map((item, index) => (
                              <li key={index} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity} × {item.name}
                                </span>
                                <span>${item.price.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Information</CardTitle>
                      <CardDescription>
                        {order.shipping.trackingNumber ? "Tracking available" : "No tracking available yet"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Shipping Method</h4>
                          <p className="text-sm text-muted-foreground">{order.shipping.method}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Shipping Address</h4>
                          <p className="text-sm text-muted-foreground">{order.shipping.address}</p>
                        </div>
                        {order.shipping.trackingNumber && (
                          <div>
                            <h4 className="font-medium">Tracking Number</h4>
                            <p className="text-sm text-muted-foreground">{order.shipping.trackingNumber}</p>
                            <Button variant="link" className="h-auto p-0 text-sm" asChild>
                              <a
                                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.shipping.trackingNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Track Package
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
