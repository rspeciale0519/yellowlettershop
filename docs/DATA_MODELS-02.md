# Data Models & Schema Reference

_Last Updated: April 2025_

This document defines the core data models and database design of the Yellow Letter Shop (YLS) platform. It includes schema fields, key constraints, relationships, RLS (Row-Level Security) enforcement, logging policies, and considerations for AI, personalization, annotation workflows, and third-party printer integration.

---

## 1. Overview

YLS uses Supabase PostgreSQL for structured data storage. All records are scoped by `user_id` and governed by strict RLS policies to ensure tenant isolation. Flexible data fields such as mailing list records, personalization mappings, and design data are stored as JSONB.

---

## 2. User Identity & Roles

### Table: `auth.users` (managed by Supabase Auth)

### Table: `user_profiles`
| Field      | Type     |
|------------|----------|
| id         | UUID     |
| email      | text     |
| full_name  | text     |
| role       | enum     | admin, manager, user, client |
| created_at | timestamp|

---

## 3. Mailing Lists

### Table: `mailing_lists`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| user_id     | UUID     |
| name        | text     |
| description | text     |
| created_at  | timestamp|

### Table: `mailing_list_records`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| mailing_list_id   | UUID     |
| data              | JSONB    |
| is_duplicate      | boolean  |
| validation_status | enum     | valid, invalid, unchecked |
| created_at        | timestamp|

---

## 4. Validated Lists

### Table: `validated_mailing_lists`
| Field                 | Type     |
|-----------------------|----------|
| id                    | UUID     |
| user_id               | UUID     |
| source_list_id        | UUID     |
| records               | JSONB[]  |
| deliverability_status | enum     |
| total_records         | integer  |
| valid_records         | integer  |
| validated_at          | timestamp|

---

## 5. Templates & Designs

### Table: `templates`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| name          | text     |
| category      | text     |
| editable_zones| JSONB    |
| created_at    | timestamp|

### Table: `design_templates`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| user_id           | UUID     |
| template_id       | UUID     |
| design_data       | JSONB    |
| preview_url       | text     |
| created_at        | timestamp|

---

## 6. Orders

### Table: `orders`
| Field               | Type     |
|---------------------|----------|
| id                  | UUID     |
| user_id             | UUID     |
| mailing_list_id     | UUID     |
| design_template_id  | UUID     |
| quantity            | integer  |
| total_price         | decimal  |
| status              | enum     | draft, pending, awaiting_proof, awaiting_approval, revision_requested, approved, printing, shipped, delivered, cancelled |
| fulfillment_method  | enum     | in_house, third_party |
| payment_details     | JSONB    |
| created_at          | timestamp|

---

## 7. Proof Files

### Table: `order_proofs`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| order_id     | UUID     |
| file_url     | text     |
| revision     | integer  |
| uploaded_by  | UUID     | admin or system |
| received_at  | timestamp|

---

## 8. Annotations & Comments

### Table: `proof_annotations`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| order_id          | UUID     |
| proof_id          | UUID     |
| user_id           | UUID     |
| page_number       | integer  |
| x_percent         | decimal  | relative X coordinate on page (0.0 - 1.0) |
| y_percent         | decimal  | relative Y coordinate on page (0.0 - 1.0) |
| annotation_text   | text     |
| status            | enum     | open, resolved |
| created_at        | timestamp|

### Table: `proof_annotation_replies`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| annotation_id     | UUID     |
| user_id           | UUID     |
| reply_text        | text     |
| created_at        | timestamp|

---

## 9. AI Personalization

### Table: `ai_personalization_outputs`
| Field            | Type     |
|------------------|----------|
| id               | UUID     |
| user_id          | UUID     |
| mailing_list_id  | UUID     |
| record_id        | UUID     |
| generated_text   | text     |
| prompt_version   | text     |
| status           | enum     | success, failed |
| created_at       | timestamp|

---

## 10. Automation Engine

### Table: `mail_automations`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| name          | text     |
| type          | enum     | recurring, sequence |
| status        | enum     | active, paused |
| base_list_id  | UUID     |
| schedule_config | JSONB  |
| created_at    | timestamp|

### Table: `mail_automation_steps`
| Field              | Type     |
|--------------------|----------|
| automation_id      | UUID     |
| step_number        | integer  |
| design_template_id | UUID     |
| delay_days         | integer  |
| personalization_fields | JSONB|

---

## 11. Notifications

### Table: `notifications`
| Field      | Type     |
|------------|----------|
| id         | UUID     |
| user_id    | UUID     |
| type       | text     |
| title      | text     |
| body       | text     |
| metadata   | JSONB    |
| read       | boolean  |
| created_at | timestamp|

---

## 12. Audit & Change Logs

### Table: `record_change_logs`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| record_type  | text     |
| record_id    | UUID     |
| user_id      | UUID     |
| change_type  | enum     | created, updated, deleted |
| before       | JSONB    |
| after        | JSONB    |
| created_at   | timestamp|

### Table: `audit_logs`
| Field          | Type     |
|----------------|----------|
| id             | UUID     |
| actor_user_id  | UUID     |
| target_type    | text     |
| target_id      | UUID     |
| action         | text     |
| context        | JSONB    |
| created_at     | timestamp|

---

## 13. Support System

### Table: `support_tickets`
| Field           | Type     |
|------------------|----------|
| id               | UUID     |
| user_id          | UUID     |
| subject          | text     |
| description      | text     |
| priority         | enum     | low, medium, high, critical |
| status           | enum     | new, in_progress, resolved, closed |
| assigned_to      | UUID     |
| created_at       | timestamp|

### Table: `support_ticket_logs`
| Field        | Type     |
|--------------|----------|
| ticket_id    | UUID     |
| changed_by   | UUID     |
| action       | text     |
| metadata     | JSONB    |
| timestamp    | timestamp|

---

## 14. Row-Level Security Notes

- Every table enforces RLS using `auth.uid()` match
- Admin overrides allowed only on server with `service_role`
- All write access is tied to explicit policy logic scoped to user or team

---

For schema migrations, auditing, or storage concerns, contact: `devops@yellowlettershop.com`

