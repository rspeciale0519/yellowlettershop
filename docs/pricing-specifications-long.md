# **Pricing Specification Document: Yellow Letter Shop (YLS)**

## **Introduction and Overview**

The Yellow Letter Shop (YLS) pricing model is designed to support a flexible, scalable, and transparent direct mail SaaS platform. This document provides a comprehensive specification for the pricing structure, including base prices for mail pieces, postage rates, add-on services, and discount logic based on order quantities. It also covers edge cases, validation rules, and integration requirements to ensure accurate pricing calculations and compliance with platform requirements.

The pricing system is integrated into the order processing workflow, admin dashboard, and subscription plan enforcement, leveraging Supabase for storage, Stripe for payments, and Next.js API routes for dynamic calculations. All prices are subject to change based on market conditions and USPS postage fluctuations, with updates managed via the admin dashboard's pricing engine controls.

## **Pricing Structure**

The YLS pricing model consists of two primary components: **Mail Piece Pricing** (letters and postcards) and **Add-On Services**. Prices are determined by the type of mail piece, postage option, delivery method, and order quantity, with additional fees for optional services like skip tracing and mail tracking.

### **Mail Piece Pricing**

#### **Letters**

Letter pricing is based on the quantity ordered and the delivery method/postage type. The following table outlines the per-unit costs for letters:

| Quantity | Mailed for You (Standard Class) | Mailed for You (First Class) | Shipped to You (First Class) | Shipped to You (No Postage) | Shipped to You (Print Only) |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 1–249 | $1.10 | $1.30 | $1.60 | $0.65 | $0.55 |
| 250–499 | $1.05 | $1.25 | $1.55 | $0.65 | $0.55 |
| 500–749 | $1.02 | $1.20 | $1.50 | $0.65 | $0.55 |
| 750–999 | $0.97 | $1.15 | $1.45 | $0.65 | $0.55 |
| 1,000–2,499 | $0.87 | $1.05 | $1.35 | $0.65 | $0.55 |
| 2,500–4,999 | $0.86 | $1.03 | $1.33 | $0.65 | $0.55 |
| 5,000–9,999 | $0.83 | $1.01 | $1.31 | $0.65 | $0.55 |
| 10,000+ | $0.60 | $0.95 | $1.25 | $0.65 | $0.55 |

**Notes:**

* **Delivery Methods:**  
  * **Mailed for You**: YLS handles printing and mailing, with postage included (Standard Class or First Class).  
  * **Shipped to You**: YLS prints the letters and ships them to the customer, with options for First Class postage, no postage, or print-only (no envelopes).  
* **Postage Rules:**  
  * Standard Class requires a minimum of 200 deliverable records after validation.  
  * First Class (Discounted) requires a minimum of 500 deliverable records after validation.  
  * First Class (Forever) has no minimum quantity requirement.  
* **Discount Logic:**  
  * Prices decrease as quantity increases, reflecting economies of scale.  
  * No additional discounts apply beyond the tiered pricing structure.

#### **Postcards**

Postcard pricing varies by size, postage type, and quantity. The following table outlines the per-unit costs for postcards:

| Size/Postage | 1–249 | 250–499 | 500–749 | 750–999 | 1,000–2,499 | 2,500–4,999 | 5,000–9,999 | 10,000+ |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 4x6 First Class | $0.95 | $0.87 | $0.85 | $0.79 | $0.77 | $0.77 | $0.76 | $0.72 |
| 5x7 First Class | $1.10 | $1.02 | $1.00 | $0.94 | $0.92 | $0.92 | $0.91 | $0.90 |
| 5x9 Standard Class | $0.95 | $0.87 | $0.85 | $0.79 | $0.77 | $0.77 | $0.76 | $0.75 |
| 6x9 First Class | $1.12 | $1.04 | $1.02 | $0.96 | $0.94 | $0.94 | $0.93 | $0.89 |
| 6x9 Standard Class | $0.97 | $0.89 | $0.87 | $0.81 | $0.81 | $0.79 | $0.78 | $0.74 |
| 6x11 First Class | $1.15 | $1.07 | $1.05 | $0.99 | $0.99 | $0.97 | $0.96 | $0.92 |
| 6x11 Standard Class | $0.98 | $0.90 | $0.90 | $0.82 | $0.82 | $0.80 | $0.79 | $0.75 |

**Notes:**

* **Postage Rules:**  
  * Standard Class requires a minimum of 200 deliverable records after validation.  
  * First Class has no minimum quantity requirement.  
* **Discount Logic:**  
  * Similar to letters, prices decrease with higher quantities.  
  * No additional discounts apply beyond the tiered pricing structure.

### **Add-On Services**

YLS offers several optional services to enhance campaign effectiveness. These services are priced per record or per mailing and can be selected during the order process.

