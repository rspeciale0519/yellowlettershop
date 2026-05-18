# YLS Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the self-improving per-project engineering brain for yls — an Obsidian-markdown vault in `ylsbrain/` plus tiered Claude Code Node enforcement hooks — exactly as specified in `feature-yls-brain.md`.

**Architecture:** Vault-native brain (`ylsbrain/`: STATE/journal/skills/log/index) governed by `ylsbrain/CLAUDE.md`; four deterministic Node hooks in `yls/.claude/hooks/` (SessionStart inject · PostToolUse work-ledger · Stop conditional gate · Consolidation helper) wired via committed `.claude/settings.json`; a global cross-session watermark in `ylsbrain/.brainstate/brain.json` makes the gate clear deterministically.

**Tech Stack:** Node.js (already present — yls is Next.js 15), JSON state files, Obsidian markdown, Claude Code hooks, git.

**Spec:** `yls/.claude/plans/feature-yls-brain.md` (read it before executing — §5 schemas, §7 lifecycle, §9 limitations, §11 verification are authoritative).

---

## Git Workflow (user global Rule 6/7/8 — overrides default per-task commit cadence)

- All work is in the **yls repo** (`C:\Users\rob\Documents\Software\service-businesses\yls`), which you are authorized to operate in.
- **Before any file changes (Rule 8 Trigger 1):** `/git-workflow-planning:start feature yls-brain` → branch `feature/yls-brain`. If that skill's arg-parser misbehaves (observed previously), fall back to: `git checkout -b feature/yls-brain` (base `develop` if it exists, else `main`).
- **After each Phase (Rule 8 Trigger 2):** `/git-workflow-planning:checkpoint <phase> <desc>`. yls *does* have lint/test (`npm run lint`, `npm test`) but the brain is standalone Node scripts under `.claude/` not covered by yls Mocha; the checkpoint's value here is the commit + the phase's own Node verify gate. If checkpoint hard-fails on tooling, fall back to `git add -A && git commit`.
- **Roadmap (Rule 7):** the Phase Checklist at the end of this file is the roadmap; tick `[x]` before each checkpoint.
- **After the final Phase (Rule 8 Trigger 3):** `/git-workflow-planning:finish`.
- **Brain commits use a `brain:` prefix** per spec §7 invariants (keeps brain churn distinct from yls code history).
- Never delete (Rule 1): superseded → `ylsbrain/archive/` + tombstone.

---

## File Structure

| Path | Responsibility |
|---|---|
| `ylsbrain/CLAUDE.md` | Human-authoritative brain schema (§5/§6/§9) |
| `ylsbrain/STATE.md` | Tiny always-on layer |
| `ylsbrain/index.md` · `log.md` | Catalog · append-only timeline |
| `ylsbrain/journal/.gitkeep` · `skills/.gitkeep` · `archive/.gitkeep` | Tracked empty dirs |
| `.claude/hooks/brain-lib.js` | Shared: paths, JSON I/O, brainstate, ledger, journal parse, PII scan |
| `.claude/hooks/session-start.js` | H1 SessionStart (inject) |
| `.claude/hooks/post-tool-use.js` | H2 PostToolUse (work-ledger) |
| `.claude/hooks/stop.js` | H3 Stop (conditional gate) |
| `.claude/hooks/consolidate.js` | H4 helper: overdue check + journal-vs-git gap check + counter reset |
| `.claude/hooks/verify/verify-structure.js` | Phase-1 gate |
| `.claude/hooks/verify/verify-schema.js` | Phase-2 gate |
| `.claude/hooks/verify/verify-hooks.js` | Phase-3/5 simulated-session gate |
| `.claude/settings.json` | Committed `hooks` wiring (Phase 0 verifies interaction with `settings.local.json`) |
| `yls/CLAUDE.md` | + ~15-line `## YLS Brain` pointer section |
| `yls/.gitignore` | + `ylsbrain/.brainstate/`, `ylsbrain/.obsidian/workspace*.json` |

**Hook code conventions (mandatory — yls security tooling enforces these):**
`'use strict';`, CommonJS (`require`), Node core only (no external deps). Every entry script wrapped so internal errors **fail open** (exit 0) except H3's intentional block (exit 2). **Never use shell string interpolation / `exec()` / `execSync(string)`** — use `child_process.execFileSync`/`spawnSync` with an **argument array** (no shell). yls has a PreToolUse security hook that rejects `exec()`-with-interpolation.

---

## Phase 0: Verify environment assumptions

- [ ] **Step 0.1: Branch (Rule 8 Trigger 1)**

