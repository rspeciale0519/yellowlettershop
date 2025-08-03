# Data Models & Schema Reference

*Last Updated: April 2025*

This document defines the database schema and key tables used across the Yellow Letter Shop (YLS) platform. It includes structures supporting mailing list processing, proofing, AI personalization, team collaboration, field-level rollback, payment authorization, saved payment methods, webhook logging, feedback collection, and reporting.

---

## 1. User Identity & Roles

### Table: `auth.users`
Managed by Supabase Auth.

### Table: `user_profiles`
| Field              | Type     |
|--------------------|----------|
| id                 | UUID     |
| email              | text     |
| full_name          | text     |
| role               | enum     | admin, manager, user |
| plan_tier          | enum     | free, pro, team, enterprise  |
| dedupe_default     | boolean  |
| downgraded_at      | timestamp|
| grace_period_until | timestamp|
| stripe_customer_id | text     |
| created_at         | timestamp|

---

## 2. Stored Payment Methods

### Table: `user_payment_methods`
| Field               | Type     |
|---------------------|----------|
| id                  | UUID     |
| user_id             | UUID     |
| stripe_pm_id        | text     |
| brand               | text     |
| last4               | text     |
| exp_month           | integer  |
| exp_year            | integer  |
| is_default          | boolean  |
| created_at          | timestamp|

---

## 3. Teams & Collaboration

### Table: `team_members`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| team_id     | UUID     |
| user_id     | UUID     |
| invited_by  | UUID     |
| status      | enum     | pending, accepted |
| created_at  | timestamp|

---

## 4. Mailing Lists

### Table: `mailing_lists`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| user_id     | UUID     |
| name        | text     |
| description | text     |
| is_archived | boolean  |
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
| short_link_code   | text     |
| short_link_visits | integer  |
| last_visited_at   | timestamp|
| created_at        | timestamp|

---

## 5. Per-Field Change History

### Table: `record_field_changes`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| record_id    | UUID     |
| field_name   | text     |
| old_value    | text     |
| new_value    | text     |
| changed_by   | UUID     |
| change_reason| text     |
| created_at   | timestamp|

---

## 6. Contact Cards

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

---

## 7. Orders & Payment Authorization

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
| status              | enum     | draft, pending, awaiting_admin_review, awaiting_proof, revision_requested, approved, printing, shipped, delivered, cancelled |
| fulfillment_method  | enum     | undecided, in_house, third_party |
| vendor_id           | UUID     |
| mailing_option      | JSONB    |
| campaign_options    | JSONB    |
| payment_intent_id   | text     |
| design_locked       | boolean  |
| accepted_disclaimer | boolean  |
| is_archived         | boolean  |
| created_at          | timestamp|

---

## 8. Proofs & Annotations

### Table: `order_proofs`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| order_id    | UUID     |
| file_url    | text     |
| revision    | integer  |
| uploaded_by | UUID     |
| received_at | timestamp|

### Table: `proof_annotations`
| Field           | Type     |
|-----------------|----------|
| id              | UUID     |
| order_id        | UUID     |
| proof_id        | UUID     |
| user_id         | UUID     |
| page_number     | integer  |
| x_percent       | decimal  |
| y_percent       | decimal  |
| annotation_text | text     |
| status          | enum     | open, resolved |
| created_at      | timestamp|

### Table: `proof_annotation_replies`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| annotation_id | UUID     |
| user_id       | UUID     |
| reply_text    | text     |
| created_at    | timestamp|

---

## 9. Vendors

### Table: `vendors`
| Field             | Type     |
|-------------------|----------|
| id                | UUID     |
| name              | text     |
| contact_name      | text     |
| email             | text     |
| vendor_type       | enum     | print, skip_tracing, enrichment, other |
| phone             | text     |
| website           | text     |
| address           | text     |
| services_offered  | JSONB    |
| contract_start    | date     |
| contract_end      | date     |
| quality_rating    | decimal  |
| delivery_rate     | decimal  |
| error_incidents   | integer  |
| created_at        | timestamp|

---

## 10. Skip Trace Orders

### Table: `skip_trace_orders`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| mailing_list_id| UUID    |
| record_ids    | UUID[]   |
| vendor_id     | UUID     |
| status        | enum     | pending, processing, completed, failed |
| result_url    | text     |
| created_at    | timestamp|

---

## 11. Webhooks

### Table: `webhook_endpoints`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| user_id     | UUID     |
| url         | text     |
| event_type  | text     |
| created_at  | timestamp|

### Table: `webhook_logs`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| endpoint_id  | UUID     |
| payload      | JSONB    |
| status_code  | integer  |
| response     | text     |
| success      | boolean  |
| created_at   | timestamp|

---

## 12. Feedback

### Table: `feedback`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| user_id     | UUID     |
| order_id    | UUID     |
| nps_score   | integer  |
| comment     | text     |
| source      | text     |
| created_at  | timestamp|

---

## 13. Reporting

### Table: `saved_reports`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| name          | text     |
| config        | JSONB    |
| is_admin_only | boolean  |
| created_at    | timestamp|

### Table: `scheduled_reports`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| report_id     | UUID     |
| schedule_type | enum     | daily, weekly, monthly |
| next_run_at   | timestamp|
| last_run_at   | timestamp|
| status        | enum     | active, paused |
| format        | enum     | csv, pdf, excel |
| created_at    | timestamp|

---

## 14. Short Links

### Table: `short_links`
| Field           | Type     |
|-----------------|----------|
| id              | UUID     |
| record_id       | UUID     |
| order_id        | UUID     |
| mailing_list_id | UUID     |
| code            | text     |
| destination_url | text     |
| visit_count     | integer  |
| last_visited_at | timestamp|
| created_at      | timestamp|

---

## 15. Audit & Change Logs

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

## Contact

For schema changes, DB access issues, or relational design review:  
support@yellowlettershop.com

