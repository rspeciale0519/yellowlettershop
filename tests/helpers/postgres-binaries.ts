import { spawnSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

/** Find native PostgreSQL on developer machines and both GitHub runner OSes. */
export function postgresBinaries(): string {
  const suffix = process.platform === 'win32' ? '.exe' : ''
  const complete = (dir: string) => ['initdb', 'pg_ctl', 'psql']
    .every(name => existsSync(join(dir, name + suffix)))
  if (process.env.PG_BIN) {
    if (complete(process.env.PG_BIN)) return process.env.PG_BIN
    throw new Error('PG_BIN must point to a PostgreSQL bin directory containing initdb, pg_ctl and psql')
  }
  const config = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' })
  const configured = config.status === 0 ? config.stdout.trim() : ''
  if (configured && complete(configured)) return configured
  const root = process.platform === 'win32'
    ? join(process.env.ProgramFiles || 'C:\\Program Files', 'PostgreSQL')
    : '/usr/lib/postgresql'
  if (existsSync(root)) {
    for (const version of readdirSync(root).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
      const dir = join(root, version, 'bin')
      if (complete(dir)) return dir
    }
  }
  throw new Error('Native PostgreSQL is required for migration tests. Install PostgreSQL and set PG_BIN to its bin directory.')
}
