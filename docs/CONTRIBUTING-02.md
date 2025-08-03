# Contributing to Yellow Letter Shop (YLS)

_Last Updated: April 2025_

We welcome contributions to Yellow Letter Shop from internal developers, contractors, and vetted collaborators. This guide outlines how to contribute effectively and maintain consistency across the platform, including support for new modules such as webhooks, feedback systems, analytics dashboards, rollback tooling, and team collaboration features.

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
- Use a descriptive branch name: `feature/feedback-module`, `fix/webhook-retry-logging`
- Avoid committing directly to `main` or `staging`

---

## 4. Code Standards

### TypeScript
- All new files must be `.tsx` or `.ts`
- Avoid `any` types unless absolutely necessary (must include comments)

### Tailwind CSS
- Use utility classes for layout and spacing
- Maintain consistent use of `rounded`, `text-sm`, `grid`, `gap`, etc.

### ESLint & Prettier
Run before pushing:
```bash
npm run lint
npm run format
```

---

## 5. Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:
```bash
feat(reports): add feedback analytics to admin dashboard
fix(short-links): correct redirect path handling for invalid codes
chore(api): document webhook retry response model
```

---

## 6. Pull Requests

- PR title must follow commit format
- Include clear description and screenshots for UI changes
- Tag related issue or ticket number
- CI must pass: lint, typecheck, tests
- Tag reviewers relevant to feature (e.g., QA, analytics, infra)

---

## 7. Testing Requirements

- New logic must include Jest unit tests or Cypress E2E tests
- API inputs must be validated using Zod schemas
- Manual QA checklist required for:
  - Contextual help
  - Feedback submission
  - Team collaboration workflows
  - Webhook logs UI
  - Admin dashboards
  - Export and archival tools

---

## 8. Sensitive Data

Never commit the following:
- `.env.local` or any environment file
- Supabase service keys
- Stripe secret keys
- OpenAI or Anthropic API keys

All secrets must be configured in Vercel or GitHub secrets.

---

## 9. New Feature Guidelines

- Add schema changes in `prisma/schema.prisma`
- Create new API routes under `/app/api/<feature>`
- Document endpoints in `API_REFERENCE.md`
- Add relevant tasks to `DEVELOPMENT_TODO.md`
- Update `DATA_MODELS.md` if new tables are introduced
- Include the feature in `CHANGELOG.md` and link PR
- Update `PRD.md` and `ARCHITECTURE.md` if the feature has systemic impact

---

## 10. Contact

For contribution guidelines, access issues, or code reviews:
- devteam@yellowlettershop.com