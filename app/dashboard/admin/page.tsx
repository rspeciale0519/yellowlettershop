'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingBag, DollarSign, BarChart3, Server, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface QuickStat {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Users;
  href: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
}

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
}

const statusDot: Record<string, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500 animate-pulse',
  down: 'bg-red-500 animate-pulse',
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<QuickStat[]>([
    { title: 'Total Users', value: '—', subtitle: 'Loading...', icon: Users, href: '/dashboard/admin/users' },
    { title: 'Total Orders', value: '—', subtitle: 'Loading...', icon: ShoppingBag, href: '/dashboard/admin/orders' },
    { title: 'Revenue', value: '—', subtitle: 'Loading...', icon: DollarSign, href: '/dashboard/admin/analytics' },
    { title: 'Avg Order Value', value: '—', subtitle: 'Loading...', icon: BarChart3, href: '/dashboard/admin/analytics' },
  ]);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    const [metricsRes, healthRes, activityRes] = await Promise.all([
      fetch('/api/admin/analytics', { headers }).catch(() => null),
      fetch('/api/admin/health', { headers }).catch(() => null),
      fetch('/api/admin/pricing/history?limit=5', { headers }).catch(() => null),
    ]);

    if (metricsRes?.ok) {
      const { data } = await metricsRes.json();
      const m = data.metrics;
      setStats([
        { title: 'Total Users', value: String(m.users.total), subtitle: `${m.users.newThisMonth} new this month`, icon: Users, href: '/dashboard/admin/users' },
        { title: 'Total Orders', value: String(m.orders.total), subtitle: `${m.orders.thisMonth} this month`, icon: ShoppingBag, href: '/dashboard/admin/orders' },
        { title: 'Revenue', value: `$${m.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: `$${m.revenue.thisMonth.toFixed(2)} this month`, icon: DollarSign, href: '/dashboard/admin/analytics' },
        { title: 'Avg Order Value', value: `$${m.averageOrderValue.toFixed(2)}`, subtitle: 'Across all orders', icon: BarChart3, href: '/dashboard/admin/analytics' },
      ]);
    }

    if (healthRes?.ok) {
      const { data } = await healthRes.json();
      setHealth(data.services);
    }

    if (activityRes?.ok) {
      const { data } = await activityRes.json();
      setRecentActivity(data?.slice?.(0, 5) ?? []);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8 animate-admin-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and quick actions.</p>
      </div>

      {/* Quick Stats — linked to detail pages */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 admin-stagger">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="relative overflow-hidden group hover:shadow-md hover:border-red-500/20 transition-all cursor-pointer">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
              System Health
            </CardTitle>
            <Link href="/dashboard/admin/settings" className="text-xs text-red-500 hover:underline flex items-center gap-1">
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {health.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Loading health checks...</p>
            ) : (
              <div className="space-y-3">
                {health.map((service) => (
                  <div key={service.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${statusDot[service.status]}`} />
                      <span className="text-sm font-mono">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.latencyMs !== null && (
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                          {service.latencyMs}ms
                        </span>
                      )}
                      <Badge variant="outline" className={`text-[10px] font-mono ${
                        service.status === 'healthy' ? 'text-emerald-600 border-emerald-500/30' :
                        service.status === 'degraded' ? 'text-amber-600 border-amber-500/30' :
                        'text-red-500 border-red-500/30'
                      }`}>
                        {service.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
                { label: 'View Orders', href: '/dashboard/admin/orders', icon: ShoppingBag },
                { label: 'Update Pricing', href: '/dashboard/admin/pricing', icon: DollarSign },
                { label: 'View Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-transparent hover:border-red-500/20 hover:bg-muted/50 transition-all group cursor-pointer">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    <span className="text-sm font-medium group-hover:text-red-500 transition-colors">
                      {action.label}
                    </span>
                    <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground/30 group-hover:text-red-500/60 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
