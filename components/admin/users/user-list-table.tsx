'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Ban, CheckCircle2, KeyRound } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserRow {
  user_id: string;
  full_name: string | null;
  email?: string | null;
  role: string;
  account_status: string;
  created_at: string;
}

interface UserListTableProps {
  users: UserRow[];
  onStatusChange: (userId: string, status: 'active' | 'suspended' | 'banned') => void;
  onResetPassword: (userId: string) => void;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-500/10 text-green-600' },
  suspended: { label: 'Suspended', className: 'bg-yellow-500/10 text-yellow-600' },
  banned: { label: 'Banned', className: 'bg-red-500/10 text-red-600' },
};

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
}

export function UserListTable({ users, onStatusChange, onResetPassword }: UserListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No users found.
            </TableCell>
          </TableRow>
        )}
        {users.map((user) => {
          const badge = statusBadge[user.account_status] ?? statusBadge.active;
          return (
            <TableRow key={user.user_id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.full_name, user.email ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.full_name ?? 'No name'}</p>
                    <p className="text-xs text-muted-foreground">{user.email ?? user.user_id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{user.role ?? 'user'}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/admin/users/${user.user_id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onResetPassword(user.user_id)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      {user.account_status !== 'suspended' && (
                        <DropdownMenuItem onClick={() => onStatusChange(user.user_id, 'suspended')}>
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                      {user.account_status !== 'active' && (
                        <DropdownMenuItem onClick={() => onStatusChange(user.user_id, 'active')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
