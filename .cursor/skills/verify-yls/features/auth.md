# Auth

Sign-in and sign-up are a **global dialog** driven by `?auth=` (`components/auth/auth-flow-modal/`). `/login` and `/signup` only rewrite to `/?auth=login` / `/?auth=signup`. `/register` is a separate static form and is **not** wired to Supabase — do not use it as the real signup path.

## Sub-features

- Email/password login (`#login-email`, `#login-password`, submit **Sign In**)
- Google (`aria-label="Sign in with Google"`, **Continue with Google**)
- Forgot password, reset, verify modes
- Email signup (`#signup-email`, `#signup-password`, `#agree`, **Create Account**)
- Redirect to `redirectedFrom` or `/dashboard` on `SIGNED_IN`

## How to get to it (user POV)

1. From home, click header **Sign In** (login) or **Get Started** (signup).
2. Or open http://localhost:3010/?auth=login or http://localhost:3010/?auth=signup
3. Protected routes (`/dashboard`, `/new-campaign`, `/design/customize`) bounce here with `redirectedFrom`.

## Driving it with the verify-yls harness

```bash
node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth
```

Assertions (Chrome hydrated DOM):

- Login: dialog title **Welcome back**, description **Sign in to your account to continue**, label **Email Address**, **Password**, **Sign In**, **Continue with Google**, **Create Account**
- Signup: **Create your account**, `#signup-email`, `#signup-password`, `#agree` **I agree to the Terms and Privacy Policy**, **Create Account**, **Back to sign in**
- Screenshots: `auth-login.png`, `auth-signup.png`

A passing modal chrome check is **not** a signed-in session. To prove login with local Supabase:

1. `./.cursor/skills/verify-yls/scripts/local-supabase.sh` (Docker + ICC fix). API `http://127.0.0.1:62440`.
2. Point `.env.local` at `npx supabase status -o env` and restart the Next process.
3. `node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth` fills `#signup-email` / `#signup-password` / `#agree` and submits **Create Account** (`enable_confirmations=false` locally).
4. End state below. Screenshot: `dashboard.png`.

Do not use production Auth or live Google client IDs.

## Gotchas

- Local Supabase is required for a real session. No Docker → record sign-in as **unverified**; do not mint cookies by hand.
- `/register` looks like signup but has no `onSubmit` to Auth — driving it would false-pass.
- `middleware.ts` only matches `/dashboard/:path*`. Other “protected” pages redirect in client code.
- Seed: `supabase/seed.sql` does not create a login password for you. You must create the test user locally.

## Observable end state

**Modal (always required):** `/?auth=login` shows **Welcome back** and the labelled email/password fields.

**Session (only with local GoTrue):** header avatar (not **Sign In**), navigation to `/dashboard` showing **Total Orders** / **Recent Orders**. Proof is that dashboard, not the modal remaining open.
