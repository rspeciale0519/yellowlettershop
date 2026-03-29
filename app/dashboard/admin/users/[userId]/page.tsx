'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, KeyRound, Ban, CheckCircle2, Mail } from 'lucide-react';
import { UserNotesTab } from '@/components/admin/users/user-notes-tab';
import { UserCreditsTab } from '@/components/admin/users/user-credits-tab';
import { createClient } from '@/utils/supabase/client';

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [creditData, setCreditData] = useState<{ balance: number; history: Record<string, unknown>[] }>({ balance: 0, history: [] });
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const [detailRes, creditRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`, { headers }),
        fetch(`/api/admin/users/${userId}/credits`, { headers }),
      ]);

      if (detailRes.ok) {
        const { data } = await detailRes.json();
        setDetail(data);
      }
      if (creditRes.ok) {
        const { data } = await creditRes.json();
        setCreditData(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusChange = async (status: 'active' | 'suspended' | 'banned') => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status }),
    });
    await fetchDetail();
  };

  const handleResetPassword = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/users/${userId}/password-reset`, { method: 'POST', headers });
    if (res.ok) alert('Password reset email sent.');
  };

  const handleAddNote = async (content: string) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/users/${userId}/notes`, {
      method: 'POST', headers, body: JSON.stringify({ content }),
    });
    await fetchDetail();
  };

  const handleAddCredit = async (amount: number, type: string, description: string) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/users/${userId}/credits`, {
      method: 'POST', headers, body: JSON.stringify({ amount, type, description }),
    });
    const creditRes = await fetch(`/api/admin/users/${userId}/credits`, { headers: await getAuthHeaders() });
    if (creditRes.ok) { const { data } = await creditRes.json(); setCreditData(data); }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading user details...</p>;
  }

  if (!detail) {
    return <p className="text-sm text-destructive py-8 text-center">User not found.</p>;
  }

  const profile = detail.profile as Record<string, unknown>;
  const orders = (detail.orders as Record<string, unknown>[]) ?? [];
  const payments = (detail.payments as Record<string, unknown>[]) ?? [];
  const notes = (detail.notes as Record<string, unknown>[]) ?? [];
  const status = (profile.account_status as string) ?? 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{((profile.full_name as string) ?? 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{(profile.full_name as string) ?? 'Unknown User'}</h1>
            <p className="text-sm text-muted-foreground">{detail.email as string}</p>
          </div>
          <Badge className={status === 'active' ? 'bg-green-500/10 text-green-600' : status === 'suspended' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}>
            {status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            <KeyRound className="h-4 w-4 mr-1.5" /> Reset Password
          </Button>
          {status !== 'suspended' ? (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('suspended')}>
              <Ban className="h-4 w-4 mr-1.5" /> Suspend
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('active')}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Activate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Profile Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">User ID:</span> <code className="text-xs">{userId}</code></div>
                <div><span className="text-muted-foreground">Role:</span> {profile.role as string ?? 'user'}</div>
                <div><span className="text-muted-foreground">Joined:</span> {new Date(profile.created_at as string).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Last Sign In:</span> {detail.lastSignIn ? new Date(detail.lastSignIn as string).toLocaleString() : 'Never'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Orders:</span> {orders.length}</div>
                <div><span className="text-muted-foreground">Payments:</span> {payments.length}</div>
                <div><span className="text-muted-foreground">Credit Balance:</span> ${creditData.balance.toFixed(2)}</div>
                <div><span className="text-muted-foreground">Notes:</span> {notes.length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No orders.</TableCell></TableRow>
                ) : orders.map((order) => (
                  <TableRow key={order.id as string}>
                    <TableCell className="font-mono text-xs">{(order.id as string).slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant="outline">{order.status as string}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(order.created_at as string).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stripe ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No payments.</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id as string}>
                    <TableCell className="font-mono text-xs">{((p.stripe_payment_intent_id as string) ?? '—').slice(0, 16)}...</TableCell>
                    <TableCell className="font-mono">${((p.amount as number) / 100).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{p.status as string}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(p.created_at as string).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notes">
          <UserNotesTab
            notes={notes as Parameters<typeof UserNotesTab>[0]['notes']}
            onAddNote={handleAddNote}
          />
        </TabsContent>

        <TabsContent value="credits">
          <UserCreditsTab
            balance={creditData.balance}
            history={creditData.history as Parameters<typeof UserCreditsTab>[0]['history']}
            onAddCredit={handleAddCredit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
