# Knowledge-build runbook

Purpose: construct accurate, evidence-gated knowledge docs for a project brain instance.

## Preconditions

- The codebase is reasonably stable (active architectural churn makes evidence stale immediately).
- This runbook is opt-in and triggered by the operator. Never run it automatically at `brain init`.
- The four knowledge doc files (`orientation`, `superseded`, `features`, `roadmap`) exist with `status: stub` frontmatter.

## 1. Parallel research

Dispatch INDEPENDENT agents — no shared state, no sequential hand-offs — covering these four dimensions simultaneously:

**A. Intended / product knowledge**
- Discover and read: README, docs/, ADRs, design docs, wikis, any explicit specification.
- If none exist: derive intent from code entrypoints, CLI help output, and package.json description.
- Note explicitly: "no design docs found — knowledge is code-derived."

**B. Codebase build-status**
- Identify every named feature or subsystem (from A or from the codebase itself).
- For each: does an entrypoint exist? Does it contain non-stub logic (not just `throw new Error('TODO')`)? Is it wired end-to-end (exported, imported, reachable from a route or CLI)?
- Record exact `path[:symbol]` evidence for every BUILT claim.

**C. Integrations and externals**
- List every third-party service, SDK, or API the code imports or references.
- Determine: configured (env var present in config/docs), stubbed, or only mentioned in comments.

**D. Doc-vs-memory / user-correction conflicts**
- Compare what docs/README claim versus what the code actually contains.
- List any claim in A that B cannot substantiate with a file path.
- List any correction the operator has given in prior sessions (from STATE.md or journal).

## 2. Evidence-gated classification

Apply these labels — do not guess:

- **BUILT**: entrypoint file exists AND contains non-stub logic AND is wired end-to-end. Every BUILT claim must cite `path[:symbol]`.
- **PARTIAL**: entrypoint exists but logic is incomplete or not wired end-to-end. Cite what is present and what is missing.
- **PLANNED**: appears in docs or roadmap but no code entrypoint found.
- **UNVERIFIED**: too large, polyglot, or monorepo area to check exhaustively in one pass. Use this rather than guessing.

Scale the scope of verification to the project size. For large codebases, cover primary user-facing paths fully; mark secondary areas UNVERIFIED rather than PARTIAL if you cannot inspect them.

## 3. Independent re-verification

Before synthesis, re-check a random sample of BUILT claims (minimum 10%, or all if the feature count is small) by re-opening the cited files and confirming the symbol still exists and is non-stub.

Additionally, re-verify 100% of any feature that the orientation doc (step A) explicitly calls "built" or "available" — these are the highest-risk false positives.

This step is the accuracy gate. A structural `brain verify` cannot and does not check whether claims are true.

## 4. Dual-mode checkpoint

**Interactive mode (operator present):**
1. Present a findings dossier: classified feature list, conflict list, evidence summary.
2. Wait for explicit operator approval before proceeding to synthesis.
3. Incorporate any corrections the operator provides.

**Autonomous mode (no operator present):**
1. Produce an inline dossier in the session output.
2. Record net-new doc-vs-code conflicts as `FLAGGED — provisional` in the `superseded` doc.
3. Never silently resolve a conflict; never block on approval — flag and continue.

## 5. Synthesize

From the approved (interactive) or provisional (autonomous) dossier:

1. Write the four knowledge docs in this order: `features` → `roadmap` → `superseded` → `orientation`.
2. Flip each file's frontmatter `status:` to `current` and update the `updated:` date.
3. Run `brain verify` — structural green is required before the session ends. Note: structural green does not guarantee claim accuracy; that is what steps 3–4 provide.
4. Append a journal entry citing the evidence files inspected and the classification counts (BUILT/PARTIAL/PLANNED/UNVERIFIED).

**On `superseded.md`:** a near-empty file stating "no doc-vs-truth deltas found" is a VALID `current` state. Never manufacture conflicts to fill the template. Only record genuine discrepancies between what published docs claim and what the code contains.
