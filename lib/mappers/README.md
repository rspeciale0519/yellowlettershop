# Mappers

Purpose: Pure functions that convert between external data (API/Supabase) and internal app models.

## Conventions
- Pure, side-effect free; throw typed errors only (see `lib/errors`).
- Input/Output types live in `types/`; co-locate zod schemas when added.
- Keep per-domain files small: `accuzip.mappers.ts`, `mailing-lists.mappers.ts`, etc.

## Testing
- 100% branch coverage for optional fields and null/undefined handling.
- Golden tests for sample payloads; no network.
