# YLS Brain Knowledge Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-maintaining `ylsbrain/knowledge/` layer (orientation + superseded ledger + code-verified features + roadmap) so any future session gains accurate whole-app context without trusting the 13-month-stale `dev-docs/`.

**Architecture:** New `kind: knowledge` artifact type parallel to `skills/`. A red→green Node verifier gate (the brain's established `testing-red-green-verifier-gates` pattern) locks structure *before* content. Content is produced by a phased flow: schema/protocol → parallel research into a findings dossier → **human checkpoint** → synthesis of 4 docs → load-bearing build-status re-verification → journal/consolidation. Memory overrides the stale docs; the doc version is recorded in a superseded ledger with citations.

**Tech Stack:** Node (CommonJS verifier, mirroring `.claude/hooks/verify/*.js`), Obsidian-style Markdown vault, git (direct to `develop`).

**Authoritative spec:** `.claude/plans/feature-ylsbrain-knowledge-layer.md` (read it before starting; this plan implements it).

---

## File Structure

| Path | Create/Modify | Responsibility |
|---|---|---|
| `.claude/hooks/verify/verify-knowledge.js` | Create | Structural red→green gate: 4 files exist, valid `kind: knowledge` frontmatter, `orientation.md` ≤120 lines, required section anchors, wikilink resolution, `index.md`/`CLAUDE.md` clauses present |
| `ylsbrain/CLAUDE.md` | Modify | Add "Knowledge layer" schema block + mechanical (git-diff) consolidation clause |
| `ylsbrain/index.md` | Modify | Add `## Knowledge` section (SessionStart reads this) |
| `docs/temp/ylsbrain-knowledge-findings.md` | Create (scratch, Rule 5) | Phase-2 findings dossier: raw cited research, reconciled before synthesis. Not part of the vault. |
| `ylsbrain/knowledge/orientation.md` | Create | One-screen instant context (≤120 lines) |
| `ylsbrain/knowledge/superseded.md` | Create | Doc-vs-truth ledger |
| `ylsbrain/knowledge/features.md` | Create | Code-verified BUILT/PARTIAL/PLANNED/UNVERIFIED/SUPERSEDED inventory |
| `ylsbrain/knowledge/roadmap.md` | Create | Reconciled unbuilt-feature roadmap |
| `ylsbrain/STATE.md` | Modify | Point Latest synopsis/Notes at `[[knowledge/orientation]]` |
| `ylsbrain/log.md` | Modify | One timeline line |
| `ylsbrain/journal/2026-05-18.md` | Modify | Task journal entry (brain protocol) |

Note: this plan adapts TDD to the brain's verifier-gate idiom — the "failing test" is the structural verifier run before content exists (RED), then synthesis turns it GREEN. Content correctness (not just structure) is gated by the human dossier checkpoint (Task 8) and the load-bearing build-status re-verification (Task 14), because prose accuracy cannot be asserted by a script.

---

## Phase 1 — Schema / protocol + the gate

### Task 1: Create the structural verifier (the gate)

**Files:**
- Create: `.claude/hooks/verify/verify-knowledge.js`

- [ ] **Step 1: Write the verifier**

```js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..'); // yls/
const K = (f) => path.join(root, 'ylsbrain', 'knowledge', f);
const DOCS = ['orientation', 'superseded', 'features', 'roadmap'];
const LAYER = { orientation: 'orientation', superseded: 'reference', features: 'reference', roadmap: 'roadmap' };
const STATUS = ['current', 'partial', 'needs-reconcile'];
let fail = [];

// 1. four docs exist with parseable frontmatter
for (const slug of DOCS) {
  const fp = K(slug + '.md');
  if (!fs.existsSync(fp)) { fail.push(`missing ylsbrain/knowledge/${slug}.md`); continue; }
  const txt = fs.readFileSync(fp, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { fail.push(`${slug}.md: no frontmatter block`); continue; }
  const fm = m[1];
  if (!/\bkind:\s*knowledge\b/.test(fm)) fail.push(`${slug}.md: kind != knowledge`);
  if (!new RegExp(`\\bslug:\\s*${slug}\\b`).test(fm)) fail.push(`${slug}.md: slug != ${slug}`);
  const st = (fm.match(/\bstatus:\s*([a-z-]+)/) || [])[1];
  if (!STATUS.includes(st)) fail.push(`${slug}.md: status "${st}" not in ${STATUS.join('|')}`);
  const ly = (fm.match(/\blayer:\s*([a-z-]+)/) || [])[1];
  if (ly !== LAYER[slug]) fail.push(`${slug}.md: layer "${ly}" != ${LAYER[slug]}`);
  if (!/\bupdated:\s*\d{4}-\d{2}-\d{2}/.test(fm)) fail.push(`${slug}.md: updated date missing/!ISO`);
  if (!/\bsources:\s*\n(\s*-\s+\S+\n?)+/.test(fm + '\n')) fail.push(`${slug}.md: sources: needs >=1 entry`);
}

// 2. orientation.md <= 120 lines (hard, one-screen rule)
if (fs.existsSync(K('orientation.md'))) {
  const n = fs.readFileSync(K('orientation.md'), 'utf8').split('\n').length;
  if (n > 120) fail.push(`orientation.md: ${n} lines > 120 (one-screen rule)`);
}

// 3. required section anchors per doc
const NEED = {
  'features.md':   ['## BUILT', '## PARTIAL', '## PLANNED', '## SUPERSEDED'],
  'superseded.md': ['doc said', 'truth', 'why'],
  'roadmap.md':    ['## ', 'dev-docs/roadmap.md'],
  'orientation.md':['where it', 'transactional'],
};
for (const [f, toks] of Object.entries(NEED)) {
  if (!fs.existsSync(K(f))) continue;
  const c = fs.readFileSync(K(f), 'utf8');
  toks.forEach(t => { if (!c.includes(t)) fail.push(`${f}: missing anchor "${t}"`); });
}

// 4. wikilinks to knowledge/* must resolve to an existing file
for (const slug of DOCS) {
  if (!fs.existsSync(K(slug + '.md'))) continue;
  const c = fs.readFileSync(K(slug + '.md'), 'utf8');
  for (const mm of c.matchAll(/\[\[knowledge\/([a-z-]+)\]\]/g)) {
    if (!fs.existsSync(K(mm[1] + '.md'))) fail.push(`${slug}.md: dangling [[knowledge/${mm[1]}]]`);
  }
}

// 5. protocol wiring present
const claude = path.join(root, 'ylsbrain', 'CLAUDE.md');
const idx = path.join(root, 'ylsbrain', 'index.md');
const cc = fs.existsSync(claude) ? fs.readFileSync(claude, 'utf8') : '';
if (!cc.includes('Knowledge layer')) fail.push('ylsbrain/CLAUDE.md: missing "Knowledge layer" block');
if (!cc.includes('kind: knowledge')) fail.push('ylsbrain/CLAUDE.md: missing kind: knowledge contract');
if (!cc.includes('git log --name-only')) fail.push('ylsbrain/CLAUDE.md: missing mechanical consolidation clause');
const ic = fs.existsSync(idx) ? fs.readFileSync(idx, 'utf8') : '';
if (!ic.includes('## Knowledge')) fail.push('ylsbrain/index.md: missing "## Knowledge" section');

if (fail.length) { console.log('KNOWLEDGE FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('KNOWLEDGE OK'); process.exit(0);
```

- [ ] **Step 2: Commit the gate**

```bash
git add .claude/hooks/verify/verify-knowledge.js
git commit -m "test: add ylsbrain knowledge-layer structural verifier (gate)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 2: Run the gate — expect RED

- [ ] **Step 1: Run the verifier from project root**

Run: `node .claude/hooks/verify/verify-knowledge.js`
Expected: exit 1, output begins `KNOWLEDGE FAIL:` and lists `missing ylsbrain/knowledge/orientation.md` (+ the other 3) and the missing `CLAUDE.md`/`index.md` clauses. This RED state proves the gate detects an unbuilt layer.

### Task 3: Extend `ylsbrain/CLAUDE.md` with the Knowledge-layer schema + consolidation clause

**Files:**
- Modify: `ylsbrain/CLAUDE.md` (insert a new section after `## Skill protocol`, before `## Consolidation`; then extend `## Consolidation`)

- [ ] **Step 1: Insert the Knowledge-layer schema block**

Insert this block immediately before the `## Consolidation` heading:

```markdown
## Knowledge layer
ylsbrain/knowledge/<slug>.md, slug in {orientation, superseded, features,
roadmap}; artifact `kind: knowledge`. Frontmatter: kind/slug/status
(current|partial|needs-reconcile)/updated/layer(orientation|reference|
roadmap)/sources (POINTERS only — dev-doc paths, code paths, memory:<name>;
never payloads/secrets). Rules: synthesize + link, never paste/paraphrase
dev-docs (a restated fact = <=2 sentences + citation). Principled sizing:
orientation.md <= one screen (~120 lines, hard); the other three are as long
as the reconciled facts require and no longer — pointers over paraphrase.
Build status is evidence-gated: BUILT only if entrypoint exists AND non-stub
logic AND wired end-to-end (cited path); else PARTIAL/PLANNED/UNVERIFIED —
never assert BUILT on a doc checkbox. Memory overrides dev-docs; the doc
version goes to superseded.md with both citations + reason.
```

- [ ] **Step 2: Extend the `## Consolidation` section with the mechanical clause**

Append this sentence to the existing `## Consolidation` paragraph:

```markdown
Also reconcile knowledge/: run `git log --name-only
<lastConsolidationTs>..HEAD` (+ journal entries since the watermark); for
every changed path under app/, app/api/, components/, lib/, supabase/, check
whether features.md/roadmap.md/orientation.md still hold — any claim the diff
contradicts flips to `status: needs-reconcile` and is corrected or flagged;
a doc reading like paraphrased dev-docs is trimmed to pointers.
```

- [ ] **Step 3: Verify both insertions are present**

Run: `node -e "const c=require('fs').readFileSync('ylsbrain/CLAUDE.md','utf8');console.log(['Knowledge layer','kind: knowledge','git log --name-only'].map(t=>t+':'+c.includes(t)).join(' '))"`
Expected: `Knowledge layer:true kind: knowledge:true git log --name-only:true`

### Task 4: Add the `## Knowledge` section to `ylsbrain/index.md`

**Files:**
- Modify: `ylsbrain/index.md` (add a `## Knowledge` section after `## Skills`)

- [ ] **Step 1: Insert the section** (place after the `## Skills` list, before `## Recent journal`)

```markdown
## Knowledge
- [[knowledge/orientation]] — what YLS is, transactional model, current state, next.
- [[knowledge/superseded]] — doc-vs-truth ledger (memory overrides stale dev-docs).
- [[knowledge/features]] — code-verified BUILT/PARTIAL/PLANNED/UNVERIFIED inventory.
- [[knowledge/roadmap]] — reconciled unbuilt-feature roadmap.
```

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('fs').readFileSync('ylsbrain/index.md','utf8').includes('## Knowledge'))"`
Expected: `true`

