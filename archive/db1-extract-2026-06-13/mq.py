"""Management-API query helper. Usage: python mq.py <db1|db2> [--file PATH]
SQL from --file or stdin. Prints JSON result."""
import json, urllib.request, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECTS = {"db1": "jgkkcrnegquqbizfuhqr", "db2": "lmtpfgfulkynrktdkgpu"}

def token(which):
    env = os.path.normpath(os.path.join(ROOT, "..", "..", "..", ".env.local"))
    toks = []
    with open(env, encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_ACCESS_TOKEN="):
                toks.append(line.split("=", 1)[1].strip())
    # .env.local is now DB2-only (single token). db2 → last token; db1 → first.
    return toks[0] if which == "db1" else toks[-1]

def main():
    which = sys.argv[1]
    if "--file" in sys.argv:
        sql = open(sys.argv[sys.argv.index("--file") + 1], encoding="utf-8").read()
    else:
        sql = sys.stdin.read()
    body = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECTS[which]}/database/query",
        data=body,
        headers={"Authorization": f"Bearer {token(which)}", "Content-Type": "application/json",
                 "User-Agent": "curl/8.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            print(json.dumps(json.loads(r.read()), indent=2, default=str))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode(), file=sys.stderr)
        sys.exit(1)

main()
