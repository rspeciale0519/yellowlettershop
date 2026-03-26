/**
 * Webhook Security Utilities
 * 
 * Enhanced security validation and verification for webhook endpoints
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

export interface WebhookSecurityConfig {
  secret: string
  maxAge?: number // in seconds, default 5 minutes
  allowedIps?: string[]
  signatureHeader: string
  timestampHeader?: string
}

export interface WebhookValidationResult {
  valid: boolean
  error?: string
  timestamp?: Date
}

/**
 * Validates webhook signature and timestamp to prevent replay attacks
 */
export function validateWebhookSecurity(
  payload: string,
  headers: Headers,
  config: WebhookSecurityConfig
): WebhookValidationResult {
  try {
    // 1. Validate signature
    const signature = headers.get(config.signatureHeader)
    if (!signature) {
      return { valid: false, error: 'Missing signature header' }
    }

    const expectedSignature = generateWebhookSignature(payload, config.secret)
    if (!timingSafeEqual(signature, expectedSignature)) {
      return { valid: false, error: 'Invalid signature' }
    }

    // 2. Validate timestamp if provided (prevent replay attacks)
    if (config.timestampHeader) {
      const timestampHeader = headers.get(config.timestampHeader)
      if (!timestampHeader) {
        return { valid: false, error: 'Missing timestamp header' }
      }

      const timestamp = new Date(parseInt(timestampHeader) * 1000)
      const now = new Date()
      const maxAge = (config.maxAge || 300) * 1000 // 5 minutes default

      if (now.getTime() - timestamp.getTime() > maxAge) {
        return { valid: false, error: 'Webhook timestamp too old' }
      }

      return { valid: true, timestamp }
    }

    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Security validation failed' 
    }
  }
}

/**
 * Validates webhook source IP against allowlist
 */
export function validateWebhookIp(
  request: NextRequest,
  allowedIps: string[]
): boolean {
  if (allowedIps.length === 0) return true

  const clientIp = getClientIp(request)
  if (!clientIp) return false

  return allowedIps.some(allowedIp => {
    if (allowedIp.includes('/')) {
      // CIDR notation
      return isIpInCidr(clientIp, allowedIp)
    }
    return clientIp === allowedIp
  })
}

/**
 * Generates HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  prefix: string = 'sha256='
): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload, 'utf8')
  return prefix + hmac.digest('hex')
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  
  return crypto.timingSafeEqual(bufferA, bufferB)
}

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string | null {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return request.ip || null
}

/**
 * Check if IP is in CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [network, maskBits] = cidr.split('/')
    const mask = parseInt(maskBits, 10)
    
    // Convert IPs to integers for comparison
    const ipInt = ipToInt(ip)
    const networkInt = ipToInt(network)
    const maskInt = (0xffffffff << (32 - mask)) >>> 0
    
    return (ipInt & maskInt) === (networkInt & maskInt)
  } catch {
    return false
  }
}

/**
 * Convert IP address to integer
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet, 10)
  }, 0) >>> 0
}

/**
 * Rate limiting for webhook endpoints
 */
const webhookRateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkWebhookRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const current = webhookRateLimits.get(identifier)
  
  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs
    webhookRateLimits.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  current.count++
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  }
}

/**
 * Webhook logging for security monitoring
 */
export interface WebhookSecurityLog {
  timestamp: string
  source: string
  endpoint: string
  valid: boolean
  error?: string
  ip?: string
  userAgent?: string
}

export function logWebhookSecurity(
  request: NextRequest,
  endpoint: string,
  validation: WebhookValidationResult
): WebhookSecurityLog {
  const log: WebhookSecurityLog = {
    timestamp: new Date().toISOString(),
    source: 'webhook',
    endpoint,
    valid: validation.valid,
    ip: getClientIp(request) || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }

  if (!validation.valid && validation.error) {
    log.error = validation.error
  }

  // Log to console for now - could be enhanced to send to monitoring service
  console.log('Webhook Security Log:', JSON.stringify(log, null, 2))
  
  return log
}