### Task 5: Commit Phase 1

- [ ] **Step 1: Commit schema/protocol wiring**

```bash
git add ylsbrain/CLAUDE.md ylsbrain/index.md
git commit -m "brain: add knowledge-layer schema + mechanical consolidation clause

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

(The gate still RED — content not yet created. That is expected; Phase 1 only wires the contract.)

---

## Phase 2 — Parallel research → findings dossier

### Task 6: Dispatch parallel research agents

**Files:**
- Create: `docs/temp/ylsbrain-knowledge-findings.md`

- [ ] **Step 1: Dispatch four independent agents in ONE message** (no shared state — use `Agent`, `subagent_type: general-purpose`, run concurrently). Each returns a cited section; you assemble them into the dossier.

  - **Agent A — dev-docs product/roadmap mining.** Prompt: "Read `dev-docs/PRD.md`, `roadmap.md`, `todo.md`, `features-and-dashboards.md`, `technical-architecture.md`. Output: (1) the intended product purpose/users/business model; (2) the COMPLETE feature universe as a flat list grouped by area (auth, list-builder, design, orders, payments, validation, analytics, multi-tenant, integrations, admin); (3) the roadmap phases verbatim-summarized with dev-doc citations. Pointers + 1–2 sentence summaries only; cite `dev-docs/<file>` per claim. Do NOT read code."
  - **Agent B — codebase build-status verification.** Prompt: "For each feature area (auth, list-builder, design, orders, payments, validation, analytics, multi-tenant, integrations, admin) inspect `app/`, `app/api/`, `components/`, `lib/`, `supabase/`. Classify each feature BUILT / PARTIAL / PLANNED / UNVERIFIED to this bar: BUILT = entrypoint exists AND non-stub logic (not TODO/`throw 'not implemented'`/empty handler) AND wired end-to-end; PARTIAL = entrypoint but (logic|wiring) missing — say what; UNVERIFIED = couldn't conclude. Cite exact path (and symbol/line where it sharpens it) for every BUILT/PARTIAL. Do not trust `dev-docs/todo.md` checkboxes."
  - **Agent C — integrations.** Prompt: "Determine the real status of AccuZip, Melissa, Redstone, Stripe, Mailgun: where each is wired in code (cite paths), built vs planned, and the canonical `dev-docs/api-*.md` pointer. No secrets/keys — pointers only."
  - **Agent D — doc-vs-memory conflict detection.** Prompt: "Cross-check `dev-docs/` claims against these current truths: transactional-only/no-subscriptions (MLM is a separate app), no FPD (custom design system), AccuZip tiered standalone pricing $8–$400, admin pricing UI need, role model. For EACH conflict produce: `doc said X (cite dev-doc) → truth is Y (cite memory:<name> or 'user-stated') → why`. Also list any NEW conflict you find that is NOT in that list, marked `FLAG-TO-USER` (do not resolve it)."

- [ ] **Step 2: Assemble the dossier** into `docs/temp/ylsbrain-knowledge-findings.md` with this exact skeleton:

```markdown
# YLS Knowledge — Findings Dossier (scratch, pre-synthesis)

