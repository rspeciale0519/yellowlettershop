\# Templates for Roadmap Builder

\## 1. Feature Evaluation Template

Use this to score or assess any potential feature.

\*\*Feature Name:\*\*

\*\*Description:\*\*

\*\*Stage:\*\* (Pre-launch / Post-launch / Growth)

\*\*Category:\*\* (Retention / Core / Monetization / Growth)

\### Impact vs Effort

| Factor | Rating (1–5) | Notes |

|--------|---------------|-------|

| Impact on core users | | |

| Effort to build | | |

| Ease of validation | | |

| Measurable outcome | | |

\*\*Recommendation:\*\*

\_(Summarize priority and next steps)\_

---

\## 2. Stage-Based Decision Prompt

Use this when filtering out ideas.

> “Given we’re in the \*\*{{stage}}\*\* phase, our priority is \*\*{{priority}}\*\*.

> Does this feature directly serve that goal or distract from it?”

---

\## 3. Red Flag Detector

Use this to catch roadmap bloat.

\*\*Prompt:\*\*

> “Are we building this because users asked for it, or because we can?”

> “Can we fake this feature manually first?”

> “Would removing this feature change the user’s main outcome?”

If any answer suggests uncertainty — delay or de-scope the idea.

---

\## 4. Sprint Planning Summary

Use this to produce clear sprint focus.

\*\*Sprint Goal:\*\*

\*\*Top Priority Features:\*\*

\- \[ ] {{feature\_1}}

\- \[ ] {{feature\_2}}

\*\*Rationale:\*\*

\_(Summarize why these matter now based on impact/effort and stage)\_

---

\## 5. What to Build Next Generator

Use this prompt to list the next top priorities:

> “Based on our current stage (\*\*{{stage}}\*\*) and goals (\*\*{{goal}}\*\*),

> here’s what to build next, in priority order:

> 1. High-impact, low-effort features tied to core use case

> 2. Retention-improving fixes

> 3. Requested user features that improve satisfaction or sharing”
