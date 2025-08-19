# **Development Guide — Yellow Letter Shop (YLS)**

*Last Updated: April 2025*

This document provides comprehensive guidance for developing, testing, and deploying the Yellow Letter Shop platform. It covers development workflows, testing strategies, deployment procedures, database setup, authentication implementation, and quality assurance processes.

## **1. Development Environment Setup**

### **1.1 Prerequisites**

To set up your development environment, ensure you meet the following requirements:

* **Node.js v18 or higher** - Required for all development activities
* **npm 8+** - Package management and script execution
* **Git** - Version control and collaboration
* **Supabase CLI** - Database management and local development
* **Docker** (optional) - For containerized development environments

### **1.2 Project Setup**

```bash
# Clone the repository
git clone <repository-url>
cd yellow-letter-shop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### **1.3 Environment Configuration**

Environment variables are managed through specific `.env` files:

* **`.env.local`** - Local development configuration
* **`.env.test`** - Test database and isolated testing environment
* **`.env.staging`** - Staging environment configuration
* **`.env.production`** - Production environment (managed via Vercel)

**Critical Environment Variables:**
* `DATABASE_URL` - Supabase database connection string
* `SUPABASE_URL` and `SUPABASE_ANON_KEY` - Supabase project configuration
* `SUPABASE_SERVICE_ROLE` - Server-side database operations
* `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` - Payment processing
* `NEXT_PUBLIC_SUPABASE_URL` - Client-side Supabase configuration

## **2. Development Workflow**

### **2.1 Branching Strategy**

Follow these branching guidelines for consistent development:

* **All feature work should be done in branches off `main`**
* **Use descriptive branch names** following the pattern:
  * `feature/ai-preview` - New feature implementation
  * `fix/stripe-webhook` - Bug fixes and corrections
  * `feature/feedback-module` - Major feature additions
  * `fix/webhook-retry-logging` - Specific issue resolution

* **Avoid committing directly to `main` or `staging`**
* **All Pull Requests (PRs) must target `main` for production deployment**

### **2.2 Code Standards**

Maintain consistency across the platform by following these standards:

#### **TypeScript Requirements**
* **All new files must be `.tsx` or `.ts`**
* **Avoid `any` types unless absolutely necessary** - document with comments when used
* **TypeScript is mandatory** for all new development
* **Strict typing enabled** with comprehensive type definitions

#### **Styling Standards**
* **Use Tailwind utility classes** instead of inline styles
* **Maintain consistent spacing and sizing** with `rounded`, `text-sm`, `grid`, `gap`
* **Avoid external CSS** unless properly scoped
* **Follow mobile-first responsive design principles**

#### **Code Quality Tools**
* **ESLint and Prettier** must be run before pushing code
* **Zero TypeScript errors** required for CI passage
* **Consistent formatting** enforced via automated tools

#### **Input Validation**
* **Zod is mandatory for API request validation**
* **All POST/PUT routes require schema validation**
* **Client-side validation must be complemented by server-side checks**

### **2.3 Commit Conventions**

* **Use Conventional Commits format** for all commit messages
* **Examples:**
  * `feat: add user dashboard analytics`
  * `fix: resolve stripe webhook timeout issue`
  * `docs: update API documentation`
  * `test: add E2E tests for proof annotation`

### **2.4 Pull Request Guidelines**

Follow these requirements for all Pull Requests:

* **PR title must follow commit message conventions**
* **Include clear description** of problem and solution
* **For UI changes, include screenshots** showing before/after states
* **Reference related issue or ticket number**
* **Tag relevant reviewers** from appropriate teams (QA, analytics, infra, API)

**Required CI Checks:**
* `lint` - Code style and quality validation
* `typecheck` - TypeScript compilation verification
* `test` - Unit and integration test execution
* `cypress` - End-to-end test completion

**All checks must pass before merging** to maintain code quality standards.

## **3. Authentication & User Management**

### **3.1 Authentication Architecture**

The YLS platform uses **Supabase Auth** integrated with **NextAuth.js** for comprehensive authentication management:

* **Primary Provider**: Supabase Auth with PostgreSQL backend
* **Session Management**: NextAuth.js with JWT tokens
* **Storage**: HttpOnly cookies with SameSite Strict policy
* **OAuth Support**: Google OAuth as primary authentication method

### **3.2 Role Management System**

#### **User Roles**
The platform implements hierarchical role-based access control:

* **Admin**: Full system access with impersonation capabilities
* **Manager**: Team-level management and order oversight
* **User**: Core functionality access (upload, order, design, proof review)
* **Client**: View-only access to assigned assets

#### **Implementation Details**
* **Roles stored in `user_profiles.role`** with database-level enforcement
* **Role-based UI rendering** with conditional component display
* **API-level permission checking** for all protected routes
* **RLS policies** enforce data access based on user roles

### **3.3 Team Collaboration**

* **Team invitation system** with email-based acceptance workflow
* **Shared resource access** for mailing lists, templates, and designs
* **Team-scoped permissions** with manager-level controls
* **Plan-based user limits** with automatic enforcement

### **3.4 Security Considerations**

* **Row-Level Security (RLS)** enforced on all major database tables
* **Session validation middleware** for all protected routes
* **Impersonation logging** with comprehensive audit trails
* **Password policies** and secure session management

## **4. Database Setup and Testing**

### **4.1 Database Architecture**

The YLS platform uses **Supabase PostgreSQL** with strict security policies:

* **Row-Level Security (RLS)** enabled on all tables
* **Multi-tenant isolation** via `auth.uid()` and `team_id` scoping
* **JSONB fields** for flexible data storage (designs, configurations, metadata)
* **Comprehensive audit logging** for all data changes

### **4.2 Test Database Configuration**

#### **Isolated Test Environment**
The platform maintains a dedicated test database environment to ensure:
* **Safe automated testing** without affecting development or production data
* **Consistent test conditions** with predictable data states
* **Reliable CI/CD pipeline** execution

#### **Test Database Setup**
```bash
# Test database configuration in .env.test
DATABASE_URL="postgresql://postgres:<password>@db.<project>.supabase.co:5432/yls_test"