## A. Product / purpose / business model (cited)
## B. Build-status inventory (per feature: AREA — NAME — STATUS — cited path — note)
## C. Integrations (per integration: status — code path — dev-doc pointer)
## D. Superseded deltas (doc said X [cite] → truth Y [cite] → why)
## D2. FLAG-TO-USER — new conflicts not previously in memory (unresolved)
## E. Counts: BUILT=_ PARTIAL=_ PLANNED=_ UNVERIFIED=_ ; superseded deltas=_
## F. Proposed per-doc soft size targets (derived from counts)
```

- [ ] **Step 3: Commit the dossier (scratch)**

```bash
git add docs/temp/ylsbrain-knowledge-findings.md
git commit -m "docs(temp): ylsbrain knowledge findings dossier (pre-synthesis)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## ── CHECKPOINT (hard gate) ──

### Task 7: Present the dossier and get explicit approval

- [ ] **Step 1: Present to the user**: section E counts, the full §D superseded list, **every §D2 FLAG-TO-USER conflict (ask the user to resolve each — do not guess)**, and the §F proposed per-doc size targets.
- [ ] **Step 2: Incorporate the user's resolutions** of §D2 into the dossier; record agreed per-doc size targets.
- [ ] **Step 3: STOP until the user explicitly approves.** Synthesis (Phase 3) MUST NOT begin until approval is given. If the user requests research changes, loop back to Task 6.

