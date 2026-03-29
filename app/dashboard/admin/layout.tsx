import type React from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { AdminLayout } from '@/components/admin/admin-layout';

const ADMIN_ROLES = ['admin', 'super_admin'];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?auth=login');
  }

  // Check admin role using service client (bypasses RLS)
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    redirect('/dashboard?error=unauthorized');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
