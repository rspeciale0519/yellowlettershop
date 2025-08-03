# **Feature Specifications: Yellow Letter Shop (YLS) Admin Management Dashboard**

## **Introduction and Overview**

The Admin Management Dashboard for Yellow Letter Shop (YLS) is a critical component of the platform, providing administrative users with the tools necessary to oversee and manage various aspects of the system. This dashboard is designed for use by authorized personnel, including admins and super-admins, who are responsible for ensuring the smooth operation of YLS.

The primary purpose of the admin system is to enable efficient management of users, orders, campaigns, and other key elements of the platform. It provides a centralized interface where admins can perform tasks such as:

* Searching for and viewing user accounts  
* Managing orders and processing refunds  
* Moderating campaign content  
* Viewing activity logs and internal proofs  
* Controlling pricing and postage rules  
* Monitoring usage and enforcing subscription plans

By consolidating these functionalities into a single, user-friendly dashboard, the admin system streamlines administrative workflows and enhances the overall efficiency of the YLS platform.

## **Feature Breakdown**

### **User Account Lookup and Impersonation**

**Purpose:**  
This feature allows administrative users to locate and manage user accounts efficiently. It is essential for troubleshooting, providing customer support, and ensuring that users are adhering to platform policies.

**Functionality:**

* **Search and Filter:** Admins can search for users using various criteria such as email, name, or user ID. The search functionality includes filters to narrow down results based on specific attributes (e.g., subscription plan, account status).  
* **User Profile View:** Upon selecting a user, admins can view a detailed profile that includes:  
  * Basic information (email, name, user ID)  
  * Subscription plan and status  
  * Associated Identity Cards  
  * Recent campaigns and orders  
  * Account activity history  
* **Impersonation:** To assist users or investigate issues, admins can temporarily impersonate a user. This is achieved by generating a short-lived JWT token that grants the admin access to the user's account with the same permissions. Impersonation sessions are logged for security and auditing purposes.

**Technical Details:**

* **Frontend:** The user search and profile view are built using TanStack Table for efficient data display and shadcn/ui components for a consistent look and feel.  
* **Backend:** Supabase is used to query user data from the `profiles` table, with Row-Level Security (RLS) policies ensuring that only authorized admins can access this information.  
* **Security:** All impersonation actions are logged in the `activity_logs` table, and impersonation tokens are time-limited to minimize security risks.

### **Order History and Refund Controls**

**Purpose:**  
This feature provides admins with a comprehensive view of all orders placed on the platform, along with the ability to manage these orders, including processing refunds when necessary.

**Functionality:**

* **Order List:** A table displaying all orders with columns for order ID, user, campaign name, status (e.g., in queue, production, shipped), total cost, and available actions (view, refund).  
* **Order Details:** Clicking on an order opens a detailed view showing:  
  * Campaign details  
  * Associated mailing list  
  * Design proof  
  * Payment status and history  
* **Refund Processing:** Admins can initiate refunds directly from the order details page. This triggers a call to the Stripe API to process the refund, and the order status is updated accordingly.

**Technical Details:**

* **Frontend:** The order list is implemented using TanStack Table for performance with large datasets, and shadcn/ui components for modals and buttons.  
* **Backend:** Orders are stored in the `orders` table in Supabase, with RLS policies restricting access to admins. The refund functionality integrates with Stripe's API to handle payment reversals.  
* **Security:** Refund actions are validated to prevent duplicate refunds and are logged in the `activity_logs` table for auditing.

### **Campaign Moderation Interface**

**Purpose:**  
To ensure that all mail pieces meet the platform's content standards and are appropriate for distribution, this feature allows admins to review and approve or reject campaign designs before they are printed and mailed.

**Functionality:**

* **Moderation Queue:** A table listing all pending campaigns that require review, with columns for user, campaign name, design preview, and status (pending, approved, flagged).  
* **Design Review:** Admins can view the mail piece design rendered from the Fancy Product Designer (FPD) JSON data. This allows them to inspect the content for any inappropriate or non-compliant material.  
* **Approval/Rejection:** Admins can approve the campaign, allowing it to proceed to printing, or flag/reject it with a comment explaining the reason. Rejected campaigns trigger an email notification to the user via Mailgun.

