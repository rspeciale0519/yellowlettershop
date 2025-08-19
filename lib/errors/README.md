# Error Normalization

Purpose: Provide a consistent error surface across fetch/Supabase/third-party APIs.

## Pattern
- Define `DomainError` with `code`, `message`, and optional `cause`.
- Map HTTP/Supabase/SDK errors to `DomainError` in one place.
- Utilities for `isDomainError`, `toDomainError`.

## Usage
- API/queries: wrap and rethrow as `DomainError`.
- UI: render friendly messages; optionally log raw cause in dev.

## Testing
- Unit tests for mappers: input error -> expected DomainError.
