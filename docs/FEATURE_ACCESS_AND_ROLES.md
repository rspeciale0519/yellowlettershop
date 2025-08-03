# Feature Access and Roles

## Overview
This document defines the user roles, plan tiers, feature access, and permission controls for the Yellow Letter Shop (YLS) platform. It is the authoritative source for how permissions and access are structured and enforced throughout the application. All developers, product managers, and support/admin staff should reference this document when making changes to user-facing features or onboarding new team members.

---

## Table of Contents
1. [User Roles and Plan Tiers](#user-roles-and-plan-tiers)
2. [Feature Access by Role](#feature-access-by-role)
3. [Special Permissions and Super Admin Controls](#special-permissions-and-super-admin-controls)
4. [Permission Storage and Enforcement](#permission-storage-and-enforcement)
5. [Edge Cases and Notes](#edge-cases-and-notes)
6. [Extending or Updating This Matrix](#extending-or-updating-this-matrix)

---

## 1. User Roles and Plan Tiers

### Roles
- **Free User**: Single user, no team, on the free plan.
- **Pro User**: Single user, no team, on a paid plan. Has full access to advanced features for their own account.
- **Team Member**: Part of a team, not a manager. Shares assets with team, cannot manage users or see team-wide logs.
- **Team Manager**: Manages a team. Can manage users and view team activity/logs.
- **Enterprise Member**: Part of an enterprise team, not a manager. Same as Team Member but with higher limits and access to enterprise features for their own account.
- **Enterprise Manager**: Manages an enterprise team. Can manage users, view all enterprise activity/logs, access advanced reporting and webhook management for the enterprise.
- **Admin**: Has full access to all features and pages, regardless of plan or team. Can manage all users and data.
- **Super Admin**: Has all Admin powers, plus the ability to grant/revoke admin-level permissions for Admin users. Only Super Admins can control what Admins are allowed to do.

### Plan Tiers
- **Free**: $0/mo, 1 user, limited features.
- **Pro**: $49/mo, 1 user, all standard features.
- **Team**: $99/mo, 3+ users, shared access, team management features.
- **Enterprise**: $499/mo, 10+ users, advanced reporting, webhook management, higher usage limits.

---

## 2. Feature Access by Role

### Free User
- Dashboard
- Saved Templates
- Order History
- Profile
- Security
- Media Library
- Notifications
- API Keys
- Account Page
- Mailing List Manager (basic: add/delete/view lists; advanced features show upgrade modal)

### Pro User
- All Free User features, plus:
- Mailing List Manager (full access: dedupe, merge, AI, exports, etc.)
- Activity Logs (for their own actions only)
- Reporting (for their own data only)
- Webhook Management (for their own account only)

### Team Member
- All Pro User features
- Part of a team (shared assets, collaboration)
- Cannot access User Management or Activity Logs for the team (can only see their own logs and reports)

### Team Manager
- All Team Member features, plus:
- User Management (manage team members)
- Activity Logs (view all team activity)
- Reporting (for the whole team)
- Webhook Management (for the whole team)

### Enterprise Member
- All Team Member features
- Higher usage limits
- Advanced reporting and webhook management (for their own account, if enabled by policy)

### Enterprise Manager
- All Team Manager features, plus:
- Advanced Reporting (for the whole enterprise)
- Webhook Management (for the whole enterprise)
- Highest usage limits

### Admin
- Full access to all features and pages, regardless of plan or role
- Can manage all users, teams, and data

### Super Admin
- All Admin powers
- Can grant/revoke admin-level permissions for Admin users (see below)
- Only Super Admins can assign/demote Admins and control their permissions

---

## 3. Special Permissions and Super Admin Controls

- **Super Admin** can:
  - Assign or revoke the Admin role for any user
  - Grant or revoke specific admin-level permissions (e.g., user deletion, billing, team management, data export)
  - Access a dedicated "Admin Controls" panel to manage Admin permissions
  - Only Super Admins can demote other Super Admins (or this can be restricted to the account owner)

- **Admin** users:
  - Can only access admin-level features that have been enabled for them by a Super Admin
  - See only the features/pages they have been granted

- **Permissions Storage**:
  - Permissions for Admins should be stored in a dedicated table (e.g., `admin_permissions`) or as a JSONB field in `user_profiles`
  - Permissions should be enforced in both the UI and backend

---

## 4. Permission Storage and Enforcement

- **Roles and plan tiers** are stored in the `user_profiles` table:
  - `role` (enum: free, pro, team_member, team_manager, enterprise_member, enterprise_manager, admin, super_admin)
  - `plan_tier` (enum: free, pro, team, enterprise)
- **Team membership** is tracked in the `team_members` table
- **Admin permissions** (for non-super-admin Admins) are stored in `admin_permissions` or as a JSONB field in `user_profiles`
- **Feature access logic** is enforced in:
  - React context/hook (frontend)
  - API middleware/guards (backend)
- **Upgrade modal**: If a user clicks a locked feature, show a floating modal prompting upgrade or permission request

---

## 5. Edge Cases and Notes

- Any user can see all menu items, but locked features will show an upgrade modal or permission error if not eligible
- Pro users have all advanced features, but only for their own account/data
- Team/Enterprise Managers have access for their whole team/enterprise
- Team/Enterprise Members have advanced features only for their own data
- Admins always have full access unless restricted by a Super Admin
- Super Admins are the only role that can manage Admin permissions
- Enterprise plans are "Team plans on steroids"—all Team features, but higher limits and more advanced controls

---

## 6. Extending or Updating This Matrix

- When adding a new feature or page:
  - Update this document with access rules for each role/plan
  - Update the feature access logic in both frontend and backend code
- When changing roles or permissions:
  - Update the `role` enum and/or permission storage schema as needed
  - Communicate changes to all developers and support/admin staff

---

## Revision History
- **2025-04-18**: Initial version, based on detailed discussion and consensus between product owner and engineering

---

For questions or to propose updates, contact the product owner or lead engineer.
