# **Yellow Letter Shop (YLS) Technical Architecture Documentation**

*Last Updated: April 2025*

This document outlines the comprehensive technical architecture, security framework, and infrastructure design for the Yellow Letter Shop (YLS) platform. It covers system layers, technology stack, deployment practices, security protocols, and scalability considerations for complete implementation.

## **1. System Overview**

Yellow Letter Shop is a **cloud-native, modular SaaS platform** that combines a **Next.js frontend**, **Supabase backend**, **Stripe billing**, and **S3-based asset storage**. The platform is designed for scalability, security, and maintainability with strict Row-Level Security (RLS) enforcement and comprehensive audit logging.

### **Architecture Principles**
* **Cloud-first deployment** with serverless-first strategy
* **Multi-tenant security** via Supabase RLS policies
* **Modular design** with feature-based organization
* **API-first approach** with RESTful structure
* **Mobile-responsive** with progressive web app capabilities
* **Real-time capabilities** through Supabase subscriptions

## **2. Technology Stack**

### **2.1 Frontend Technologies**

#### **Core Framework**
* **Next.js (v14+)** - React framework with App Router
  * **App Router** for file-based routing and server-first design
  * **Server-Side Rendering (SSR)** and **Static Site Generation (SSG)**
  * **API Routes** for internal backend logic
  * **Incremental Static Regeneration** for marketing pages

#### **UI Framework & Styling**
* **React (v18+)** - Component-based UI with functional components and hooks
* **TypeScript (v5+)** - Strict typing with custom interfaces and type definitions
* **Tailwind CSS (v3+)** - Utility-first CSS with mobile-first responsive design
* **CSS Modules** - For scoped styles when needed

#### **Component Libraries & UI Tools**
* **ShadCN/UI** - Headless Tailwind component library for modals, forms, and primitives
* **TanStack Table** - Highly customizable headless table component for mailing list management
* **Recharts** - Declarative charting library for analytics and dashboard visualizations
* **Lucide React** - Scalable SVG icon set
* **React Hook Form + Zod** - Performant form handling with schema validation
* **Framer Motion** - Animation library for interactive transitions

#### **Specialized Integrations**
* **Fancy Product Designer (FPD)** - Embedded WYSIWYG canvas editor for mail piece customization
* **React-PDF / PDF.js** - Embedded PDF viewer with annotation overlay support

### **2.2 Backend & Database**

#### **Backend Services**
* **Supabase** - Complete backend-as-a-service platform
  * **PostgreSQL Database** with full Row-Level Security (RLS)
  * **Supabase Auth** with JWT token management
  * **Supabase Storage** backed by AWS S3
  * **Real-time subscriptions** for live updates
* **Next.js API Routes** - RESTful backend logic with feature-based organization
* **Prisma ORM** - Type-safe database access and schema management

#### **Database Architecture**
* **PostgreSQL** with JSONB fields for flexible data storage
* **Row-Level Security (RLS)** enforced on all major tables
* **Audit logging** with comprehensive change tracking
* **Multi-tenant isolation** via `auth.uid()` and `team_id` scoping

### **2.3 Authentication & Authorization**

#### **Authentication Stack**
* **Supabase Auth** - Primary authentication provider with PostgreSQL backend
* **NextAuth.js** - Session middleware and cookie management
* **JWT Tokens** - Stored in HttpOnly cookies with SameSite Strict policy
* **OAuth Integration** - Google OAuth as primary authentication method

#### **Authorization Framework**
* **Role-Based Access Control (RBAC)** - Four distinct user roles
  * **Admin**: System-wide access with impersonation capabilities
  * **Manager**: Team-level control over data and orders
  * **User**: Core functionality (upload, order, design, proof review)
  * **Client**: View-only restricted access
* **Row-Level Security (RLS)** - Database-level access control
* **Server-side enforcement** - All routes protected with session validation

### **2.4 File Storage & Asset Management**

* **AWS S3** via Supabase Storage with organized bucket structure:
  * `uploads/` - Mailing lists and input files
  * `designs/` - Customized design data and saved templates
  * `template-previews/` - Preview renders
  * `order-proofs/` - PDF proofs and revision history
  * `skip-trace/` - CSVs for skip tracing workflows
* **Signed URLs** for secure access control
* **IAM policies** scoped per user folder

### **2.5 Third-Party Integrations**

#### **Payment Processing**
* **Stripe** - Complete payment infrastructure
  * Payment authorization with manual capture workflow
  * Subscription billing with metered usage
  * Webhook handling for payment lifecycle events
  * Support for stored payment methods

#### **Communication Services**
* **Mailgun** - Email delivery and processing
  * Transactional emails for notifications and updates
  * Inbound email parsing via webhook routes
  * Suppression handling and deliverability monitoring

