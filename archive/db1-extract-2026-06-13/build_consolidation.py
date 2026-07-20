"""Generate the consolidation migration: DB1's domain model → DB2 (YLS-owned),
keeping DB2's user_profiles + keepers + data. Reads db1-raw.json (DB1 schema)
and the hardening migration; writes supabase/migrations/<ts>_consolidate_db1_model.sql."""
import json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, "..", "..", ".."))
raw = json.load(open(os.path.join(ROOT, "db1-raw.json"), encoding="utf-8"))

EXCLUDE = {"user_profiles"}                                  # keep DB2's version
DROP_FIRST = ["orders", "campaigns", "contact_cards", "mailing_lists"]  # DB2 empty → replace with DB1

def col_type(c):
    dt, udt = c["data_type"], c["udt_name"]
    if dt == "USER-DEFINED": return udt
    if dt == "ARRAY": return udt.lstrip("_") + "[]"
    if dt == "character varying":
        return f"varchar({c['character_maximum_length']})" if c["character_maximum_length"] else "varchar"
    if dt == "numeric" and c["numeric_precision"]:
        return f"numeric({c['numeric_precision']},{c['numeric_scale'] or 0})"
    return dt

tables = {}
for c in raw["columns"]:
    if c["table_name"] in EXCLUDE: continue
    tables.setdefault(c["table_name"], []).append(c)

cons = {}
for c in raw["constraints"]:
    if c["tbl"] in EXCLUDE: continue
    cons.setdefault(c["tbl"], []).append(c)

out = [
    "-- Consolidation: DB1 normalized domain model → YLS-owned DB2.",
    "-- Keeps DB2 user_profiles + keepers (pricing_config/order_drafts/admin_audit_log/",
    "-- user_credits/user_notes/design_templates/pricing_change_log) + all DB2 data.",
    "-- Replaces DB2's 4 EMPTY overlap tables with DB1's versions. Idempotent + transactional.",
    "begin;",
    "",
    "-- ENUMS",
]
for e in raw["enums"]:
    vals = e["vals"]
    if isinstance(vals, str): vals = vals.strip("{}").split(",")
    labels = ", ".join("'" + v.strip('"') + "'" for v in vals)
    out.append(f"do $$ begin if not exists (select 1 from pg_type where typname='{e['name']}') then "
               f"create type public.{e['name']} as enum ({labels}); end if; end $$;")

out.append("")
out.append("-- FUNCTIONS (DB1)")
for fn in raw["functions"]:
    out.append(fn["def"].rstrip().rstrip(";") + ";")

out.append("")
out.append("-- DROP DB2's empty overlap tables (verified 0 rows) to replace with DB1's")
for t in DROP_FIRST:
    out.append(f"drop table if exists public.{t} cascade;")

out.append("")
out.append("-- Augment DB2's kept user_profiles with team_id so DB1 team-scoped")
out.append("-- policies work (DB1 policies are rewritten to user_profiles.user_id below).")
out.append("alter table public.user_profiles add column if not exists team_id uuid;")

out.append("")
out.append("-- TABLES (columns only; constraints added after)")
for t in sorted(tables):
    lines = []
    for c in tables[t]:
        seg = f"  {c['column_name']} {col_type(c)}"
        if c["column_default"] is not None: seg += f" default {c['column_default']}"
        if c["is_nullable"] == "NO": seg += " not null"
        lines.append(seg)
    out.append(f"create table if not exists public.{t} (\n" + ",\n".join(lines) + "\n);")

out.append("")
out.append("-- CONSTRAINTS — PK/UNIQUE/CHECK first (so FKs can reference them), then FKs")
def emit_constraint(t, c):
    out.append(f"do $$ begin if not exists (select 1 from pg_constraint where conname='{c['conname']}' "
               f"and connamespace='public'::regnamespace) then "
               f"alter table public.{t} add constraint {c['conname']} {c['def']}; end if; end $$;")
for t in sorted(cons):
    for c in cons[t]:
        if c["contype"] != "f":   # p, u, c
            emit_constraint(t, c)
out.append("-- foreign keys (after all PK/UNIQUE exist)")
for t in sorted(cons):
    for c in cons[t]:
        if c["contype"] == "f":
            emit_constraint(t, c)
out.append("-- user_profiles.team_id → teams (augmented column; team-scoped access)")
out.append("do $$ begin if not exists (select 1 from pg_constraint where conname='user_profiles_team_id_fkey' "
           "and connamespace='public'::regnamespace) then "
           "alter table public.user_profiles add constraint user_profiles_team_id_fkey "
           "foreign key (team_id) references public.teams(id); end if; end $$;")

out.append("")
out.append("-- INDEXES")
for ix in raw["indexes"]:
    if ix["tbl"] in EXCLUDE: continue
    d = re.sub(r"^CREATE (UNIQUE )?INDEX ",
               lambda m: f"CREATE {m.group(1) or ''}INDEX IF NOT EXISTS ", ix["indexdef"], count=1)
    out.append(d.rstrip(";") + ";")

out.append("")
out.append("-- RLS")
for r in raw["rls"]:
    if r["tbl"] in EXCLUDE: continue
    out.append(f"alter table public.{r['tbl']} enable row level security;")

out.append("")
out.append("-- POLICIES")
for p in raw["policies"]:
    if p["tbl"] in EXCLUDE: continue
    roles = p["roles"]
    if isinstance(roles, str): roles = roles.strip("{}").split(",")
    roles_s = ", ".join(r.strip('"') for r in roles) if roles else "public"
    perm = "permissive" if str(p.get("permissive") or "PERM").upper().startswith("PERM") else "restrictive"
    # DB1 keyed user_profiles by id=auth.uid(); DB2 keeps id PK + user_id=auth.uid()
    # (the convention the app code uses). Rewrite the team-membership subquery
    # accordingly while preserving the team-scoped access model.
    def fix(expr):
        return expr.replace("user_profiles.id = auth.uid()", "user_profiles.user_id = auth.uid()")
    qual = fix(p["qual"]) if p["qual"] is not None else None
    wc = fix(p["with_check"]) if p["with_check"] is not None else None
    clause = f'create policy "{p["policyname"]}" on public.{p["tbl"]} as {perm} for {p["cmd"].lower()} to {roles_s}'
    if qual is not None: clause += f" using ({qual})"
    if wc is not None: clause += f" with check ({wc})"
    out.append(f'drop policy if exists "{p["policyname"]}" on public.{p["tbl"]};')
    out.append(clause + ";")

out.append("")
out.append("-- TRIGGERS (DB1)")
for tg in raw["triggers"]:
    if tg["tbl"] in EXCLUDE: continue
    out.append(f"drop trigger if exists {tg['tgname']} on public.{tg['tbl']};")
    out.append(tg["def"].rstrip(";") + ";")

# hardening migration (idempotent) appended
hard = open(os.path.join(REPO, "supabase", "migrations", "20260612010000_production_hardening.sql"), encoding="utf-8").read()
out.append("")
out.append("-- HARDENING (persistent jobs, rate-limit RPC, webhook dead letters)")
out.append(hard.strip())

out.append("")
out.append("commit;")

dest = os.path.join(REPO, "supabase", "migrations", "20260613000000_consolidate_db1_model.sql")
with open(dest, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(out))
print("wrote", dest)
print(f"tables_created={len(tables)} (excl user_profiles) drop_first={DROP_FIRST}")
print(f"constraints={sum(len(v) for v in cons.values())} policies={len([p for p in raw['policies'] if p['tbl'] not in EXCLUDE])}")
