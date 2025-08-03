# **Pricing Specification Document: Yellow Letter Shop (YLS)**

## **Overview**

The Yellow Letter Shop (YLS) pricing model supports a direct mail SaaS platform with transparent, tiered pricing for letters, postcards, and add-on services. Prices vary by quantity, postage type, and delivery method, with dynamic rules enforced during order processing. This document outlines the pricing structure, discount logic, and edge cases, integrated with Supabase, Stripe, and AccuZIP for accurate calculations and validation.

## **Pricing Structure**

### **Letters**

Per-unit pricing for letters depends on quantity and delivery/postage type:

| Quantity | Mailed (SC) | Mailed (FC) | Shipped (FC) | Shipped (NP) | Shipped (PO) |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 1–249 | $1.10 | $1.30 | $1.60 | $0.65 | $0.55 |
| 250–499 | $1.05 | $1.25 | $1.55 | $0.65 | $0.55 |
| 500–749 | $1.02 | $1.20 | $1.50 | $0.65 | $0.55 |
| 750–999 | $0.97 | $1.15 | $1.45 | $0.65 | $0.55 |
| 1,000–2,499 | $0.87 | $1.05 | $1.35 | $0.65 | $0.55 |
| 2,500–4,999 | $0.86 | $1.03 | $1.33 | $0.65 | $0.55 |
| 5,000–9,999 | $0.83 | $1.01 | $1.31 | $0.65 | $0.55 |
| 10,000+ | $0.60 | $0.95 | $1.25 | $0.65 | $0.55 |

**Notes**: SC \= Standard Class (200-record minimum), FC \= First Class (Forever: no minimum; Discounted: 500-record minimum), NP \= No Postage, PO \= Print Only.

### **Postcards**

Per-unit pricing for postcards varies by size, postage, and quantity:

| Size/Postage | 1–249 | 250–499 | 500–749 | 750–999 | 1,000–2,499 | 2,500–4,999 | 5,000–9,999 | 10,000+ |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 4x6 First Class | $0.95 | $0.87 | $0.85 | $0.79 | $0.77 | $0.76 | $0.72 | $0.72 |
| 5x7 First Class | $1.10 | $1.02 | $1.00 | $0.94 | $0.92 | $0.91 | $0.90 | $0.90 |
| 5x9 Standard Class | $0.95 | $0.87 | $0.85 | $0.79 | $0.77 | $0.76 | $0.75 | $0.75 |
| 6x9 First Class | $1.12 | $1.04 | $1.02 | $0.96 | $0.94 | $0.93 | $0.89 | $0.89 |
| 6x9 Standard Class | $0.97 | $0.89 | $0.87 | $0.81 | $0.79 | $0.78 | $0.74 | $0.74 |
| 6x11 First Class | $1.15 | $1.07 | $1.05 | $0.99 | $0.97 | $0.96 | $0.92 | $0.92 |
| 6x11 Standard Class | $0.98 | $0.90 | $0.90 | $0.82 | $0.80 | $0.79 | $0.75 | $0.75 |

**Notes**: Standard Class requires 200-record minimum; First Class has no minimum.

### **Add-On Services**

| Service | Price | Description |
| ----- | ----- | ----- |
| Mailing Lists | $0.12/record | Demographic-based lists, quoted via email. |
| Skip Tracing | $0.10/record | Phone/email data for contacts and family. |
| Mail Tracking | $25/mailing | Per-campaign tracking with alerts and analytics. |
| List Formatting | $0.05/record | Formats lists for proper capitalization and structure. |
| List Parsing | $0.25/record | Extracts/reformats addresses and names (if possible). |

## **Pricing Rules and Logic**

* **Quantity-Based Tiers**: Prices are determined by the number of deliverable records after AccuZIP validation, stored in the Supabase `pricing` table (`type`, `name`, `cost`, `min_quantity`, `max_quantity`).  
* **Postage Eligibility**: Standard Class (200-record minimum) and First Class (Discounted, 500-record minimum) are filtered dynamically based on validated list count. First Class (Forever) is always available.  
* **Discount Logic**: Prices decrease with higher quantities per the tiered tables. No additional discounts apply.  
* **Add-On Pricing**: Per-record fees (e.g., $0.12 for Mailing Lists) are multiplied by record count; Mail Tracking is a flat $25 per campaign.

## **Edge Cases**

* **List Validation**: If validation reduces records below postage minimums (e.g., \<200 for Standard Class), the system prompts users to add records or select an eligible postage type (e.g., First Class Forever).  
* **Order Abandonment**: Payments are authorized at checkout but captured only after design approval. Abandoned orders are not charged.  
* **Price Changes**: Pricing is locked at order initiation to avoid mid-process changes. Updates apply to new orders.  
* **List Parsing Failure**: If names cannot be separated, users are notified via Mailgun, and no parsing fee is charged for unprocessed records.

## **Implementation**

* **Supabase**: Store pricing in the `pricing` table with RLS for admin-only access. Use API routes (`GET /api/pricing`, `PATCH /api/admin/pricing`) for retrieval and updates.  
* **Stripe**: Authorize payments at checkout, capture after approval, and support refunds via admin dashboard.  
* **AccuZIP**: Validate lists to determine deliverable count and enforce postage rules.  
* **Admin Dashboard**: Pricing controls allow super-admins to update rates and view cost impacts, with changes logged for auditing.

This document provides a concise guide for implementing the YLS pricing system.

