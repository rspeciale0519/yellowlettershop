"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  User,
  Shield,
  Users,
  ImageIcon,
  Activity,
  Bell,
  Key,
  Tag,
  Menu,
  X,
  LogOut,
  CreditCard,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAdmin } from "@/hooks/use-admin"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { isAdmin } = useAdmin()

  useEffect(() => {
    setIsSidebarOpen(isDesktop)
  }, [isDesktop])

  const closeSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false)
    }
  }

  // Admin routes use their own layout — skip the dashboard sidebar entirely
  // This check must be AFTER all hooks to avoid React hook ordering violations
  if (pathname?.startsWith("/dashboard/admin")) {
    return <>{children}</>
  }

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Saved Templates", href: "/dashboard/templates", icon: FileText },
    { name: "Order History", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Contact Cards", href: "/dashboard/contact-cards", icon: CreditCard },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Security", href: "/dashboard/security", icon: Shield },
    { name: "Team Management", href: "/dashboard/team-management", icon: Users },
    { name: "Media Library", href: "/dashboard/media", icon: ImageIcon },
    { name: "Tag Manager", href: "/dashboard/tags", icon: Tag },
    { name: "Activity Logs", href: "/dashboard/activity", icon: Activity },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-end px-4 border-b lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 py-4">
            <div className="h-[4.3125rem] border-b flex items-center justify-center">
              <Link href="/dashboard" className="text-2xl font-bold text-foreground -mt-[0.875rem]">
                YLS Dashboard
              </Link>
            </div>
            <nav className="space-y-1 px-2 py-4">
              {navigationItems.map((item) => {
                // For dashboard home, only exact match; for other items, allow sub-paths
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || (pathname?.startsWith(`${item.href}/`) && item.href !== "/dashboard")

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#F6CF62] text-black"
                        : "text-muted-foreground hover:bg-[#F6CF62] hover:text-black"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? "text-black" : "text-muted-foreground group-hover:text-black"
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Admin Panel Link */}
            {isAdmin && (
              <div className="px-2 pt-4 border-t mt-4">
                <Link
                  href="/dashboard/admin"
                  onClick={closeSidebar}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/dashboard/admin")
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  }`}
                >
                  <ShieldAlert
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      pathname?.startsWith("/dashboard/admin")
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-400"
                    }`}
                  />
                  Admin Panel
                </Link>
              </div>
            )}
          </ScrollArea>
          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/login">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Mobile-only Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm lg:hidden">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {navigationItems.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))?.name ||
                "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
