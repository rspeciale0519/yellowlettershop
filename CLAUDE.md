# Yellow Letter Shop (YLS) - Claude AI Assistant Guide

## Project Overview

Yellow Letter Shop is a comprehensive SaaS platform for direct mail automation, enabling users to create, personalize, and deliver direct mail campaigns at scale. The platform targets real estate professionals, local businesses, agencies, and marketers who need efficient tools for generating and fulfilling marketing mail campaigns.

### Key Features
- **Template Library**: Professional direct mail templates with customization
- **Mailing List Management**: CSV/XLSX upload, validation, and deduplication
- **List Building Tools**: Generate targeted lists based on demographics and criteria
- **Design Tool Integration**: WYSIWYG editor for mail piece customization
- **Address Validation**: AccuZip integration for CASS-certified validation
- **Order Processing**: Complete workflow from design to fulfillment
- **Payment Integration**: Stripe with manual capture workflow
- **Analytics Dashboard**: Campaign tracking and performance metrics
- **Multi-tenant Architecture**: Team collaboration with role-based access

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - Component-based UI with TypeScript
- **Tailwind CSS 3** - Utility-first styling with custom themes
- **ShadCN/UI** - Headless component library
- **Radix UI** - Accessible primitives and components
- **React Hook Form + Zod** - Form handling with validation
- **TanStack Table** - Advanced data tables
- **Recharts** - Analytics visualizations

### Backend & Database
- **Supabase** - Backend-as-a-service with PostgreSQL (Supabase JS client only — no ORM, no NextAuth)
- **Next.js API Routes** - RESTful backend endpoints
- **Row-Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Supabase Auth sessions (Bearer + cookie via `withAuth`)

### External Integrations
- **Stripe** - Payment processing with manual capture
- **AccuZip API** - Address validation and standardization
- **Resend / Mailgun** - Transactional email via `lib/email/` adapter (Resend preferred)
- **Custom in-house designer** - `components/designer/` (react-rnd canvas, pdf-lib server rendering, three.js 3D preview) — FPD was rejected and is NOT used
- **Supabase Storage** - File storage (assets, private proof bucket)

### Development Tools
- **TypeScript 5** - Strict typing throughout
- **ESLint & Prettier** - Code quality and formatting
- **Mocha + React Testing Library** - Unit and component testing
- **Cross-platform compatibility** - Windows/Ubuntu support

## Project Structure
```
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── dashboard/         # Protected dashboard pages
│   ├── design/            # Design canvas pages
│   ├── forgot-password/   # Forgot password pages
│   ├── login/             # Login pages
│   ├── mailing-services/  # Core service pages
│   ├── register/          # Register pages
│   ├── reset-password/    # Reset password pages
│   ├── s/                 # Shortcode pages
│   ├── signup/            # Signup pages
│   ├── templates/         # Templates pages
│   ├── test-types/        # Test types pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Global layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
├── data/                 # Static data and constants
├── docs/                 # Comprehensive project documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
├── node_modules/         # Node.js dependencies
├── public/               # Static assets
├── scripts/              # Build and deployment scripts
├── supabase/             # Supabase configuration
├── tests/                # Test files and setup
├── types/                # TypeScript type definitions
├── utils/                # Helper functions

```

## Key Development Scripts

From package.json:
- `npm run dev` - Start development server (port **3010**)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint. **Exits 1 with 7,222 errors / 95,482 warnings**
  (measured 2026-08-04; the previous "~743" figure here was badly stale). This is
  a known backlog with its own ticket — **delta-gate only**: lint just the files
  your change touched (`npx eslint <paths>`), never the repo.
  **Consequence:** `/git-workflow-planning:checkpoint` gates its commit on
  repo-wide `npm run lint` and refuses to commit when it fails, so on this repo
  it can never checkpoint. For planned work, gate phases on
  `npm run typecheck:full` + `npm test` + delta eslint, then commit directly.
  A full repo lint also takes 10+ minutes.
- `npm test` - Run Mocha test suite
- `npm run typecheck:ui` / `npm run typecheck:full` - TypeScript gates

## Development Workflow

