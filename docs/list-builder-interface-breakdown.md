# **ListSource "Create Your Own" Build‑List Interface – Detailed Breakdown**

## **1\. Overall structure**

ListSource’s **Create Your Own** build‑list interface is organized as a wizard‑style tool for constructing targeted property mailing lists. The interface loads after sign‑in and clicking **Create Your Own**. It displays a set of tabs representing major categories of criteria and a large work area beneath the tabs where users choose and refine criteria. A **Current List** panel on the left shows selected criteria and the estimated record count as the list is built. Each tab contains a **Select Criteria** drop‑down or set of options. Selecting a criterion opens a secondary panel with fields, drop‑down menus, check boxes, or range selectors. Most panels feature two lists (Available vs. Selected) with **Add \>** and **\< Remove** buttons for transferring items. The bottom of each panel provides **Purchase List** and **Save Criteria** buttons, though purchasing is not performed during exploration.

## **2\. Geography tab (defining where the properties are)**

The **Geography** tab defines the territory of the mailing list. A drop‑down labelled **Select Criteria** contains numerous geographic filters. Selecting a criterion opens a panel explaining how it works, along with fields for entry and lists of available and selected items. Common controls include:

* **State selector** – Many panels require selecting a state first. Available states appear in a list box; users move them to the **Selected State** box with **Add**/**Remove** buttons. A note at the top of the tab states that four states (Montana, South Carolina, Idaho and Kansas) are excludedlistsource.com.

* **Add / Remove lists** – For cities, counties, ZIP codes, etc., there are dual list boxes for available and selected values. Selected items can be moved back and forth.

* **Manual entry fields** – Some criteria allow manual entry of codes (FIPS, parcel IDs, ZIP ranges, etc.).

Below is an organized list of Geography criteria and their key features.

| Criterion | Functionality & available options |
| ----- | ----- |
| **Area Code** | Users select a state and then choose one or more telephone area codes from an available list. A free‑form field allows entry of specific codes. Selected area codes are moved to the selected list and used to target properties by phone area codelistsource.com. |
| **Census Tract** | After choosing a state, the user selects or enters a census tract number. The panel has available and selected lists and an entry box for manual entry of tract numberslistsource.com. |
| **City** | Users select a state and then choose from available city names. The selected city list defines the geographic arealistsource.com. |
| **County** | Similar to the city filter but lists counties after choosing the state. Selected counties define the listlistsource.com. |
| **FIPS Code** | Lets users search by Federal Information Processing Standard (FIPS) codes. After choosing a state, there is a list of available codes and a field for manual FIPS or FIPS rangeslistsource.com. |
| **MSA (Metropolitan Statistical Area)** | After selecting the state, available MSAs are listed; selected MSAs become part of the criterialistsource.com. |
| **Map Book Page/Grid** | Used where local map books are still used; requires state and county, then allows entry of map book page and grid. Selected page/grid combinations are listedlistsource.com. |
| **Map Search** | Opens an interactive map (powered by Google Maps). Users can draw shapes on the map to define a custom polygon or radius area. This is the most visual way to select geographylistsource.com. |
| **Municipality/Township** | Requires selecting a state and county, then allows selection of municipal/township names from a listlistsource.com. |
| **Parcel ID Range** | Users choose a state and county and then enter parcel ID prefixes or ranges; selected ranges are added to the listlistsource.com. |
| **SCF (Sectional Center Facility)** | Targets the first three digits of ZIP codes; after selecting a state, available SCF codes are listed and can be selected or entered manuallylistsource.com. |
| **State** | Allows selecting one or multiple states. The available list shows all states except the excluded ones. The selected states define the list’s geographylistsource.com. |
| **Street Name** | For very precise targeting: users choose state and county, optionally enter a city, and then specify a street name along with low/high house numbers. Selected street segments are listedlistsource.comlistsource.com. |
| **Subdivision** | After selecting state and county, users can look up a subdivision by name or enter it manually. Available subdivisions are selected into the listlistsource.com. |
| **Tax Rate Area (tax millage code)** | Allows targeting properties by tax area; requires state and county, then users enter or choose tax millage codeslistsource.com. |
| **Township‑Range‑Section (TRS)** | For rural areas using PLSS (Public Land Survey System). Users select state and county and then enter or choose township, range and section numbers. Combinations can be added to the selected listlistsource.com. |
| **Tract** | Similar to census tract but uses local tract numbers; requires selecting state and county then entering a tract numberlistsource.com. |
| **ZIP \+ Radius** | Users enter a five‑digit ZIP code and select a radius (1–25 miles). The list shows selected ZIP/radius combinationslistsource.com. |
| **ZIP Code** | Enables selection of specific ZIP codes. After choosing a state, available ZIP codes are listed. Users may also type ZIP codes or ranges separated by commas. Selected ZIPs appear in a listlistsource.com. |

## **3\. Mortgage tab**

The **Mortgage** tab becomes active after at least one geographic criterion is selected. A description at the top explains that this tab provides search fields related to mortgage amount, mortgage date, lender name, loan‑to‑value and loan types. Two primary controls are available:

1. **Lien Position** – Radio buttons allow searching on **All Mortgages**, **First Mortgages**, or **Junior Mortgages**. Selecting a lien position filters the list accordingly (e.g., a first mortgage denotes the primary loan on a property).

2. **Select Criteria** – This drop‑down lists mortgage attributes that can be added to the search. Selecting an item opens a panel for the chosen criterion. The drop‑down includes a long list of mortgage fields (observed fields listed below). Users may add multiple criteria sequentially; each opens its own panel below the previous one. Because of time constraints, the session focused on the **Adjustable Rate Rider** criterion. However, the drop‑down also contains other search fields, such as **Balloon Loan**, **Combined Mortgage Amount**, **Credit Line Loan**, **Equity Loan**, **Interest Rate**, **Lender – Assigned Lender**, **Lender – Origination**, **Loan Rate Type**, **Loan‑to‑Value**, **Matured Mortgage**, **Maturity Date**, **Mortgage Amount**, **Mortgage Assignment Date**, **Mortgage Origination Date**, **Mortgage Term**, and **Primary Loan Type**.

### **3.1 Adjustable Rate Rider criterion (sub‑searches)**

Selecting **Adjustable Rate Rider** (ARR) opens a panel with a second drop‑down, **Select Adjustable Rate Rider Search**, because there are multiple sub‑criteria related to ARM loans. The panel includes the following sub‑options (the user may choose one at a time):

| ARR sub‑criterion | Description & options |
| ----- | ----- |
| **Interest Only** | Indicates if the loan is an interest‑only mortgage. Radio buttons: **Only** (select only interest‑only loans), **Exclude** (remove interest‑only loans) or **No Preference**listsource.com. |
| **Interest Rate % Change Limit** | Represents how much the interest rate can change during an adjustment period. The panel lists pre‑defined ranges (e.g., .001–.999 %, 1–1.999 %, etc.) with dual list boxes and **Add \>**/**\< Remove** buttons to choose rangeslistsource.com. |
| **Interest Rate Change %** | The actual percentage change the interest rate adjusts (again provided as ranges). Users select desired ranges from available lists and move them to selectedlistsource.com. |
| **Interest Rate Change Date** | Specifies the month and year when the interest rate is scheduled to change. Two radio buttons choose whether to search on the **Initial Change Date** (first adjustment only) or **Next Change Date** (initial and subsequent adjustments). Drop‑downs let users select a month and year; selected dates are added to a listlistsource.com. |
| **Interest Rate Change Frequency** | Defines how often the interest rate adjusts (e.g., monthly, quarterly, annually). Available frequencies are listed (Monthly, Quarterly, Annually), and users add desired frequencies to the selected listlistsource.com. |
| **Interest Rate Index Type** | ARM loans are tied to published indices. The available index types include **LIBOR**, **11th District**, **Prime**, **LAMA**, **Constant Maturity Treasury**, **Monthly Treasury Average**, **Treasury Bill**, **FNMA (Fannie Mae)** and **Other**. Users choose one or more index types from the listlistsource.com. |
| **Interest Rate Maximum % (Lifetime Cap)** | The maximum interest rate a borrower can pay during the life of the loan. Users select ranges (.001–.999 %, 1–1.999 %, etc.) via the dual list boxeslistsource.com. |
| **Negative Amortization** | Indicates whether the loan allows negative amortization. Radio buttons provide **Only**, **Exclude** or **No Preference** options. The panel explains that a Neg Am loan allows the unpaid interest to be added to principallistsource.com. |
| **Payment Option** | Describes a *monthly adjusting ARM* where borrowers can choose from several monthly payment options: 30‑ or 40‑year fully amortizing payment, 15‑year fully amortizing payment, interest‑only payment, minimum payment or more than minimum. Radio buttons let users specify **Only**, **Exclude**, or **No Preference**listsource.com. |
| **Prepayment Penalty** | A simple panel indicating whether there is a prepayment penalty on the mortgage. Radio options: **Only**, **Exclude**, or **No Preference**listsource.com. |
| **Prepayment Penalty Expire Date** | Allows selection of the month and year when the prepayment penalty expires. The panel explains this and provides month/year drop‑downs and an **Add \>** button to compile selected dates. A **Selected Prepayment Penalty Expire Date** list box displays the chosen valueslistsource.com. |

