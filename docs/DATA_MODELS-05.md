# Data Models & Schema Reference

_Last Updated: April 2025_

This document defines the core data models and database design of the Yellow Letter Shop (YLS) platform. It includes schema fields, key constraints, relationships, RLS (Row-Level Security) enforcement, logging policies, and considerations for contact cards, deduplication preferences, annotation workflows, fulfillment routing, campaign scheduling, skip tracing, and vendor management.

---

## 1. Overview

YLS uses Supabase PostgreSQL for structured data storage. All records are scoped by `user_id` and governed by strict RLS policies to ensure tenant isolation. Flexible fields such as mailing list records, personalization mappings, enriched skip trace data, and campaign configurations are stored as JSONB.

---

## 2. User Identity & Roles

### Table: `auth.users` (managed by Supabase Auth)

### Table: `user_profiles`
| Field              | Type     |
|--------------------|----------|
| id                 | UUID     |
| email              | text     |
| full_name          | text     |
| role               | enum     | admin, manager, user, client |
| dedupe_default     | boolean  |
| created_at         | timestamp|

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
| skip_trace_status | enum     | not_requested, pending, enriched, failed |
| enriched_data     | JSONB    |
| created_at        | timestamp|

---

## 4. Contact Cards

### Table: `contact_cards`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| first_name    | text     |
| last_name     | text     |
| address       | text     |
| unit          | text     |
| city          | text     |
| state         | text     |
| zip           | text     |
| email         | text     |
| company_name  | text     |
| phone         | text     |
| created_at    | timestamp|

- Each user may have a limited number of contact cards depending on their plan:
  - Pro: max 2
  - Team/Enterprise: limited to number of users in account
- Contact cards are selected per order; one card per campaign

---

## 5. Orders

### Table: `orders`
| Field               | Type     |
|---------------------|----------|
| id                  | UUID     |
| user_id             | UUID     |
| mailing_list_id     | UUID     |
| design_template_id  | UUID     |
| contact_card_id     | UUID     |
| quantity            | integer  |
| total_price         | decimal  |
| status              | enum     | draft, pending, awaiting_admin_review, awaiting_proof, awaiting_approval, revision_requested, approved, printing, shipped, delivered, cancelled |
| fulfillment_method  | enum     | undecided, in_house, third_party |
| vendor_id           | UUID     |
| mailing_option      | JSONB    |
| campaign_options    | JSONB    |
| payment_details     | JSONB    |
| created_at          | timestamp|

#### Sample `mailing_option` JSON:
```json
{
  "type": "full_service",
  "postage_type": "first_class",
  "stamp_type": "live_stamp"
}
```

#### Sample `campaign_options` JSON:
```json
{
  "split": {
    "enabled": true,
    "num_drops": 4,
    "interval_weeks": 1
  },
  "repeat": {
    "enabled": true,
    "repeat_count": 2,
    "interval_weeks": null
  }
}
```

---

## 6. Proof Files

### Table: `order_proofs`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| order_id     | UUID     |
| file_url     | text     |
| revision     | integer  |
| uploaded_by  | UUID     |
| received_at  | timestamp|

---

## 7. Annotations & Comments

### Table: `proof_annotations`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| order_id          | UUID     |
| proof_id          | UUID     |
| user_id           | UUID     |
| page_number       | integer  |
| x_percent         | decimal  |
| y_percent         | decimal  |
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

## 8. AI Personalization

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

## 9. Vendor Management (Generalized)

### Table: `vendors`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| name              | text     |
| contact_name      | text     |
| email             | text     |
| vendor_type       | enum     | print, skip_tracing, data_enrichment, other |
| phone             | text     |
| website           | text     |
| address           | text     |
| services_offered  | JSONB    |
| min_order_qty     | integer  |
| avg_turnaround    | interval |
| shipping_costs    | JSONB    |
| payment_terms     | text     |
| contract_start    | date     |
| contract_end      | date     |
| quality_rating    | decimal  |
| delivery_rate     | decimal  |
| error_incidents   | integer  |
| notes             | text     |
| created_at        | timestamp|

### Table: `vendor_pricing`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| vendor_id         | UUID     |
| product_type      | text     |
| price_per_unit    | decimal  |
| volume_tier       | text     |
| effective_date    | date     |
| created_at        | timestamp|

---

## 10. Notifications

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

## 11. Audit & Change Logs

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

## 12. Support System

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

## 13. Row-Level Security Notes

- Every table enforces RLS using `auth.uid()` match
- Admin overrides allowed only on server with `service_role`
- All write access is tied to explicit policy logic scoped to user or team

---

For schema migrations or modeling updates, contact: devops@yellowlettershop.com

