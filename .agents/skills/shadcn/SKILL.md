---
name: shadcn
description: Add, update, or debug Yellow Letter Shop shadcn components and registry integrations.
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---

# shadcn/ui

Use this skill for component API, composition, accessibility, or registry work.
The presence of `components.json` alone does not make this skill relevant.
Use the project design skills for visual direction and routine page styling.

## Project evidence

Read `components.json` and the relevant source in `components/ui/`.
Check the installed dependency versions in `package-lock.json`.
This project uses npm, Tailwind CSS 3, Radix primitives, and Lucide icons.

Existing component source defines the available exports, props, and variants.
Do not assume that newer registry examples match these local components.
Do not import `Field`, `Empty`, `Spinner`, or other components unless they exist.
Preserve local changes, including the Button brand variant.

Reuse installed components before searching registries.
Use current primary documentation when a library API needs verification.
Do not run registry discovery commands for a simple local style change.

## Registry changes

Use the user's registry or the configured registry for the requested component.
Clarify the source only when it is ambiguous and changes the result.
Check current CLI help before using a command or option.

Preview the affected files before adding or updating components.
Review dependency changes and get approval for new production dependencies.
Do not overwrite local components, switch presets, or reinitialize the project without explicit approval.
Review generated code and imports before considering the change complete.

## References on demand

Read only the reference needed for the current operation.
These references describe upstream patterns, which may require components or APIs absent from this repository.
Verify compatibility before applying them.

- [CLI](./cli.md): registry discovery and requested installation or update operations.
- [Customization](./customization.md): requested theme or shared variant changes.
- [Forms](./rules/forms.md): form composition supported by installed components.
- [Composition](./rules/composition.md): overlays, groups, and component structure.
- [Icons](./rules/icons.md): icon placement and sizing for the installed component.
- [Styling](./rules/styling.md): styling conventions compatible with local source.
- [Radix and Base UI](./rules/base-vs-radix.md): API differences when investigating a compatibility issue.

Follow the application and browser checks in the repository's [instructions](../../../AGENTS.md).
