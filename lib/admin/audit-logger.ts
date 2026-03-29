import { createServiceClient } from '@/utils/supabase/service';
import type { AdminAction } from './types';

interface AuditLogParams {
  actorId: string;
  action: AdminAction;
  targetType: string;
  targetId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an admin action to the admin_audit_log table.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAdminAction(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createServiceClient();

    await supabase.from('admin_audit_log').insert({
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Extract IP address from a request for audit logging.
 */
export function getRequestIp(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  );
}