### **3.2 Other mortgage criteria**

The main **Select Criteria** drop‑down lists several other mortgage fields (Balloon Loan, Combined Mortgage Amount, Credit Line Loan, Equity Loan, Interest Rate, etc.). Due to time restrictions these panels were not examined, but based on patterns in the interface they likely contain similar dual lists or input fields for ranges (for amounts and dates). Users can mix and match multiple mortgage filters by selecting them sequentially; each adds to the *Current List* summary on the left.

## **4\. Current List panel**

On the left side of the interface, a **Current List** panel shows selected geography and mortgage criteria with record counts. Each criterion is displayed as a node in a tree (e.g., *Geography \> State \> All States*, *Mortgage \> First Mortgage*). Counts update dynamically as more filters are selected. A red “X” appears next to each criterion, allowing users to remove it. This panel helps users track how each criterion affects the available record count and ensures they have at least one geographic area selected before applying further filters.

## **5\. Property tab – physical and valuation filters**

Once a geography is selected, the **Property** tab becomes available. A drop‑down labelled **Select Criteria** lists dozens of physical and financial attributes of a property. Selecting any item opens a dedicated panel where the user can choose from predefined ranges or categories, enter custom ranges, and transfer selections into a **Selected** list. The following table summarizes the property criteria encountered during the study:

| Property criterion | Functionality & available options |
| ----- | ----- |
| **Last Market Sale Price** | Offers a list of sale‑price ranges (e.g., $1–$50 k, $50 k–$100 k, $100 k–$200 k, continuing into million‑dollar increments). Users may also type a **From** and **To** price to create custom ranges. Selected ranges appear in a list and are applied to filter propertieslistsource.com. |
| **Equity ($)** | Searches by estimated lien equity in dollars. The panel lists negative equity ranges ($1 to –$10 k, –$10,001 to –$20 k, etc.) along with Add/Remove controlslistsource.com. |
| **Equity (%)** | Similar to the dollar‑equity filter, this panel lets users select percentage‑equity ranges (e.g., 1 to –20 %, –21 to –30 %, etc.) or manually enter **From** and **To** percentageslistsource.com. |
| **Current Home Value** | Provides a list of estimated home‑value ranges ($1–$50 k, $50 k–$100 k, etc.) plus **From**/**To** fields for custom value rangeslistsource.com. |
| **Homestead Property** | Determines whether the owner receives a homestead or homeowner tax exemption. Radio options: **Only** (return only homesteaded properties) or **No Preference**listsource.com. |
| **Bathrooms / Bedrooms** | Separate panels for the number of bathrooms and bedrooms. Each includes **From**/**To** numeric fields to define the desired range and an **Add \>** button to build a list of acceptable countslistsource.comlistsource.com. |
| **Above Grade Area** | Searches by the finished living area above grade (in square feet). Users enter minimum and maximum square footage values and add them to the selected listlistsource.com. |
| **Basement Area** | Similar to above‑grade area but targets finished or unfinished basement square footagelistsource.com. |
| **Basement Type** | Lists basement types such as Basement, Cellar, Complete, Crawl, Daylight, Finished, Full, Michigan, etc. Users transfer desired types to the selected listlistsource.com. |
| **Bldg/Living Area** | Provides pre‑set living‑area ranges (1–500 sq ft, 501–1 000 sq ft, etc.) with Add/Remove controls. Custom ranges may also be enteredlistsource.com. |
| **Buildings – Number of** | Targets properties with multiple structures. Users specify **From**/**To** numbers of buildings and add the range to the selected listlistsource.com. |
| **County Land Use / State Land Use** | Require the user to pick a state and county. Available land‑use codes are listed, and selected codes filter the listlistsource.comlistsource.com. |
| **Improved % / Improved Value / Land Value** | Three related panels. **Improved %** searches by the ratio of improvement value to total assessed value, using **From**/**To** percentage fieldslistsource.com. **Improved Value** and **Land Value** allow users to specify dollar‑value ranges of the improvements or land portionlistsource.comlistsource.com. |
| **Last Market Recording Date** | Filters by the month/year when the last market sale was recorded. Date pickers allow custom **From** and **To** dates, and preset quick‑select options (Last 1 Week, Last 2 Weeks, etc.) are availablelistsource.com. |
| **Last Market Sale Date** | Similar to recording date but refers to the date of sale. Provides date range selectors and quick presetslistsource.com. |
| **Last Market Sale Deed Type** | Lists numerous deed types (Administrator’s Deed, Affidavit, All Inclusive Deed of Trust, etc.). Users move desired deed types to the selected listlistsource.com. |
| **Last Market Sale Price** | Another sale‑price filter (similar to the first criterion) for targeting by the most recent market sale amountlistsource.com. |
| **Length of Residence** | Provides categories representing how long the owner has lived at the property (0–3 months, 1–2 years, 3–5 years, etc.). Users select one or more categorieslistsource.com. |
| **Lot Area** | Filters by lot size. Radio buttons let users choose units (square feet or acres). **From**/**To** fields specify the rangelistsource.com. |
| **Parking Spaces / Parking Type** | *Parking Spaces* uses **From**/**To** fields to specify the number of spaceslistsource.com. *Parking Type* lists options such as Adequate Capacity, Aluminum Carport, Aluminum Garage, etc., with Add/Remove selectionlistsource.com. |
| **Pre‑Foreclosure (Property)** | Allows users to include or exclude properties with pre‑foreclosure indicators. Radio buttons: **Only**, **Exclude**, **No Preference**listsource.com. |
| **Property Type** | Provides either general property types (e.g., Agricultural, Commercial, Industrial) or detailed types. A preset choice selects only *Single Family Residences (1–4 units)*. Users add the desired types to the selected listlistsource.com. |
| **Site/Waterfront Influence** | Lists location attributes such as Airport, Bay Front, Beach, Canal, City, Golf Course, Lake Front, Mountain, Ocean Front, River, Waterfront – with numerous other influences. A preset selects only properties influenced by waterlistsource.com. |
| **Stories/Floors** | Allows searching for properties with multiple stories or floors. Users enter minimum and maximum story counts in **From**/**To** fields and add them to the selected list (useful for distinguishing one‑story vs. multi‑story structures). |
| **Style** | Searches by architectural style. The available list includes A‑Frame, Antique/Historic, Art Deco, Bi‑Level, Bungalow, Cabin, Cape Cod, Chalet/Alpine, Cluster, Coach/Carriage House and many more. Users add one or more styles to the selected listlistsource.com. |
| **Swimming Pool Present** | Simple yes/no filter. Radio buttons: **Only** (include only properties with a pool), **Exclude** (remove properties with a pool) or **No Preference**listsource.com. |
| **Total Assessed Value / Tax Reduction** | This panel offers two related searches. **Total Assessed Value** lets users choose from a list of assessed‑value ranges ($1–$50 k up to $2.5 M+). **Tax Reduction** computes the ratio of assessed value to current home value; users select percentage ranges. Both include **From**/**To** fields for custom rangeslistsource.com. |
| **Units – Number of** | Targets properties with a specified number of dwelling units (e.g., duplexes or multi‑unit buildings). Users enter a **From** and **To** unit count and add the range to the selected listlistsource.com. |
| **Year Built** | Allows searching for properties built in a specific year or range of years. **From** and **To** fields capture the year; selections appear in the selected listlistsource.com. |

