export function requireAccuzipApiKey(key: string | undefined = process.env.ACCUZIP_API_KEY): string {
  if (!key) throw new Error('AccuZIP is not configured')
  return key
}
