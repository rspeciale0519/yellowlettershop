---
name: frontend-design
description: Design a new Yellow Letter Shop page or requested redesign when the task needs a distinct visual direction.
---

# Frontend Design

Use this skill when the user requests a new visual direction or a distinct page design.
Use the project `design-guide` skill for routine changes within the existing application style.
A functional fix alone does not authorize a redesign.

## Design direction

Use the user's brief, audience, content, and existing brand to choose a clear direction.
Inspect relevant screens and shared styles before choosing typography, color, spacing, and motion.
State material assumptions when the brief leaves them open.

Make the main action and information hierarchy clear.
Use distinctive details where they support the page's purpose.
Choose visual complexity to suit the content and performance needs.
Do not force unusual fonts, dramatic effects, or a new theme onto every page.

## Implementation

Build working behavior within the existing Next.js, React, and Tailwind structure.
Reuse project components and design tokens where they fit the selected direction.
Preserve established user flows unless the request includes changes to them.
Keep keyboard access, visible focus, readable contrast, and reduced-motion support.
Handle relevant loading, empty, error, and success states.
Check narrow and wide layouts.

Use a component skill only when its specific implementation guidance is needed.
Do not add a production dependency without approval.
Follow the UI verification and application checks in the repository's [instructions](../../../AGENTS.md).