---

## Phase 3 — Synthesis (only after checkpoint approval)

> Each doc below: write to the exact frontmatter + skeleton shown, fill from the **approved** dossier only, every BUILT/PARTIAL line carries its cited path, no paraphrased dev-doc prose. `updated:` = today (`date -u +%F`).

### Task 8: Synthesize `ylsbrain/knowledge/superseded.md` (highest value — do first)

**Files:**
- Create: `ylsbrain/knowledge/superseded.md`

- [ ] **Step 1: Write the file** using this exact structure (one block per dossier §D entry; include all §2 spec areas + every user-resolved §D2):

```markdown
---
kind: knowledge
slug: superseded
status: current
updated: <YYYY-MM-DD>
layer: reference
sources:
  - dev-docs/PRD.md
  - dev-docs/roadmap.md
  - memory:project_no_subscriptions
  - memory:feedback_no_fpd
  - memory:project_validation_pricing
  - memory:project_admin_pricing
---

# Superseded — doc-vs-truth ledger

Each entry: **doc said X** (citation) → **truth is Y** (citation) → **why**.
The brain trusts the "truth" column; `dev-docs/` remain the historical baseline.

### Subscriptions / pricing tiers
- doc said: Free/Pro/Team/Enterprise subscription tiers (`dev-docs/PRD.md`, `dev-docs/roadmap.md` §1.2)
- truth: transactional revenue only; no subscriptions; MLM is a SEPARATE app (`memory:project_no_subscriptions`)
- why: <reason from dossier/user>

### Design tooling
- doc said: Fancy Product Designer (FPD) integration (`dev-docs/technical-architecture.md`)
- truth: custom design system only, VistaPrint-style (`memory:feedback_no_fpd`)
- why: <reason>

### AccuZip validation pricing
- doc said: <doc claim + cite>
- truth: tiered per-job $8–$400, charged standalone only, not on mail orders (`memory:project_validation_pricing`)
- why: <reason>

### Admin pricing management
- doc said: <doc claim + cite>
- truth: admin UI required to manage pricing without code deploys (`memory:project_admin_pricing`)
- why: <reason>

### Role model
- doc said: 8-tier role system (`dev-docs/roadmap.md` §1.2)
- truth: <actual role model from Agent B, cited path>
- why: <reason>

<one ### block per remaining dossier §D entry and each user-resolved §D2>
```

