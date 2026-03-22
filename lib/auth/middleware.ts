/**
 * Authentication Middleware for API Routes
 * 
 * Provides reusable authentication checks for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest {
  user: User;
  userId: string;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requireTeam?: boolean;
  allowedRoles?: string[];
}

/**
 * Authentication middleware for API routes
 * Returns user information if authenticated, null if not
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authorization.substring(7);
    const supabase = createServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Middleware wrapper for protected API routes
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Additional role checks if specified
    if (options.allowedRoles) {
      // Get user profile with role information
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!profile || !options.allowedRoles.includes(profile.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    const authContext: AuthenticatedRequest = {
      user,
      userId: user.id,
    };
    
    return handler(request, authContext);
  };
}

/**
 * Team authorization middleware
 * Ensures user has access to the specified team
 */
export async function authorizeTeamAccess(
  userId: string, 
  teamId: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    // Check if user is team owner or member
    const { data: teamAccess } = await supabase
      .from('teams')
      .select('id, owner_id')
      .eq('id', teamId)
      .single();
    
    if (!teamAccess) {
      return false;
    }
    
    // User is team owner
    if (teamAccess.owner_id === userId) {
      return true;
    }
    
    // Check team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    return !!membership;
  } catch (error) {
    console.error('Team authorization error:', error);
    return false;
  }
}

/**
 * Resource authorization middleware
 * Ensures user has access to the specified resource
 */
export async function authorizeResourceAccess(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    // Check resource ownership or permissions
    const { data: resource } = await supabase
      .from(resourceType)
      .select('user_id, team_id, created_by')
      .eq('id', resourceId)
      .single();
    
    if (!resource) {
      return false;
    }
    
    // User owns the resource
    if (resource.user_id === userId || resource.created_by === userId) {
      return true;
    }
    
    // Check team access if resource belongs to a team
    if (resource.team_id) {
      return authorizeTeamAccess(userId, resource.team_id);
    }
    
    // Check explicit resource permissions
    const { data: permission } = await supabase
      .from('resource_permissions')
      .select('id')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('user_id', userId)
      .single();
    
    return !!permission;
  } catch (error) {
    console.error('Resource authorization error:', error);
    return false;
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (request: NextRequest): NextResponse | null => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const key = `${ip}`;
    
    const current = requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return null; // Allow request
    }
    
    if (current.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    current.count++;
    return null; // Allow request
  };
}