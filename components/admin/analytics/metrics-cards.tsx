'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  subtitle?: string;
}

function TrendIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> No change
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      isPositive ? 'text-emerald-500' : 'text-red-500'
    }`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{change}% vs last month
    </span>
  );
}

interface MetricsCardsProps {
  metrics: {
    revenue: { total: number; thisMonth: number; changePercent: number };
    orders: { total: number; thisMonth: number; changePercent: number };
    users: { total: number; newThisMonth: number; changePercent: number };
    averageOrderValue: number;
  };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards: MetricCardProps[] = [
    {
      label: 'Total Revenue',
      value: `$${metrics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: metrics.revenue.changePercent,
      subtitle: `$${metrics.revenue.thisMonth.toFixed(2)} this month`,
    },
    {
      label: 'Total Orders',
      value: metrics.orders.total.toLocaleString(),
      change: metrics.orders.changePercent,
      subtitle: `${metrics.orders.thisMonth} this month`,
    },
    {
      label: 'Total Users',
      value: metrics.users.total.toLocaleString(),
      change: metrics.users.changePercent,
      subtitle: `${metrics.users.newThisMonth} new this month`,
    },
    {
      label: 'Avg Order Value',
      value: `$${metrics.averageOrderValue.toFixed(2)}`,
      change: 0,
      subtitle: 'Across all orders',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="relative overflow-hidden group hover:shadow-md transition-shadow">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums leading-none mb-2">
              {card.value}
            </p>
            <div className="space-y-0.5">
              <TrendIndicator change={card.change} />
              {card.subtitle && (
                <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
