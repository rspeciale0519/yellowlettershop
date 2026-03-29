import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { createServiceClient } from '@/utils/supabase/service';
import type { AdminUser } from '@/lib/admin/types';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  message: string;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('user_profiles').select('user_id').limit(1);
    const latency = Date.now() - start;
    if (error) return { name: 'Supabase', status: 'degraded', latencyMs: latency, message: error.message };
    return { name: 'Supabase', status: 'healthy', latencyMs: latency, message: 'Connected' };
  } catch (e) {
    return { name: 'Supabase', status: 'down', latencyMs: Date.now() - start, message: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return { name: 'Stripe', status: 'down', latencyMs: null, message: 'STRIPE_SECRET_KEY not set' };

    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;

    if (!res.ok) return { name: 'Stripe', status: 'degraded', latencyMs: latency, message: `HTTP ${res.status}` };
    return { name: 'Stripe', status: 'healthy', latencyMs: latency, message: 'Connected' };
  } catch (e) {
    return { name: 'Stripe', status: 'down', latencyMs: Date.now() - start, message: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkAccuZip(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const key = process.env.ACCUZIP_API_KEY;
    if (!key) return { name: 'AccuZip', status: 'degraded', latencyMs: null, message: 'ACCUZIP_API_KEY not set' };
    // Simple connectivity check — AccuZip doesn't have a lightweight health endpoint,
    // so we just verify the API key env var is present
    return { name: 'AccuZip', status: 'healthy', latencyMs: Date.now() - start, message: 'API key configured' };
  } catch (e) {
    return { name: 'AccuZip', status: 'down', latencyMs: Date.now() - start, message: e instanceof Error ? e.message : 'Check failed' };
  }
}

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const [supabase, stripe, accuzip] = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkAccuZip(),
  ]);

  const services = [supabase, stripe, accuzip];
  const overallStatus = services.every(s => s.status === 'healthy')
    ? 'healthy'
    : services.some(s => s.status === 'down')
      ? 'down'
      : 'degraded';

  return NextResponse.json({
    data: {
      overall: overallStatus,
      services,
      checkedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextVersion: process.env.NEXT_RUNTIME ?? 'unknown',
    },
  });
});
