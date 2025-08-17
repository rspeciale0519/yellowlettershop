# **Product Requirements Document (PRD) — Yellow Letter Shop (YLS)**

*Last Updated: April 2025*

## **1. Project Overview**

### **Platform Purpose**

Yellow Letter Shop (YLS) is a comprehensive SaaS platform that enables users to create, personalize, and deliver direct mail campaigns with speed and precision. It targets real estate professionals, local businesses, agencies, and marketers who require efficient tools to generate and fulfill marketing mail at scale or on-demand. The platform includes dynamic mail piece design, mailing list management, address validation, automation options, real-time status tracking, and advanced analytics—all optimized for mobile use.

### **Target Audience**

The primary target audience for YLS includes:

* Real estate investors, agents, wholesalers, and construction companies
* Insurance agents and mortgage companies  
* Small to medium-sized business owners
* Marketing agencies and sales professionals
* Direct mail agencies

### **Problem Statement**

Manually managing, designing, skip tracing, and sending personalized direct mail is **time-consuming, error-prone, and lacks scalable automation**. Businesses currently lack an integrated, no-code tool to manage mailing lists, customize templates, validate addresses, place print orders, track campaign performance, perform skip tracing, manage external vendors effectively, track engagement, generate reports, manage contact information, reverse bulk changes, handle user feedback, share resources with teams, and route data intelligently without vendor lock-in.

## **2. Core Objectives**

The YLS platform aims to achieve the following core objectives:

* **Provide a frictionless end-to-end direct mail workflow**
* **Upload and validate mailing lists** with address deduplication and configurable defaults
* **Enable professional-grade mailer customization** without requiring design skills
* **Customize direct mail templates** with dynamic personalization
* **Process payments and manage orders** with status tracking and manual capture workflow
* **Ensure production accuracy** with user-approved proofs and list integrity
* **Support single recipient mailing and high-volume batch campaigns**
* **Offer automation tools** for recurring and split campaigns
* **Enable skip tracing on-demand** with order lifecycle support
* **Provide performance tracking, history logging, and data segmentation tools**
* **Support admin oversight, impersonation, team collaboration**, and role-based access
* **Expose internal and external APIs** with webhook support for CRM integration
* **Enable a seamless third-party print and skip tracing fulfillment workflow**

## **3. Functional Requirements**

### **3.1 User Account and Identity Management**

* **Authentication**: Supabase Auth with NextAuth.js integration
* **OAuth Support**: Google OAuth as primary method
* **Role-based Access Control**: Admin, manager, user, client roles with distinct permissions
* **Identity Cards**: Saved sender profiles for contact info reuse and multi-brand account support
* **Team Management**: Multi-user collaboration with invite flows and shared resource access

### **3.2 Mailing List Manager (MLM)**

* **File Upload**: CSV/XLSX upload with drag-and-drop interface, header mapping, validation, and preview
* **Deduplication**: Toggle-based deduplication during upload with user-level default settings
* **Address Validation**: AccuZIP integration for CASS-certified validation and deliverability scoring
* **List Management**: 
  * Custom and system column mapping with field exclusion before import
  * Bulk and single-record entry support with manual record addition
  * Tagging system for segmentation with advanced search and filtering
  * Field-level change tracking and full record history with audit trails
  * Response tagging (converted, called, etc.) for CRM-style tracking
* **Data Processing**: 
  * Record-level delivery history and performance tracking
  * Deduplication, parsing, vacant filtering capabilities
  * Export options with tag filters and bulk export functionality
* **Archival**: Automatic archival of inactive lists after 12 months

### **3.3 Contact Cards**

* **Required Fields**: First name, Last name, Street address, Suite/Unit/Apt, City, State, Zip code, Email address, Company name, Phone number
* **Plan-based Limits**:
  * Pro plan: maximum of 2 contact cards
  * Team and Enterprise plans: limit based on number of users in the account
* **Campaign Integration**: One contact card must be selected for every campaign
* **Order Process**: Prompt to select existing or create new card during order wizard
* **Design Preview**: Contact card info displayed on design preview and injected into live previews

### **3.4 Template Management & Design Tool**

* **Design Engine**: Fancy Product Designer (FPD) integration with drag-and-drop WYSIWYG editor
* **Template Features**:
  * Browse pre-made industry templates with categorized, ready-to-use designs
  * Template marketplace for public & private templates with favorites and reuse capability
  * Variable tag fields support (e.g., {{FirstName}}, {{PropertyAddress}})
  * Templates include compatible variable tags from mailing list and contact card fields
* **Design Capabilities**:
  * Real-time canvas editor with image uploads and backgrounds
  * Font, color, and layout control with professional customization options
  * Auto-fill preview mode using sample mailing list data and contact card information
  * Save drafts and reusable templates with template versioning
  * Support for letters, postcards, and envelopes

### **3.5 Order Processing Workflow**

* **Multi-step Order Wizard**:
  1. Template selection
  2. Mailing list upload with deduplication toggle
  3. Field mapping and validation
  4. Design customization with live preview
  5. Contact card selection (mandatory)
  6. Mailing options configuration
  7. Campaign options setup
  8. Final review with design lock confirmation + no refund disclaimer
  9. Stripe checkout with payment authorization