Run `/git-workflow-planning:start feature yls-brain` (fallback: `cd` to yls, `git rev-parse --verify --quiet refs/heads/develop && git checkout -b feature/yls-brain develop || git checkout -b feature/yls-brain main`).
Verify: `git -C "C:/Users/rob/Documents/Software/service-businesses/yls" branch --show-current` → `feature/yls-brain`.

- [ ] **Step 0.2: Verify node + settings reality**

Run:
```bash
cd "C:/Users/rob/Documents/Software/service-businesses/yls" && node -v && ls -la .claude/settings.json 2>/dev/null || echo "NO settings.json" && ls -la .claude/settings.local.json && grep -c '"hooks"' .claude/settings.local.json .claude/settings.json 2>/dev/null || echo "no hooks key anywhere"
```
Expected: a node version prints; record whether `.claude/settings.json` exists and whether any `"hooks"` key already exists. **Decision rule:** if `.claude/settings.json` is absent, Phase 4 creates it containing only a `hooks` key; if present, Phase 4 merges a `hooks` key without touching other keys. `settings.local.json` is never modified. Write the finding into the Phase-4 task notes before proceeding.

- [ ] **Step 0.3: Checkpoint**

Tick Phase 0. `/git-workflow-planning:checkpoint 0 verify environment` (fallback `git commit --allow-empty -m "brain: phase 0 environment verified"`).

---

## Phase 1: Vault scaffold + gitignore

- [ ] **Step 1.1: Write the structure verifier (red)**

Create `.claude/hooks/verify/verify-structure.js`:
```javascript
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..'); // yls/
const required = [
  'ylsbrain/CLAUDE.md', 'ylsbrain/STATE.md', 'ylsbrain/index.md', 'ylsbrain/log.md',
  'ylsbrain/journal/.gitkeep', 'ylsbrain/skills/.gitkeep', 'ylsbrain/archive/.gitkeep',
  '.claude/hooks/brain-lib.js'
];
const missing = required.filter(p => !fs.existsSync(path.join(root, p)));
const gi = fs.existsSync(path.join(root, '.gitignore'))
  ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
if (!gi.includes('ylsbrain/.brainstate/')) missing.push('.gitignore: ylsbrain/.brainstate/');
if (missing.length) { console.log('MISSING:\n' + missing.join('\n')); process.exit(1); }
console.log('STRUCTURE OK'); process.exit(0);
```

- [ ] **Step 1.2: Run it — expect RED**

Run: `node .claude/hooks/verify/verify-structure.js`
Expected: exit 1, `MISSING:` listing all entries.

- [ ] **Step 1.3: Create directories + tracked .gitkeeps**

```bash
cd "C:/Users/rob/Documents/Software/service-businesses/yls" && mkdir -p ylsbrain/journal ylsbrain/skills ylsbrain/archive .claude/hooks/verify && : > ylsbrain/journal/.gitkeep && : > ylsbrain/skills/.gitkeep && : > ylsbrain/archive/.gitkeep
```

- [ ] **Step 1.4: Append gitignore entries**

Append to `yls/.gitignore` (exact lines, only if not already present):
```
# yls brain transient/per-user state
ylsbrain/.brainstate/
ylsbrain/.obsidian/workspace*.json
ylsbrain/.obsidian/cache
```

- [ ] **Step 1.5: Create placeholder vault files (content comes in Phase 2)**

Create each with a single seed line so structure passes (Phase 2 fills them):
- `ylsbrain/CLAUDE.md` → `# YLS Brain — Schema (populated in Phase 2)`
- `ylsbrain/STATE.md` → `# yls brain — STATE`
- `ylsbrain/index.md` → `# Index`
- `ylsbrain/log.md` → `# Log`

- [ ] **Step 1.6: Create the shared lib stub (full impl in Phase 3)**

Create `.claude/hooks/brain-lib.js`:
```javascript
'use strict';
// Full implementation in Phase 3. Stub keeps structure green.
module.exports = {};
```

- [ ] **Step 1.7: Run verifier — expect GREEN**

Run: `node .claude/hooks/verify/verify-structure.js`
Expected: exit 0, `STRUCTURE OK`.

- [ ] **Step 1.8: Roadmap + checkpoint**

Tick Phase 1. `/git-workflow-planning:checkpoint 1 vault scaffold` (fallback `git add -A && git commit -m "brain: phase 1 vault scaffold + gitignore"`).

---

## Phase 2: Protocol content

- [ ] **Step 2.1: Write the schema verifier (red)**

