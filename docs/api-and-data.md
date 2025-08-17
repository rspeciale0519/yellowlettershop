# **API & Data Documentation — Yellow Letter Shop (YLS)**

*Last Updated: April 2025*

This document provides comprehensive reference for the Yellow Letter Shop (YLS) platform's internal REST API endpoints, database architecture, and third-party integrations. It includes endpoint specifications, data models, authentication requirements, and detailed integration guides for external services.

## **1. Internal API Reference**

The YLS platform uses a RESTful API architecture built with Next.js API routes. All endpoints require authentication via Supabase JWT tokens unless otherwise specified.

### **1.1 Authentication**

#### **Session Management**
- **GET** `/api/auth/session` - Returns current session details or metadata
- **POST** `/api/auth/signout` - Clears active session cookie/token and logs out user

**Authentication Requirements:**
- All endpoints require valid JWT session token
- Admin routes require `user.role = admin`
- Team-scoped resources require appropriate team membership
- Row-Level Security (RLS) enforced at database level

### **1.2 Mailing List API**

#### **List Management**
- **POST** `/api/mailing-lists/upload` - Uploads new mailing list file
  - **Body**: `FormData` (file, `dedupe: boolean`)
  - **Accepts**: CSV/XLSX with deduplication toggle
  - **Returns**: Record count, preview rows, column mapping

- **POST** `/api/mailing-lists/:id/deduplicate` - Deduplicates records in specific list
  - **Body**: `{ fields: string[] }`
  - **Returns**: Duplicate count and cleaned record set

- **GET** `/api/mailing-lists/:id/records` - Fetches records from given list
  - **Returns**: Paginated mailing list records with metadata

- **DELETE** `/api/mailing-lists/:id` - Soft-deletes a mailing list
  - **Returns**: Deletion confirmation and archive status

### **1.3 Address Validation API**

- **POST** `/api/address-validation/validate` - Validates uploaded addresses using AccuZIP
  - **Body**: `{ records: object[], dedupe: boolean }`
  - **Returns**: Valid, invalid, and corrected records with deliverability scores

### **1.4 Contact Cards API**

- **GET** `/api/contact-cards` - Returns all contact cards for current user
- **POST** `/api/contact-cards` - Creates new contact card
  - **Body**: `{ first_name, last_name, address, unit, city, state, zip, email, company_name, phone }`
  - **Returns**: Created contact card with validation status

- **PUT** `/api/contact-cards/:id` - Updates existing contact card
- **DELETE** `/api/contact-cards/:id` - Deletes existing contact card
- **GET** `/api/contact-cards/limits` - Returns maximum allowed cards based on user's plan and team size

### **1.5 Skip Tracing API**

- **POST** `/api/skip-tracing/orders` - Creates skip tracing order with selected records
  - **Body**: `{ record_ids: UUID[], mailing_list_id: UUID }`
  - **Returns**: `{ order_id, estimated_price }`

- **POST** `/api/skip-tracing/checkout` - Triggers Stripe checkout session for skip trace order
  - **Body**: `{ order_id: UUID }`
  - **Returns**: Stripe session URL and payment details

- **POST** `/api/skip-tracing/webhook` - Inbound webhook for receiving skip traced CSV files
  - **Function**: Matches incoming email by order ID, parses CSV, imports enriched data, marks order complete
  - **Returns**: Processing status and import summary

- **GET** `/api/skip-tracing/orders` - Returns list of skip tracing orders for current user
- **GET** `/api/skip-tracing/orders/:id` - Returns details of specific skip tracing order

### **1.6 Template & Design API**

- **GET** `/api/templates` - Returns available public and private templates
- **GET** `/api/templates/:id` - Returns single template and its configuration
- **GET** `/api/templates/:id/config` - Returns FPD configuration JSON for design loading
- **POST** `/api/designs/save` - Saves user's customized template design
  - **Body**: `{ template_id, design_data, contact_card_id }`
  - **Returns**: Saved design ID and preview URL

- **POST** `/api/designs/:id/preview` - Generates preview with mapped personalization and contact card
  - **Body**: `{ contact_card_id, sample_record }`
  - **Returns**: Rendered preview URL

### **1.7 Orders API**