* **Design Approval Flow**:
  * Required double-approval modal before checkout with explicit design lock warning
  * "By clicking Continue, you approve your design for printing. No changes can be made afterward."
  * No external proofing or human review step for standard flow

* **Payment Integration**:
  * Stripe integration with payment authorization on checkout
  * **Manual Capture Workflow**: Funds authorized but not captured until proof approval
  * Final capture after design approval, with fund release if order abandoned
  * Support for stored payment methods and default card selection

### **3.6 Mailing Options**

Configurable during order wizard with dynamic pricing:

* **Option A**: Full mailing service (postage type + stamp/indicia selection)
* **Option B**: Print, process, and ship to user (with or without postage - First Class live stamps only)
* **Option C**: Print only and ship unprocessed/unpostaged to user
* **Postage Rules**: 
  * First Class (Forever): no minimum quantity
  * First Class (Discounted): 500-piece minimum
  * Standard Class: 200-piece minimum
* **Dynamic Filtering**: System automatically shows only eligible postage types based on validated list count
* **Shipping**: Shipping and handling fees apply to Options B & C based on weight

### **3.7 Campaign Options**

* **Split Campaign Configuration**: User selects number of drops and weekly interval (e.g., 4 drops, 1 per week)
* **Repeat Campaign Options**:
  * If split selected: specify how many times to repeat the full campaign
  * If not split: specify frequency and number of repetitions
* **Campaign Management**: Locked templates and contact cards for consistent sequencing with visual campaign calendar UI

### **3.8 Vendor Management System**

* **Multi-type Vendor Framework**: Support for print, skip_tracing, data_enrichment, and other vendor types
* **Vendor Directory**: Unified admin-accessible directory with filtering by vendor_type
* **Vendor Data Management**:
  * Store vendor name, contact details, services offered, and pricing tiers
  * Record wholesale pricing per service/product with tiered pricing structure
  * Track turnaround time, shipping costs, minimum order quantity, quality rating, and error incidents
  * Maintain historical pricing records and contract terms
* **Performance Tracking**: Monitor delivery performance with on-time delivery rates, quality scores, and error incident logging
* **Fulfillment Integration**: Used in routing for both print and skip tracing orders with manual vendor selection and fallback logic

### **3.9 Skip Tracing System**

* **Record Selection**: User can select one, multiple, or all records for skip tracing
* **Order Management**: Skip tracing order creation with associated pricing and Stripe payment enforcement
* **Vendor Integration**:
  * Export selected records (limited fields) for external processing
  * Email dispatch to selected skip tracing vendor with attached CSV
  * Inbound email parsing and enriched data import via webhook
* **Lifecycle Tracking**: Complete audit logging of skip trace actions with status tracking (not_requested, pending, enriched, failed)
* **Notification System**: In-app and email notifications upon completion

### **3.10 Proof Review & Annotation System**

* **PDF Viewer Integration**: Embedded PDF viewer (PDF.js) with clickable annotation support
* **Annotation Features**:
  * Location-aware annotations with X/Y coordinates and page tracking
  * Threaded comment replies with timestamp tracking
  * Sidebar display of full comment list with resolution capability
* **Approval Workflow**:
  * Customer review of generated proofs with annotation capability
  * Approve/Request Changes/Cancel options
  * Approval triggers final payment capture; cancellation voids authorization
* **Admin Integration**: Admin and support team can reply to or resolve comment threads

### **3.11 AI Features**

* **AI Personalization**: Toggle-enabled AI-generated message content using OpenAI/Claude with subscription tier usage limits
* **Contextual Help**: Embedded AI-based tips and guidance by page/task with indexed documentation links
* **Prompt System**: Template-based prompt system with token support and generated output history

### **3.12 Short URL Tracking System**

* **Link Generation**: Unique short codes per recipient/record (e.g., yls.to/xyz123)
* **Analytics Tracking**: Log timestamp, IP, user agent, and record ID for each click
* **Campaign Metrics**: Aggregate analytics per campaign with heatmap and time series views
* **Smart Redirects**: Optional custom landing page redirection capability

### **3.13 Rollback & Change Management**

* **Change Tracking**: Track all modifications to mailing list records with before/after snapshots
* **Rollback Options**: Support for individual record, entire list, or tag segment rollback
* **Visual Interface**: UI for visual diff comparison with field-level change history
* **Audit Logging**: All rollback actions logged to audit table with user attribution

### **3.14 Analytics & Reporting Module**

* **User Dashboard**: Login landing page with KPI tiles, charts, short link activity, and recent orders
* **Admin Dashboard**: Platform-wide KPIs, revenue trends, vendor performance, and user activity charts
* **Report Builder**: Full-featured interface with:
  * Report type selection and timeframe filters
  * Export formats (CSV, PDF, Excel)
  * One-time download or email delivery options
  * Scheduling engine for recurring delivery (daily, weekly, monthly)
