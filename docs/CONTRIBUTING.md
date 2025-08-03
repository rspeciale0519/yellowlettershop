# Contributing to Yellow Letter Shop (YLS)

_Last Updated: April 2025_

This guide outlines contribution practices for Yellow Letter Shop (YLS), including internal development workflows, testing standards, feature integration requirements, and documentation responsibilities. It ensures consistency across modules such as rollback, short link tracking, analytics, team collaboration, scheduled reporting, webhooks, and feedback collection.

---

## 1. Repository Structure

```
/                 Root
├── app/           App Router & API endpoints
├── components/    UI components (atomic design)
├── lib/           Utility functions, constants, shared logic
├── prisma/        DB schema and migration files
├── public/        Static files and FPD assets
├── scripts/       CLI tooling and cron scripts
├── styles/        Global Tailwind styles
├── tests/         Jest + Cypress tests
```

---

## 2. Setup Instructions

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Run the development server
npm run dev
```

Requires Node.js v18+ and npm v8+.

---

## 3. Branching Strategy

- Use `main` for production and `staging` for pre-release testing.
- Branch names should be descriptive: `feature/rollback-ui`, `fix/feedback-alert`
- All PRs must target `main` or `staging`, not random feature branches.

---

## 4. Code Style & Standards

- TypeScript is mandatory
- Tailwind CSS for styling; avoid external CSS unless scoped
- Use `Zod` for API request validation
- Lint + format before commit:
  ```bash
  npm run lint
  npm run format
  ```

---

## 5. Commit Conventions

Use Conventional Commits:
```
feat(feedback): add NPS collection logic
fix(webhook): correct retry count behavior
chore(api): normalize response schema types
```

---

## 6. Pull Request Checklist

- Descriptive title and clear summary
- Reference related task or issue (if tracked externally)
- Include screenshots or schema diffs (if applicable)
- Ensure all CI checks pass:
  - `lint`, `typecheck`, `test`, `cypress`
- Assign reviewers by feature area (e.g. API, analytics, QA)

---

## 7. Testing Requirements

- Unit tests (Jest) for logic-heavy features (e.g. rollback engine)
- Cypress E2E coverage for full user flows:
  - Upload → Design → Proof → Approve
  - Short link redirect → Report export
  - Webhook registration → Retry
- Zod schema validation for all inputs
- Manual QA for:
  - Team invite flow
  - Proof annotation threads
  - Scheduled report delivery
  - Rollback preview/confirmation

---

## 8. Feature Integration Process

- Add new DB tables in `prisma/schema.prisma`
- Add endpoints under `/app/api/<module>`
- Update `API_REFERENCE.md` with new routes
- Modify `DATA_MODELS.md` for any schema change
- Add checklist items to `DEVELOPMENT_TODO.md`
- Document new logic in `PRD.md` and `ARCHITECTURE.md` (if systemic)
- Add logs or rollback support to `audit_logs` if applicable
- Log errors in Sentry + Supabase Logs (if relevant)

---

## 9. Sensitive Data Handling

- Never commit `.env*` files or service role keys
- Secrets should be set in Vercel or GitHub Actions only
- API keys (Stripe, AccuZIP, OpenAI, Mailgun) must be server-side only

---

## 10. Key Contribution Areas

| Module            | Responsibility                         |
|-------------------|-----------------------------------------|
| Proof Annotation  | QA, UI, audit logs                      |
| Feedback/NPS      | Feedback form, score thresholds         |
| Rollback System   | Record history, UI confirmation, logs   |
| Analytics         | Charts, filters, exports, recurrence    |
| Webhooks          | Delivery status, retry logic, logs      |
| Scheduled Reports | CRON triggers, format, email delivery   |
| Team Access       | Invite, role management, access control |
| Support Tickets   | Form + Admin view + SLA                 |

---

## Contact

For access requests, code review questions, or merge conflicts:  
support@yellowlettershop.com

