import { BlockList, isIP } from 'node:net'

const privateNets = new BlockList()
privateNets.addSubnet('0.0.0.0', 8, 'ipv4')
privateNets.addSubnet('10.0.0.0', 8, 'ipv4')
privateNets.addSubnet('127.0.0.0', 8, 'ipv4')
privateNets.addSubnet('169.254.0.0', 16, 'ipv4')
privateNets.addSubnet('172.16.0.0', 12, 'ipv4')
privateNets.addSubnet('192.168.0.0', 16, 'ipv4')
privateNets.addSubnet('100.64.0.0', 10, 'ipv4')
privateNets.addAddress('::', 'ipv6')
privateNets.addAddress('::1', 'ipv6')
privateNets.addSubnet('fc00::', 7, 'ipv6')
privateNets.addSubnet('fe80::', 10, 'ipv6')

export type NormalizedIp = { address: string; type: 'ipv4' | 'ipv6' }

function stripBrackets(raw: string): string {
  return raw.replace(/^\[|\]$/g, '').trim().toLowerCase()
}

/** Unwrap IPv4-mapped IPv6 (::ffff:127.0.0.1 / ::ffff:7f00:1) before range checks. */
export function normalizeIp(raw: string): NormalizedIp | null {
  const host = stripBrackets(raw)
  if (!host) return null

  const dotted = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
  if (dotted) {
    return isIP(dotted[1]) === 4 ? { address: dotted[1], type: 'ipv4' } : null
  }

  const hexMapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
  if (hexMapped) {
    const hi = Number.parseInt(hexMapped[1], 16)
    const lo = Number.parseInt(hexMapped[2], 16)
    const address = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
    return { address, type: 'ipv4' }
  }

  const kind = isIP(host)
  if (kind === 4) return { address: host, type: 'ipv4' }
  if (kind === 6) return { address: host, type: 'ipv6' }
  return null
}

export function isBlockedIp(raw: string): boolean {
  const normalized = normalizeIp(raw)
  if (!normalized) return false
  return privateNets.check(normalized.address, normalized.type)
}

export function assertPublicIps(addresses: string[]): void {
  if (addresses.length === 0) {
    throw new Error('Outbound URL resolved to no addresses')
  }
  for (const address of addresses) {
    const normalized = normalizeIp(address)
    if (!normalized) {
      throw new Error('Outbound URL resolved to an unparseable address')
    }
    if (isBlockedIp(address)) {
      throw new Error('Outbound URL resolved to a blocked address')
    }
  }
}