* **Saved Reports**: User and admin report templates with recurring report management
* **Analytics Tracking**: Mailing volume, spend, engagement rates, validation success, skip tracing metrics, and short link performance

### **3.15 Team Collaboration**

* **Role-based Permissions**: Distinct access levels for admin, manager, user, and client roles
* **Team Management**: Invitation flows with pending acceptance and plan limit enforcement
* **Shared Resources**: Access to shared mailing lists, templates, reports, and contact cards
* **Activity Tracking**: Team usage monitoring and collaborative workflow support

### **3.16 Feedback & Support Systems**

* **Feedback Collection**: NPS prompts post-order or post-proof with comment capability
* **Support Integration**: Internal ticketing system with user submission and admin triage
* **Alert System**: Automated alerts for NPS < 6 and critical system events
* **Analytics Integration**: Feedback data included in admin reporting dashboards

### **3.17 Webhooks & API Integration**

* **Webhook Management**: User-defined webhook URLs per event type with comprehensive logging
* **Event Types**: Support for proof approval, order creation, skip trace completion, and short link engagement
* **Retry Logic**: Failed webhook retry capability with status tracking and manual retry options
* **API Access**: REST endpoints for external system integration and CRM connectivity

## **4. Technical Requirements**

### **Technology Stack**
* **Frontend**: Next.js, React, TypeScript, Tailwind CSS
* **Backend**: Supabase (Auth, DB, Storage), Next.js API routes
* **Database**: PostgreSQL with Row-Level Security (RLS)
* **ORM**: Prisma for type-safe database access
* **Payment Processing**: Stripe with manual capture workflow
* **File Storage**: AWS S3 via Supabase Storage
* **Design Engine**: Fancy Product Designer (FPD)
* **Address Validation**: AccuZIP REST API
* **Email Services**: SendGrid/Mailgun for transactional and inbound email
* **AI Services**: OpenAI/Anthropic for optional personalization
* **Charts & Analytics**: Recharts for dashboard visualizations

### **Security & Compliance**
* **Authentication**: JWT-based with Supabase Auth and NextAuth.js
* **Authorization**: Supabase RLS for tenant isolation and data protection
* **Data Handling**: GDPR-compliant with user data export and deletion capabilities
* **Payment Security**: PCI compliance through Stripe integration
* **Audit Logging**: Comprehensive activity tracking for compliance and debugging

### **Performance & Scalability**
* **Responsive Design**: Mobile-first, fully responsive interface
* **Accessibility**: WCAG 2.1 compliant design standards
* **CI/CD**: GitHub Actions with automated testing and deployment
* **Monitoring**: Sentry error tracking, Vercel logs, and Supabase observability

## **5. User Roles & Plan Tiers**

### **User Roles**
| Role | Description | Scope |
|------|-------------|-------|
| **Admin** | Full system access, impersonation, global oversight | System-wide |
| **Manager** | Team management, order oversight, vendor routing | Team-level |
| **User** | Core functionality: upload, order, design, proof review | Individual |
| **Client** | View-only access to assigned assets | Restricted |

### **Subscription Plans**
| Plan | Monthly Price | Users | Key Features |
|------|---------------|-------|--------------|
| **Free** | $0 | 1 | Limited features, basic functionality |
| **Pro** | $49 | 1 | All standard features, full access |
| **Team** | $99 | 3 | Shared access, collaboration, team management |
| **Enterprise** | $499 | 10 | Advanced reporting, webhook control, priority support |

**Add-ons**: $29/user for additional seats on Team or Enterprise plans

## **6. Success Metrics**

### **Core KPIs**
* **Design approval rate before payment**: >98%
* **Address validation success rate**: >95% deliverable after AccuZIP processing
* **Customer retention**: >50% reorder rate among returning customers
* **Support efficiency**: <5 support tickets per 100 orders
* **Operational reliability**: 90% on-time print and delivery rate

### **Advanced Metrics**
* **Proof review efficiency**: Minimal admin intervention required
* **Vendor performance**: Cost-effective routing and quality maintenance
* **User engagement**: AI help usage, short link engagement, and feature adoption
* **System reliability**: Webhook delivery success, scheduled report accuracy
* **Team collaboration**: Multi-user plan adoption and team feature utilization

## **7. Development Phases**

### **Phase 1: Foundation & MVP (Month 1-2)**
* User authentication, identity cards, MLM, design tool, basic order flow, payment integration

### **Phase 2: Feature Expansion (Month 3-4)**  
* Analytics dashboard, reorder functionality, response tagging, advanced MLM features

### **Phase 3: Internal Tools & Admin Panel (Month 5)**
* Admin dashboard, user management, impersonation, pricing controls, vendor management

### **Phase 4: Collaboration & Automation (Month 6-7)**
* Team features, campaign scheduling, subscription tiers, skip tracing system

### **Phase 5: Advanced Features (Month 8+)**
* AI personalization, contextual help, short link tracking, rollback system, feedback collection

### **Phase 6: Ecosystem Growth (Future)**
* Template marketplace, mobile app, advanced automation, external API access

## **8. Contact**

For questions related to this PRD, feature clarifications, or product strategy:

**Email:** support@yellowlettershop.com