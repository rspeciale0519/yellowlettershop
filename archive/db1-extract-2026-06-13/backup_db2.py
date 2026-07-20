"""Back up DB2 (lmtpfg, YLS-owned) data + schema before consolidation.
Read-only. Writes db2-backup/{data.json, tables.json}."""
import json, urllib.request, os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "db2-backup")
os.makedirs(OUT, exist_ok=True)
PROJECT = "lmtpfgfulkynrktdkgpu"

def read_token():
    env = os.path.normpath(os.path.join(ROOT, "..", "..", "..", ".env.local"))
    toks = []
    with open(env, encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_ACCESS_TOKEN="):
                toks.append(line.split("=", 1)[1].strip())
    return toks[1]  # second = DB2

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

tables = [t["table_name"] for t in q(
    "select table_name from information_schema.tables where table_schema='public' order by 1")]

data = {}
for t in tables:
    try:
        rows = q(f'select * from public."{t}"')
        data[t] = rows
    except Exception as e:
        data[t] = {"_error": str(e)}

with open(os.path.join(OUT, "tables.json"), "w", encoding="utf-8") as f:
    json.dump(tables, f, indent=2)
with open(os.path.join(OUT, "data.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, default=str)

print("DB2 tables:", len(tables))
for t in tables:
    n = len(data[t]) if isinstance(data[t], list) else "ERR"
    print(f"  {t}: {n} rows")