- [ ] **Step 2: Commit**

```bash
git add ylsbrain/knowledge/superseded.md
git commit -m "brain(knowledge): add superseded doc-vs-truth ledger

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 9: Synthesize `ylsbrain/knowledge/features.md`

**Files:**
- Create: `ylsbrain/knowledge/features.md`

- [ ] **Step 1: Write the file** — every BUILT/PARTIAL row MUST end with a real cited path from dossier §B; PLANNED rows point to `[[knowledge/roadmap]]`; SUPERSEDED rows point to `[[knowledge/superseded]]`:

```markdown
---
kind: knowledge
slug: features
status: current
updated: <YYYY-MM-DD>
layer: reference
sources:
  - dev-docs/features-and-dashboards.md
  - dev-docs/todo.md
  - app/
  - components/
  - lib/
  - supabase/
---

# Features — code-verified inventory

Status bar: **BUILT** = entrypoint + non-stub logic + wired (cited). **PARTIAL**
= what's missing noted. **PLANNED** → [[knowledge/roadmap]]. **UNVERIFIED** =
not conclusively checked. **SUPERSEDED** → [[knowledge/superseded]].

## BUILT
| Area | Feature | Evidence (path[:symbol]) |
|---|---|---|
| <area> | <feature> | `<exact/path>` |

## PARTIAL
| Area | Feature | Have | Missing | Path |
|---|---|---|---|---|

## PLANNED
| Area | Feature | → |
|---|---|---|
| <area> | <feature> | [[knowledge/roadmap]] |

## UNVERIFIED
| Area | Feature | Why not conclusive |
|---|---|---|

## SUPERSEDED
| Area | Was | → |
|---|---|---|
| <area> | <doc feature> | [[knowledge/superseded]] |
```

- [ ] **Step 2: Commit**

```bash
git add ylsbrain/knowledge/features.md
git commit -m "brain(knowledge): add code-verified features inventory

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 10: Synthesize `ylsbrain/knowledge/roadmap.md`

**Files:**
- Create: `ylsbrain/knowledge/roadmap.md`

- [ ] **Step 1: Write the file** — phased unbuilt work, reconciled; superseded phases explicitly marked, not dropped:

```markdown
---
kind: knowledge
slug: roadmap
status: current
updated: <YYYY-MM-DD>
layer: roadmap
sources:
  - dev-docs/roadmap.md
  - dev-docs/todo.md
---

# Roadmap — reconciled unbuilt work

Reconciled to current direction (memory overrides stale `dev-docs/`). Original
detail: `dev-docs/roadmap.md`. Superseded phases kept visible, struck through.

## Near-term (next)
- <unbuilt feature> — <1-line> (orig: `dev-docs/roadmap.md` §<n>)

## Mid-term
- <...>

## Long-term
- <...>

## Superseded / dropped from the original roadmap
- ~~<phase/feature>~~ — superseded; see [[knowledge/superseded]] (<reason>)
```

- [ ] **Step 2: Commit**

```bash
git add ylsbrain/knowledge/roadmap.md
git commit -m "brain(knowledge): add reconciled roadmap

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 11: Synthesize `ylsbrain/knowledge/orientation.md` (≤120 lines, last — it summarizes the others)

**Files:**
- Create: `ylsbrain/knowledge/orientation.md`

- [ ] **Step 1: Write the file**, ≤120 lines total, pointer sections only (2–3 sentences + links), no synthesized product/arch/integration prose:

```markdown
---
kind: knowledge
slug: orientation
status: current
updated: <YYYY-MM-DD>
layer: orientation
sources:
  - dev-docs/PRD.md
  - dev-docs/technical-architecture.md
  - memory:project_no_subscriptions