**Technical Details:**

* **Frontend:** The moderation queue uses TanStack Table, and the design preview is rendered using the FPD JS API.  
* **Backend:** Campaigns are stored in the `campaigns` table, with their status updated upon moderation. Rejection notifications are sent via Mailgun's API.  
* **Security:** Access to the moderation interface is restricted to authorized admins, and all moderation actions are logged.

### **Mail Piece Activity Logs and Internal Proofs**

**Purpose:**  
This feature provides a detailed history of all actions related to a campaign, allowing admins to track its lifecycle from design to delivery. It also includes access to internal proof PDFs for quality assurance.

**Functionality:**

* **Activity Log:** A timeline view showing all actions taken on a campaign, such as design uploads, proof approvals, and mailing status updates.  
* **Proof Viewer:** Admins can view and download the final PDF proof of the mail piece, which is generated from the FPD design and stored in AWS S3.

**Technical Details:**

* **Frontend:** The activity log is displayed using a custom component built with shadcn/ui, and the proof viewer uses an embedded PDF viewer.  
* **Backend:** Activity logs are stored in the `activity_logs` table, and proof PDFs are stored in S3 with signed URLs for secure access.  
* **Security:** RLS policies ensure that only authorized admins can view logs and proofs.

### **Pricing Engine Controls**

**Purpose:**  
This feature allows super-admins to manage the pricing structure of the platform, including unit costs for mail pieces, postage rates, and fees for add-on services.

**Functionality:**

* **Pricing Table:** An editable table where admins can update pricing for different components, such as base mail piece cost, postage types (e.g., First Class, Standard), and add-ons (e.g., skip tracing, mail tracking).  
* **Validation Rules:** Admins can set minimum order quantities for certain postage types and define other pricing rules.  
* **Preview Calculator:** A tool that allows admins to see how changes to pricing would affect the cost of sample orders.

**Technical Details:**

* **Frontend:** The pricing table is built with TanStack Table, allowing inline editing, and the preview calculator uses React state to simulate order costs.  
* **Backend:** Pricing data is stored in the `pricing` table in Supabase, with updates handled via API routes. Pricing changes are cached for performance.  
* **Security:** Access to pricing controls is restricted to super-admins, and all changes are logged.

### **Usage Reporting and Subscription Plan Enforcement**

**Purpose:**  
To monitor platform usage and ensure that users are adhering to their subscription plan limits, this feature provides analytics and tools for managing user subscriptions.

**Functionality:**

* **Usage Dashboard:** Visualizations (using Recharts) showing key metrics such as the number of campaigns created, mailing lists uploaded, and other usage statistics.  
* **Subscription Management:** Admins can view and manually adjust a user's subscription plan or usage limits if necessary.

**Technical Details:**

* **Frontend:** Recharts is used for creating interactive charts, and shadcn/ui components are used for the subscription management interface.  
* **Backend:** Usage data is aggregated from the `usage_metrics` table, and subscription information is synced with Stripe.  
* **Security:** RLS policies protect usage data, and subscription changes are audited.

## **User Interface (UI) Design**

The admin dashboard is designed with a clean, modern interface that prioritizes ease of use and efficiency. It features a sidebar navigation menu that provides quick access to all major sections:

* **Users:** Manage user accounts and impersonate users.  
* **Orders:** View and manage orders, including processing refunds.  
* **Campaigns:** Moderate pending campaigns and review designs.  
* **Activity Logs:** View detailed logs of platform activities.  
* **Pricing:** Control pricing and postage rules.  
* **Usage:** Monitor usage and manage subscription plans.

Each section is built using consistent UI components from shadcn/ui, ensuring a uniform look and feel across the dashboard. The design is fully responsive, adapting to different screen sizes and devices, with particular attention to mobile usability.

**Navigation and Layout:**

* The sidebar is collapsible on smaller screens to maximize space.  
* Each section opens in the main content area, with breadcrumbs or a title indicating the current page.  
* Tables and lists are implemented with TanStack Table for performance and flexibility, supporting features like sorting, filtering, and pagination.

