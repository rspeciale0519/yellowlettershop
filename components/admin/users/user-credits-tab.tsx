'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { DollarSign } from 'lucide-react';

interface CreditEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
  created_at: string;
}

interface UserCreditsTabProps {
  balance: number;
  history: CreditEntry[];
  onAddCredit: (amount: number, type: string, description: string) => Promise<void>;
}

const typeBadge: Record<string, { label: string; className: string }> = {
  credit: { label: 'Credit', className: 'bg-green-500/10 text-green-600' },
  debit: { label: 'Debit', className: 'bg-red-500/10 text-red-600' },
  refund_credit: { label: 'Refund', className: 'bg-blue-500/10 text-blue-600' },
  promotional: { label: 'Promo', className: 'bg-purple-500/10 text-purple-600' },
  adjustment: { label: 'Adjustment', className: 'bg-yellow-500/10 text-yellow-600' },
};

export function UserCreditsTab({ balance, history, onAddCredit }: UserCreditsTabProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!amount || !description.trim()) return;
    setIsSaving(true);
    try {
      await onAddCredit(parseFloat(amount), type, description.trim());
      setAmount('');
      setDescription('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${balance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Add Credit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Credit/Debit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                  <SelectItem value="refund_credit">Refund Credit</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason..." />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={isSaving || !amount || !description.trim()} size="sm">
            {isSaving ? 'Adding...' : 'Add Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* History Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No credit history.</TableCell>
            </TableRow>
          ) : history.map((entry) => {
            const badge = typeBadge[entry.type] ?? typeBadge.adjustment;
            return (
              <TableRow key={entry.id}>
                <TableCell className="text-sm">{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge></TableCell>
                <TableCell className="text-sm">{entry.description}</TableCell>
                <TableCell className={`text-right font-mono text-sm ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.amount >= 0 ? '+' : ''}{Number(entry.amount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">${Number(entry.balance_after).toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
