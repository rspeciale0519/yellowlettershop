# Analytics & Reporting Module Specification

*Last Updated: April 2025*

This document defines the UI/UX flows, data outputs, submodules, roles, and functional specifications for the Analytics & Reporting Module in the Yellow Letter Shop (YLS) platform. It integrates with all core systems including mailing lists, orders, templates, skip tracing, vendors, AI personalization, short links, proof workflows, team collaboration, feedback collection, webhooks, and rollback tracking.

---

## 1. Overview

The Analytics & Reporting Module provides:
- User and admin KPI dashboards
- Custom report builder interface
- Export engine (CSV, PDF, Excel)
- Scheduled recurring reports
- Short link and engagement insights
- Feedback and NPS analytics
- Webhook delivery logs
- Team usage and audit statistics

Data visualizations and reports are powered by Supabase views and API joins. Reports reflect user-specific access control and are scoped via Supabase RLS.

---

## 2. Entry Points

### User View (Authenticated)
- `/dashboard`
- Dashboard loads on login (user-scoped)

### Admin View (Admin Only)
- `/admin/dashboard`
- Accessible only if `user_profiles.role = admin`

### Reports Center
- `/reports`
- Shared for all roles with permission-filtered views

---

## 3. User Dashboard

### KPI Tiles
- Total Orders
- Total Spend
- Pieces Mailed
- Active Campaigns
- Proofs Approved
- AI Content Generated
- Feedback Submitted (NPS avg.)

### Visuals
- Bar Chart: Monthly Spend
- Line Chart: Order Volume
- Pie Chart: Mailing Type (full, process-only, print-only)
- Table: Recent Orders (status, design locked, vendor, quantity)
- Short Link Feed: Code, Visit Count, Timestamp

---

## 4. Admin Dashboard

### KPI Tiles
- Total Revenue
- Active Users
- Monthly Recurring Revenue (MRR)
- Vendor Reliability %
- Avg. Skip Trace Turnaround
- Feedback NPS Average
- Total Webhook Events (Success vs Failed)

### Visuals
- Time Series Chart: Revenue Trend
- Pie Chart: Plan Distribution
- Table: Webhook Failures (URL, Status Code, Last Attempt)
- Leaderboard: Top Teams by Spend
- Heatmap: Short Link Engagement (Geo/Time)
- Line Chart: Feedback Trends Over Time

---

## 5. Report Builder Workflow

### Step 1: Choose Report Type

#### For Users:
- Order Summary Report
- Campaign Performance Report
- Skip Trace Report
- AI Usage Report
- Short Link Engagement Report
- Feedback Report (NPS & comments)

#### For Admins (in addition):
- Platform Revenue Report
- Vendor Metrics Report
- Team/Org Usage Report
- Webhook Event Logs Report
- Fulfillment Routing Activity

### Step 2: Filter Criteria
- Timeframe (preset or custom)
- Campaign Name
- Vendor Name
- Template ID
- Order Status
- Report Creator
- Team ID (admin only)
- Webhook Event Type or Status (admin only)

### Step 3: Output Format
- CSV
- PDF
- Excel

### Step 4: Delivery Method
- Download Now
- Email (one-time)
- Schedule Recurring:
  - Daily
  - Weekly
  - Monthly
  - Custom day/time

---

## 6. Saved Reports

- Report templates can be saved for future use
- Include:
  - Report type
  - All filter criteria
  - Output format
  - Scheduling options (if enabled)
- Users may:
  - Load, edit, rename, delete, duplicate
- Admins can mark saved reports as "Global Admin Reports"

---

## 7. Scheduled Reports

- Path: `/reports/scheduled`
- List of user’s scheduled exports
- Fields:
  - Name
  - Frequency (daily, weekly, etc.)
  - Last Run Date
  - Next Run Date
  - Format
  - Status (Active, Paused)
- Actions:
  - Edit schedule
  - Cancel
  - View logs
  - Download last run

---

## 8. Feedback Analytics

- Aggregated average NPS score
- Trend line: NPS by week
- Pie chart: Score distribution
- Comment table with tags (auto-detected themes coming soon)
- Filters:
  - Report context (order, report)
  - Score threshold
  - Date range

---

## 9. Webhook Reporting

- Table: All user or admin webhooks
- Fields:
  - Endpoint URL
  - Event Type
  - Status Code
  - Retry Count
  - Success/Fail
- View failed payload JSON
- Action: Retry or Cancel
- Export log as CSV or JSON

---

## 10. Team Activity Reports

(Admin Only)
- Team invitations and acceptance
- Member activity logs (upload, order, feedback)
- Top performing team members
- Team plan usage limits (cards, orders, users)

---

## 11. Export & Accessibility

- All tables are exportable as CSV or Excel
- PDF reports render via headless browser
- Accessible design: keyboard nav, screen reader tags, semantic headings
- Mobile responsive: dashboards collapse to stacked layout

---

## 12. Notification Logic

- Report ready: Email confirmation + link
- Report delivery failed: Email with error
- Admin alerts on webhook failures or feedback NPS < 6
- All scheduled exports logged to `audit_logs`

---

## 13. Technology Overview

- React + Tailwind CSS
- Recharts or ApexCharts (charts)
- API routes: `/api/analytics`, `/api/reports`, `/api/feedback`, `/api/webhooks`
- Supabase views and SQL joins on core models
- CRON jobs via Supabase Functions or Vercel Schedule

---

## 14. Permissions & RLS

- Every query uses `auth.uid()` or `user.team_id` scope
- Admins bypass filters via `role = admin`
- Global reports marked as `is_admin_only = true`
- Scheduled reports stored per user and protected via RLS

---

## 15. Contact

Questions about analytics exports, admin dashboards, or custom report logic:  
support@yellowlettershop.com

