---
type: skill
area: build
status: active
confidence: provisional
updated: 2026-05-18
sources: [[journal/2026-05-18]]
---
# Prove-before-destroy for git objects (branches / worktrees / stashes)

## When to use
Before ANY destructive git op on history-bearing objects: deleting a branch,
removing a worktree, dropping/clearing a stash, `reset --hard`, force-push.
Especially when the object is unfamiliar (auto-named tool branches, old WIP
stashes) or Rule 1 ("never delete — archive instead") seems to apply.

## The approach
Prove non-destructive with objective commands, THEN act with the safe variant.

- **Branch:** `git merge-base --is-ancestor <tip> main` AND `… develop`
  (both exit 0 ⇒ fully merged); `git log <branch> --not develop --not main`
  (empty ⇒ zero unique commits). Only then `git branch -d` (refuses if
  unmerged) — NEVER `-D`.
- **Stash:** `git stash show --stat <ref>` (scope); `git stash show -p
  --name-only <ref> | grep -v '^<ignored-prefix>/'` (empty ⇒ no source, pure
  ignored payload); `git branch --contains <stash-base>` (base already in
  main/develop ⇒ real work shipped); cross-check `.gitignore` + `git ls-files
  <prefix>` (=0 ⇒ payload untracked/regenerable so the diff is moot).
- **Commit hygiene:** stage by explicit path, then `git status --porcelain`
  to confirm nothing unintended, before `git commit`. Avoid blanket
  `git add -A` when the working tree has mixed concerns.
- **Rule-1 archive exception (reasoned, user-approved):** a payload that is
  100% gitignored regenerable build output (e.g. `.next/`), on a base commit
  already in main/develop, is disposable WITHOUT archiving — archiving tens of
  thousands of LOC of webpack churn has no recovery value. State the reasoning
  and get explicit confirmation; default otherwise remains archive-not-delete.

## Pitfalls & anti-patterns
- **Windows `git worktree remove` partial-apply:** can return "Permission
  denied" / "not a working tree" while having already deregistered the
  worktree. Do NOT retry blindly or escalate to `--force` reflexively —
  re-inspect real state (`git worktree list` + path existence); often only
  `git worktree prune` + `branch -d` remain.
- Trusting a stash/branch *name* ("WIP on main") instead of inspecting its
  actual diff.
- `git add -A` sweeping unrelated working-tree changes into a focused commit.
- Treating a transient OS-lock error as "operation failed" without verifying.

## Evidence
- [[journal/2026-05-18]] [23:25]: branch+worktree `cc/jovial-ellis-f13b4d`
  deleted after ancestor/`--not` proofs; `git branch -d` → "Deleted … (was
  5cb2199)" exit 0; final `git branch` = expected 3.
- [[journal/2026-05-18]] [23:40]: `stash@{0}` proven 100% `.next/` (448 files,
  0 non-build via `grep -v`), base in main+develop; `git stash drop` exit 0;
  `git stash list` empty.
- [[journal/2026-05-18]] [23:52]: path-scoped `git add` + porcelain check →
  clean isolated commit `abec7d5`.

## Revision log
- [2026-05-18] Created from first consolidation. Two genuinely independent
  in-session applications (branch/worktree [23:25] vs stash [23:40], distinct
  objects + decision rules) each with objective git-output evidence. Held at
  `provisional` (single session/agent) per the Evidence rule; promote to
  `established` on the next independent confirmation in a separate session.
