import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, FileText, Mail, Inbox } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { summarizeOrderRow } from "@/lib/orders/order-summary"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import MediaUpload from "@/components/dashboard/media-upload"

export const dynamic = "force-dynamic"

async function loadDashboardData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { orderCount: 0, designCount: 0, campaignCount: 0, recentOrders: [] }

  const [orders, designs, campaigns, recent] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("created_by", user.id),
    supabase.from("saved_designs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("created_by", user.id),
    supabase
      .from("orders")
      .select("id, status, submitted_at, created_at, proof_urls, proof_approved_at, payment_status, amount_authorized, amount_captured, total_cost, record_count, mail_class, postage_type")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  return {
    orderCount: orders.count ?? 0,
    designCount: designs.count ?? 0,
    campaignCount: campaigns.count ?? 0,
    recentOrders: (recent.data ?? []).map(summarizeOrderRow),
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function DashboardPage() {
  const { orderCount, designCount, campaignCount, recentOrders } = await loadDashboardData()

  const stats = [
    { title: "Total Orders", value: orderCount, icon: Package },
    { title: "Saved Designs", value: designCount, icon: FileText },
    { title: "Campaigns", value: campaignCount, icon: Mail },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest campaigns and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="mb-1 text-sm font-medium">No orders yet</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Your campaigns will show up here once you place your first order.
                </p>
                <Link
                  href="/orders/new?source=dashboard_create_new"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Place your first order →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center rounded-md p-2 -mx-2 transition-colors hover:bg-muted"
                  >
                    <div className="mr-4 rounded-full bg-primary/10 p-2">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Order #{order.id.split("-")[0].toUpperCase()}
                        {order.recordCount > 0 && (
                          <span className="text-muted-foreground"> · {order.recordCount.toLocaleString()} pieces</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(order.submittedAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.displayStatus} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link
                href="/design/customize"
                className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <FileText className="mr-3 h-4 w-4 text-primary" />
                Create New Template
              </Link>
              <MediaUpload />
              <Link
                href="/orders/new?source=dashboard_create_new"
                className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <Package className="mr-3 h-4 w-4 text-primary" />
                Place New Order
              </Link>
              <Link
                href="/dashboard/users/invite"
                className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <Users className="mr-3 h-4 w-4 text-primary" />
                Invite Team Member
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
