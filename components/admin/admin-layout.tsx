'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from 'next-themes';
import { adminNavItems } from './admin-nav-items';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { setTheme } = useTheme();

  // Force dark mode in admin panel
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  const closeSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-end px-4 border-b lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-4">
            {/* Admin Header */}
            <div className="h-[4.3125rem] border-b flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-foreground -mt-[0.125rem]">
                Admin Panel
              </span>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Admin
              </Badge>
            </div>

            {/* Back to Dashboard */}
            <div className="px-2 pt-3 pb-1">
              <Link
                href="/dashboard"
                onClick={closeSidebar}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="mr-3 h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1 px-2 py-2">
              {adminNavItems.map((item) => {
                const isActive =
                  item.href === '/dashboard/admin'
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-400'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Mobile Header */}
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
              {adminNavItems.find(
                (item) =>
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`)
              )?.name || 'Admin Panel'}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