### Getting Started
1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd yls
   npm install
   ```

2. **Environment Setup**:
   - Configure `.env.local` (Supabase, Stripe, and other API keys)
   - Dev uses the **local Docker Supabase stack** (`supabase start`); hosted project is production only

3. **Start Development**:
   ```bash
   npm run dev  # Starts on http://localhost:3010
   ```

### Code Standards
- **Modularization Priority**: When writing new or modifying existing code, ALWAYS prioritize modularization over monolithic files
- **File Size Limit**: All code files MUST be ≤350 lines of code (LOC)
- **TypeScript Required**: All new files must be `.ts` or `.tsx`
- **Strict Typing**: Avoid `any` types, document when necessary
- **Tailwind CSS**: Use utility classes over custom CSS
- **Component Structure**: Follow existing patterns in `components/`
- **API Validation**: Use Zod for all API endpoint validation
- **Testing**: Write tests for new components and utilities

### Branch Strategy
- **Feature branches**: `feature/feature-name` (off `develop`)
- **Bug fixes**: `fix/issue-description`
- **Daily work / PR target**: `develop`; `develop` → `main` only for production releases
- **Parallel sessions / worktrees**: when running more than one Claude Code or dev session on this repo, give each its own worktree via the helper — `./scripts/wt.ps1 new <branch>` (sibling container `../yls.worktrees/`, one folder per branch). Never hand-run `git worktree add`, and never run concurrent sessions sharing one working tree (their shared Git HEAD collides mid-task).

## Architecture Patterns

### Component Organization
- **Feature-based organization** in `components/`
- **Shared primitives** in `components/ui/` and `components/list-builder/common/`
- **Page-specific components** co-located with their pages
- **Hooks extracted** to `hooks/` directory with feature grouping

### Data Flow
- **Supabase RLS** enforces data access at database level
- **Multi-tenant isolation** via user ID and team ID scoping
- **Real-time subscriptions** for live updates
- **Optimistic updates** for better UX

### State Management
- **React Context** for global state (auth, theme)
- **Local state** with hooks for component-specific data
- **Server state** managed via SWR or native fetch
- **Form state** handled by React Hook Form

## Testing Strategy

### Test Setup (Mocha + RTL)
The project uses a Mocha-based test harness with:
- **ts-node** for TypeScript support
- **JSDOM** for DOM simulation
- **React Testing Library** for component testing
- **Cross-platform compatibility** (Windows/Ubuntu)

### Key Test Files
- `.mocharc.json` - Test configuration
- `tests/setup/` - Test environment setup
- `tests/tsconfig.mocha.json` - TypeScript config for tests

### Test Categories
- **Unit Tests**: Pure functions, utilities, calculations
- **Component Tests**: User interactions, state changes
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Complete user workflows (planned)

### Running Tests
```bash
npm test                    # Run all tests
npx mocha tests/specific.test.tsx  # Run specific test
```

## Current Development State

See **`dev-docs/implementation-status.md`** (code-verified audit 2026-07-31,
release update 2026-08-02) for what is built/partial/not-built, and `ylsbrain/`
STATE + journals for the live session-to-session record. Highlights: customer
money path works end-to-end (wizard → validate → design → authorize → proof →
approve → capture → email → status); **vendor fulfillment dispatch is built and
LIVE in production** (auto-dispatch → vendor proof+CSV → admin advances →
delivered), with an opt-in Redstone API path behind it; custom designer suite
incl. postage areas + 3D preview; teams/access-control with RLS + SQL assertion
tests; real TOTP 2FA.

`payment_transactions` was **never** a real table — the inline-payment model
(payment state on `orders`) replaced it; never reintroduce it.

Biggest known gaps: template galleries still mock; DB-backed rate limiter has
zero callers; shipped test/debug endpoints (`api/test-db*`, `api/test-auth-state`,
`/test-types`) are live in production and should be deleted; proof annotation UI
not built.

## Key Business Logic

### Order Processing Workflow
1. **Template Selection** - Choose from library or upload custom
2. **Mailing List Upload** - CSV/XLSX with validation
3. **Address Validation** - AccuZip CASS certification
4. **Design Customization** - custom in-house designer with merge-token personalization
5. **Contact Card Selection** - Sender information management
6. **Payment Authorization** - Stripe hold (not capture)
7. **Proof Review** - generated PDF proof, approve/reject (annotation UI not built yet)
8. **Payment Capture** - On approval, funds captured (reject cancels the hold)
9. **Fulfillment** - Auto-dispatch to the active print vendor on capture: vendor
   receives the approved proof + recipient CSV as 7-day signed links (or the
   Redstone API when that vendor opts in); admin advances accepted → in
   production → mailed (+tracking) → delivered; order completes and the customer
   is emailed on ship. Inbound vendor replies are still recorded manually.

### User Roles & Permissions
- **Platform roles**: `admin` | `super_admin` (`lib/admin/require-admin.ts`)
- **Per-team roles**: Owner / Admin / Member via `team_members` + authority RPCs
- Everything else is gated by auth + RLS, not role tiers

### Revenue Model
**Transactional only — there are NO subscriptions.** (MLM is a separate app.)
Standalone AccuZip validation is tiered per-job ($8–$400), free with mail
orders. Legacy subscription code (`lib/payments/subscription-service.ts`) is
dead and pending archive — never build on it.

## Important Implementation Notes

### Security Considerations
- **Row-Level Security (RLS)** enforced on all major tables
- **JWT tokens** in HttpOnly cookies
- **Input sanitization** with Zod validation
- **API rate limiting** and CORS protection
- **Audit logging** for compliance

### Performance Optimizations
- **Code splitting** with Next.js dynamic imports
- **Image optimization** with Next.js Image component
- **Database indexing** for frequent queries
- **CDN integration** via Vercel edge network
- **Component memoization** for expensive operations

### External API Integrations
- **AccuZip**: Address validation requires specific field mapping (order path is live; count/search fall back to mock without a key)
- **Stripe**: Manual capture workflow for order approvals
- **Resend/Mailgun**: Outbound transactional email via `lib/email/`; Mailgun inbound webhook parsing for vendor communications
- **Designer**: Design state stored as `DesignElement[]` JSON (`types/designer.ts`) in `saved_designs`

## Documentation Resources

The project includes comprehensive documentation:
- `dev-docs/implementation-status.md` - **Authoritative code-verified build status (read first)**
- `dev-docs/PRD.md`, `roadmap.md`, `todo.md` - April-2025 planning baseline (stale-bannered; intent only)
- `dev-docs/api-*.md` - Vendor API references (AccuZip, Melissa, Redstone, integrations)
- `ylsbrain/knowledge/` - Live reconciled knowledge (features, roadmap, superseded, orientation)
- `docs/temp/` - Working notes and audit reports

## Common Development Tasks

### Adding New Components
1. Create component in appropriate `components/` subdirectory
2. Follow TypeScript strict typing patterns
3. Use Tailwind utility classes for styling
4. Export from directory index if applicable
5. Add tests in `tests/` directory

### Creating API Endpoints
1. Add route in `app/api/` following RESTful patterns
2. Implement Zod schema for request validation
3. Use Supabase client with RLS enforcement
4. Add error handling and proper HTTP status codes
5. Update type definitions in `types/`

### Database Schema Changes
1. Plan changes with team for multi-tenant impact
2. Update RLS policies if needed
3. Consider migration strategy for existing data
4. Update TypeScript types
5. Add tests for new functionality

## Troubleshooting

### Common Issues
- **Build Errors**: Check TypeScript compilation with `npm run typecheck:full`
  (`npm run lint` does not typecheck, and fails on pre-existing debt regardless)
- **Test Failures**: Verify JSDOM setup and component mocks
- **Database Access**: Confirm RLS policies and user context
- **External APIs**: Check environment variables and API keys

### Debugging Tools
- **React DevTools** for component debugging
- **Supabase Dashboard** for database queries
- **Vercel Logs** for production issues
- **Browser Network Tab** for API debugging

## Contact & Support

For development assistance, architectural questions, or technical support:
**Email**: support@yellowlettershop.com

---

*This guide is maintained as a living document. Update it when adding new features, changing architecture, or modifying development workflows.*

## YLS Brain (ylsbrain/) — mandatory protocol

A self-improving engineering memory lives in `ylsbrain/`. Hooks enforce it
(SessionStart injects state; Stop gates a per-task journal entry). On every
session: read the injected STATE + latest journal pointer and state what we
last did before new work. On task completion: append a journal entry
(Synopsis / What worked + Evidence / What did NOT work / Artifacts / Next) per
`ylsbrain/CLAUDE.md`. NO secrets/PII in entries. Consolidation runs after the
user's task, never instead of it. Full schema: `ylsbrain/CLAUDE.md`.

<!-- brain:pointer -->
## yls Brain (ylsbrain/) — mandatory protocol

A self-improving engineering memory lives in `ylsbrain/`. Hooks enforce it
(SessionStart injects state; Stop gates a per-task journal entry). State what we
last did before new work; on task completion append a journal entry per
`ylsbrain/CLAUDE.md`. NO secrets/PII. Consolidation after the user task only.
<!-- /brain:pointer -->