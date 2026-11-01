import http from 'node:http'
import https from 'node:https'
import { lookup as dnsLookup } from 'node:dns/promises'
import type { LookupFunction } from 'node:net'
import { assertPublicIps } from './blocked-ip'
import { assertSafeOutboundUrl } from './safe-fetch-url'

export type ResolvedAddress = { address: string; family: 4 | 6 }

export type DnsResolve = (hostname: string) => Promise<ResolvedAddress[]>

export type SafeFetchInit = RequestInit & {
  resolve?: DnsResolve
  fetchImpl?: (input: string | URL, init?: RequestInit) => Promise<Response>
}

export async function defaultResolve(hostname: string): Promise<ResolvedAddress[]> {
  const records = await dnsLookup(hostname, { all: true, verbatim: true })
  return records.map((row) => ({
    address: row.address,
    family: row.family === 6 ? 6 : 4,
  }))
}

/** Lookup that only returns the already-checked addresses (blocks DNS rebinding). */
export function pinnedLookup(addrs: ResolvedAddress[]): LookupFunction {
  return function lookup(hostname, options, callback) {
    const cb = typeof options === 'function' ? options : callback
    const family = typeof options === 'object' && options ? options.family : undefined
    const pick =
      (family === 6 && addrs.find((a) => a.family === 6)) ||
      (family === 4 && addrs.find((a) => a.family === 4)) ||
      addrs[0]
    if (!pick || !cb) {
      cb?.(Object.assign(new Error(`No pinned address for ${hostname}`), { code: 'ENOTFOUND' }), '', 4)
      return
    }
    cb(null, pick.address, pick.family)
  }
}

function headersToNode(headers?: HeadersInit): http.OutgoingHttpHeaders {
  if (!headers) return {}
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  return { ...headers }
}

function pinnedNodeFetch(url: URL, addrs: ResolvedAddress[], init: RequestInit): Promise<Response> {
  const lib = url.protocol === 'https:' ? https : http
  const lookup = pinnedLookup(addrs)
  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: init.method || 'GET',
        headers: headersToNode(init.headers),
        lookup,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 0,
              headers: res.headers as HeadersInit,
            })
          )
        })
      }
    )
    req.on('error', reject)
    if (init.body != null) req.write(init.body)
    req.end()
  })
}

function rejectRedirect(response: Response): Response {
  if (response.status >= 300 && response.status < 400) {
    throw new Error('Outbound redirect is not allowed')
  }
  return response
}

/**
 * Fetch a public http(s) URL after resolving DNS once, checking every address,
 * and pinning the connect to those same addresses. Redirects are not followed.
 */
export async function safeFetch(raw: string, init: SafeFetchInit = {}): Promise<Response> {
  const url = assertSafeOutboundUrl(raw)
  const { resolve = defaultResolve, fetchImpl, ...requestInit } = init
  const addrs = ipLiteral(url.hostname) ?? (await resolve(url.hostname))
  assertPublicIps(addrs.map((a) => a.address))

  const fetchInit: RequestInit = { ...requestInit, redirect: 'manual' }
  const response = fetchImpl
    ? await fetchImpl(url, fetchInit)
    : await pinnedNodeFetch(url, addrs, fetchInit)
  return rejectRedirect(response)
}

function ipLiteral(hostname: string): ResolvedAddress[] | null {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return [{ address: host, family: 4 }]
  }
  if (host.includes(':')) {
    return [{ address: host, family: 6 }]
  }
  return null
}