---

# YLS — Orientation (read this first)

**What it is:** Yellow Letter Shop — direct-mail automation SaaS (real-estate/
agency/marketer users): build lists → design mail → validate addresses →
order → fulfill.

**Business model:** transactional revenue only — NO subscriptions; AccuZip
validation billed standalone tiered $8–$400. MLM is a separate app. See
[[knowledge/superseded]].

**Current state (3 lines):** <BUILT-vs-PLANNED one-liner from features.md
counts>. Full inventory: [[knowledge/features]].

**Where it's headed next:** <top near-term items>. See [[knowledge/roadmap]].

## Product (pointer)
<2–3 sentences> — detail: `dev-docs/PRD.md`, corrections [[knowledge/superseded]].

## Architecture (pointer)
<2–3 sentences: Next.js App Router + Supabase/RLS + Stripe manual-capture> —
detail: `dev-docs/technical-architecture.md`; real module map [[knowledge/features]].

## Integrations (pointer)
AccuZip / Melissa / Redstone / Stripe / Mailgun — status in
[[knowledge/features]]; specs `dev-docs/api-*.md`.

## Caveat
`dev-docs/` are April 2025 and partly stale — always defer to
[[knowledge/superseded]] on conflict.
```

- [ ] **Step 2: Verify line count ≤120**

Run: `node -e "console.log(require('fs').readFileSync('ylsbrain/knowledge/orientation.md','utf8').split('\n').length)"`
Expected: a number `≤ 120`. If over, cut prose to pointers and re-check.

- [ ] **Step 3: Commit**

```bash
git add ylsbrain/knowledge/orientation.md
git commit -m "brain(knowledge): add orientation (one-screen entry point)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Verification

### Task 12: Turn the gate GREEN

- [ ] **Step 1: Run the structural verifier**

Run: `node .claude/hooks/verify/verify-knowledge.js`
Expected: exit 0, output `KNOWLEDGE OK`. If `KNOWLEDGE FAIL:`, fix each listed item and re-run until `KNOWLEDGE OK`.

- [ ] **Step 2: Run the full verifier suite (no regression)**

Run: `node .claude/hooks/verify/verify-structure.js && node .claude/hooks/verify/verify-schema.js && node .claude/hooks/verify/verify-hooks.js && node .claude/hooks/verify/verify-settings.js && node .claude/hooks/verify/verify-knowledge.js && echo ALL VERIFY GREEN`
Expected: ends with `ALL VERIFY GREEN`.

### Task 13: Load-bearing build-status re-verification (the value check)

- [ ] **Step 1: Independently re-verify build claims.** For each feature group in `features.md` BUILT: pick ≥3 rows and re-open the cited path; confirm entrypoint + non-stub logic + wiring per the §5 bar. **Re-verify 100% of any feature `orientation.md` calls built/shipped.**
- [ ] **Step 2: Downgrade failures.** Any BUILT not meeting the bar → move to PARTIAL/UNVERIFIED with the gap noted. Re-run Task 12 Step 1 (still `KNOWLEDGE OK`).
- [ ] **Step 3: Record evidence** verbatim for the journal (paths checked, what was found) — this satisfies the brain Evidence rule.

### Task 14: Secret/PII + link + consolidation checks

- [ ] **Step 1: AL-5 scan over all new files**

Run: `node -e "const L=require('./.claude/hooks/brain-lib');const fs=require('fs');for(const f of ['orientation','superseded','features','roadmap']){const p='ylsbrain/knowledge/'+f+'.md';console.log(p, L.scanSecrets(fs.readFileSync(p,'utf8'))?'FLAG':'clean');}"`
Expected: each `clean`. A `FLAG` on a 40-char git SHA is the known benign false positive — confirm it is a SHA, otherwise remove the real secret.

- [ ] **Step 2: Consolidation helper exits 0**

Run (from project root): `node .claude/hooks/consolidate.js; echo "exit=$?"`
Expected: `exit=0`.

---

## Phase 5 — Journal, STATE, consolidation

### Task 15: Update STATE / log / index and append the journal entry

