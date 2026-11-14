---
name: design-guide
description: Keep Yellow Letter Shop UI additions and visual fixes consistent with the existing application.
---

# Design Guide

Use this skill for UI work within the existing application style.
Use the project `frontend-design` skill for a requested new visual direction.
Do not load both skills solely because a task changes a component.

## Existing design

Inspect the nearest comparable screen and the components being changed.
Use `app/globals.css`, `tailwind.config.ts`, and `components/ui/` as design references.
Preserve established typography, brand colors, spacing, and component variants.
Do not impose a new palette, font, or spacing system on an isolated change.

Make the primary action clear.
Use spacing and text hierarchy that suit the information density.
Reuse components when their behavior fits the task.

## Interaction and access

Preserve keyboard access and visible focus.
Use labels and appropriate accessible names for controls.
Make loading, empty, error, success, and disabled states clear where relevant.
Support narrow screens without clipping controls or hiding required information.
Respect reduced-motion settings when adding motion.

For shadcn component behavior or registry work, select the project `shadcn` skill when available.
Its presence is not a reason to install or replace components.
Follow the UI verification and application checks in the repository's [instructions](../../../AGENTS.md).
