# **Rebuilding the ListSource "Create Your Own" Build-List Interface**

This document provides detailed and comprehensive instructions to help you rebuild the ListSource-style "Create Your Own" mailing list interface on your own web platform. It mirrors all of the tabs, input types, options, and behaviors found in the original system.

---

## **Table of Contents**

1. UI Layout and Structure

2. Step-by-Step Tab Implementation

   * Geography

   * Mortgage

   * Property

   * Demographics

   * Foreclosure

   * Predictive Analytics

   * Options

3. Input Types and Component Behaviors

4. Search and Filter Logic

5. Data Binding and State Management

6. UX Considerations and Interactions

7. Export, Count, and Save Features

---

## **1\. UI Layout and Structure**

The interface uses a tab-based structure, with each tab loading its own configurable criteria form:

* **Tabs**: Horizontally displayed with active tab highlighting

* **Criteria Sidebar**: Fixed-position sidebar on the left listing all selected criteria

* **Main Panel**: Dynamic content area that displays filter configuration forms per tab

* **Bottom Bar**: Displays counts, action buttons (Save List, View Count, Purchase, etc.)

Technologies recommended:

* Framework: React or Next.js

* Styling: TailwindCSS or custom SCSS

* State Management: Redux, Zustand, or React Context

---

## **2\. Step-by-Step Tab Implementation**

### **2.1 Geography Tab**

* Multi-tier cascading selectors:

  * State \> County \> City \> Zip Code

* Radius Search:

  * Enter address \+ select radius in miles

* Map Integration (optional):

  * Google Maps API or Leaflet.js for visual selection

### **2.2 Mortgage Tab**

* Range selectors and drop-downs:

  * Loan Amount (from/to)

  * Interest Rate (from/to)

  * Loan Type (Fixed, Adjustable, etc.)

  * Lender Name (text input with autocomplete)

  * Loan Term (drop-down: 15 yr, 30 yr, etc.)

  * Adjustable Rate Reset Dates (date pickers)

### **2.3 Property Tab**

* Dozens of criteria types:

  * Property Type

  * Lot Area (range)

  * Number of Bedrooms/Bathrooms

  * Stories/Floors (range)

  * Pool Present (checkbox)

  * Style, Units, Year Built (drop-downs)

  * Total Assessed Value, Living Area, Equity % (range fields)

  * State Land Use / County Land Use Codes (multi-selects)

  * Site/Waterfront Influence (checkbox list)

### **2.4 Demographics Tab**

* Owner-level data filters:

  * Age Range (multi-select)

  * Marital Status, Gender, Language

  * Estimated Income (range)

  * Credit Card Ownership (checkbox)

  * Interests (multi-select category chips)

### **2.5 Foreclosure Tab**

* Filter by activity stage:

  * Pre-foreclosure, Auction, Bank-Owned

* Key fields:

  * Default Amount

  * Unpaid Balance

  * Lender Name

  * Foreclosure Recording Date, Auction Date (date pickers)

### **2.6 Predictive Analytics Tab**

* Scoring system:

  * Likelihood to Refinance

  * Likelihood to Sell

  * Likelihood to Purchase HELOC

  * 5-point scale (Very Low to Very High)

* Each score available via checkboxes or multi-select

### **2.7 Options Tab**

* Property ownership flags:

  * Owner Occupied (Yes/No)

  * Corporate Owner (Yes/No)

  * Address Complete (Yes/No)

  * Trustee-owned (Yes/No)

---

## **3\. Input Types and Component Behaviors**

* **Range Selectors**: Two numeric inputs for min/max

* **Date Pickers**: Calendar widgets for from/to

* **Drop-downs**: Single-select or multi-select

* **Checklists**: Scrollable checkboxes for long lists

* **Typeaheads**: Text fields with autocomplete for lenders, cities, etc.

* **Multi-Select Chips**: For fields like interests or predictive score levels

Ensure all components update the left sidebar in real-time with selected filters.

---

## **4\. Search and Filter Logic**

* Each tab contributes to the unified query model

* All criteria are AND-combined across tabs

* Some options (like predictive scores) allow for inclusive OR filtering

* Filters should validate input (e.g., max \> min) and prevent invalid range overlaps

---

## **5\. Data Binding and State Management**

* Maintain global state per tab

* Bind all filter values to a unified query object

* Persist state when navigating between tabs

* Use debounce for live count previewing

---

## **6\. UX Considerations and Interactions**

* Sidebar summary updates live as criteria are added

* All drop-downs collapse on outside click

* Input validation with error feedback

* Responsive design: full support for tablets

* Hover tooltips for complex criteria explanations

* Collapse/expand panels inside each tab for better UX

---

## **7\. Export, Count, and Save Features**

* **View Count**: Button to retrieve matching record count

* **Save List**: Save current query to database for later reuse

* **Purchase**: Initiates payment flow and export process

* **Export Format**: CSV or XLSX output

Integrate with Stripe or custom checkout logic for purchasing lists based on count tier.

---

By following this guide, you can replicate ListSource's complex yet intuitive build-list system with modern web technology. Each feature here is derived from direct analysis of the real interface, and the architecture is designed for flexibility and scalability.

