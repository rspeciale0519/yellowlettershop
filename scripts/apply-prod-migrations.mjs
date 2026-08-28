#!/usr/bin/env node
/**
 * Apply pending Supabase migrations through the Management API.
 *
 * The CLI validates every local migration before it reads credentials or sends
 * a request. Each migration uses one database transaction for the advisory
 * lock, ledger guard, checksum record, migration SQL, and commit.
 *
 * Env:   SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 * Flags: --dry-run   read metadata and list pending migrations without writes
 */
import { runCli } from './prod-migrations/cli.mjs'

process.exitCode = await runCli()
