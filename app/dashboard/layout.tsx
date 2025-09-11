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

    // If no user and no auth session missing error, redirect to login
    // This should be rare since middleware should catch most cases
    if (!user && !error?.message.includes('Auth session missing')) {
      redirect('/?auth=login');
    }

  } catch (error) {
    // Log unexpected errors but continue to render dashboard
    // Let the client-side auth handle any additional checks
    console.debug('Dashboard auth check error:', error);
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