This extensive list shows how ListSource enables highly granular targeting of properties based on physical attributes, valuation, parking, building composition, and other characteristics.

## **6\. Demographics tab – occupant characteristics**

The **Demographics** tab provides filters related to the occupants or owners of a property. After selecting a geography, users open the **Select Criteria** drop‑down and choose one demographic field at a time. Observed criteria include:

| Demographic criterion | Functionality & options |
| ----- | ----- |
| **Age** | A list of age ranges (19–24 years, 25–34 years, 35–44 years, 45–64 years, 65+ years, Unknown). Users may also specify a custom age range using **From**/**To** fieldslistsource.com. |
| **Contributor** | Identifies donors or contributors; the available list contained a single value, *Environmental*, which can be selectedlistsource.com. |
| **Education** | Lists highest education levels (Bachelor Degree, Graduate Degree, High School Diploma, Less Than High School Diploma, Some College, Unknown) with Add/Remove selectionlistsource.com. |
| **Credit Cards** | Indicates whether the household holds a premium credit card or a regular credit card. Users choose one or both categorieslistsource.com. |
| **Estimated Income** | Provides household income ranges: $15 k–$24.9 k, $25 k–$34.9 k, $35 k–$49.9 k, $50 k–$74.9 k, $75 k–$99.9 k, $100 k–$149.9 k, $150 k–$174.9 k, $175 k–$199.9 k, $200 k–$249.9 k, $250 k+ and Unknown. Custom **From**/**To** fields allow additional rangeslistsource.com. |
| **Interests** | Categories such as Computers, Decorating, Dogs, Fitness, Funds, Gourmet, Investors, Outdoors, Pets, Sports. Users select one or more interests for targeted marketinglistsource.com. |
| **Language** | A long list of languages (Afrikaans, Albanian, Amharic, Arabic, Ashanti, Azeri, Bantu, Basque, Bengali, Kyrgyz, Korean, Laotian, Latvian, Lithuanian, Macedonian, Malay, Moldavian, Mongolian, Norwegian, Oromo, etc.). Available languages are added to the selected list via Add/Remove controlslistsource.com. |
| **Marital Status** | Radio buttons to select **Married**, **Single**, or **No Preference**listsource.com. |
| **Year of Birth** | Provides a scrollable list of birth years (from around 1900 through 2007). Users can select specific years or enter **From**/**To** years to capture an age cohortlistsource.com. |

These demographic filters allow marketers to refine lists based on the characteristics of the occupants rather than the physical property.

## **7\. Foreclosure tab – distressed‑property filters**

The **Foreclosure** tab enables targeting of properties in various stages of the foreclosure process. At the top of the tab there is a **Foreclosure Stage** section with radio buttons for **Default (Pre‑foreclosure) Initiated**, **Pending Auction Sale**, and **Bank‑Owned (REO)**; only one stage can be selected at a time. The **Select Criteria** drop‑down lists additional foreclosure‑specific filters:

| Foreclosure criterion | Description |
| ----- | ----- |
| **Recent Added Date** | Filters records by when the foreclosure information was added or changed. Users choose a **From**/**To** date or select quick ranges (Last 1 Month, Last 3 Months, Last 6 Months, Last 9 Months, Last 12 Months). Selected date ranges appear in a listlistsource.com. |
| **Default Amount** | Lists ranges of default amounts (Unknown, $1–$5 k, $5–$10 k, $10–$15 k, continuing in $5 k increments). Users may also enter custom amount rangeslistsource.com. |
| **Foreclosure Effective Date** | Similar interface to **Recent Added Date**; this filter targets the effective date of the foreclosure filing. Includes **From**/**To** date pickers and quick‑range buttons (Last 1 Month, etc.). |
| **Lender Name – Foreclosure** | Allows selection of current lenders responsible for the foreclosure. A lookup field and available/selected lists let users choose specific lenderslistsource.com. |
| **Original Lender Name** | Filters by the lender who originated the mortgage. Uses lookup and Add/Remove lists similar to the foreclosure lender filterlistsource.com. |
| **Original Mortgage Amount** | Provides ranges of original loan amounts (Unknown, $1–$50 k, $50 k–$100 k, etc.) plus custom range fieldslistsource.com. |
| **Original Recording Date** | Date‑range filter for the original mortgage recording date. Includes quick‑range radio options (Last 1–12 Months)listsource.com. |
| **Unpaid Balance Amount** | Lists ranges of unpaid balance amounts or judgment amounts (Unknown, $1–$50 k, $50 k–$100 k, etc.) with Add/Remove controlslistsource.com. |

These filters help identify distressed properties based on foreclosure status, timing, lenders involved and financial details.

## **8\. Predictive Analytics tab – likelihood scores**

ListSource offers proprietary predictive models under the **Predictive Analytics** tab. A drop‑down lists five predictive scores, each with five categories representing the likelihood that a homeowner will undertake a particular action. After selecting a score, a panel appears with available likelihood categories (**Very Low \[1–370\]**, **Low \[371–480\]**, **Moderate \[481–600\]**, **High \[601–795\]**, **Very High \[796–999\]**) that can be added to the selected list. Scores studied include:

1. **Likelihood to apply for a HELOC (home‑equity line of credit)**listsource.com.

2. **Likelihood to apply for a purchase mortgage**listsource.com.

3. **Likelihood to refinance**listsource.com.

4. **Likelihood to list their home for rent**listsource.com.

5. **Likelihood to list their home for sale**listsource.com.

Selecting one or more score categories allows marketers to target households based on predicted behaviour derived from thousands of variables and updated monthly.

## **9\. Options tab – special filters**

The **Options** tab contains high‑level filters that control record types and address quality rather than property or owner attributes. The interface groups settings with radio buttons:

| Option | Choices |
| ----- | ----- |
| **Owner Occupied Status** | **Owner Occupied**, **Absentee Owner**, **No Preference** – selects owner‑occupied versus absentee propertieslistsource.com. |
| **Trustee‑Owned Properties** | **Only**, **Exclude**, **No Preference** – include only trustee‑owned properties, exclude them, or disregard this factorlistsource.com. |
| **Corporate‑Owned Properties** | **Only**, **Exclude**, **No Preference** – similar options for corporate ownershiplistsource.com. |
| **Address Completeness Requirements** | Choose to require: **Mailing address complete**, **Mailing address and ZIP+4 complete**, **Property address complete**, **Both mailing and property address complete**, or **No Preference**listsource.com. |

These settings ensure that purchased lists meet address quality standards and that marketing campaigns reach the desired owner types.

## **10\. Instructions for replicating the interface**

To recreate this mailing‑list builder on your own website, follow these guidelines based on the observed interface:

1. **Tabbed Navigation** – Provide tabs for each major category (Geography, Mortgage, Property, Demographics, Foreclosure, Predictive Analytics, Options). Use clear labels and highlight the active tab.

2. **Current List summary** – Display a side panel summarizing selected criteria. Use a tree structure showing categories and sub‑criteria with record counts. Include an “X” to remove any criterion and update counts dynamically.

3. **Select Criteria drop‑down** – Within each tab, implement a drop‑down listing all available search fields for that category. When a user chooses an item, load a new panel below the list explaining the criterion and offering selection controls.

4. **Dual list boxes** – For most criteria, implement a left box of *available* values and a right box of *selected* values. Provide **Add \>** and **\< Remove** buttons to move items between the lists. For longer lists, support scrolling and search within the available box.

5. **Manual entry fields** – Provide text boxes for codes or ranges (FIPS, ZIP ranges, parcel IDs). Validate entries and allow comma‑separated values and hyphenated ranges where appropriate.

6. **Date selectors** – For criteria based on dates (e.g., interest‑rate change date, maturity date), include month and year drop‑downs and allow the user to add multiple dates to a selected list.

7. **Range selectors** – For numeric ranges (e.g., interest rate change %, loan amount), present a list of pre‑defined ranges or let users enter low/high values. Use dual lists for selecting desired ranges.

8. **Radio buttons** – For binary or tri‑state options (Only/Exclude/No Preference), present radio buttons with a concise explanation of what the criterion means.

9. **Interactive map** – To allow custom geographic selection, embed an interactive map (Google Maps or similar) where users can draw polygons or set radii. Provide tools to add shapes to the selection and remove them.

10. **Save and purchase controls** – At the bottom of each panel, include buttons to *Save Criteria* (store the current selections for later use) and *Purchase List* (begin the checkout process). Ensure these buttons are disabled until required information is selected.

11. **Dependency enforcement** – Enforce dependencies (e.g., require at least one geography criterion before enabling Mortgage, Property, or Demographics tabs).

12. **Helpful descriptions** – Each panel should include a succinct description of the criterion’s purpose and how the options affect the list. Use tooltips or help icons for additional guidance.

## **11\. Conclusion**

ListSource’s **Create Your Own** interface is a sophisticated tool for building targeted property mailing lists. By combining geographic filters (states, cities, ZIP codes, map shapes) with mortgage attributes (lien position, adjustable‑rate rider details, loan amount ranges), and optionally property, demographic and foreclosure data, users can refine lists to match very specific marketing objectives. The interface relies on consistent design patterns: drop‑down lists to choose criteria, dual list boxes for selecting values, radio buttons for simple yes/no filters, and date/range selectors for numeric criteria. Implementing similar patterns on your website will allow you to replicate the functionality of ListSource’s mailing‑list builder.

