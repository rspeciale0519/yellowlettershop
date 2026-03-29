'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TopCustomer {
  userId: string;
  fullName: string | null;
  email: string | null;
  orderCount: number;
  totalSpent: number;
}

interface TopCustomersTableProps {
  customers: TopCustomer[];
  isLoading: boolean;
}

export function TopCustomersTable({ customers, isLoading }: TopCustomersTableProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground/70">
          Top Customers by Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No customer data yet.</p>
        ) : (
          <div className="space-y-3">
            {customers.map((customer, i) => (
              <Link
                key={customer.userId}
                href={`/dashboard/admin/users/${customer.userId}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                {/* Rank */}
                <span className={`w-6 text-center font-bold tabular-nums text-sm ${
                  i === 0 ? 'text-amber-500' : i === 1 ? 'text-muted-foreground/70' : i === 2 ? 'text-orange-700' : 'text-muted-foreground/40'
                }`}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">
                    {(customer.fullName ?? customer.email ?? '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-red-500 transition-colors">
                    {customer.fullName ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.email ?? customer.userId.slice(0, 8)}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">
                    ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
