# Marketing Writer — Templates

This document defines all reusable content templates the Marketing Writer skill can produce.
Each template follows the `problem → solution → benefit` storytelling arc and adheres to the brand voice.

---

## 🪧 Landing Page Section

**Purpose:** Describe one feature clearly and persuasively for your website.

```md
### {feature_title}

**Problem**

- {problem_1}
- {problem_2}

**Solution**
{solution_one_paragraph}

**What you get**

- {benefit_1} (because {proof_or_mechanism_1})
- {benefit_2} (because {proof_or_mechanism_2})
- {benefit_3} (because {proof_or_mechanism_3})

**Quick example**
{tiny_before_after}

_Works best for:_ {ideal_user_or_scenario}
```

**Example output**

```md
### One-Click Slack Import

**Problem**

- Empty states make your demo feel fake.
- Seeding data manually takes forever.

**Solution**
Import a real Slack channel and populate your workspace in under a minute.

**What you get**

- Preview flows with real conversations (because we map threads, reactions, and files automatically)
- Skip CSV cleanup (because native parsing handles edge cases)
- Safer demos (because we redact emails and tokens on import)

**Quick example**
Before: 45 min of CSV wrangling. After: 58 seconds, done.

_Works best for:_ teams setting up realistic QA or demos
```

---

## 🧵 Tweet Thread

**Purpose:** Announce a feature or insight on X/Twitter.

```text
1) {hook_one_sentence}

2) {why_now_or_problem}
3) {what_it_does_plain}
4) {quick_before_after_or_gif_idea}
5) {proof_numbers_or_specifics}
6) {who_it’s_for}
7) {how_to_try} → {cta_link}

P.S. {bonus_tip_or_edgecase}
```

**Example output**

```text
1) Your onboarding shouldn’t start with a blank page.

2) Empty states kill momentum and hide value.
3) One-click Slack import seeds real data securely.
4) GIF: empty workspace → populated in <60 s.
5) Handles threads/files/reactions; auto-redacts secrets.
6) For product & QA teams.
7) Try it free → https://yourapp.example.com

P.S. Works with private channels if you have admin.
```

---

## ✉️ Launch Email

**Purpose:** Send a friendly, high-signal feature launch announcement.

```md
Subject: {tight_subject_line}

Hey {first_name_placeholder or "there"},

You know that {pain_in_plain_words}?  
We just shipped **{feature_name}** so you can {primary_outcome} without {annoying_old_way}.

Here’s the quick hit:

- What it does: {one_sentence_value}
- Why it matters: {one_sentence_benefit}
- Real example: {tiny_concrete_example}
- Time to value: {expected_setup_or_savings}

Try it: {cta_link}  
If you’re mid-workflow: {one_line_low_friction_path}

Heads up: {any_requirements_or_limits}

Cheers,  
{signature_name}
```

**Example output**

```md
Subject: Seed real data in 60 s

Hey there,

You know that awkward empty dashboard after setup?  
We just shipped **One-Click Slack Import** so you can start with real conversations instead of lorem ipsum.

Here’s the quick hit:

- What it does: Pulls a Slack channel into your workspace.
- Why it matters: Real data = better testing and demos.
- Real example: We seeded #support in 58 seconds.
- Time to value: 40 minutes saved per setup.

Try it: https://yourapp.example.com/new#slack  
Or watch a 40-second demo.

Heads up: Needs Slack admin for private channels.

Cheers,  
The Team
```