#### **Order Creation**
- **POST** `/api/orders` - Creates new print order
  - **Body**: `{ mailing_list_id, contact_card_id, template_id, mailing_option, campaign_option_config, total_price }`
  - **Returns**: Order ID and initial status
  - **Note**: Sets status to `awaiting_admin_review` for routing decision

#### **Order Management**
- **GET** `/api/orders` - Returns user's recent orders with pagination
- **GET** `/api/orders/:id` - Returns specific order with full metadata and preview URL
- **POST** `/api/orders/:id/cancel` - Cancels pending order and voids Stripe payment hold

#### **Admin Order Management**
- **POST** `/api/admin/orders/:id/fulfillment` - Admin endpoint to set vendor manually
  - **Body**: `{ method: 'in_house' | 'third_party', vendor_id?: string }`
  - **Returns**: Fulfillment assignment confirmation

- **POST** `/api/admin/orders/auto-route` - Applies default fulfillment logic if timeout expires
  - **Function**: System action for time-based routing fallback
  - **Returns**: Routing decision and vendor assignment

### **1.8 Payment API**

#### **Payment Processing**
- **POST** `/api/payments/checkout` - Initializes payment intent with Stripe
  - **Body**: `{ amount, save_card?: boolean, use_saved_method_id?: string }`
  - **Returns**: Stripe checkout session and payment intent ID

- **POST** `/api/payments/capture` - Captures payment intent after approval
  - **Body**: `{ payment_intent_id }`
  - **Returns**: Capture confirmation and updated order status

- **POST** `/api/payments/cancel` - Cancels/voids uncaptured payment
  - **Body**: `{ payment_intent_id }`
  - **Returns**: Cancellation confirmation

