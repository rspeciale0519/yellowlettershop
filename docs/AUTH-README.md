# Authentication & Role Management Documentation

## Overview
This project uses Supabase for authentication and manages user roles for access control. The key logic is implemented in the following files:
- `lib/auth-context.tsx`: Provides authentication context and helpers (sign in, sign up, sign out, reset password).
- `lib/use-user-roles.ts`: Custom hook to fetch and manage user roles from the database.

## Authentication Flow
1. **Sign Up**: Creates a user in Supabase Auth and a profile in the `user_profiles` table with a default role (`user`).
2. **Sign In**: Authenticates via Supabase and loads the session/user into context.
3. **Sign Out**: Clears the session.
4. **Reset Password**: Sends a reset email with a redirect.

## Role Management
- Roles are fetched from the `UserRole` table and joined with the `Role` table.
- The `useUserRoles` hook exposes `roles`, `isAdmin`, `isManager`, and `isUser` flags for easy access control in components.
- Default roles: `admin`, `manager`, `user`. Extendable by adding new roles in the DB and updating UI logic.

## Adding a New Role
1. Add the new role to the `Role` table in your database.
2. Assign the role to users in the `UserRole` table.
3. Update UI logic (e.g., add `isSuperAdmin` to `useUserRoles` if needed).

## Protecting Routes
- Use the role flags from `useUserRoles` to conditionally render or redirect users from protected pages.
- Example:
  ```tsx
  const { isAdmin } = useUserRoles();
  if (!isAdmin) return <Unauthorized />;
  ```

## Testing
- Automated tests for auth and role logic are in `tests/auth-context.test.tsx`.
- To run all tests:
  ```sh
  pnpm test
  ```
- Edge cases to test:
  - Logging in/out
  - Role changes
  - Unauthorized access attempts
  - Different user roles

## Extending
- To add new authentication providers, update the Supabase project settings and extend the context logic if needed.
- For more granular permissions, add permission checks in the UI and/or API routes.

## Troubleshooting
- If role-based redirects or access are not working, check that roles are correctly assigned in the DB and fetched by the hook.
- For session/auth issues, verify Supabase environment variables and network requests.

---
For further details, see inline comments in the respective files or reach out to the maintainers.
