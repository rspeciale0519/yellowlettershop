# Analytics & Reporting Module Specification

*Last Updated: April 2025*

This document defines the UI/UX flows, data outputs, submodules, roles, and functional specifications for the Analytics & Reporting Module in the Yellow Letter Shop (YLS) platform. It integrates with existing systems including orders, templates, mailing lists, skip tracing, vendor management, AI personalization, proof review, tracking URLs, and user role-based permissions.

---

## 1. Overview

The Analytics & Reporting Module provides:
- Visual dashboards (user-facing and admin-facing)
- Custom report builders with export capabilities
- Scheduled report delivery engine
- Real-time KPIs and historical trends
- Saved report templates

All data visualizations, exports, and user experiences must align with existing systems defined in:
- PRD.md
- DATA_MODELS.md
- API_REFERENCE.md
- ARCHITECTURE.md
- TECH_STACK.md
- DEVELOPMENT_TODO.md

---

## 2. Entry Points

### User View (Authenticated)
- Path: `/dashboard`
- Default homepage post-login

### Admin View (Admin Role Only)
- Path: `/admin/dashboard`
- Requires `user_profiles.role = admin`

### Reports Center (Both Roles)
- Path: `/reports`
- Accessible via dashboard CTA or sidebar

---

## 3. User Dashboard (Login Landing Page)

### Top KPI Tiles
- Total Orders
- Total Spend
- Total Pieces Mailed
- Active Campaigns
- Average Turnaround Time
- AI-Enhanced Campaigns

### Visual Components
- Bar Chart: Monthly Spend Over Time
- Line Chart: Orders Over Time
- Pie Chart: Mailing Method Distribution
- Table: Recent Orders (status, design locked, quantity, vendor, total)
- Short Link Activity Feed: IP, code, timestamp, campaign

---

## 4. Admin Dashboard (Platform-Wide View)

### Admin KPI Tiles
- Total Revenue
- Monthly Recurring Revenue (MRR)
- Active Users
- Orders This Month
- Skip Trace Volume (Current Month)
- Vendor Reliability Score (avg on-time delivery rate)

### Visual Components
- Time Series Chart: Revenue & Volume Trends
- Pie Chart: Plan Distribution (Free, Pro, Team, Enterprise)
- Leaderboard: Top Users by Spend
- Table: Recently Failed Orders or Proof Rejections
- Heatmap: Short Link Click Activity (geographic/time-based)

---

## 5. Report Builder UX Flow

### Step 1: Select Report Type

**User Options:**
- Orders Report
- Skip Trace Report
- Campaign Report
- Short Link Engagement Report
- Spending Summary
- AI Personalization Usage Report

**Admin-Only Additional Reports:**
- Platform Revenue Report
- Vendor Performance Report
- User Activity Logs
- Fulfillment Routing Logs
- Subscription & Plan Distribution Report

### Step 2: Filter Criteria
- Timeframe Presets:
  - Today, Last 7 Days, Last 30 Days
  - This Month, Last Month
  - This Quarter, Last Quarter
  - Year to Date, This Year, Last Year
  - Custom Range (start date / end date)

- Optional Filters:
  - Campaign Name
  - Template
  - Vendor
  - Order Status
  - Fulfillment Method

### Step 3: Output Options
- Format:
  - CSV
  - PDF
  - Excel

- Delivery:
  - Download Now
  - Email One-Time
  - Schedule Recurring:
    - Daily, Weekly, Monthly
    - Day/time selection
    - End date (optional)

---

## 6. Saved Reports System
- Allow users and admins to save report templates
- Fields Saved:
  - Report type
  - Filters
  - Timeframe
  - Output format
  - Scheduling (if enabled)
- My Saved Reports View:
  - Load, Edit, Delete, Duplicate
- Admin Global Reports:
  - Visible only to admin role
  - Labelled with badge: "Admin Global Report"

---

## 7. Scheduled Reports
- Recurring reports listed in `/reports/scheduled`
- Each row includes:
  - Report Name
  - Frequency
  - Next Send Date
  - Last Run Date
  - Format
  - Status (Active / Paused)
- Actions:
  - Pause
  - Edit
  - Cancel
  - Download Last Run

---

## 8. Mobile Support
- KPI tiles convert to swipeable horizontal scroll view
- Graphs collapse to single-column responsive layouts
- Tables convert to collapsible accordion rows
- Filters and report builder use stacked, step-by-step UI

---

## 9. Technology
- Frontend: React, Tailwind CSS, Recharts or ApexCharts for charts
- API Layer: `/api/analytics`, `/api/reports`
- Data Layer: Supabase views or SQL joins on orders, mailing_lists, skip_trace_orders, short_links, contact_cards
- Scheduled Delivery: CRON jobs managed via Supabase Functions or serverless scheduler (Vercel CRON)
- PDF Export: Headless browser rendering or third-party service

---

## 10. Permissions
- All user-specific dashboards and data filtered by `auth.uid()`
- Admin dashboard requires role = `admin`
- Admin reports can access platform-wide data
- Saved report permissions scoped by user ID (or global flag for admin reports)

---

## 11. Notifications
- On successful scheduled report delivery, send confirmation email
- Error alerts (e.g., failed export or delivery) sent to:
  - Users: support@yellowlettershop.com
  - Admins: admin@yellowlettershop.com

---

## 12. Support
- User questions or reporting issues: support@yellowlettershop.com
- Admin support and platform monitoring: admin@yellowlettershop.com