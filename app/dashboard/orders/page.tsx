"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Filter, ArrowUpDown, Eye, Package, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OrderStatusBadge, orderStatusLabel } from "@/components/orders/order-status-badge"
import { ORDER_STATUS_STEPS, type OrderSummary } from "@/lib/orders/order-summary"

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/orders")
      if (!res.ok) throw new Error("Failed to load your orders")
      const data = await res.json()
      setOrders(data.orders ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase())
          const matchesStatus = statusFilter === "all" || order.displayStatus === statusFilter
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
          const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
          if (sortBy === "recent") return bTime - aTime
          if (sortBy === "oldest") return aTime - bTime
          if (sortBy === "total-high") return b.total - a.total
          if (sortBy === "total-low") return a.total - b.total
          return 0
        }),
    [orders, searchQuery, statusFilter, sortBy]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <Button asChild>
          <Link href="/orders/new?source=dashboard_create_new">Place New Order</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order id..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUS_STEPS.map((s) => (
                <SelectItem key={s.status} value={s.status}>
                  {orderStatusLabel(s.status)}
                </SelectItem>
              ))}
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rejected">Proof rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[190px]">
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !error && filteredOrders.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery || statusFilter !== "all" ? "No orders found" : "No orders yet"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Your direct mail campaigns will appear here once you place your first order."}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/orders/new?source=dashboard_create_new">Place New Order</Link>
          </Button>
        </div>
      ) : !error ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell className="font-mono font-medium">
                    #{order.id.split("-")[0].toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {order.submittedAt ? new Date(order.submittedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{order.recordCount > 0 ? order.recordCount.toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.displayStatus} />
                  </TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/new?reorderId=${order.id}&source=previous_orders_reorder`}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reorder
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
