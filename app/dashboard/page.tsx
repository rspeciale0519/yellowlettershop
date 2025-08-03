import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, FileText, ImageIcon } from "lucide-react"
import Link from "next/link"
import { orders, activityItems } from "@/lib/data-structures"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="mr-4 rounded-full bg-primary/10 p-2">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
                href="/dashboard/templates/new"
                className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <FileText className="mr-3 h-4 w-4 text-primary" />
                Create New Template
              </Link>
              <Link
                href="/dashboard/media/upload"
                className="flex items-center rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <ImageIcon className="mr-3 h-4 w-4 text-primary" />
                Upload Media
              </Link>
              <Link
                href="/dashboard/orders/new"
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
