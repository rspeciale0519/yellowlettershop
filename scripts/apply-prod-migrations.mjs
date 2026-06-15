#!/usr/bin/env node
/**
 * Apply pending Supabase migrations to a REMOTE project via the Management API.
 *
 * Why not `supabase db push`? This repo's local migration chain is a retrofit
 * reconstruction (baseline_* + consolidate_db1_model rebuild tables for a fresh
 * LOCAL DB). Replaying it against production would be destructive. This runner
 * instead applies ONLY files whose version isn't yet recorded in
 * supabase_migrations.schema_migrations, each wrapped in a transaction, stopping
 * on the first error (atomic — a failed migration rolls back, nothing after it runs).
 *
 * Env:   SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 * Flags: --dry-run   list pending migrations, apply nothing
 *        --backfill   record every current migration as applied WITHOUT running it
 *                     (one-time bootstrap so the runner only applies FUTURE migrations)
 */
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF
if (!TOKEN || !REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN and/or SUPABASE_PROJECT_REF')
  process.exit(1)
}
const DRY = process.argv.includes('--dry-run')
const BACKFILL = process.argv.includes('--backfill')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migDir = path.join(root, 'supabase', 'migrations')
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`

async function runSql(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  return text ? JSON.parse(text) : []
}

const versionOf = f => (f.match(/^(\d+)_/) || [])[1] || null
const nameOf = f => f.replace(/^\d+_/, '').replace(/\.sql$/, '')

async function record(version, name) {
  await runSql(
    `insert into supabase_migrations.schema_migrations(version, name)
     values ('${version}', $tag$${name}$tag$) on conflict (version) do nothing;`
  )
}

async function main() {
  await runSql(
    `create schema if not exists supabase_migrations;
     create table if not exists supabase_migrations.schema_migrations (
       version text primary key, name text, statements text[]);`
  )

  const appliedRows = await runSql('select version from supabase_migrations.schema_migrations;')
  const applied = new Set(appliedRows.map(r => r.version))

  const files = (await readdir(migDir)).filter(f => f.endsWith('.sql') && versionOf(f)).sort()
  const pending = files.filter(f => !applied.has(versionOf(f)))

  if (pending.length === 0) {
    console.log('No pending migrations. Production is up to date.')
    return
  }
  console.log(`${pending.length} pending migration(s):`)
  pending.forEach(f => console.log(`  - ${f}`))

  for (const file of pending) {
    const version = versionOf(file)
    const name = nameOf(file)
    if (DRY) {
      console.log(`[dry-run] would apply ${file}`)
      continue
    }
    if (BACKFILL) {
      await record(version, name)
      console.log(`[backfill] recorded ${file} (NOT executed)`)
      continue
    }
    const sql = await readFile(path.join(migDir, file), 'utf8')
    try {
      await runSql(`BEGIN;\n${sql}\nCOMMIT;`)
      await record(version, name)
      console.log(`applied  ${file}`)
    } catch (err) {
      console.error(`FAILED   ${file}\n  ${err.message}`)
      console.error('Stopping. This migration rolled back (atomic); nothing after it ran.')
      process.exit(1)
    }
  }
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