Create `.claude/hooks/verify/verify-schema.js`:
```javascript
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..');
const checks = {
  'ylsbrain/CLAUDE.md': ['## Session-Start Ritual','## Per-task Journal','## Skill','## Accepted Limitations','AL-1','AL-5','no-op','Evidence'],
  'ylsbrain/STATE.md': ['Current focus','Latest synopsis','Open threads'],
  'ylsbrain/index.md': ['## Skills','## Recent journal'],
  'ylsbrain/log.md': ['# Log'],
};
const rootClaude = path.join(root, 'CLAUDE.md');
let fail = [];
for (const [f, toks] of Object.entries(checks)) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { fail.push(f + ' (absent)'); continue; }
  const c = fs.readFileSync(fp, 'utf8');
  toks.forEach(t => { if (!c.includes(t)) fail.push(`${f}: missing "${t}"`); });
}
if (!fs.existsSync(rootClaude) || !fs.readFileSync(rootClaude,'utf8').includes('## YLS Brain'))
  fail.push('yls/CLAUDE.md: missing "## YLS Brain" pointer section');
if (fail.length) { console.log('SCHEMA FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SCHEMA OK'); process.exit(0);
```

- [ ] **Step 2.2: Run it — expect RED**

Run: `node .claude/hooks/verify/verify-schema.js`
Expected: exit 1, `SCHEMA FAIL:` (placeholder files lack tokens).

- [ ] **Step 2.3: Write `ylsbrain/CLAUDE.md`** (full content)

Replace `ylsbrain/CLAUDE.md` with exactly:
```markdown
# YLS Brain — Schema

You maintain a self-improving engineering memory for the yls app. The enforced
behavior is hook-injected each session; this file is the human-authoritative copy.

## Session-Start Ritual
Before new work: read STATE.md, the tail of the latest journal/YYYY-MM-DD.md,
index.md, and any [[skill-...]] marked in play. State what we last did and where
it lives before starting.

## Recall-before-work
Check skills/<area> for an existing relevant skill and apply it before re-deriving.

## Per-task Journal protocol
On task completion append to journal/<today>.md:
### [HH:MM] <task title>   (branch: <branch> · commits: <shas|none>)
**Synopsis:** 1-3 sentences - goal and outcome.
**What worked:** concrete + reusable. Evidence: <npm test/lint/typecheck:ui/build, or "manual: <how>">.
**What did NOT work:** dead-ends, wrong assumptions - explicit. "(none)" only if truly none.
**Artifacts:** files, decisions, [[skill-...]], PR/commit.
**Next / open:** follow-ups, risk.
Then update STATE.md, log.md, and index.md if a skill changed.
No-op escape: a one-line `no substantive task - nothing to record` is valid.
NO secrets / NO PII - pointers, not payloads.

## Evidence rule
"What worked" must cite an objective signal or explicit `manual:`; else it is
recorded as *unverified*, not "worked".

## Skill protocol
skills/<area>-<slug>.md (area = api|supabase|ui|auth|integrations|testing|build),
frontmatter: type/status/confidence/updated/sources. Sections: When to use /
The approach / Pitfalls & anti-patterns / Evidence / Revision log (append-only).
confidence provisional->established only on genuinely independent signal
(different task context or external proof). Contradiction -> status: deprecated +
tombstone. Never delete -> archive/ + tombstone.

## Consolidation
Periodic (every ~5 tasks or when the SessionStart notice says overdue), AFTER
the user's current request, time-boxed: distil recurring worked->skill,
didn't->pitfalls; revise/deprecate contradicted skills; run journal-vs-git gap
check; trim STATE; refresh index. Never preempt the user's task.

## Seam
When a skill is established AND generalizable beyond yls, propose an app-agnostic
version for the Developer portfolio brain's wiki/shared/ (kind: playbook).
Proposal-only, user-approved; cross-project write needs explicit authorization.

## Accepted Limitations
- AL-1: hooks cannot verify truthfulness/completeness of self-reports (structural floor only).
- AL-2: enforcement only in Claude Code; other tools won't self-maintain the brain.
- AL-3: task-boundary detection is heuristic; gate may over/under-fire.
- AL-4: distillation quality is agent-dependent; the post-task notice is a floor.
- AL-5: brain-in-repo is a confidentiality/entanglement tradeoff; heuristic PII scan is partial.
```

- [ ] **Step 2.4: Write `ylsbrain/STATE.md`**

```markdown
# yls brain — STATE
Updated: 2026-05-17

## Current focus
Brain bootstrap — no engineering tasks recorded yet.

## Latest synopsis
(none yet) — first task will create journal/<date>.md

## Open threads
- none

## Active skills in play
- none
```

- [ ] **Step 2.5: Write `ylsbrain/index.md`**

```markdown
# Index
Catalog of the yls brain. SessionStart reads this.

## Skills
_None yet._

## Recent journal
_None yet._

## Key references
_None yet._
```

