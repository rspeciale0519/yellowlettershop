const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.internal.',
  'metadata',
])

function ipv4ToInt(host: string): number | null {
  const parts = host.split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return (((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3]) >>> 0
}

function isBlockedIpv4(host: string): boolean {
  const ip = ipv4ToInt(host)
  if (ip === null) return false
  const ranges: Array<[number, number]> = [
    [ipv4ToInt('0.0.0.0')!, ipv4ToInt('0.255.255.255')!],
    [ipv4ToInt('10.0.0.0')!, ipv4ToInt('10.255.255.255')!],
    [ipv4ToInt('127.0.0.0')!, ipv4ToInt('127.255.255.255')!],
    [ipv4ToInt('169.254.0.0')!, ipv4ToInt('169.254.255.255')!],
    [ipv4ToInt('172.16.0.0')!, ipv4ToInt('172.31.255.255')!],
    [ipv4ToInt('192.168.0.0')!, ipv4ToInt('192.168.255.255')!],
  ]
  return ranges.some(([start, end]) => ip >= start && ip <= end)
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase()
  return h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')
}

/** True when `raw` is a public http(s) URL safe to fetch from the server. */
export function isSafeOutboundUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.username || url.password) return false
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host || host.endsWith('.local') || host.endsWith('.internal')) return false
  if (BLOCKED_HOSTS.has(host)) return false
  if (isBlockedIpv4(host) || isBlockedIpv6(host)) return false
  return true
}

export function assertSafeOutboundUrl(raw: string): URL {
  if (!isSafeOutboundUrl(raw)) {
    throw new Error('Outbound URL is not allowed')
  }
  return new URL(raw)
}