**UI Components:**

* **Search Bars:** Used in sections like Users and Orders for quick data retrieval.  
* **Modals:** For actions like impersonation confirmation or viewing detailed order information.  
* **Forms:** For editing pricing or managing subscriptions, built with React Hook Form and Zod for validation.  
* **Charts:** In the Usage section, using Recharts for data visualization.

The UI design emphasizes accessibility, adhering to WCAG 2.1 standards, with features like keyboard navigation and screen reader support.

## **Backend Architecture**

The backend of the admin system is built on Supabase, leveraging its PostgreSQL database, authentication, and Row-Level Security (RLS) features. The architecture is designed to be secure, scalable, and easy to maintain.

**Database Schema:**  
The following tables are central to the admin system's functionality:

* **profiles:** Stores user profile information, linked to Supabase's `auth.users`.  
* **orders:** Tracks order details, including status and payment information.  
* **campaigns:** Stores campaign metadata and design data.  
* **activity\_logs:** Records all significant actions for auditing.  
* **pricing:** Holds pricing rules and rates.  
* **usage\_metrics:** Aggregates usage data for reporting.

Each table has RLS policies enforced to ensure that only authorized admins can access or modify the data.

**API Routes:**  
The admin system uses Next.js API routes to handle backend logic, including:

* `GET /api/admin/users`: Retrieves a list of users with filtering options.  
* `POST /api/admin/impersonate`: Generates a temporary JWT for user impersonation.  
* `GET /api/admin/orders`: Fetches order history with pagination.  
* `POST /api/admin/orders/refund`: Processes a refund via Stripe.  
* `PATCH /api/admin/campaigns/moderate`: Updates campaign status (approve/reject).  
* `GET /api/admin/logs`: Retrieves activity logs.  
* `PATCH /api/admin/pricing`: Updates pricing rules.

All API routes are protected by admin-only authentication and RLS.

**Integrations:**

* **Stripe:** For payment processing and refund management.  
* **Mailgun:** For sending notifications, such as campaign rejection emails.  
* **Fancy Product Designer (FPD):** For rendering campaign designs in the moderation interface.  
* **AWS S3:** For storing and serving proof PDFs securely.

## **Security and Compliance**

Security is a top priority for the admin system, given the sensitive nature of the data it handles. The following measures are in place:

* **Role-Based Access Control (RBAC):** Access to the admin dashboard and its features is restricted based on user roles (admin, super-admin).  
* **Row-Level Security (RLS):** Supabase RLS policies ensure that admins can only access data they are authorized to view or modify.  
* **Audit Logging:** All significant actions, such as impersonation, refunds, and pricing changes, are logged in the `activity_logs` table for auditing and compliance.  
* **GDPR Compliance:** The system includes features for data retention, anonymization, and user consent management to comply with GDPR requirements.  
* **Secure Integrations:** All third-party integrations (e.g., Stripe, Mailgun) use secure API keys and are configured to minimize data exposure.

Additionally, the admin system undergoes regular security audits and penetration testing to identify and address potential vulnerabilities.

## **Implementation Plan**

To build the admin system, follow these steps:

1. **Database Setup:**

   * Create the necessary tables in Supabase using the provided schema.  
   * Configure RLS policies to secure data access.  
2. **API Development:**

   * Implement Next.js API routes for each admin feature, ensuring they are protected by authentication and RLS.  
3. **UI Development:**

   * Build the dashboard layout and navigation using Tailwind CSS and shadcn/ui components.  
   * Develop individual pages for each feature, integrating with the API routes.  
4. **Integrations:**

   * Set up Stripe for payment and refund processing.  
   * Configure Mailgun for email notifications.  
   * Integrate FPD for design rendering.  
   * Use AWS S3 for storing proof PDFs.  
5. **Testing:**

   * Write unit tests for API routes using Jest.  
   * Perform end-to-end testing with Cypress to ensure UI functionality.  
   * Conduct security testing to verify RLS and access controls.  
6. **Deployment:**

   * Deploy the application to Vercel, ensuring that environment variables are correctly configured for production.

By following this plan, developers can ensure that the admin system is built to specification and ready for use.