- [ ] **Step 2.6: Write `ylsbrain/log.md`**

```markdown
# Log
Append-only timeline. Entry format: `## [YYYY-MM-DD] <op> | <title>`.

## [2026-05-17] init | YLS brain scaffolded
- Vault structure, schema, hooks created.
```

- [ ] **Step 2.7: Append the pointer section to `yls/CLAUDE.md`**

Append exactly (do not modify any existing content):
```markdown

## YLS Brain (ylsbrain/) — mandatory protocol

A self-improving engineering memory lives in `ylsbrain/`. Hooks enforce it
(SessionStart injects state; Stop gates a per-task journal entry). On every
session: read the injected STATE + latest journal pointer and state what we
last did before new work. On task completion: append a journal entry
(Synopsis / What worked + Evidence / What did NOT work / Artifacts / Next) per
`ylsbrain/CLAUDE.md`. NO secrets/PII in entries. Consolidation runs after the
user's task, never instead of it. Full schema: `ylsbrain/CLAUDE.md`.
```

- [ ] **Step 2.8: Run schema verifier — expect GREEN**

Run: `node .claude/hooks/verify/verify-schema.js`
Expected: exit 0, `SCHEMA OK`.

- [ ] **Step 2.9: Roadmap + checkpoint**

Tick Phase 2. `/git-workflow-planning:checkpoint 2 protocol content` (fallback `git add -A && git commit -m "brain: phase 2 protocol + schema content"`).

---

## Phase 3: Hook scripts (Node)

- [ ] **Step 3.1: Write the hooks verifier (red)**

Create `.claude/hooks/verify/verify-hooks.js`:
```javascript
'use strict';
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const hooks = path.resolve(__dirname, '..');
const root = path.resolve(hooks, '..', '..');
const bs = path.join(root, 'ylsbrain', '.brainstate');
function reset(){ fs.rmSync(bs, {recursive:true, force:true}); }
function run(script, input){
  return cp.spawnSync(process.execPath, [path.join(hooks, script)],
    { input: JSON.stringify(input), encoding:'utf8' });
}
let fails = [];
reset();
// 1. session-start injects and creates sentinel
let r = run('session-start.js', { session_id:'T1', cwd:root });
if (!/STATE/.test(r.stdout) || !fs.existsSync(path.join(bs,'T1.sentinel')))
  fails.push('session-start did not inject/sentinel');
// 2. post-tool-use writes a ledger line
run('post-tool-use.js', { session_id:'T1', tool_name:'Write', tool_input:{file_path:'app/x.ts'} });
const ledger = path.join(bs,'T1.ledger');
if (!fs.existsSync(ledger) || !fs.readFileSync(ledger,'utf8').includes('Write')) fails.push('ledger not written');
// 3. stop blocks when unconsumed work and no covering entry
r = run('stop.js', { session_id:'T1', cwd:root });
if (r.status !== 2) fails.push('stop did not block (expected exit 2), got '+r.status);
// 4. write a covering journal entry -> stop passes + watermark advances
const jdir = path.join(root,'ylsbrain','journal');
const today = new Date().toISOString().slice(0,10);
fs.writeFileSync(path.join(jdir, today+'.md'),
  `# ${today}\n\n### [23:59] test task (branch: feature/yls-brain · commits: none)\n`+
  `**Synopsis:** s\n**What worked:** w. Evidence: manual: verified\n`+
  `**What did NOT work:** none\n**Artifacts:** a\n**Next / open:** none\n`);
r = run('stop.js', { session_id:'T1', cwd:root });
if (r.status !== 0) fails.push('stop did not pass after covering entry, got '+r.status);
const brain = JSON.parse(fs.readFileSync(path.join(bs,'brain.json'),'utf8'));
if (!brain.lastCoveredTs) fails.push('watermark not advanced');
// 5. loop-breaker: force 2 blocks then fail open
reset(); run('session-start.js',{session_id:'T2',cwd:root});
run('post-tool-use.js',{session_id:'T2',tool_name:'Edit',tool_input:{file_path:'a.ts'}});
run('stop.js',{session_id:'T2',cwd:root}); run('stop.js',{session_id:'T2',cwd:root});
r = run('stop.js',{session_id:'T2',cwd:root});
if (r.status !== 0) fails.push('loop-breaker did not fail open on 3rd block');
// 6. PII heuristic warns
reset(); run('session-start.js',{session_id:'T3',cwd:root});
run('post-tool-use.js',{session_id:'T3',tool_name:'Write',tool_input:{file_path:'a.ts'}});
fs.writeFileSync(path.join(jdir, today+'.md'),
  `# ${today}\n\n### [23:58] s (branch: x · commits: none)\n**Synopsis:** s\n`+
  `**What worked:** key sk_live_abcdefghij. Evidence: manual: x\n`+
  `**What did NOT work:** none\n**Artifacts:** a\n**Next / open:** none\n`);