| Service | Price | Description |
| ----- | ----- | ----- |
| Mailing Lists | $0.12 per record | Purchase demographic-based mailing lists with no additional filter fees. |
| Skip Tracing | $0.10 per record | Provides updated phone numbers and email addresses for contacts and family. |
| Mail Tracking | $25 per mailing | Tracks each mail piece, with alerts and analytics (charts, geo-mapping). |
| List Formatting | $0.05 per record | Formats mailing lists for proper capitalization and column structure. |
| List Parsing | $0.25 per record | Extracts and reformats addresses, separating names where possible. |

**Notes:**

* **Mailing Lists**: Users request lists via email (Sales@YellowLetterShop.com) with desired quantity and filters, receiving a custom quote starting at $0.12 per record.  
* **List Parsing**: Name separation (first, middle, last) depends on the input data structure. Users are notified if separation is not possible.  
* **Mail Tracking**: Applied per campaign, not per record, providing detailed tracking data.

## **Pricing Rules and Logic**

### **Quantity-Based Pricing Tiers**

* **Logic**: The system automatically applies the appropriate price per unit based on the number of deliverable records in the validated mailing list. For example, a letter order with 600 records uses the 500–749 pricing tier.  
* **Implementation**: The pricing table is stored in the Supabase `pricing` table, with columns for `type` (e.g., letter, postcard), `name` (e.g., "First Class Mailed"), `min_quantity`, `max_quantity`, and `cost`. The system queries this table to determine the applicable price based on the order quantity.

### **Postage Type Eligibility**

* **Rules**:  
  * **First Class (Forever)**: Available for any quantity (no minimum).  
  * **First Class (Discounted)**: Requires at least 500 deliverable records.  
  * **Standard Class**: Requires at least 200 deliverable records.  
* **Dynamic Filtering**: During order processing, the system validates the mailing list and filters available postage types based on the final deliverable record count. For example, if a list has fewer than 200 records, only First Class (Forever) and non-postage options (Shipped to You: No Postage, Print Only) are shown.  
* **Implementation**: The order processing API checks the validated list count against the `min_quantity` field in the `pricing` table and returns only eligible postage options.

### **Discount Logic**

* **Tiered Discounts**: Discounts are automatically applied based on the quantity tiers defined in the pricing tables. No additional promotional discounts or coupon codes are currently supported.  
* **Edge Case Handling**:  
  * If a mailing list is reduced after validation (e.g., due to deduplication or invalid addresses), the system recalculates the price using the updated deliverable record count.  
  * If a user attempts to select a postage type that becomes ineligible after validation (e.g., Standard Class with fewer than 200 records), the system prompts the user to choose a valid postage type or adjust the order.

### **Add-On Service Pricing**

* **Per-Record Services**: Mailing Lists, Skip Tracing, List Formatting, and List Parsing are charged based on the number of records processed. For example, a mailing list with 1,000 records incurs a $120 fee for Mailing Lists ($0.12 × 1,000).  
* **Per-Mailing Service**: Mail Tracking is a flat $25 fee per campaign, regardless of quantity.  
* **Implementation**: Add-on services are stored in the `pricing` table with `type = 'add-on'`. The system calculates the total cost by multiplying the per-record price by the number of records or adding the flat fee for Mail Tracking.

## **Edge Cases and Validation**

### **Mailing List Validation Impact**

* **Scenario**: A user uploads a mailing list with 600 records, selecting First Class (Discounted) postage. After validation (via AccuZIP API), only 450 records are deliverable.  
* **Handling**: The system detects that First Class (Discounted) requires 500 records and prompts the user to either:  
  * Add more records to meet the minimum.  
  * Switch to a different postage type (e.g., First Class Forever or Standard Class).  
  * Proceed with a non-postage option (Shipped to You: No Postage or Print Only).  
* **Implementation**: The order processing API validates the list count post-AccuZIP processing and returns an error with available options if the selected postage type is ineligible.

### **Partial Order Abandonment**

* **Scenario**: A user completes the design and list upload but abandons the order before approving the final proof.  
* **Handling**: No funds are captured until the user approves the design via the double-approval modal. If abandoned, the order is marked as "pending" in the `orders` table, and no charges are applied.  
* **Implementation**: Stripe payment authorization is initiated at checkout but only captured after design approval. Abandoned orders are cleaned up via a scheduled job after a set period (e.g., 7 days).

### **Price Changes During Order Processing**

* **Scenario**: An admin updates pricing in the `pricing` table while a user is in the order process.  
* **Handling**: The system locks in the pricing at the time of order initiation (when the user starts the checkout flow) to ensure consistency. Updated prices apply only to new orders.  
* **Implementation**: The order processing API snapshots the relevant pricing data into the `orders` table at checkout, ensuring that subsequent price changes do not affect in-progress orders.

### **Invalid or Missing Data for Add-Ons**

* **Scenario**: A user requests List Parsing, but the mailing list lacks sufficient data to separate first, middle, and last names.  
* **Handling**: The system attempts to parse the data and notifies the user via email (using Mailgun) if separation is not possible. The user is not charged for unperformed parsing.  
* **Implementation**: The list parsing service checks the input data structure and flags records that cannot be parsed. The API returns a summary to the user, and the `orders` table reflects only the successful parsing fee.

