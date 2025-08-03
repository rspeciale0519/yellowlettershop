# **Product Requirements Document (PRD) – Yellow Letter Shop (YLS)**

## **Overview**

Yellow Letter Shop (YLS) is a web-based direct mail automation platform that allows users to create, customize, and send personalized marketing mailers. The platform serves real estate investors, small businesses, and agencies looking to streamline mailing list management, design mail pieces, and execute high-volume or one-off print campaigns. YLS supports uploading and purchasing mailing lists, real-time design approval, integrated data processing tools, and robust analytics.

## **Goals**

* Eliminate friction in the direct mail ordering process.

* Provide an intuitive design-to-delivery pipeline.

* Support real-time customization and automation for both novice and experienced marketers.

* Ensure data accuracy and personalization through list validation and tagging.

## **Core Features**

### **1\. User Flow Options**

* Guided homepage with two main paths: “Got your design ready?” or “Need some inspiration?”

* One-off mail flow for sending to a single recipient.

### **2\. Design & Approval Workflow**

* Real-time drag-and-drop designer powered by Fancy Product Designer.

* Mandatory double-confirmation of final design before proceeding to checkout.

* Tag-based dynamic text insertion using uploaded or purchased data.

### **3\. Mailing List Manager (MLM)**

* Upload, parse, map, tag, and segment records.

* Per-field version history tracking.

* Track delivery and engagement history per contact.

* Optional services: deduplication, vacant filtering, skip tracing, parsing.

### **4\. Postage and Delivery Options**

* Postage types:

  * First Class (Forever): no minimums

  * First Class (Discounted): 500-piece minimum

  * Standard Class: 200-piece minimum

* Postage selection restricted by list size.

### **5\. Order and Payment System**

* Stripe integration with authorization at checkout.

* Funds only captured after design approval.

* Reorder capability with option to edit.

### **6\. Dashboard and Analytics**

* View and track campaign status.

* Analytics on mail delivery and response (manual tagging supported).

* Exportable campaign reports.

### **7\. Account Management**

* Identity cards for quick sender info setup.

* Role-based access and team collaboration.

## **Tech Stack**

* **Frontend**: Next.js, React, TypeScript, Tailwind CSS

* **Backend**: Supabase (DB \+ Auth \+ Storage), AWS (S3), Stripe, Mailgun

* **Component Libraries**: TanStack Table, shadcn/ui, Recharts

* **Integrations**: Fancy Product Designer, AccuZIP API, Stripe API, Mailgun API

## **Success Metrics**

* User approval rate of final designs before checkout \> 98%

* List validation success rate \> 95%

* Return customer reorder rate \> 50%

* Support ticket volume per 100 orders \< 5

---

This PRD serves as the functional blueprint for development and QA implementation of YLS 1.0.

