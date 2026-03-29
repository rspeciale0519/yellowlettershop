import { createServiceClient } from '@/utils/supabase/service';
import { logAdminAction } from './audit-logger';
import type { AdminUserFilters } from './types';

interface UserListResult {
  users: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

export async function listUsers(filters: AdminUserFilters): Promise<UserListResult> {
  const supabase = createServiceClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }
  if (filters.role) {
    query = query.eq('role', filters.role);
  }
  if (filters.status) {
    query = query.eq('account_status', filters.status);
  }

  const sortBy = filters.sortBy ?? 'created_at';
  const sortOrder = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list users: ${error.message}`);

  return { users: data ?? [], total: count ?? 0, page, limit };
}

export async function getUserDetail(userId: string): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  const [profileRes, ordersRes, paymentsRes, notesRes, creditRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('orders').select('id, status, order_state, submitted_at, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('payment_transactions').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('user_notes').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('user_credits').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);

  if (profileRes.error) throw new Error(`User not found: ${profileRes.error.message}`);

  // Get auth user data for email and last sign in
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  const authUser = authUsers?.find((u: { id: string }) => u.id === userId);

  return {
    profile: profileRes.data,
    email: authUser?.email ?? profileRes.data?.email ?? null,
    lastSignIn: authUser?.last_sign_in_at ?? null,
    emailConfirmed: authUser?.email_confirmed_at ?? null,
    orders: ordersRes.data ?? [],
    orderCount: ordersRes.data?.length ?? 0,
    payments: paymentsRes.data ?? [],
    notes: notesRes.data ?? [],
    creditBalance: creditRes.data?.[0]?.balance_after ?? 0,
  };
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'banned',
  actorId: string,
  reason?: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('account_status')
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('user_profiles')
    .update({ account_status: status, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  await logAdminAction({
    actorId,
    action: 'user_status_changed',
    targetType: 'user',
    targetId: userId,
    oldValue: { status: existing?.account_status },
    newValue: { status, reason },
  });
}

export async function updateUserRole(
  userId: string,
  role: string,
  actorId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to update role: ${error.message}`);

  // Also update user metadata so middleware can read role from JWT
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });

  await logAdminAction({
    actorId,
    action: 'user_role_changed',
    targetType: 'user',
    targetId: userId,
    oldValue: { role: existing?.role },
    newValue: { role },
  });
}

export async function resetUserPassword(
  userId: string,
  actorId: string
): Promise<void> {
  const supabase = createServiceClient();

  // Get email from auth system (not user_profiles — that table has no email column)
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  if (!authUser?.email) throw new Error('User email not found');

  // Trigger Supabase password reset email
  const { error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.email,
  });

  if (error) throw new Error(`Failed to send reset: ${error.message}`);

  await logAdminAction({
    actorId,
    action: 'user_password_reset',
    targetType: 'user',
    targetId: userId,
  });
}

export async function addUserNote(
  userId: string,
  content: string,
  authorId: string
): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_notes')
    .insert({ user_id: userId, author_id: authorId, content })
    .select()
    .single();

  if (error) throw new Error(`Failed to add note: ${error.message}`);

  await logAdminAction({
    actorId: authorId,
    action: 'user_note_added',
    targetType: 'user',
    targetId: userId,
  });

  return data;
}

export async function getUserNotes(
  userId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch notes: ${error.message}`);
  return data ?? [];
}

export async function addUserCredit(
  userId: string,
  amount: number,
  type: 'credit' | 'debit' | 'refund_credit' | 'promotional' | 'adjustment',
  description: string,
  actorId: string,
  referenceId?: string,
  referenceType?: string
): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  // Get current balance
  const { data: lastCredit } = await supabase
    .from('user_credits')
    .select('balance_after')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const currentBalance = parseFloat(lastCredit?.balance_after ?? '0');
  const balanceAfter = currentBalance + amount;

  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      reference_id: referenceId ?? null,
      reference_type: referenceType ?? null,
      balance_after: balanceAfter,
      created_by: actorId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add credit: ${error.message}`);

  await logAdminAction({
    actorId,
    action: 'user_credit_added',
    targetType: 'user',
    targetId: userId,
    newValue: { amount, type, description, balanceAfter },
  });

  return data;
}

export async function getUserCreditBalance(userId: string): Promise<number> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('user_credits')
    .select('balance_after')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return parseFloat(data?.balance_after ?? '0');
}
