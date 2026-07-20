"""Extract DB1 (jgkkcr) public schema as replayable DDL via the Supabase
Management API. Read-only against DB1. Writes db1-schema.sql + raw JSON."""
import json, urllib.request, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT = "jgkkcrnegquqbizfuhqr"

def read_token():
    env = os.path.join(ROOT, "..", "..", "..", ".env.local")
    with open(os.path.normpath(env), encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()  # first = DB1
    raise SystemExit("no token")

TOKEN = read_token()

def q(sql):
    body = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT}/database/query",
        data=body,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                 "User-Agent": "curl/8.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())

raw = {}
raw["enums"] = q("""select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as vals
  from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' group by t.typname order by 1""")
raw["columns"] = q("""select table_name, column_name, data_type, udt_name, is_nullable,
  column_default, character_maximum_length, numeric_precision, numeric_scale, ordinal_position
  from information_schema.columns where table_schema='public' order by table_name, ordinal_position""")
raw["constraints"] = q("""select conrelid::regclass::text as tbl, conname, contype, pg_get_constraintdef(oid) as def
  from pg_constraint where connamespace='public'::regnamespace order by conrelid::regclass::text, contype desc, conname""")
raw["indexes"] = q("""select tablename as tbl, indexname, indexdef from pg_indexes
  where schemaname='public' order by tablename, indexname""")
raw["policies"] = q("""select tablename as tbl, policyname, permissive, cmd, roles, qual, with_check
  from pg_policies where schemaname='public' order by tablename, policyname""")
raw["rls"] = q("""select c.relname as tbl from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relrowsecurity order by 1""")
raw["functions"] = q("""select proname, pg_get_functiondef(oid) as def from pg_proc
  where pronamespace='public'::regnamespace order by proname""")
raw["triggers"] = q("""select tgname, tgrelid::regclass::text as tbl, pg_get_triggerdef(oid) as def
  from pg_trigger where not tgisinternal and tgrelid::regclass::text in (
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r') order by tgrelid::regclass::text, tgname""")

with open(os.path.join(ROOT, "db1-raw.json"), "w", encoding="utf-8") as f:
    json.dump(raw, f, indent=2, default=str)

# ---- assemble DDL ----
def col_type(c):
    dt, udt = c["data_type"], c["udt_name"]
    if dt == "USER-DEFINED":
        return udt
    if dt == "ARRAY":
        return udt.lstrip("_") + "[]"
    if dt == "character varying":
        return f"varchar({c['character_maximum_length']})" if c["character_maximum_length"] else "varchar"
    if dt == "numeric" and c["numeric_precision"]:
        return f"numeric({c['numeric_precision']},{c['numeric_scale'] or 0})"
    return dt

# columns grouped by table
tables = {}
for c in raw["columns"]:
    tables.setdefault(c["table_name"], []).append(c)

cons = {}
for c in raw["constraints"]:
    cons.setdefault(c["tbl"], []).append(c)

out = ["-- DB1 (jgkkcr) public schema, extracted via Management API.",
       "-- Generated for consolidation into the YLS-owned project.\n"]

out.append("-- ===== ENUM TYPES =====")
for e in raw["enums"]:
    vals = e["vals"]
    if isinstance(vals, str):
        vals = vals.strip("{}").split(",")
    labels = ", ".join("'" + v.strip('"') + "'" for v in vals)
    out.append(f"do $$ begin if not exists (select 1 from pg_type where typname='{e['name']}') then "
               f"create type public.{e['name']} as enum ({labels}); end if; end $$;")
out.append("")

out.append("-- ===== FUNCTIONS =====")
for fn in raw["functions"]:
    out.append(fn["def"].rstrip().rstrip(";") + ";")
out.append("")

out.append("-- ===== TABLES (columns only; constraints added after) =====")
for t in sorted(tables):
    lines = []
    for c in tables[t]:
        seg = f"  {c['column_name']} {col_type(c)}"
        if c["column_default"] is not None:
            seg += f" default {c['column_default']}"
        if c["is_nullable"] == "NO":
            seg += " not null"
        lines.append(seg)
    out.append(f"create table if not exists public.{t} (\n" + ",\n".join(lines) + "\n);")
out.append("")

out.append("-- ===== CONSTRAINTS (PK/UNIQUE/CHECK then FK) =====")
for t in sorted(cons):
    for c in cons[t]:
        # idempotent add
        out.append(f"do $$ begin if not exists (select 1 from pg_constraint where conname='{c['conname']}' "
                   f"and connamespace='public'::regnamespace) then "
                   f"alter table public.{t} add constraint {c['conname']} {c['def']}; end if; end $$;")
out.append("")

out.append("-- ===== INDEXES =====")
for ix in raw["indexes"]:
    d = ix["indexdef"]
    d = re.sub(r"^CREATE (UNIQUE )?INDEX ", lambda m: f"CREATE {m.group(1) or ''}INDEX IF NOT EXISTS ", d, count=1)
    out.append(d.rstrip(";") + ";")
out.append("")

out.append("-- ===== RLS ENABLE =====")
for r in raw["rls"]:
    out.append(f"alter table public.{r['tbl']} enable row level security;")
out.append("")

out.append("-- ===== POLICIES =====")
for p in raw["policies"]:
    roles = p["roles"]
    if isinstance(roles, str):
        roles = roles.strip("{}").split(",")
    roles_s = ", ".join(r.strip('"') for r in roles) if roles else "public"
    perm = (p.get("permissive") or "PERMISSIVE")
    perm = "permissive" if str(perm).upper().startswith("PERM") else "restrictive"
    clause = f'create policy "{p["policyname"]}" on public.{p["tbl"]} as {perm} for {p["cmd"].lower()} to {roles_s}'
    if p["qual"] is not None:
        clause += f" using ({p['qual']})"
    if p["with_check"] is not None:
        clause += f" with check ({p['with_check']})"
    out.append(f'drop policy if exists "{p["policyname"]}" on public.{p["tbl"]};')
    out.append(clause + ";")
out.append("")

out.append("-- ===== TRIGGERS =====")
for tg in raw["triggers"]:
    out.append(f"drop trigger if exists {tg['tgname']} on public.{tg['tbl']};")
    out.append(tg["def"].rstrip(";") + ";")
out.append("")

with open(os.path.join(ROOT, "db1-schema.sql"), "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print(f"tables={len(tables)} enums={len(raw['enums'])} constraints={sum(len(v) for v in cons.values())} "
      f"indexes={len(raw['indexes'])} policies={len(raw['policies'])} functions={len(raw['functions'])} "
      f"triggers={len(raw['triggers'])} rls_tables={len(raw['rls'])}")
print("tables:", ", ".join(sorted(tables)))