#### **Address Validation & Mail Processing**
* **AccuZIP REST API** - CASS-certified address validation
  * Address standardization and correction
  * Deduplication and vacant property filtering
  * Presort and barcode generation
  * Mail tracking integration

#### **Design & Personalization**
* **Fancy Product Designer (FPD)** - Real-time design editor
  * JavaScript integration with CDN delivery
  * Dynamic placeholder support for variable injection
  * JSON-based design state management
  * Layer and object locking capabilities

#### **AI Services (Future Phases)**
* **OpenAI/Claude** - AI-powered content generation
  * Message personalization with prompt templates
  * Contextual help system
  * Usage tracking and subscription tier enforcement

## **3. Application Architecture**

### **3.1 Application Layers**

#### **Presentation Layer (Frontend)**
* **Next.js + Tailwind CSS** with server components and layouts
* **Fancy Product Designer (FPD)** integration for design editing
* **PDF viewer with annotations** using PDF.js
* **Real-time dashboards** with analytics visualizations
* **Mobile-responsive design** with progressive enhancement

#### **API Layer (Backend)**
* **Next.js API Routes** with RESTful structure organized by feature:
  * `/api/templates` - Template management
  * `/api/mailing-lists` - List upload and validation
  * `/api/orders` - Order processing and fulfillment
  * `/api/payments` - Stripe integration
  * `/api/vendors` - Vendor management
  * `/api/analytics` - Reporting and dashboards
  * `/api/webhooks` - External integrations
* **Middleware stack** for session validation, rate limiting, and input validation
* **Zod schema validation** for all mutation inputs

#### **Data Layer**
* **Supabase PostgreSQL** with comprehensive RLS policies
* **JSONB fields** for flexible content storage
* **Audit logging** with field-level change tracking
* **Real-time subscriptions** for live updates

### **3.2 Key System Workflows**

#### **Order Fulfillment Workflow**
1. Customer uploads mailing list with deduplication options
2. Address validation via AccuZIP API
3. Design customization using FPD with contact card integration
4. Payment authorization (not captured) via Stripe
5. Admin review and fulfillment method selection
6. Vendor routing for third-party fulfillment
7. Proof generation and customer review with annotation system
8. Final approval triggers payment capture
9. Order completion with tracking and analytics

#### **Multi-Vendor Management**
* **Unified vendor framework** supporting multiple vendor types
* **Performance tracking** with delivery rates and quality scores
* **Automated routing** with fallback mechanisms
* **Email-based communication** for order dispatch and proof delivery

#### **Skip Tracing Integration**
* **Record selection interface** for targeted skip tracing
* **CSV export and vendor communication** via email
* **Inbound file processing** with automatic data enrichment
* **Status tracking and notification system**

## **4. Security Architecture**

### **4.1 Authentication Security**

#### **Token Management**
* **JWT tokens** issued by Supabase with secure storage
* **HttpOnly cookies** with SameSite Strict policy
* **Automatic token refresh** with secure rotation
* **Session timeout** with configurable duration

#### **OAuth Integration**
* **Google OAuth** as primary authentication method
* **Secure redirect handling** with state validation
* **Token exchange** with proper scope management

### **4.2 Authorization & Access Control**

#### **Row-Level Security (RLS)**
* **Database-level security** enforced on all major tables
* **User-scoped data** via `auth.uid()` filtering
* **Team-scoped resources** via `team_id` association
* **Admin overrides** via secure service role context

#### **API Security**
* **Route protection** with middleware validation
* **Role-based access** enforced at endpoint level
* **Input sanitization** with Zod schema validation
* **Rate limiting** to prevent abuse

### **4.3 Data Protection**

#### **Encryption & Storage**
* **Data encryption** at rest and in transit
* **Secure file storage** with signed URL access
* **PCI compliance** through Stripe integration
* **GDPR compliance** with data export and deletion capabilities

#### **Audit & Monitoring**
* **Comprehensive audit logging** for all user actions
* **Impersonation tracking** with admin session logs
* **Change history** with before/after snapshots
* **Security event monitoring** with automated alerts

### **4.4 Privacy Controls**

#### **User Consent Management**
* **Consent banner** with customizable tracking preferences
* **Cookie management** with granular control options
* **Data export capabilities** for user transparency
* **Right to be forgotten** implementation

#### **Data Handling Policies**
| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| **Mailing List Data** | Print production and delivery | Campaign completion + 30 days |
| **User Contact Info** | Account management and support | Account lifetime |
| **Design Metadata** | Template rendering and personalization | Indefinite (user-controlled) |
| **Analytics Data** | Performance tracking and insights | 2 years |
| **Audit Logs** | Security and compliance | 7 years |

