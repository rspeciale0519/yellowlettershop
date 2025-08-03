# **Yellow Letter Shop Web Application – Full Feature Specification**

## **Overview**

The Yellow Letter Shop (YLS) is a direct mail SaaS platform designed to streamline the entire lifecycle of a direct mail campaign—from design and list management to printing, delivery, and analytics. Built for real estate professionals, marketers, and small business owners, YLS enables users to easily create personalized mailers, manage contact lists, purchase or upload mailing data, and automate delivery workflows. The platform emphasizes user-friendliness, mobile optimization, automation, and professional-grade customization tools.

## **Core Modules and Features**

---

### **1\. Homepage Navigation Choices**

* **Got Your Design Ready?**: Directs users who already know what they want to a fast upload or editing experience.

* **Need Some Inspiration?**: Directs users to a gallery of templates where they can browse and customize designs.

---

### **2\. User Identity Cards (Contact Profiles)**

* Users can pre-save their return addresses, phone numbers, and company information.

* Enables 1-click selection of sender identity during design or checkout.

* Great for users managing multiple brands or clients.

---

### **3\. Pre-Design Form Intake**

* Captures essential information up front:

  * Return address

  * Company name

  * Phone number

  * Email

* Ensures all tags are available for dynamic insertion during the design phase.

---

### **4\. Mailing List Options**

* **Upload Your List**:

  * Drag-and-drop CSV uploader

  * Column mapping to standard fields

  * Custom field support

  * Optional: column exclusion before import

* **Purchase a List**:

  * Built-in form for demographic filters

  * Real-time quote and lead count estimation

  * Direct integration with third-party list providers

* **No Mailing List Yet?**:

  * Proceed with design and choose shipping-only delivery

---

### **5\. Mailing List Manager (MLM)**

* Manage unlimited mailing lists

* Features:

  * Track version history for any changes made to mailing list records, including when and what data was modified. Supports per-field change tracking.

  * View mail history per contact (including record-specific delivery and activity history)

  * Column mapping

  * Field exclusion

  * Tagging system

  * Manual and bulk record entry

  * Segmentation, filters, and search

  * Record version history

  * Delivery history per record

  * Add new records directly from MLM

  * CRM-style response tagging (called, converted, opted out)

  * List parsing tools with optional fees

  * Deduplication and vacant property filtering

  * Analytics (open, call, response tracking)

---

### **6\. Mail Piece Design Tool**

* Powered by Fancy Product Designer (FPD)

* Features:

  * Drag-and-drop WYSIWYG editor

  * Image uploads and backgrounds

  * Font, color, and layout control

  * Variable tag fields (e.g. {{FirstName}}, {{PropertyAddress}})

  * Auto-fill preview mode using sample mailing list data

  * Save drafts and reuse old designs

---

### **7\. Envelope and Postcard Design Integration**

* Allows separate or combined design flows

* Includes automatic tag field merging (e.g. {{ReturnAddress}})

---

### **8\. One-Off Mail Feature**

* For users mailing to a single recipient

* Simple form: Name, Address, Mail Piece, Message

* Option to save recipient to MLM automatically

---

### **9\. Order Processing Workflow**

1. Upload or purchase mailing list

2. Validate and deduplicate records

3. Choose mail piece and design

4. Choose postage type (First Class, Standard, etc.)

5. Approve proof (manual or instant preview)

6. Confirm order and capture payment

---

### **10\. Postage Type Selector**

* Based on quantity:

  * First Class (Forever): no minimums

  * First Class (Discounted): 500-piece minimum

  * Standard Class: 200-piece minimum

* Dynamic Postage Type Filtering: The system automatically shows only the postage types that meet the postage type required minimums based on the validated mailing list's final count. For example, if the list contains fewer than 200 deliverable records after validation, only postage options with no minimums will be available. Or, if the list contains fewer than 500 deliverable records after validation, only postage options with minimums of less than 500 records will be available. This ensures customers cannot select postage types that require more pieces than they have eligible.

---

### **11\. Add-On Services**

* Available during list processing:

  * Address parsing and formatting

  * Skip tracing

  * Mail tracking service (near checkout)

* Each with separate pricing and user opt-in

---

### **12\. Order Approval and Payment**

* Users must confirm their final design by clicking a 'Checkout' button. A modal then prompts them to approve their design, stating that no further changes can be made after approval. This ensures the design is final before continuing to payment.

* Funds are authorized at checkout and immediately captured after the user has approved their design.

* If the user abandons the flow before design approval, no funds are captured.

---

### **13\. User Dashboard**

* Campaign status tracking (in queue, production, mailed/shipped)

* Reorder previous campaigns

* Edit before reordering

---

### **14\. Notifications and Email Updates**

* Triggered by:

  * Upload complete

  * Proof ready

  * Order shipped

* Powered by Mailgun

---

### **15\. Account & Team Management**

* Role-based permissions

* Team access to shared mailing lists and designs

* Plan-based feature gating (Free, Pro, Team, Enterprise)

---

### **16\. Analytics and CRM Integration**

* Track response metrics (manual or integrated)

* Tag responses (called, converted, etc.)

* Export analytics reports

---

### **17\. Reusability & Campaign Drafts**

* Save campaigns as templates

* Clone previous orders with or without edits

* Load draft campaigns for future completion

---

### **18\. Mobile Optimization**

* Fully responsive for phone and tablet use

* Large tap areas for buttons

* Simplified upload and preview for small screens

---

### **19\. Security and Compliance**

* Supabase Row-Level Security (RLS)

* GDPR-compliant storage and privacy notices

* Secure Stripe checkout

* S3-based file storage with restricted access

---

### **20\. Infrastructure and Integrations**

* Tech Stack:

  * Next.js, React, TypeScript

  * Tailwind CSS, Supabase, AWS

  * **TanStack Table (React Table)** for customizable, performant mailing list tables

  * **shadcn/ui** for Tailwind-compatible UI components across the app

  * **Recharts** for analytics dashboards and campaign performance visualizations

* Integrations:

  * Stripe

  * AccuZIP

  * Mailgun

  * Fancy Product Designer

  * REST APIs and Webhooks

---

### **Resources**

#### **Fancy Product Designer (FPD) API**

* [FPD JS API Guide – Methods & Events](https://support.fancyproductdesigner.com/support/solutions/articles/13000074839-using-api-methods-and-events)

* [FPD REST API Documentation](https://apidoc.fancyproductdesigner.com/)

#### **AccuZIP API**

* [Direct Mail RESTful API Overview](https://www.accuzip.com/products/restful-api-for-data-cleansing-and-direct-mail/)

* [AccuZIP API Technical PDF Reference](https://www.accuzip.com/files/pdf/direct_mail_api.pdf)

* [CASS Address Validation API](https://www.accuzip.com/products/restful-api-for-data-cleansing-and-direct-mail/cass-address-validation-api/)

* [AccuTrace Mail Tracking API](https://www.accuzip.com/products/restful-api-for-data-cleansing-and-direct-mail/accutrace-api/)

* [AccuZIP CASS Developers Toolkit](https://www.accuzip.com/support/tech-notes/accuzip-cass-developers-toolkit/)

#### **Stripe API**

* [Stripe API Reference](https://docs.stripe.com/api)

* [Stripe JavaScript & Elements (Stripe.js)](https://docs.stripe.com/js)

* [Stripe Developer Hub & CLI](https://stripe.dev/)

#### **Mailgun API**

* [Mailgun HTTP API Reference](https://documentation.mailgun.com/docs/mailgun/api-reference)

* [Mailgun REST API Introduction](https://documentation.mailgun.com/docs/mailgun/api-reference/intro)

