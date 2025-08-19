# Shared Filter Hooks

Purpose: Centralize filter state handling across List Builder domains so page/components can compose small, focused units.

## Hooks (planned)
- useFilterState<T>(initial: T): [state: T, patch: (p: Partial<T>) => void]
  - Emits minimal patches; merges shallowly; no I/O.
- useFilterDebounce<T>(value: T, ms: number): T
  - Debounce noisy inputs before propagating to expensive consumers.
- useFilterPersistence<T>(key: string, value: T, version?: number): void
  - Persist to localStorage/sessionStorage; include versioning + safe parse.
- useCriteriaAdapter<TCriteria>()
  - Bridges UI state <-> domain criteria (adapts to existing `hooks/use-criterion-update.ts`).

## Integration notes
- Do not fetch inside hooks; expose pure state + callbacks.
- Keep types generic; UI layers (components) adapt to domain types (e.g., `MortgageCriteria`).
- Side-effects (analytics, sync) are opt-in wrappers, not core hook behavior.

## Testing
- Unit test reducers and edge-cases (empty patch, resets, version bumps).
- Component tests verify integration within each domain orchestrator (Phase 1A).