r = run('stop.js',{session_id:'T3',cwd:root});
if (!/PII|secret/i.test(r.stdout + r.stderr)) fails.push('PII heuristic did not warn');
reset();
if (fails.length){ console.log('HOOKS FAIL:\n'+fails.join('\n')); process.exit(1); }
console.log('HOOKS OK'); process.exit(0);
```

- [ ] **Step 3.2: Run it — expect RED**

Run: `node .claude/hooks/verify/verify-hooks.js`
Expected: exit 1 (hooks not implemented).

- [ ] **Step 3.3: Implement `.claude/hooks/brain-lib.js`** (replace stub)

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

function ylsRoot(input) {
  return (input && input.cwd) ? input.cwd
    : path.resolve(__dirname, '..', '..');
}
const P = (root, ...p) => path.join(root, 'ylsbrain', ...p);
const stateDir = root => P(root, '.brainstate');

function ensureDir(d){ fs.mkdirSync(d, { recursive:true }); }
function readJson(f, dflt){ try { return JSON.parse(fs.readFileSync(f,'utf8')); }
  catch { return dflt; } }
function writeJson(f, o){ ensureDir(path.dirname(f)); fs.writeFileSync(f, JSON.stringify(o,null,2)); }
const nowIso = () => new Date().toISOString();

function brainFile(root){ return path.join(stateDir(root),'brain.json'); }
function getBrain(root){ return readJson(brainFile(root),
  { lastCoveredTs:'', lastConsolidationTs:'', taskCountSinceConsolidation:0 }); }
function setBrain(root,b){ writeJson(brainFile(root), b); }

function sentinelFile(root,id){ return path.join(stateDir(root), id+'.sentinel'); }
function ledgerFile(root,id){ return path.join(stateDir(root), id+'.ledger'); }

function appendLedger(root,id,tool,detail){
  ensureDir(stateDir(root));
  fs.appendFileSync(ledgerFile(root,id), `${nowIso()}\t${tool}\t${detail}\n`);
}
function allLedgerLines(root){
  const d = stateDir(root); if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f=>f.endsWith('.ledger'))
    .flatMap(f=>fs.readFileSync(path.join(d,f),'utf8').split('\n').filter(Boolean))
    .map(l=>({ ts:l.split('\t')[0], raw:l }));
}
function unconsumed(root){
  const b = getBrain(root);
  return allLedgerLines(root).filter(x => !b.lastCoveredTs || x.ts > b.lastCoveredTs);
}

function latestJournal(root){
  const jd = P(root,'journal'); if (!fs.existsSync(jd)) return null;
  const files = fs.readdirSync(jd).filter(f=>/^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort();
  return files.length ? path.join(jd, files[files.length-1]) : null;
}
// returns array of {ts:isoApprox, ok:boolean} for each ### [HH:MM] block in the latest day file
function journalBlocks(root){
  const f = latestJournal(root); if (!f) return [];
  const day = path.basename(f,'.md');
  const txt = fs.readFileSync(f,'utf8');
  const blocks = txt.split(/^### \[/m).slice(1);
  return blocks.map(bk=>{
    const hhmm = (bk.match(/^(\d{2}:\d{2})\]/)||[])[1] || '00:00';
    const ok = /\*\*What did NOT work:\*\*\s*\S/.test(bk) && /Evidence:\s*\S/.test(bk);
    return { ts:`${day}T${hhmm}:00.000Z`, ok };
  });
}
const PII = [/sk_live_[A-Za-z0-9]/, /AKIA[0-9A-Z]{16}/, /BEGIN [A-Z ]*PRIVATE KEY/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, /\b\d{3}[-.]\d{3}[-.]\d{4}\b/,
  /\b[0-9a-fA-F]{40,}\b/];
function scanSecrets(text){ return PII.some(re=>re.test(text)); }

module.exports = { ylsRoot, P, stateDir, ensureDir, readJson, writeJson, nowIso,
  getBrain, setBrain, sentinelFile, ledgerFile, appendLedger, allLedgerLines,
  unconsumed, latestJournal, journalBlocks, scanSecrets };
```

- [ ] **Step 3.4: Implement `.claude/hooks/session-start.js`**

