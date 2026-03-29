'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Server, CreditCard, MapPin, Clock } from 'lucide-react';
import { HealthCardSkeleton } from '@/components/admin/admin-skeleton';
import { createClient } from '@/utils/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  message: string;
}

interface HealthData {
  overall: string;
  services: ServiceStatus[];
  checkedAt: string;
  environment: string;
}

const statusDot: Record<string, string> = {
  healthy: 'bg-emerald-500 shadow-emerald-500/50',
  degraded: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
  down: 'bg-red-500 shadow-red-500/50 animate-pulse',
};

const serviceIcon: Record<string, typeof Server> = {
  Supabase: Server,
  Stripe: CreditCard,
  AccuZip: MapPin,
};

export default function AdminSettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = createClient();

  const fetchHealth = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/health', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { data } = await res.json();
        setHealth(data);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  return (
    <div className="space-y-8 animate-admin-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">Platform health and configuration.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHealth(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
            System Health
          </h2>
          {health && (
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${statusDot[health.overall]}`} />
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {health.overall}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <HealthCardSkeleton key={i} />
            ))}
          </div>
        ) : health ? (
          <div className="grid gap-4 md:grid-cols-3">
            {health.services.map((service) => {
              const Icon = serviceIcon[service.name] ?? Server;
              const dot = statusDot[service.status];

              return (
                <Card key={service.name} className="relative overflow-hidden">
                  {/* Status bar at top */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                    service.status === 'healthy' ? 'bg-emerald-500' :
                    service.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{service.name}</span>
                      </CardTitle>
                      <span className={`h-3 w-3 rounded-full shadow-lg ${dot}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        service.status === 'healthy' ? 'border-emerald-500/30 text-emerald-600' :
                        service.status === 'degraded' ? 'border-amber-500/30 text-amber-600' :
                        'border-red-500/30 text-red-500'
                      }`}
                    >
                      {service.status.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{service.message}</p>
                    {service.latencyMs !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono tabular-nums">{service.latencyMs}ms</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Failed to load health data.</p>
        )}

        {health?.checkedAt && (
          <p className="text-[11px] text-muted-foreground/50 mt-3 font-mono">
            Last checked: {new Date(health.checkedAt).toLocaleString()} · {health.environment}
          </p>
        )}
      </div>

      {/* Platform Info */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Application</span>
              <span className="font-mono font-medium">Yellow Letter Shop</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-mono font-medium">Next.js 15</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Database</span>
              <span className="font-mono font-medium">Supabase (PostgreSQL)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Payments</span>
              <span className="font-mono font-medium">Stripe (Test Mode)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Address Validation</span>
              <span className="font-mono font-medium">AccuZip</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">Hosting</span>
              <span className="font-mono font-medium">Vercel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
