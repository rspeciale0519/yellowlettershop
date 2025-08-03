# Data Models & Schema Reference

*Last Updated: April 2025*

This document defines the core data models and database design of the Yellow Letter Shop (YLS) platform. It includes schema fields, key constraints, relationships, RLS (Row-Level Security) enforcement, and schema-level support for all major platform features including mailing list deduplication, skip tracing, proof review, vendor management, rollback operations, AI help, contact cards, design locking, and recipient-level engagement tracking.

---

## 1. User Identity & Roles

### Table: `auth.users`
Managed by Supabase Auth.

### Table: `user_profiles`
| Field            | Type     |
|------------------|----------|
| id               | UUID     |
| email            | text     |
| full_name        | text     |
| role             | enum     | admin, manager, user, client |
| dedupe_default   | boolean  |
| created_at       | timestamp|

---

## 2. Mailing Lists

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
| short_link_code   | text     |
| short_link_visits | integer  |
| last_visited_at   | timestamp|
| created_at        | timestamp|

---

## 3. Contact Cards

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

## 4. Orders

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
| design_locked       | boolean  |
| accepted_disclaimer | boolean  |
| created_at          | timestamp|

---

## 5. Proof Files

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

## 6. Annotations & Comments

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

## 7. AI Personalization

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

## 8. Vendor Management

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

## 9. Notifications

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

## 10. Audit & Change Logs

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

## 11. Short Links

### Table: `short_links`
| Field           | Type     |
|-----------------|----------|
| id              | UUID     |
| record_id       | UUID     |
| mailing_list_id | UUID     |
| order_id        | UUID     |
| code            | text     |
| destination_url | text     |
| visit_count     | integer  |
| last_visited_at | timestamp|
| created_at      | timestamp|

---

## 12. Support System

### Table: `support_tickets`
| Field       | Type     |
|-------------|----------|
| id          | UUID     |
| user_id     | UUID     |
| subject     | text     |
| description | text     |
| priority    | enum     | low, medium, high, critical |
| status      | enum     | new, in_progress, resolved, closed |
| assigned_to | UUID     |
| created_at  | timestamp|

### Table: `support_ticket_logs`
| Field      | Type     |
|------------|----------|
| ticket_id  | UUID     |
| changed_by | UUID     |
| action     | text     |
| metadata   | JSONB    |
| timestamp  | timestamp|

---

## 13. Row-Level Security Notes

- Every table enforces RLS using `auth.uid()` match
- Admin overrides allowed only via backend with `service_role`
- Write operations are scoped to users or teams via explicit policy logic

---

## Contact

For schema changes, modeling suggestions, or database optimization requests:  
support@yellowlettershop.com