```javascript
'use strict';
const fs = require('fs'); const path = require('path');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const root = L.ylsRoot(input);
  const id = input.session_id || 'unknown';
  L.ensureDir(L.stateDir(root));
  // prune >14d sentinels/ledgers
  const d = L.stateDir(root), cutoff = Date.now()-14*864e5;
  for (const f of fs.readdirSync(d)) {
    if (/\.(sentinel|ledger)$/.test(f)) {
      const fp = path.join(d,f);
      if (fs.statSync(fp).mtimeMs < cutoff) fs.rmSync(fp,{force:true});
    }
  }
  L.writeJson(L.sentinelFile(root,id),
    { sessionId:id, startTs:L.nowIso(), branch:(input.branch||''), blockCount:0 });
  const rd = f => { try { return fs.readFileSync(L.P(root,f),'utf8'); } catch { return ''; } };
  const brain = L.getBrain(root);
  const overdue = brain.taskCountSinceConsolidation >= 5;
  let out = '';
  if (overdue) out += 'INFO Consolidation overdue - after the user task, offer/run a time-boxed consolidation.\n\n';
  out += '=== YLS BRAIN (session start) ===\n';
  out += 'Protocol: state what we last did before new work; on task completion append a journal entry (Synopsis/What worked+Evidence/What did NOT work/Artifacts/Next); NO secrets/PII; consolidation after the user task only.\n\n';
  out += '--- STATE.md ---\n' + rd('STATE.md') + '\n';
  const lj = L.latestJournal(root);
  out += '--- latest journal ---\n' + (lj ? path.basename(lj) : '(none yet)') + '\n';
  process.stdout.write(out);
  process.exit(0);
} catch (e) { console.error('[brain] session-start failed open: '+e.message); process.exit(0); }
```

- [ ] **Step 3.5: Implement `.claude/hooks/post-tool-use.js`**

```javascript
'use strict';
const fs = require('fs');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const tool = input.tool_name || '';
  const cmd = (input.tool_input && input.tool_input.command) || '';
  if (!/^(Edit|Write|MultiEdit)$/.test(tool)
      && !(tool==='Bash' && /git\s+commit/.test(cmd)))
    process.exit(0);
  const root = L.ylsRoot(input);
  const id = input.session_id || 'unknown';
  const detail = (input.tool_input && (input.tool_input.file_path
    || input.tool_input.command)) || tool;
  L.appendLedger(root, id, tool, String(detail).slice(0,200));
  process.exit(0);
} catch (e) { console.error('[brain] post-tool-use failed open: '+e.message); process.exit(0); }
```

- [ ] **Step 3.6: Implement `.claude/hooks/stop.js`**

```javascript
'use strict';
const fs = require('fs');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const root = L.ylsRoot(input);
  const id = input.session_id || 'unknown';
  const sf = L.sentinelFile(root,id);
  const sentinel = L.readJson(sf, { blockCount:0 });
  const un = L.unconsumed(root);
  if (un.length === 0) process.exit(0); // no substantive work

  const oldestTs = un.map(x=>x.ts).sort()[0];
  const blocks = L.journalBlocks(root);
  const covering = blocks.find(b => b.ts >= oldestTs && b.ok);

  // PII heuristic (non-blocking warning) on the latest journal file
  const lj = L.latestJournal(root);
  if (lj && L.scanSecrets(fs.readFileSync(lj,'utf8')))
    console.error('[brain] WARNING: possible secret/PII in journal entry (AL-5 heuristic) - review before commit.');

  if (covering) {
    const newest = L.allLedgerLines(root).map(x=>x.ts).sort().pop() || L.nowIso();
    const b = L.getBrain(root);
    b.lastCoveredTs = newest;
    b.taskCountSinceConsolidation = (b.taskCountSinceConsolidation||0)+1;
    L.setBrain(root,b);
    process.exit(0);
  }
  if ((sentinel.blockCount||0) >= 2) {
    console.error('[brain] loop-breaker: failing open after 2 blocks - journal entry still missing (AL-3).');
    process.exit(0);
  }
  sentinel.blockCount = (sentinel.blockCount||0)+1;
  L.writeJson(sf, sentinel);
  console.error('[brain] BLOCKED: append a journal entry to ylsbrain/journal/'
    + new Date().toISOString().slice(0,10)
    + '.md for the work just done (### [HH:MM] title; Synopsis; What worked + Evidence; What did NOT work; Artifacts; Next). Or write the one-line no-op entry if nothing substantive.');
  process.exit(2); // non-zero = block
} catch (e) { console.error('[brain] stop failed open: '+e.message); process.exit(0); }
```

- [ ] **Step 3.7: Implement `.claude/hooks/consolidate.js`** (H4 helper — invoked by the agent when prompted; not a wired hook)

> Uses `execFileSync` with an argument array (NO shell, NO string interpolation) per the yls security convention.