- **POST** `/api/payments/webhook` - Stripe webhook handler for payment events
  - **Events**: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.failed`, `payment_intent.canceled`

### **1.9 Stored Payment Methods API**

- **GET** `/api/payment-methods` - Returns stored methods for account
- **POST** `/api/payment-methods` - Attaches new payment method to user
- **POST** `/api/payment-methods/:id/default` - Sets default card
  - **Body**: `{ payment_method_id }`
- **DELETE** `/api/payment-methods/:id` - Deletes stored payment method

### **1.10 Proof Review & Annotation API**

#### **Proof Management**
- **GET** `/api/orders/:id/proofs` - Fetches proof PDF files for order or returns all revisions
- **GET** `/api/orders/:id/annotations` - Returns all annotations and comment threads for order proof

#### **Annotation System**
- **POST** `/api/annotations` - Creates new proof annotation
  - **Body**: `{ page, x, y, text }`
  - **Returns**: Annotation ID and coordinates

- **POST** `/api/annotations/:id/replies` - Adds reply to existing annotation
  - **Body**: `{ text: string }`
  - **Returns**: Reply ID and thread update

- **POST** `/api/annotations/:id/resolve` - Marks comment thread as resolved

#### **Proof Approval**
- **POST** `/api/orders/:id/approve` - Customer approves proof and triggers Stripe capture
  - **Returns**: Approval confirmation and payment status

- **POST** `/api/orders/:id/request-changes` - Customer submits requested changes
  - **Body**: `{ message: string }`
  - **Function**: Sends email to vendor with details, sets status to `awaiting_revision`

### **1.11 Vendor Management API**

- **GET** `/api/vendors` - Returns list of all registered vendors (supports filtering by `vendor_type`)
- **POST** `/api/vendors` - Creates new vendor record
  - **Body**: `{ name, contact_name, email, phone, vendor_type, services_offered, turnaround, payment_terms }`

- **GET** `/api/vendors/:id` - Returns detailed vendor information
- **PUT** `/api/vendors/:id` - Updates vendor record
- **POST** `/api/vendors/:id/pricing` - Adds new pricing entry for vendor
  - **Body**: `{ product_type, price_per_unit, volume_tier, effective_date }`

- **GET** `/api/vendors/:id/pricing` - Returns all pricing tiers for vendor

### **1.12 Analytics & Reports API**

#### **Dashboard Data**
- **GET** `/api/analytics/user-dashboard` - Returns visual KPI data for user dashboard (scoped by `auth.uid`)
- **GET** `/api/analytics/admin-dashboard` - Returns platform-wide KPIs, revenue, vendors, feedback, link heatmaps (admin-only)

#### **Report Generation**
- **POST** `/api/reports/generate` - Generates report immediately or ad hoc
  - **Body**: `{ report_type, filters, format }`
  - **Returns**: Report file URL or email confirmation

- **POST** `/api/reports/schedule` - Schedules recurring report
  - **Body**: `{ report_type, filters, format, recurrence }`
  - **Returns**: Scheduled report ID and next run time

- **GET** `/api/reports/scheduled` - Returns list of scheduled reports for current user
- **PUT** `/api/reports/scheduled/:id` - Modifies scheduled report or edits recurrence
- **DELETE** `/api/reports/scheduled/:id` - Deletes scheduled report or cancels future export

### **1.13 Feedback API**

- **POST** `/api/feedback` - Submits NPS rating and comments
  - **Body**: `{ score, comment, source }`
  - **Returns**: Feedback ID and submission confirmation

- **GET** `/api/admin/feedback` - Returns aggregate NPS data (admin only)
  - **Returns**: NPS trends, score distribution, and comment analysis

### **1.14 Webhooks API**

- **POST** `/api/webhooks/register` - Registers webhook endpoint for event type
- **GET** `/api/webhooks` - Returns all webhooks registered to user
- **DELETE** `/api/webhooks/:id` - Removes webhook endpoint
- **GET** `/api/webhooks/logs` - Returns event log delivery attempts
- **POST** `/api/webhooks/:id/retry` - Retries failed webhooks

### **1.15 Admin Routes**

- **POST** `/api/admin/impersonate` - Initiates impersonation session
- **GET** `/api/admin/users` - Returns all users with filtering and search
- **POST** `/api/admin/templates/approve` - Approves submitted marketplace template
- **POST** `/api/admin/feature-flags` - Toggles platform-level feature flags
- **GET** `/api/admin/orders/:id/logs` - Returns full communication and action log for order

## **2. Database Architecture**

The YLS platform uses Supabase PostgreSQL with strict Row-Level Security (RLS) policies. All tables implement multi-tenant isolation via `auth.uid()` or `team_id` scoping.

### **2.1 Core Data Models**

#### **User Identity & Profiles**
- **`user_profiles`** - Extended user information beyond Supabase Auth
  - Key fields: `email`, `full_name`, `role`, `plan_tier`, `stripe_customer_id`
  - RLS: Scoped by `auth.uid()`

#### **Team Collaboration**
- **`team_members`** - Team membership and collaboration
  - Key fields: `team_id`, `user_id`, `invited_by`, `status`
  - RLS: Team-scoped access control

#### **Mailing Lists & Records**
- **`mailing_lists`** - Container for uploaded mailing data
  - Key fields: `user_id`, `name`, `description`, `is_archived`
  - RLS: User-scoped with team sharing

- **`mailing_list_records`** - Individual mailing records with flexible JSONB data
  - Key fields: `mailing_list_id`, `data` (JSONB), `validation_status`, `skip_trace_status`
  - Includes: `enriched_data` (JSONB), `short_link_code`, tracking metadata

#### **Contact Cards**
- **`contact_cards`** - Sender information for campaigns
  - Key fields: `user_id`, contact details, plan-based limits enforcement
  - RLS: User-scoped with plan validation

#### **Orders & Campaign Management**
- **`orders`** - Print and mailing orders with complete lifecycle tracking
  - Key fields: `user_id`, `mailing_list_id`, `design_template_id`, `contact_card_id`
  - Includes: `mailing_option` (JSONB), `campaign_options` (JSONB), `payment_intent_id`

#### **Proof Management**
- **`proof_files`** - PDF proofs with revision tracking
- **`annotations`** - Proof annotations with coordinate mapping
- **`annotation_comments`** - Threaded comment system for collaborative review

#### **Vendor Management**
- **`vendors`** - Multi-type vendor directory with performance tracking
  - Key fields: `name`, `vendor_type`, `services_offered`, `quality_rating`
- **`vendor_prices`** - Tiered pricing structure per vendor and service

#### **Analytics & Tracking**
- **`short_links`** - Recipient-level engagement tracking
- **`webhook_logs`** - Event delivery tracking with retry capability
- **`feedback`** - NPS scores and user comments
- **`scheduled_reports`** - Recurring report management

#### **Audit & Change Management**
- **`audit_logs`** - System-wide action tracking
- **`record_change_logs`** - Field-level change history for rollback capability
- **`impersonation_sessions`** - Admin impersonation tracking

### **2.2 Security & Access Control**

#### **Row-Level Security (RLS)**
- All major tables enforce RLS via `auth.uid()` matching
- Team data scoped by `team_id` for collaborative access
- Admin overrides available via `service_role` context (server-only)

#### **Data Validation**
- All POST/PUT/DELETE routes require Zod schema validation
- Input sanitization and type safety enforced
- Business logic validation at API layer

## **3. Third-Party API Integration**

The YLS platform integrates with multiple third-party services for address validation, mail processing, and fulfillment. Each third-party API has its own dedicated documentation file for detailed implementation guidance.

### **3.1 AccuZIP Address Validation API**

**Purpose**: CASS-certified address validation, deduplication, and mail processing services

**Integration Points**:
- Address validation during mailing list upload
- Deduplication and data quality scoring
- Presort and postal discount calculation
- USPS documentation generation

**Key Features**:
- 100% cloud-based Data Quality (DQ) and Mail Processing
- CASS Certification for address standardization
- NCOALink integration for change of address data
- Duplicate detection with multiple matching algorithms
- Postal presorting and barcode generation

**Documentation**: See `api-accuzip.md` for complete endpoint specifications, authentication requirements, request/response formats, and integration workflows.

**Contact Information**:
- **AccuZIP Technical Support**: steve@accuzip.com
- **YLS Integration Support**: support@yellowlettershop.com

### **3.2 Redstone Mail Fulfillment API**

**Purpose**: Automated direct mail order processing and print fulfillment

**Integration Points**:
- Print order submission and tracking
- File upload for mailing data and artwork
- Production status monitoring
- Quality control and delivery confirmation

**Key Features**:
- REST API for order automation
- Support for multiple mail piece types (letters, postcards, self-mailers)
- Flexible printing options (color configurations, custom envelopes)
- Integrated mailing services with various postage options
- Real-time status updates throughout production

**Documentation**: See `api-redstone.md` for complete API specifications, required fields, job type configurations, and integration examples.

**Contact Information**:
- **Redstone Mail Support**: Contact via their standard support channels
- **YLS Integration Support**: support@yellowlettershop.com

### **3.3 Adding New Third-Party APIs**

When integrating additional third-party services:

1. **Create dedicated API documentation** following the pattern of `api-{servicename}.md`
2. **Add reference entry** in this section with purpose, integration points, and key features
3. **Update integration workflows** in section 4 if applicable
4. **Include contact information** for both the third-party provider and YLS support

**Current Third-Party API Files**:
- `api-accuzip.md` - AccuZIP address validation and mail processing
- `api-redstone.md` - Redstone Mail print fulfillment services

## **4. Integration Guidelines**

### **4.1 AccuZIP Integration Workflow**
1. **Upload mailing list** via AccuZIP upload endpoint
2. **Get quote** to verify processing status
3. **Run CASS certification** for address validation
4. **Optional**: Run NCOALink for change of address data
5. **Optional**: Run duplicate detection
6. **Download results** in desired format (CSV, PDF, etc.)

### **4.2 Redstone Integration Workflow**
1. **Prepare job data** with all required fields
2. **Submit order** via POST to production endpoint
3. **Monitor status** through webhook notifications
4. **Handle file uploads** for data, suppression, and artwork
5. **Track completion** through status update system

### **4.3 Error Handling Best Practices**
- **Implement retry logic** for network failures
- **Validate responses** before processing
- **Log all API interactions** for debugging
- **Handle rate limiting** appropriately
- **Store webhook payloads** for audit trails

## **5. Development Support**

### **5.1 YLS Platform Support**
For schema details, query examples, SDK bindings, endpoint access, webhook integration, API onboarding, or troubleshooting:

**Email:** support@yellowlettershop.com

### **5.2 Third-Party Support**
- **AccuZIP Technical Support**: steve@accuzip.com
- **Redstone Mail Support**: Contact through their standard support channels

### **5.3 Integration Testing**
- **Sandbox environments** available for both AccuZIP and Redstone
- **Test API keys** provided for development
- **Mock data sets** available for integration testing
- **Webhook testing tools** for event simulation