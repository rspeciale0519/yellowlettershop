function replaceAll(text, value, replacement) {
  return value ? text.split(value).join(replacement) : text
}

const SQL_PATTERNS = [
  /\bwith\s+(?:recursive\s+)?[A-Za-z_"][A-Za-z0-9_$"]*(?:\s*\([^)]*\))?\s+as\s*\(/i,
  /\bvalues\s*\(/i,
  /\b(?:table|show|listen|notify)\s+[A-Za-z_"*]/i,
  /\bunlisten\s+(?:\*|[A-Za-z_"])/i,
  /\brefresh\s+materialized\s+view\b/i,
  /\breindex\s+(?:table|index|schema|database|system)\b/i,
  /\b(?:select|insert|update|delete|merge|alter|create|drop|truncate|copy|call|do|grant|revoke|comment|begin|start|commit|rollback|savepoint|release|prepare|execute|set|reset|lock|vacuum|analyze|explain)\b/i,
]

export function redactSensitive(input, options = {}) {
  let text = String(input ?? '')
  const secrets = (options.secrets ?? [])
    .filter(value => typeof value === 'string' && value.length >= 4)
    .sort((a, b) => b.length - a.length)
  for (const secret of secrets) text = replaceAll(text, secret, '[REDACTED]')

  text = text
    .replace(/\bBearer\s+(?:"[^"]*"|'[^']*'|[^\s"']+)/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sbp|sb_secret|sb_publishable)_[A-Za-z0-9_-]+\b/g, '[REDACTED TOKEN]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED TOKEN]')
    .replace(/\b(https?|postgres(?:ql)?):\/\/[^\s/@]+@/gi, '$1://[REDACTED]@')
    .replace(/([?&](?:access_?token|token|api_?key|apikey|password|secret)=)[^&#\s]*/gi, '$1[REDACTED]')
    .replace(/(response(?:\s+body)?\s*[:=])\s*[\s\S]*/gi, '$1 [REDACTED]')

  const sqlIndex = SQL_PATTERNS.reduce((first, pattern) => {
    const index = text.search(pattern)
    return index >= 0 && (first < 0 || index < first) ? index : first
  }, -1)
  if (sqlIndex >= 0) text = `${text.slice(0, sqlIndex)}[REDACTED SQL]`
  return text
}

export function safeErrorMessage(error, options = {}) {
  const message = error instanceof Error ? error.message : String(error)
  return redactSensitive(message, options)
}