```javascript
'use strict';
const fs = require('fs');
const cp = require('child_process');
const L = require('./brain-lib');
try {
  const root = L.ylsRoot({});
  const b = L.getBrain(root);
  // journal-vs-git gap check (heuristic): commits since lastConsolidationTs with
  // no journal file dated that day. execFileSync + arg array => no shell injection.
  let commits = '';
  try {
    const since = b.lastConsolidationTs || '1970-01-01';
    commits = cp.execFileSync('git',
      ['-C', root, 'log', '--since', since, '--pretty=%h%x09%ad', '--date=short'],
      { encoding:'utf8' });
  } catch { commits = ''; }
  const jdir = L.P(root,'journal');
  const days = fs.existsSync(jdir)
    ? fs.readdirSync(jdir).map(f=>f.replace('.md','')) : [];
  const gaps = commits.split('\n').filter(Boolean)
    .filter(l => { const day=l.split('\t')[1]; return day && !days.includes(day); });
  console.log('CONSOLIDATION HELPER');
  console.log('Tasks since last consolidation: ' + (b.taskCountSinceConsolidation||0));
  console.log('Potential journal-vs-git gaps (commit dates with no journal file):');
  console.log(gaps.length ? gaps.join('\n') : '(none)');
  console.log('\nNow distil: cluster recurring "what worked"->skill, "what did NOT work"->pitfalls; revise/deprecate contradicted skills; trim STATE.md; refresh index.md.');
  b.lastConsolidationTs = L.nowIso();
  b.taskCountSinceConsolidation = 0;
  L.setBrain(root,b);
  process.exit(0);
} catch (e) { console.error('[brain] consolidate helper error (non-fatal): '+e.message); process.exit(0); }
```

- [ ] **Step 3.8: Run hooks verifier — expect GREEN**

Run: `node .claude/hooks/verify/verify-hooks.js`
Expected: exit 0, `HOOKS OK`. If any sub-check fails, fix the named script to match its spec behavior and re-run until green.

- [ ] **Step 3.9: Roadmap + checkpoint**

Tick Phase 3. `/git-workflow-planning:checkpoint 3 node hooks` (fallback `git add -A && git commit -m "brain: phase 3 node enforcement hooks"`).

---

## Phase 4: settings.json wiring

- [ ] **Step 4.1: Apply the Phase-0 decision**

Using the Phase-0 finding: if `.claude/settings.json` is **absent**, create it with exactly:
```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/session-start.js" }] }],
    "PostToolUse": [{ "matcher": "Edit|Write|MultiEdit|Bash", "hooks": [{ "type": "command", "command": "node .claude/hooks/post-tool-use.js" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/stop.js" }] }]
  }
}
```
If `.claude/settings.json` **exists**, add the same `hooks` key with a Node script (no shell interpolation; reads/writes the file via `fs`, preserving all existing keys). Create `.claude/hooks/_apply-settings.js`:
```javascript
'use strict';
const fs=require('fs'); const f='.claude/settings.json';
const s=JSON.parse(fs.readFileSync(f,'utf8'));
s.hooks=s.hooks||{};
s.hooks.SessionStart=[{hooks:[{type:'command',command:'node .claude/hooks/session-start.js'}]}];
s.hooks.PostToolUse=[{matcher:'Edit|Write|MultiEdit|Bash',hooks:[{type:'command',command:'node .claude/hooks/post-tool-use.js'}]}];
s.hooks.Stop=[{hooks:[{type:'command',command:'node .claude/hooks/stop.js'}]}];
fs.writeFileSync(f,JSON.stringify(s,null,2));
console.log('merged hooks into existing settings.json');
```
then run `cd "C:/Users/rob/Documents/Software/service-businesses/yls" && node .claude/hooks/_apply-settings.js`. `settings.local.json` is NOT modified.

- [ ] **Step 4.2: Validate JSON + hook paths**

Create `.claude/hooks/verify/verify-settings.js`:
```javascript
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..');
const s=JSON.parse(fs.readFileSync(path.join(root,'.claude/settings.json'),'utf8'));
let fail=[];
['SessionStart','PostToolUse','Stop'].forEach(k=>{ if(!s.hooks||!s.hooks[k]) fail.push('missing '+k); });
['session-start.js','post-tool-use.js','stop.js'].forEach(h=>{
  if(!fs.existsSync(path.join(root,'.claude/hooks',h))) fail.push('missing hook file '+h); });
if(fail.length){ console.log('SETTINGS FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SETTINGS OK'); process.exit(0);
```
Run: `node .claude/hooks/verify/verify-settings.js`
Expected: exit 0, `SETTINGS OK`.

