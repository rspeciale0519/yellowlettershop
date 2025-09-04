/**
 * Email Validation Service
 * Provides real-time email validation with multiple validation levels
 */

export interface EmailValidationResult {
  isValid: boolean
  score: number // 0-100, higher is better
  issues: string[]
  suggestions?: string
  deliverable: 'valid' | 'invalid' | 'risky' | 'unknown'
  details: {
    syntax: boolean
    domain: boolean
    mailbox: boolean
    disposable: boolean
    role: boolean
    free: boolean
  }
}

export interface EmailValidationOptions {
  checkDeliverability?: boolean
  allowDisposable?: boolean
  allowRole?: boolean
  allowFree?: boolean
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'yopmail.com', 'temp-mail.org', 'throwaway.email', 'maildrop.cc',
  'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me'
])

// Common role-based email prefixes
const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'support', 'help', 'info', 'contact', 'sales',
  'marketing', 'noreply', 'no-reply', 'postmaster', 'webmaster', 'hostmaster',
  'abuse', 'security', 'privacy', 'legal', 'billing', 'accounts', 'hr'
])

// Common free email providers
const FREE_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'comcast.net',
  'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net', 'charter.net'
])

/**
 * Validates email address with comprehensive checks
 */
export async function validateEmail(
  email: string, 
  options: EmailValidationOptions = {}
): Promise<EmailValidationResult> {
  const {
    checkDeliverability = true,
    allowDisposable = false,
    allowRole = false,
    allowFree = true
  } = options

  const issues: string[] = []
  let score = 100
  
  // Basic syntax validation
  const syntaxValid = isValidEmailSyntax(email)
  if (!syntaxValid) {
    issues.push('Invalid email syntax')
    score -= 50
  }

  const [localPart, domain] = email.toLowerCase().split('@')
  
  // Domain validation
  const domainValid = domain && isValidDomain(domain)
  if (!domainValid) {
    issues.push('Invalid domain')
    score -= 30
  }

  // Check for disposable email
  const isDisposable = DISPOSABLE_DOMAINS.has(domain)
  if (isDisposable && !allowDisposable) {
    issues.push('Disposable email address')
    score -= 40
  }

  // Check for role-based email
  const isRole = ROLE_PREFIXES.has(localPart)
  if (isRole && !allowRole) {
    issues.push('Role-based email address')
    score -= 20
  }

  // Check for free email provider
  const isFree = FREE_PROVIDERS.has(domain)
  if (isFree && !allowFree) {
    issues.push('Free email provider')
    score -= 10
  }

  // Deliverability check (simplified - in production, use external service)
  let mailboxValid = true
  if (checkDeliverability && syntaxValid && domainValid) {
    mailboxValid = await checkMailboxDeliverability(domain)
    if (!mailboxValid) {
      issues.push('Domain does not accept email')
      score -= 30
    }
  }

  // Generate suggestions for common typos
  const suggestions = generateEmailSuggestions(email)

  // Determine deliverable status
  let deliverable: EmailValidationResult['deliverable'] = 'unknown'
  if (!syntaxValid || !domainValid) {
    deliverable = 'invalid'
  } else if (score >= 80) {
    deliverable = 'valid'
  } else if (score >= 60) {
    deliverable = 'risky'
  } else {
    deliverable = 'invalid'
  }

  return {
    isValid: Boolean(syntaxValid && domainValid && score >= 60),
    score: Math.max(0, score),
    issues,
    suggestions,
    deliverable,
    details: {
      syntax: Boolean(syntaxValid),
      domain: Boolean(domainValid),
      mailbox: Boolean(mailboxValid),
      disposable: Boolean(isDisposable),
      role: Boolean(isRole),
      free: Boolean(isFree)
    }
  }
}

/**
 * Validates email syntax using comprehensive regex
 */
function isValidEmailSyntax(email: string): boolean {
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) {
    return false
  }

  // Additional checks
  const [localPart, domain] = email.split('@')
  
  // Local part length check
  if (localPart.length > 64) {
    return false
  }

  // Domain length check
  if (domain.length > 253) {
    return false
  }

  // No consecutive dots
  if (email.includes('..')) {
    return false
  }

  return true
}

/**
 * Validates domain format
 */
function isValidDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!domainRegex.test(domain)) {
    return false
  }

  // Must have at least one dot
  if (!domain.includes('.')) {
    return false
  }

  // TLD must be at least 2 characters
  const parts = domain.split('.')
  const tld = parts[parts.length - 1]
  if (tld.length < 2) {
    return false
  }

  return true
}

/**
 * Check if domain accepts email (simplified DNS check)
 */
async function checkMailboxDeliverability(domain: string): Promise<boolean> {
  // In a real implementation, this would:
  // 1. Check MX records
  // 2. Attempt SMTP connection
  // 3. Verify mailbox existence
  
  // For now, return true for known good domains, false for obviously bad ones
  const knownBadDomains = ['example.com', 'test.com', 'invalid.com', 'fake.com']
  
  if (knownBadDomains.includes(domain)) {
    return false
  }

  // Simulate async check
  return new Promise<boolean>(resolve => {
    setTimeout(() => resolve(true), 100)
  })
}

/**
 * Generate suggestions for common email typos
 */
function generateEmailSuggestions(email: string): string | undefined {
  const [localPart, domain] = email.toLowerCase().split('@')
  
  if (!domain) return undefined

  // Common domain typos
  const domainSuggestions: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com'
  }

  const suggestion = domainSuggestions[domain]
  if (suggestion) {
    return `${localPart}@${suggestion}`
  }

  return undefined
}

/**
 * Batch validate multiple emails
 */
export async function validateEmailBatch(
  emails: string[],
  options: EmailValidationOptions = {}
): Promise<Record<string, EmailValidationResult>> {
  const results: Record<string, EmailValidationResult> = {}
  
  // Process in batches to avoid overwhelming the system
  const batchSize = 10
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const batchPromises = batch.map(email => 
      validateEmail(email, options).then(result => ({ email, result }))
    )
    
    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach(({ email, result }) => {
      results[email] = result
    })
  }
  
  return results
}

/**
 * Get validation statistics for a batch of results
 */
export function getValidationStats(results: Record<string, EmailValidationResult>) {
  const total = Object.keys(results).length
  let valid = 0
  let invalid = 0
  let risky = 0
  let disposable = 0
  let role = 0
  let free = 0

  Object.values(results).forEach(result => {
    if (result.deliverable === 'valid') valid++
    else if (result.deliverable === 'invalid') invalid++
    else if (result.deliverable === 'risky') risky++

    if (result.details.disposable) disposable++
    if (result.details.role) role++
    if (result.details.free) free++
  })

  return {
    total,
    valid,
    invalid,
    risky,
    disposable,
    role,
    free,
    validPercent: total > 0 ? Math.round((valid / total) * 100) : 0,
    invalidPercent: total > 0 ? Math.round((invalid / total) * 100) : 0,
    riskyPercent: total > 0 ? Math.round((risky / total) * 100) : 0
  }
}
