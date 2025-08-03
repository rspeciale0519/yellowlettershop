# Contributing to Yellow Letter Shop (YLS)

_Last Updated: April 2025_

We welcome contributions to Yellow Letter Shop from internal developers, contractors, and vetted collaborators. This guide outlines how to contribute effectively and maintain consistency across the platform.

---

## 1. Repository Structure

```
/               Root
├── app/         Next.js App Router entry points
├── components/  UI components (atomic design structure)
├── lib/         Shared helpers, utils, API wrappers
├── pages/       Legacy routes (optional fallback)
├── prisma/      DB schema and migrations
├── public/      Static assets and FPD config JSON
├── scripts/     One-off CLI tools
├── styles/      Tailwind config and global CSS
└── tests/       Unit, integration, and Cypress tests
```

---

## 2. Setup & Dev Environment

```bash
# Install dependencies
npm install

# Create local .env file
cp .env.example .env.local

# Run dev server
npm run dev
```

Make sure you are running Node.js v18 or higher and using npm 8+.

---

## 3. Branching Strategy

- All feature work should be done in branches off `main`
- Use a descriptive branch name: `feature/ai-preview`, `fix/stripe-webhook`
- Avoid committing directly to `main` or `staging`

---

## 4. Code Standards

### TypeScript
- All new files must be `.tsx` or `.ts`
- No `any` types unless absolutely necessary (must be commented)

### Tailwind CSS
- Use utility classes instead of inline styles
- Use `rounded`, `text-sm`, etc. for spacing and sizing

### ESLint & Prettier
Run this before pushing:
```bash
npm run lint
npm run format
```

---

## 5. Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
feat(auth): add Google OAuth login
fix(order): correct total price calculation on preview
chore(ci): update node version in GitHub Actions
```

---

## 6. Pull Requests

- PR title must follow commit message conventions
- Include a clear description of the problem and solution
- Reference related issue or ticket number
- All PRs must pass CI (typecheck, test, lint)
- Tag relevant reviewers from the team

---

## 7. Testing Requirements

- New logic must include appropriate Jest or Cypress tests
- All API inputs must be validated using Zod
- Manual QA checklist must be completed for UI features

---

## 8. Sensitive Data

Never commit any of the following:
- `.env.local` or secrets
- Supabase service keys
- Stripe secret keys

Use environment-specific secret management via Vercel or GitHub.

---

## 9. Contact

For contribution questions or CI access, contact:
- devteam@yellowlettershop.com