- [ ] **Step 4.3: Roadmap + checkpoint**

Tick Phase 4. `/git-workflow-planning:checkpoint 4 settings wiring` (fallback `git add -A && git commit -m "brain: phase 4 settings.json hook wiring"`).

---

## Phase 5: End-to-end + acceptance

- [ ] **Step 5.1: Full verify suite — expect GREEN**

Run each, expect exit 0:
```bash
cd "C:/Users/rob/Documents/Software/service-businesses/yls" && node .claude/hooks/verify/verify-structure.js && node .claude/hooks/verify/verify-schema.js && node .claude/hooks/verify/verify-hooks.js && node .claude/hooks/verify/verify-settings.js && echo "ALL VERIFY GREEN"
```
Expected final line: `ALL VERIFY GREEN`.

- [ ] **Step 5.2: Consolidation plumbing check**

Run: `node .claude/hooks/consolidate.js`
Expected: prints `CONSOLIDATION HELPER`, a tasks count, a (possibly empty) gap list, and the distil instruction; exit 0. Confirms plumbing only — distillation quality is AL-4, not gated.

- [ ] **Step 5.3: Acceptance review against spec §12**

Confirm and note in the final journal entry: all §4 files exist; `.brainstate/` gitignored; `ylsbrain/CLAUDE.md` has §6 protocol + §9 AL-1..AL-5; root `CLAUDE.md` has the `## YLS Brain` section; `.claude/settings.json` has 3 hooks; deterministic clear + cross-session covered (verify-hooks check 4); loop-breaker (check 5); PII heuristic (check 6); plumbing-only consolidation (5.2). **Fidelity caveat (spec §11):** these use mocked hook input.

- [ ] **Step 5.4: Real-session smoke check (manual, required by spec §11)**

STOP and report to the user: "Automated checks green. The real-session smoke check requires a fresh Claude Code session in the yls repo to confirm the SessionStart injection and Stop gate fire under the actual harness. This cannot be self-tested in this session — please start a new yls session and confirm the brain injects + gates, then we finalize." Do not claim done until the user confirms or explicitly waives.

- [ ] **Step 5.5: Roadmap + finish**

Tick Phase 5. `/git-workflow-planning:finish` (fallback `git add -A && git commit -m "brain: phase 5 end-to-end validation"`).

---

## Phase Checklist (Rule 7 roadmap)

- [ ] Phase 0: Verify environment
- [ ] Phase 1: Vault scaffold + gitignore
- [ ] Phase 2: Protocol content
- [ ] Phase 3: Node hooks
- [ ] Phase 4: settings.json wiring
- [ ] Phase 5: End-to-end + acceptance

---

## Self-Review

**Spec coverage:** §4 vault/structure → Phase 1; §5 schemas + §6 protocol + §9 AL → Phase 2 (`ylsbrain/CLAUDE.md`) verified by verify-schema; §7 hooks incl. §7.1 ledger/watermark lifecycle, loop-breaker, PII, fail-open → Phase 3 verified by verify-hooks checks 1–6; §7 Phase-0 settings assumption → Phase 0 + Phase 4 + verify-settings; §8 seam → encoded in `ylsbrain/CLAUDE.md` Seam section (proposal-only, correctly out of automated scope); §11 verification (structure/schema/simulated session/deterministic clear/cross-session/loop-breaker/PII/consolidation plumbing/fidelity caveat/real-session smoke) → Phases 1/2/3/4/5; §12 acceptance → Step 5.3; AL-1..AL-5 → `ylsbrain/CLAUDE.md` Step 2.3 + surfaced 5.3. No gaps.

**Placeholder scan:** No "TBD/handle errors/etc." Every step has exact paths, complete code, exact commands + expected output. Template tokens (`<area>`, `<slug>`, `HH:MM`) are protocol schema tokens, not plan gaps.

**Type/name consistency:** `brain-lib.js` exports (`ylsRoot,P,stateDir,ensureDir,readJson,writeJson,nowIso,getBrain,setBrain,sentinelFile,ledgerFile,appendLedger,allLedgerLines,unconsumed,latestJournal,journalBlocks,scanSecrets`) are exactly the names consumed by `session-start.js`/`post-tool-use.js`/`stop.js`/`consolidate.js`. `brain.json` shape `{lastCoveredTs,lastConsolidationTs,taskCountSinceConsolidation}` consistent across lib + stop + consolidate + spec §7.1. Stop block = exit 2 consistently asserted in verify-hooks check 3. Hook command paths in Phase 4 match files created in Phase 3. Security convention (no `exec()`/shell interpolation; `execFileSync`+arg array) honored in `consolidate.js` and `_apply-settings.js`.
```