## **5. Infrastructure & Deployment**

### **5.1 Hosting & Deployment**

#### **Primary Infrastructure**
* **Vercel** - Frontend and API hosting with edge deployment
* **Supabase** - Backend services with global distribution
* **AWS S3** - File storage via Supabase integration
* **GitHub** - Source control with automated workflows

#### **Environment Management**
* **Local Development** - Developer workstations with hot reload
* **Preview Environments** - Automatic PR deployments via Vercel
* **Staging** - Internal QA and regression testing
* **Production** - Live system with monitoring and alerting

### **5.2 CI/CD Pipeline**

#### **GitHub Actions Workflow**
```
Code Push → Lint → TypeCheck → Unit Tests → E2E Tests → Build → Deploy
```

* **Automated Testing** - Jest unit tests and Cypress E2E tests
* **Code Quality** - ESLint linting and Prettier formatting
* **Type Safety** - TypeScript compilation verification
* **Security Scanning** - Dependency vulnerability checks
* **Performance Testing** - Build optimization verification

#### **Deployment Strategy**
* **Blue-green deployment** for zero-downtime updates
* **Feature flags** for gradual rollout control
* **Rollback capabilities** with one-click reversion
* **Health checks** with automated monitoring

### **5.3 Monitoring & Observability**

#### **Error Tracking & Logging**
* **Sentry** - Frontend and backend error monitoring
* **Vercel Logs** - Runtime function logs and build logs
* **Supabase Logs** - Database queries, auth events, and RLS traces
* **Stripe Dashboard** - Payment processing and webhook monitoring

#### **Performance Monitoring**
* **Core Web Vitals** tracking for user experience
* **API response times** with alerting thresholds
* **Database performance** with query optimization
* **Third-party service** uptime and latency monitoring

#### **Business Intelligence**
* **User analytics** with privacy-compliant tracking
* **Campaign performance** metrics and reporting
* **Vendor performance** tracking and SLA monitoring
* **Financial metrics** integration with Stripe data

## **6. Development Tools & Workflow**

### **6.1 Design & Prototyping Tools**
* **V0 by Vercel** - AI-powered frontend design and component generation
* **Figma** - UI/UX design and prototyping
* **Component libraries** - shadcn/ui for consistent design systems

### **6.2 Development Environment**
* **AI Development Tools**:
  * **Windsurf** - AI-assisted backend development and architecture
  * **Cursor** - AI-powered code editing and refactoring
  * **GitHub Copilot** - Code completion and suggestion
* **Standard Development Tools**:
  * **Visual Studio Code** - Primary code editor with TypeScript support
  * **ESLint & Prettier** - Code formatting and linting standards
  * **Conventional Commits** - Standardized commit message format

### **6.3 Testing & Quality Assurance**
* **Unit Testing** - Jest with React Testing Library
* **Integration Testing** - API endpoint testing with Supertest
* **End-to-End Testing** - Cypress for full user workflow validation
* **Visual Regression Testing** - Screenshot comparison for UI consistency
* **Performance Testing** - Lighthouse CI for web vitals monitoring

## **7. Scalability & Performance**

### **7.1 Current Architecture Benefits**
* **Serverless scaling** with automatic resource allocation
* **CDN distribution** via Vercel edge network
* **Database optimization** with Supabase connection pooling
* **Caching strategies** for static assets and API responses

### **7.2 Future Scalability Considerations**
* **Microservices architecture** for complex business logic
* **Queue-based processing** for background jobs and email handling
* **Database sharding** for large-scale multi-tenant data
* **API gateway** implementation for enterprise integrations
* **Mobile app development** using React Native/Expo

### **7.3 Performance Optimization**
* **Code splitting** for optimized bundle sizes
* **Image optimization** with Next.js Image component
* **API response caching** with intelligent invalidation
* **Database indexing** for query performance
* **Asset compression** and minification

## **8. Security Best Practices**

### **8.1 Development Security**
* **Dependency scanning** with automated vulnerability detection
* **Secrets management** via environment variables and secure vaults
* **Code review process** with security-focused guidelines
* **HTTPS enforcement** across all environments

### **8.2 Runtime Security**
* **Content Security Policy (CSP)** headers
* **Rate limiting** to prevent abuse and DDoS attacks
* **Input validation** and SQL injection prevention
* **Cross-site scripting (XSS)** protection

### **8.3 Compliance & Auditing**
* **GDPR compliance** with data protection measures
* **SOC 2 readiness** with comprehensive audit trails
* **PCI DSS compliance** through Stripe integration
* **Regular security audits** and penetration testing

## **9. Contact**

For technical architecture questions, infrastructure support, security concerns, or development environment assistance:

**Email:** support@yellowlettershop.com