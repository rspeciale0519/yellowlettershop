'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MetricsCards } from '@/components/admin/analytics/metrics-cards';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { TopCustomersTable } from '@/components/admin/analytics/top-customers-table';
import { createClient } from '@/utils/supabase/client';

type Days = 7 | 30 | 90;

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [topCustomers, setTopCustomers] = useState<Record<string, unknown>[]>([]);
  const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
  const [days, setDays] = useState<Days>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  const supabase = createClient();

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/analytics', { headers });
      if (res.ok) {
        const { data } = await res.json();
        setMetrics(data.metrics);
        setTopCustomers(data.topCustomers);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setChartLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/analytics/revenue?days=${days}`, { headers });
      if (res.ok) {
        const { data } = await res.json();
        setRevenueData(data);
      }
    } finally {
      setChartLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance and customer insights.</p>
      </div>

      {/* Metrics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : metrics ? (
        <MetricsCards metrics={metrics as Parameters<typeof MetricsCards>[0]['metrics']} />
      ) : null}

      {/* Revenue Chart with Period Selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {([7, 30, 90] as Days[]).map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
              className={days === d ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {d === 7 ? '7 Days' : d === 30 ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
        <RevenueChart
          data={revenueData as Parameters<typeof RevenueChart>[0]['data']}
          isLoading={chartLoading}
        />
      </div>

      {/* Top Customers */}
      <TopCustomersTable
        customers={topCustomers as Parameters<typeof TopCustomersTable>[0]['customers']}
        isLoading={isLoading}
      />
    </div>
  );
}