# Important: URL-encode passwords with special characters
```

#### **Package Scripts (Cross-Platform)**
```json
{
  "scripts": {
    "test:prepare": "dotenv -f .env.test -- pnpm prisma migrate deploy && dotenv -f .env.test -- node ./prisma/seed.js",
    "test": "dotenv -f .env.test -- pnpm vitest run",
    "test:all": "pnpm test:prepare && pnpm test"
  }
}
```

### **4.3 Database Seeding**

#### **Seed Script Implementation**
* **Location**: `prisma/seed.ts` (compiled to `prisma/seed.js`)
* **Purpose**: Seeds essential tables (`planTier`, `role`, default configurations)
* **Execution**: Automated via test preparation scripts
* **Logging**: Comprehensive logging for debugging and validation

#### **Running Tests**
```bash
# Prepare and run all tests
pnpm test:all

# Manual seeding if needed
dotenv -f .env.test -- node ./prisma/seed.js
```

### **4.4 Schema Management**

* **Prisma schema** defined in `prisma/schema.prisma`
* **Migration management** via Prisma CLI
* **Type generation** for TypeScript integration
* **Database versioning** with migration history tracking

## **5. Testing Strategy & Quality Assurance**

### **5.1 Testing Philosophy**

The YLS platform follows a comprehensive testing approach with multiple layers:

* **Ensure all business-critical workflows are covered by automated tests**
* **Maintain confidence in deployments with full CI-based enforcement**
* **Use manual QA to catch UI/UX inconsistencies and edge cases**
* **Create repeatable and documented QA steps for all releases**

### **5.2 Testing Framework Architecture**

| Type | Tool/Framework | Scope |
|------|----------------|-------|
| **Unit Tests** | Jest | Pure functions, schema logic, pricing calculations, utility functions |
| **Component Tests** | React Testing Library | Component behavior, user interactions, state management |
| **Integration Tests** | Jest + Supertest | API route logic, database interactions, endpoint validation |
| **End-to-End Tests** | Cypress | Complete user workflows, cross-system integration |
| **Manual QA** | QA Team | Design previews, edge cases, UX consistency, mobile layouts |

### **5.3 Code Coverage Goals**

| Layer/Module | Target Coverage |
|--------------|-----------------|
| **Unit Tests** | 90%+ |
| **Component Tests** | 85%+ |
| **Integration Routes** | 90%+ |
| **E2E Core Workflows** | 100% |
| **Payment Authorization** | 100% |
| **Proof Approval Process** | 100% |
| **Stripe Capture/Cancel** | 100% |

### **5.4 Critical End-to-End Test Workflows**

#### **Authentication & User Management**
* User login, logout, and session management
* Role-based access control verification
* Admin impersonation workflow testing

#### **Mailing List Management**
* File upload with CSV/XLSX support
* Column mapping and field validation
* Deduplication toggle functionality
* AccuZIP address validation integration

#### **Order Processing Workflow**
* Complete order wizard execution
* Design customization and preview generation
* Contact card selection and validation
* Payment authorization (without capture)
* Design lock confirmation and approval process

#### **Proof Review and Annotation**
* PDF proof display and annotation placement
* Threaded comment system functionality
* Proof approval triggering payment capture
* Order cancellation with fund release

#### **Admin Functionality**
* Order fulfillment method selection
* Vendor assignment and routing
* User impersonation with audit logging
* System-wide analytics and reporting

### **5.5 Manual QA Checklist**

#### **Design and Personalization**
* Design preview accuracy with contact card data
* Personalization token rendering verification
* Mobile responsiveness across devices
* Cross-browser compatibility testing

#### **Payment Integration**
* Stripe payment authorization workflow
* Fund hold and release sequence validation
* Saved payment method functionality
* Refund processing verification

#### **User Experience**
* Contextual help system accuracy
* Error message clarity and helpfulness
* Navigation flow consistency
* Accessibility compliance (WCAG 2.1)

### **5.6 Bug Tracking and Resolution**

#### **Bug Severity Classification**

| Severity | Description | SLA |
|----------|-------------|-----|
| **Critical** | Payment failures, data loss, system outages | < 12 hours |
| **High** | Core feature breakage, user workflow blocking | 24 hours |
| **Medium** | Non-blocking issues, UI glitches, minor feature problems | 72 hours |
| **Low** | Cosmetic issues, performance improvements, enhancement requests | Next backlog |

#### **Bug Reporting Requirements**
All bugs must be logged with:
* **Detailed steps to reproduce** the issue
* **Expected vs actual behavior** documentation
* **Screenshots or recordings** when applicable
* **Environment and browser information**
* **Severity classification** and priority assessment

### **5.7 Unit & Component Test Harness (Mocha + ts-node + RTL)**

YLS uses a Mocha-based harness for unit and component tests with TypeScript and React Testing Library. The setup is cross-platform (Windows/Ubuntu) and avoids ESM/CJS loader pitfalls.

**Key files:**
* `.mocharc.json` — Single source of truth for test config. Loads setup files via `require` in order and discovers specs by glob.
* `tests/setup/register-ts-node.cjs` — Registers `ts-node` with `tests/tsconfig.mocha.json` and enables `tsconfig-paths` for `@/*` imports.
* `tests/setup/jsdom.js` — Initializes JSDOM and attaches DOM globals (`window`, `document`, events, `requestAnimationFrame`).
* `tests/setup/mock-lucide-react.js` — Resolver-based redirect to a local CJS stub for `lucide-react`.
* `tests/setup/lucide-react-cjs-stub.js` — Tiny React SVG proxy used by the mock above.
* `tests/tsconfig.mocha.json` — TypeScript config for tests.

**How to run:**
* Local/CI: `npm test`
* Single spec (example):
  ```bash
  npx mocha tests/lender-filters.test.tsx
  ```

**Conventions & tips:**
* Keep setup order in `.mocharc.json` (ts-node → jsdom → mocks) to ensure a stable environment.
* For ESM-only libraries in tests, add a small resolver-based redirect in `tests/setup/` (patterned after `mock-lucide-react.js`) instead of global monkeypatching.
* Component tests should use React Testing Library and user-event for interactions.
* Keep test files focused and under ~200–300 LOC; split when they grow large.

**Version notes:**
* Tests pin `jsdom` to a CommonJS-friendly version and use `date-fns@2.30.0` to avoid ESM-only breakage in the CJS harness.

## **6. Deployment & DevOps**

### **6.1 Deployment Environments**

The YLS platform utilizes multiple deployment environments hosted on **Vercel**:

| Environment | Purpose | Access |
|-------------|---------|--------|
| **Local Dev** | Developer workstations for local development | Individual developers |
| **Preview** | Automatic PR deployments for review | Team collaboration |
| **Staging** | Internal QA and regression testing | QA team and stakeholders |
| **Production** | Live system at yellowlettershop.com | Public access |

### **6.2 CI/CD Pipeline**

#### **GitHub Actions Workflow**
The deployment pipeline is managed by **GitHub Actions** with the following triggers:
* **`push` to `main` branch** → Production deployment
* **`pull_request` against `main`** → Preview environment deployment

#### **Pipeline Steps**
```
Code Push → Lint → TypeCheck → Unit Tests → E2E Tests → Build → Deploy
```

**Detailed Workflow:**
1. **Lint**: Execute `npm run lint` for code quality
2. **Type Check**: Execute `npm run typecheck` for TypeScript validation
3. **Unit Tests**: Execute `npm run test` with Jest
4. **E2E Tests**: Execute Cypress test suite in headless mode
5. **Build**: Execute `npm run build` for production optimization
6. **Deploy**: Vercel auto-deployment with health checks

### **6.3 Environment Configuration**

#### **Secrets Management**
Environment variables are managed through **Vercel and GitHub repository settings**:

**Required Secrets:**
* **Supabase Configuration**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
* **Stripe Integration**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
* **External APIs**: `ACCUZIP_API_KEY`, `MAILGUN_API_KEY`, `OPENAI_API_KEY`
* **FPD Configuration**: `FPD_CONFIG_URL` and related settings

### **6.4 Email Infrastructure**

#### **Outbound Email System**
* **Primary Provider**: Mailgun for transactional emails
* **Use Cases**: Notifications, receipts, proof delivery, status updates
* **Features**: Template management, delivery tracking, bounce handling

#### **Inbound Email Processing**
* **Provider**: Mailgun Routes with webhook integration
* **Purpose**: Automated proof ingestion and skip trace file processing
* **Workflow**:
  1. Vendor sends revised proof or enriched data via email
  2. Mailgun webhook triggers file parsing logic
  3. Attachments extracted and stored in appropriate S3 buckets
  4. Order ID extracted from subject line for matching
  5. Database updated with new file locations and status
  6. Customer notifications triggered automatically

### **6.5 Payment Processing Integration**

#### **Stripe Payment Hold and Capture Workflow**
The platform implements a sophisticated payment authorization system:

1. **Order Checkout**: Create `payment_intent` with `capture_method: manual`
2. **Authorization**: Funds authorized but not immediately captured
3. **Order Status**: Moves to `awaiting_proof` state
4. **Proof Approval**: User approval triggers automatic fund capture
5. **Order Cancellation**: Cancellation releases hold without charge

#### **Deployment Considerations**
* **Payment Intent Storage**: All `payment_intent_id` values must be persisted
* **In-Flight Transactions**: Payment intents remain valid during deployments
* **Webhook Validation**: Stripe webhook events must not trigger fulfillment for canceled intents

### **6.6 Rollback Strategy**

#### **Automated Rollback Options**
* **Vercel UI Rollback**: Navigate to Deployments tab, select previous commit, click "Redeploy"
* **GitHub Actions Rollback**: Tag stable commit with `rollback/x.y.z` and trigger manual deployment

#### **Emergency Procedures**
* **Feature Flag Disable**: Temporarily disable problematic features via admin controls
* **Manual File Upload**: Admin interface for uploading revised proofs or data files
* **Database Rollback**: Field-level and record-level rollback capabilities
* **Customer Communication**: Direct notification system for affected users

### **6.7 Monitoring & Observability**

#### **Error Tracking and Logging**
* **Sentry**: Frontend and backend error monitoring with alerting
* **Vercel Logs**: Runtime function logs, build logs, and performance metrics
* **Supabase Logs**: Database queries, authentication events, RLS trace logs
* **Stripe Dashboard**: Payment processing, webhook delivery, dispute monitoring

#### **Business Intelligence Monitoring**
* **Audit Logs**: Comprehensive tracking in `audit_logs` table
* **User Activity**: Login patterns, feature usage, and engagement metrics
* **System Performance**: API response times, database query performance
* **Third-Party Integration**: AccuZIP, Mailgun, and vendor communication monitoring

### **6.8 Launch Readiness Checklist**

#### **Pre-Production Validation**
* **CI Checks**: All lint, typecheck, Jest, and Cypress tests passing
* **Payment Integration**: Stripe test payments, authorization, and capture workflows verified
* **Email Processing**: Inbound email parsing and automated file ingestion tested
* **Proof Workflow**: Complete annotation and approval process validated
* **Admin Tools**: Impersonation, override workflows, and audit logging verified
* **Mobile Responsiveness**: Cross-device compatibility and accessibility compliance
* **Security Validation**: RLS policies, authentication, and authorization testing

#### **Stakeholder Approval**
**Required sign-offs before production deployment:**
* **QA Team Lead**: Manual validation and automated test results approval
* **DevOps Owner**: Secrets management, build integrity, and runtime readiness
* **Product Lead**: Feature review and business requirement compliance

## **7. Sensitive Data Management**

### **7.1 Security Requirements**

**Never commit sensitive data** to the repository:
* **Environment files** (`.env*` files with credentials)
* **API keys** (Supabase service keys, Stripe secret keys, AccuZIP keys)
* **Service credentials** (Mailgun API keys, OpenAI keys)
* **Database passwords** and connection strings

### **7.2 Secure Configuration**
* **Environment-specific secrets** managed via Vercel and GitHub Actions
* **Server-side API key usage** with no client-side exposure
* **Encrypted data transmission** via HTTPS enforcement
* **PCI DSS compliance** through Stripe integration (no card data storage)

### **7.3 GDPR and Privacy Compliance**
* **Data export capabilities** for user data portability
* **Right to be forgotten** implementation
* **Consent management** with granular privacy controls
* **Audit trail maintenance** for compliance reporting

## **8. Performance Optimization**

### **8.1 Frontend Performance**
* **Code splitting** and lazy loading for optimal bundle sizes
* **Image optimization** with Next.js Image component
* **CDN integration** via Vercel edge network
* **Component memoization** for expensive rendering operations

### **8.2 Backend Performance**
* **Database indexing** for frequently queried fields
* **Query optimization** with Prisma ORM
* **Caching strategies** for static data and API responses
* **Connection pooling** via Supabase infrastructure

### **8.3 Third-Party Integration Optimization**
* **API call batching** for AccuZIP and external services
* **Webhook retry logic** with exponential backoff
* **File processing optimization** for large mailing lists
* **Real-time update throttling** for improved user experience

## **9. Troubleshooting & Support**

### **9.1 Common Development Issues**

#### **Database Connection Problems**
* Verify environment variables in `.env.local`
* Check Supabase project status and connectivity
* Validate database URL encoding for special characters

#### **Authentication Issues**
* Confirm Supabase Auth configuration
* Verify JWT token expiration and refresh logic
* Check RLS policy enforcement and permissions

#### **Build and Deployment Failures**
* Review CI/CD logs in GitHub Actions
* Verify all environment secrets are properly configured
* Check TypeScript compilation errors and linting issues

### **9.2 Performance Debugging**
* **Lighthouse CI** for web vitals monitoring
* **React DevTools** for component performance analysis
* **Network tab analysis** for API response optimization
* **Database query analysis** via Supabase dashboard

### **9.3 Contact and Support**

For all development questions, technical support, deployment assistance, testing guidance, or any other development-related inquiries:

**Email:** support@yellowlettershop.com

This unified contact ensures efficient routing of development inquiries to appropriate specialists while maintaining consistent support quality across all technical domains.