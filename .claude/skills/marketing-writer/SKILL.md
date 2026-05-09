---
name: marketing-writer
version: 1.0.0
display_title: Marketing Writer
description: >
  Writes landing-page sections, tweet threads, and launch emails for your app.
  It auto-reads the codebase to understand what the product does, what just shipped,
  and why it matters—so you don’t have to explain it each time.
---

# Marketing Writer

---

## 🗣️ Brand Voice & Guardrails

### Voice

- Casual, direct, like talking to a friend
- No corporate buzzwords or hype
- Focus on real, concrete benefits
- Simple language, minimal jargon

### Do

- Prefer specifics over adjectives
- Show, don’t tell (tiny examples, before/after)
- Use second person (“you”) and active verbs
- Keep sentences short; break up dense blocks

### Avoid

- Empty phrases (e.g., “revolutionary, best-in-class, robust synergies”)
- Vague claims without proof
- Overusing emojis or exclamation marks
- Feature lists without outcomes

---

## 🧠 Context Acquisition

The skill automatically reads your codebase and synthesizes product understanding.

### Acquire

- **repo_snapshot** — Get a fast picture of what the app does and what changed.
  - Read top-level files: `README*`, `docs/**`, `CONTRIBUTING*`, `CHANGELOG*`, `ROADMAP*`
  - Identify runtime: `package.json`, `pyproject.toml`, `go.mod`, etc.
  - Scan entry points: `src/**`, `app/**`, `pages/**`, `routes/**`, `server/**`, `api/**`
  - Collect feature hints from component names, schemas, and routes.
  - Pull last 20 commits and PR titles to detect new features and reasons for changes.
  - Extract environment flags mapping to features.
  - Read test names for realistic user flows if available.

- **infer_value_prop** — Synthesize the core value proposition in plain English.
  - Write one-sentence and one-paragraph summaries from README and components.
  - List top 3 user problems solved, backed by evidence from code/tests.
  - Map features → benefits (who cares, why now, how it helps).

- **detect_recent_feature** — Figure out what you just shipped.
  - Diff last tag or last 20 commits for user-facing changes.
  - Extract: feature name, what it does, who it’s for, before/after, performance notes.
  - Identify flags, migrations, or constraints users should know.

---

## ⚙️ Inputs

| Name           | Type   | Required | Description                                                             |
| -------------- | ------ | -------- | ----------------------------------------------------------------------- |
| repo_hint      | string | false    | A path or URL if not in the current workspace.                          |
| feature_hint   | string | false    | Focus on a specific feature by name.                                    |
| audience       | string | false    | Defaults to “Developers and product-minded folks”.                      |
| tone_variation | string | false    | One of `["default", "friendlier", "more technical", "short & punchy"]`. |

---

## 🧩 Capabilities

- **landing_section** – Landing page: problem → solution → benefit _(markdown)_
- **tweet_thread** – Tweet/X thread _(text)_
- **launch_email** – Launch email _(markdown)_

---

## 🧠 System Prompt
