/**
 * Test Auth State API Route
 * 
 * Simple endpoint to check authentication state for debugging.
 * Only available in development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      auth: {
        isAuthenticated: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        } : null,
        error: error?.message || null,
      },
      headers: {
        cookie: request.headers.get('cookie') ? 'present' : 'none',
        authorization: request.headers.get('authorization') ? 'present' : 'none',
      },
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { 
        error: 'Auth test failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}