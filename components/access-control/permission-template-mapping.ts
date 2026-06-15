import type { ResourceType, PermissionLevel, TemplatePermission } from '@/lib/access-control/time-based-permissions'

export const ALL_RESOURCES = '*'

/**
 * A single editor "rule": one resource type + permission level + duration, applied
 * to a set of targets (specific resource_ids, or ['*'] for "All of this type").
 * Each rule expands to 1..N stored TemplatePermission entries on submit.
 */
export interface PermissionRule {
  resource_type: ResourceType
  targets: string[]
  permission_level: PermissionLevel
  duration_days?: number | null
}

function durationKey(d: number | null | undefined): string {
  return d === null || d === undefined ? 'perm' : String(d)
}

/** Expand editor rules into the flat TemplatePermission[] persisted on the template. */
export function expandRules(rules: PermissionRule[]): TemplatePermission[] {
  const out: TemplatePermission[] = []
  for (const rule of rules) {
    const targets = rule.targets.includes(ALL_RESOURCES) ? [ALL_RESOURCES] : rule.targets
    for (const resource_id of targets) {
      if (!resource_id) continue
      const entry: TemplatePermission = {
        resource_type: rule.resource_type,
        resource_id,
        permission_level: rule.permission_level
      }
      if (rule.duration_days !== null && rule.duration_days !== undefined) {
        entry.duration_days = rule.duration_days
      }
      out.push(entry)
    }
  }
  return out
}

/**
 * Collapse stored TemplatePermission[] back into editor rules for edit mode:
 * entries sharing {resource_type, permission_level, duration} merge into one rule
 * whose targets are the union of their resource_ids. A '*' entry => All.
 */
export function collapsePermissions(permissions: TemplatePermission[]): PermissionRule[] {
  const groups = new Map<string, PermissionRule>()
  for (const p of permissions) {
    const key = `${p.resource_type}|${p.permission_level}|${durationKey(p.duration_days)}`
    let rule = groups.get(key)
    if (!rule) {
      rule = {
        resource_type: p.resource_type,
        targets: [],
        permission_level: p.permission_level,
        duration_days: p.duration_days ?? null
      }
      groups.set(key, rule)
    }
    if (p.resource_id && !rule.targets.includes(p.resource_id)) {
      rule.targets.push(p.resource_id)
    }
  }
  // Normalize: a group that contains the wildcard collapses to All.
  for (const rule of groups.values()) {
    if (rule.targets.includes(ALL_RESOURCES)) rule.targets = [ALL_RESOURCES]
  }
  return Array.from(groups.values())
}
