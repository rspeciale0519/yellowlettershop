import type React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();

  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    // If no authenticated user, redirect to login (fallback protection)
    if (!user) {
      redirect('/?auth=login');
    }

  } catch (error) {
    // On any error, redirect to login for security
    console.error('Dashboard auth check error:', error);
    redirect('/?auth=login');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