## **Integration Requirements**

### **Supabase (Pricing Storage and Retrieval)**

* **Table Structure**:  
  * `pricing` table:  
    * `id`: UUID (primary key)  
    * `type`: TEXT (e.g., "letter", "postcard", "add-on")  
    * `name`: TEXT (e.g., "First Class Mailed", "Mail Tracking")  
    * `cost`: DECIMAL(10,2) (per-unit or flat fee)  
    * `min_quantity`: INTEGER (minimum records for eligibility, null for no minimum)  
    * `max_quantity`: INTEGER (upper bound of tier, null for open-ended)  
    * `updated_at`: TIMESTAMP (tracks price changes)  
* **RLS Policies**: Only admins can read/write the `pricing` table.  
* **API Routes**:  
  * `GET /api/pricing`: Retrieves pricing data for display in the order process or admin dashboard.  
  * `PATCH /api/admin/pricing`: Updates pricing (admin-only).

### **Stripe (Payment Processing)**

* **Authorization and Capture**:  
  * Payment is authorized at checkout and captured only after design approval.  
  * Total cost includes mail piece pricing (based on quantity and postage) plus any add-on fees.  
* **Refunds**: Admins can process refunds via the admin dashboard, triggering a Stripe refund API call.  
* **Implementation**: Stripe.js and Stripe API are used to handle payments, with webhooks updating the `orders` table on payment events.

### **AccuZIP (List Validation)**

* **Role**: Validates mailing lists to determine deliverable record count, which affects postage eligibility and pricing.  
* **Implementation**: The order processing API integrates with AccuZIP's REST API to validate lists before finalizing the order. The validated count determines the pricing tier and available postage options.

### **Mailgun (Notifications)**

* **Role**: Sends notifications for edge cases, such as ineligible postage types or failed list parsing.  
* **Implementation**: Mailgun's HTTP API is used to send transactional emails triggered by specific order events.

## **Admin Dashboard Integration**

The admin dashboard (specified in the YLS Admin Feature Specifications) includes a **Pricing Engine Controls** section for managing pricing rules:

* **Pricing Table**: Displays all pricing entries (letters, postcards, add-ons) with editable fields for `cost`, `min_quantity`, and `max_quantity`.  
* **Validation Rules Editor**: Allows admins to set minimum quantities for postage types and other constraints.  
* **Preview Calculator**: Shows the impact of pricing changes on sample orders.  
* **Security**: Access is restricted to super-admins, with all changes logged in the `activity_logs` table.

## **Implementation Guidelines**

### **Database Setup**

* Create the `pricing` table in Supabase with the specified schema.  
* Apply RLS policies to restrict access to admins.  
* Populate the table with initial pricing data from the YLS Price Sheet.

### **API Development**

* Implement `GET /api/pricing` to fetch pricing data for the order process.  
* Implement `PATCH /api/admin/pricing` for admin price updates, with validation to ensure non-negative costs and valid quantity ranges.  
* Integrate with AccuZIP for list validation and Stripe for payment processing.

### **Frontend Integration**

* Use TanStack Table in the admin dashboard to display and edit pricing data.  
* Implement a pricing calculator in the order process to show real-time costs based on quantity and selected add-ons.  
* Use shadcn/ui components for consistent UI across the order and admin interfaces.

### **Testing Considerations**

* **Unit Tests (Jest)**:  
  * Test pricing calculations for all quantity tiers and postage types.  
  * Validate edge cases (e.g., list validation reducing record count below minimum).  
* **End-to-End Tests (Cypress)**:  
  * Test the order process to ensure correct pricing is applied and ineligible postage types are filtered.  
  * Test admin pricing updates and their effect on new orders.  
* **Security Tests**:  
  * Verify RLS policies prevent unauthorized access to pricing data.  
  * Ensure audit logging captures all pricing changes.

## **Edge Case Handling Summary**

* **List Validation Reducing Quantity**: Recalculate pricing and prompt user to adjust postage type if necessary.  
* **Order Abandonment**: Do not capture funds until design approval; clean up abandoned orders after a timeout.  
* **Price Changes During Order**: Lock in pricing at order initiation to avoid inconsistencies.  
* **Invalid List Parsing**: Notify user and exclude unparsed records from billing.  
* **Postage Ineligibility**: Dynamically filter postage options based on validated list count.

## **Future Considerations**

* **Dynamic Pricing Updates**: Implement a mechanism to notify users of price changes before order confirmation.  
* **Promotional Discounts**: Add support for coupon codes or limited-time discounts in future phases.  
* **Subscription Plan Impact**: Integrate pricing with subscription tiers (e.g., Pro plan users may receive discounted rates).

This Pricing Specification Document serves as a definitive guide for developers and stakeholders implementing and maintaining the YLS pricing system.

