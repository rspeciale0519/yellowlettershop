export class MigrationTransportError extends Error {
  constructor(message, operation, status = null) {
    super(message)
    this.name = 'MigrationTransportError'
    this.operation = operation
    this.status = status
  }
}

export function createManagementApiTransport(options) {
  const { token, projectRef, fetchFn = globalThis.fetch } = options
  if (typeof token !== 'string' || token.length < 16 || /\s/.test(token)) {
    throw new MigrationTransportError('SUPABASE_ACCESS_TOKEN is missing or invalid.', 'configuration')
  }
  if (typeof projectRef !== 'string' || !/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new MigrationTransportError('SUPABASE_PROJECT_REF is missing or invalid.', 'configuration')
  }
  if (typeof fetchFn !== 'function') {
    throw new MigrationTransportError('Fetch transport is unavailable.', 'configuration')
  }
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

  return {
    async execute(operation) {
      let response
      try {
        response = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: operation.sql }),
        })
      } catch {
        throw new MigrationTransportError(
          `Management API ${operation.kind} request failed.`, operation.kind
        )
      }

      let body
      try {
        body = await response.text()
      } catch {
        throw new MigrationTransportError(
          `Management API ${operation.kind} response could not be read.`,
          operation.kind,
          response.status
        )
      }
      if (!response.ok) {
        throw new MigrationTransportError(
          `Management API ${operation.kind} failed with HTTP ${response.status}.`,
          operation.kind,
          response.status
        )
      }
      if (!body) return []
      try {
        return JSON.parse(body)
      } catch {
        throw new MigrationTransportError(
          `Management API ${operation.kind} returned an invalid response.`,
          operation.kind,
          response.status
        )
      }
    },
  }
}
