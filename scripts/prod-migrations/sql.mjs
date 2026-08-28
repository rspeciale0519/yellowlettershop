export const LEDGER_LOCK_ID = '7444823217563981'

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

export function buildLedgerInspectionSql() {
  return `select
  to_regclass('supabase_migrations.schema_migrations') is not null as ledger_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'supabase_migrations'
      and table_name = 'schema_migrations'
      and column_name = 'checksum'
  ) as checksum_exists;`
}

export function buildLedgerRowsSql() {
  return `select version, name, to_jsonb(m)->>'checksum' as checksum
from supabase_migrations.schema_migrations as m
order by version;`
}

export function buildPrepareLedgerSql() {
  return `BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT pg_catalog.pg_advisory_xact_lock(${LEDGER_LOCK_ID});
ALTER TABLE supabase_migrations.schema_migrations
  ADD COLUMN IF NOT EXISTS checksum text;
COMMIT;`
}

export function buildApplyMigrationSql(migration) {
  const version = sqlLiteral(migration.version)
  const name = sqlLiteral(migration.name)
  const checksum = sqlLiteral(migration.checksum)
  return `BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT pg_catalog.pg_advisory_xact_lock(${LEDGER_LOCK_ID});
DO $safe_migration_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version >= ${version}
  ) THEN
    RAISE EXCEPTION 'migration ledger history changed';
  END IF;
END
$safe_migration_guard$;
INSERT INTO supabase_migrations.schema_migrations(version, name, checksum)
VALUES (${version}, ${name}, ${checksum});
-- SAFE-03A migration ${migration.version} starts
${migration.executionSql.trim()}
;
-- SAFE-03A migration ${migration.version} ends
COMMIT;`
}