**Files:**
- Modify: `ylsbrain/STATE.md`, `ylsbrain/log.md`, `ylsbrain/index.md`, `ylsbrain/journal/2026-05-18.md`

- [ ] **Step 1: STATE.md** — set Current focus to "knowledge layer shipped"; Latest synopsis points at `[[knowledge/orientation]]`; close the Open thread from this work.
- [ ] **Step 2: log.md** — append:

```markdown
## [2026-05-18] feature | YLS Brain knowledge layer shipped
- knowledge/{orientation,superseded,features,roadmap}.md; schema +
  mechanical consolidation clause; structural gate verify-knowledge.js.
  Code-verified build status. See journal/2026-05-18.
```

- [ ] **Step 3: journal/2026-05-18.md** — append a `### [HH:MM] YLS Brain knowledge layer` block per the brain schema: Synopsis / What worked + **Evidence** (paste Task 12 `ALL VERIFY GREEN` + Task 13 re-verification findings + Task 14 results) / What did NOT work / Artifacts (the 4 docs, verifier, CLAUDE.md/index.md, commits) / Next.
- [ ] **Step 4: Commit**

```bash
git add ylsbrain/STATE.md ylsbrain/log.md ylsbrain/index.md ylsbrain/journal/2026-05-18.md
git commit -m "brain: journal + STATE/log/index for knowledge layer ([HH:MM])

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 16: Post-task consolidation pass

- [ ] **Step 1:** Run the brain's post-task consolidation per `ylsbrain/CLAUDE.md` `## Consolidation` (including the NEW mechanical knowledge clause — `git log --name-only` since `lastConsolidationTs`, confirm `features.md`/`roadmap.md`/`orientation.md` hold). Distil any worked→skill / didn't→pitfall, run the journal-vs-git gap check, trim STATE, refresh index.
- [ ] **Step 2:** If consolidation changes files, commit:

```bash
git add ylsbrain/
git commit -m "brain: post-task consolidation after knowledge layer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Final regression**

Run: `node .claude/hooks/verify/verify-structure.js && node .claude/hooks/verify/verify-schema.js && node .claude/hooks/verify/verify-hooks.js && node .claude/hooks/verify/verify-settings.js && node .claude/hooks/verify/verify-knowledge.js && echo ALL VERIFY GREEN`
Expected: `ALL VERIFY GREEN`.

---

## Self-Review (completed by plan author)

**1. Spec coverage:**
- Spec §3 schema → Task 1 (verifier encodes it) + Task 3 (CLAUDE.md block). ✓
- §4 four docs → Tasks 8–11 (one each, exact skeletons). ✓
- §5 reconciliation + evidence-gated build bar → Task 6 agent prompts + Task 13 re-verification. ✓
- §6 protocol extension (CLAUDE.md/index.md/STATE/log, mechanical clause, no hook code) → Tasks 3,4,15; clause verified in Task 1 Step (5) + Task 3 Step 3. ✓
- §7 phased build + hard checkpoint → Phase headings + Task 7 (explicit STOP). ✓
- §8 done-criteria → Task 12 (structure+regression), Task 13 (build integrity, load-bearing), Task 14 (AL-5/links/consolidate), Task 15 (evidence in journal). ✓
- §9 non-goals → no standalone product/arch/integration docs (orientation pointer sections only, Task 11); no dev-docs edits; no hook code. ✓
- §10 risks → checkpoint (R1/R3), mechanical clause (R2), UNVERIFIED status (R3), FLAG-TO-USER (R4). ✓

**2. Placeholder scan:** Remaining `<...>` tokens are data slots filled from the approved dossier (research output legitimately cannot be pre-written); every such slot has an explicit source (dossier §/cited path) and the surrounding structure, frontmatter, commands, and expected outputs are fully concrete. No `TBD`/"handle edge cases"/"similar to Task N".

**3. Type/name consistency:** `verify-knowledge.js` slug set {orientation,superseded,features,roadmap}, `LAYER` map, and `STATUS` enum match the frontmatter in Tasks 8–11 and the `ylsbrain/knowledge/<slug>.md` paths throughout. Section anchors the verifier checks (`## BUILT`/`## PARTIAL`/`## PLANNED`/`## SUPERSEDED`, `doc said`/`truth`/`why`, `## Knowledge`, `git log --name-only`) exactly match the strings written in Tasks 3,4,8,9. Consistent.
