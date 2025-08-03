# **Product Requirements Document (PRD) – Yellow Letter Shop (YLS)**

## **1\. Overview**

Yellow Letter Shop (YLS) is a comprehensive SaaS platform that enables users to create, personalize, and deliver direct mail campaigns with speed and precision. It targets real estate professionals, local businesses, agencies, and marketers who require efficient tools to generate and fulfill marketing mail at scale or on-demand. The platform includes dynamic mail piece design, mailing list management, address validation, automation options, real-time status tracking, and advanced analytics—all optimized for mobile use.

## **2\. Objectives**

* Provide a frictionless end-to-end direct mail workflow.

* Empower users to upload, validate, and manage mailing lists with complete control.

* Enable professional-grade mailer customization without requiring design skills.

* Ensure production accuracy with user-approved proofs and list integrity.

* Support single recipient mailing and high-volume batch campaigns.

* Offer performance tracking, history logging, and data segmentation tools.

## **3\. Target Users**

* Real estate agents, wholesalers and investors, construction companies, insurance agents, and mortgage companies.

* All other Small and medium-sized business owners

## **4\. Functional Requirements**

### **4.1 User Account and Identity Management**

* Supabase Auth with NextAuth.js

* Support for role-based access and permissioning

* Identity Cards (sender profiles) for contact info reuse

* Multi-brand account support

### **4.2 Mailing List Manager (MLM)**

* CSV upload with header mapping, validation, and preview

* Custom and system column mapping

* Column exclusion before import

* Bulk and single-record entry support

* Tagging system for segmentation

* Field-level change tracking and full record history

* Response tagging (converted, called, etc.)

* Filters and advanced search

* Record-level delivery history

* Deduplication, parsing, vacant filtering, skip tracing

* Export options with tag filters

### **4.3 Mailing List Purchase Module**

* Demographic-based list builder with count estimator

* Vendor-supplied integration with internal markup options

* Mapping and tag compatibility with designer

### **4.4 Mail Piece Designer**

* Fancy Product Designer (FPD) integration

* Template marketplace for categorized, ready-to-use designs (e.g., real estate, retail, holiday outreach)

* Ability to preview, favorite, and reuse templates

* Templates include compatible variable tags (e.g., {{FirstName}}, {{PropertyAddress}})

* Real-time canvas editor with variable tag fields (e.g., {{FirstName}})

* Templates for letters, postcards, envelopes

* Upload brand assets and photos

* Preview with sample data

* Save draft and reusable templates

### **4.5 Design Approval Flow**

* Required double-approval modal before checkout:

  * “By clicking Continue, you approve your design for printing. No changes can be made afterward.”

* No external proofing or human review step

### **4.6 Order Processing**

* Stripe integration

  * Payment authorization on checkout

  * Final capture after design approval

  * Release of funds if abandoned

* Order summary screen with per-unit pricing breakdown

* Optional mail tracking toggle

* Postage type selection:

  * First Class (Forever): no minimum

  * First Class (Discounted): 500-piece minimum

  * Standard Class: 200-piece minimum

* Enforcement of list-size-based eligibility

### **4.7 One-Off Mail Support**

* Shortcut flow for sending to one recipient

* Input recipient and message details

* Use same design interface and checkout flow

* Option to save contact to MLM automatically

### **4.8 Dashboard and Order History**

* Track campaign status (design, processing, shipped)

* Cancel/reorder campaign (if pre-print)

* View past campaigns and filter by tag/date/type

* Export CSV of campaign summary

### **4.9 Analytics & Reporting**

* Recharts-based dashboards

* Metrics: volume mailed, response rate (manual \+ tagged), delivery status

* List performance tracking (per-tag, per-segment)

* Filterable reports and export tools

### **4.10 Email & Notification System**

* Mailgun integration

* Transactional emails for:

  * Design confirmation

  * Mailing list upload complete

  * Order shipped

* Optional tracking alerts

## **5\. Non-Functional Requirements**

* Fully responsive mobile-first design

* Accessible (WCAG 2.1 compliant)

* GDPR-compliant data handling

* Secure asset storage on AWS S3

* CI/CD and automated tests (Jest, Cypress)

* Supabase RLS for data security

## **6\. Tech Stack**

* Next.js, React, TypeScript

* Tailwind CSS, shadcn/ui

* Supabase (Postgres, Auth, Storage)

* Stripe (payments)

* Mailgun (email)

* AWS (S3)

* Fancy Product Designer (JS integration)

* TanStack Table (MLM UI)

* Recharts (analytics)

## **7\. Success Metrics**

* 98% design approval before payment

* \<5% undeliverable rate post-validation

* 50% reorder rate among returning customers

* \<5 support tickets per 100 orders

* 90% on-time print and delivery rate

## **8\. Future Enhancements (Post-MVP)**

* AI-powered mail copy generation

* Multilingual UI support

* Team collaboration tools

* Campaign automation rules

* Mobile app

---

This PRD defines the detailed scope and expectations for Yellow Letter Shop v1.0, including all functional modules, integrations, and success metrics required to support a seamless direct mail campaign experience.

