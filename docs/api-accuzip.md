# **AccuZIP API Integration Guide for Direct Mail Campaign Order Processing**

This document outlines the necessary steps, API calls, and considerations for integrating the AccuZIP REST API into your web application to validate customer mailing lists, obtain deliverable and undeliverable address counts, update order quantities, and generate a filtered list of only deliverable addresses.

## **1\. Introduction**

This document provides a comprehensive guide for developers to integrate AccuZIP's cloud-based Data Quality (DQ) and Mail Processing REST API. The primary goal is to validate customer-uploaded mailing lists, calculate deliverable and undeliverable addresses, adjust order quantities based on deliverable counts, display undeliverable counts to customers, and provide a downloadable CSV containing only deliverable records for checkout.

## **2\. AccuZIP API Overview**

The AccuZIP REST API offers a 100% cloud-based solution for various mail processing tasks, including CASS Certification, NCOALink Certification, Duplicate Detection, Postal Presorting, and generating print-ready files. All API interactions utilize specific base URLs:

* **Web Services:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/`  
* **Web Applications (Upload/Download):** `https://cloud2.iaccutrace.com/ws_360_webapps/`

## **3\. Authentication**

Authentication for most API calls requires an **API Key**, which is a GUID key provided with your AccuZIP account. You can retrieve information about your account and access level using the `Account Info` web service.

### **Account Info Endpoint**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO`  
* **Method:** `POST`  
* **Body (Required):** `<apiKey>`

**Access Levels:**

* **2:** Direct Mail  
* **3:** Direct Mail and Limited 25-record Mailing Lists Test Environment  
* **4:** Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment  
* **5:** Direct Mail with EDDM and Mailing Lists

**Success Response Example:**

{  
  "account\_type": "Subscription",  
  "level": "4",  
  "success": true,  
  "active": true,  
  "credits\_remaining": {  
    "total": "106",  
    "monthly": "96",  
    "annual": "193"  
  },  
  "services": "Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment",  
  "credits\_used": {  
    "total": "94",  
    "monthly": "4",  
    "annual": "7"  
  }  
}

**Error Response Example:**

{  
  "success": false,  
  "message": "submitted API\_KEY not found \<\<apiKey\>\>"  
}

## **4\. API Rate Limits and File Constraints**

**File Upload Rate Limits:**

* Maximum of **12 individual files** can be uploaded per minute under the same API Key  
* When limit exceeded, API returns HTTP 409 Conflict with Retry-After header

**File Size Constraints:**

* **Minimum:** 3 rows (including header and 2 detail rows)  
* **Maximum:** 2,000,001 rows (including header and detail rows)  
* Each row must be terminated with Carriage Return and Line Feed (CRLF) or Line Feed (LF) only  
* File extension must always be `.csv`

**Rate Limit Error Response (HTTP 409 Conflict):**

{  
  "success": false,  
  "message": "You have attempted to upload too many files within a one (1) minute period. Please wait 4 seconds before attempting to upload a new file. File Upload Limit: 12 per minute"  
}

**File Size Violation Responses:**

*Minimum violation (HTTP 400 Bad Request):*

{  
  "success": false,  
  "message": "File line count of {fileCount} is less than required count of 3."  
}

*Maximum violation (HTTP 400 Bad Request):*

{  
  "success": false,  
  "message": "File line count of {fileCount} is more than the required count of 1000001."  
}

**Additional Resources:**

* Complete API Documentation: docs.accuzip.com  
* API Technical Support: api@accuzip.com

## **5\. Workflow Steps for Mailing List Validation and Filtering**

The following steps detail the interaction with the AccuZIP API to achieve your desired use case:

### **Step 1: Upload Mailing List for Validation**

The first step is to upload the customer's mailing list and initiate Data Quality (DQ) processing to obtain validation results.

#### **File Format Requirements**

* **File Extension:** MUST ALWAYS be `.csv` (e.g., `myfilename.csv`). Files with different extensions will be ignored.  
* **Delimiter:** The data can be **TAB, PIPE, or COMMA-SEPARATED**  
* **Row Termination:** Each row must be terminated with CRLF (Carriage Return \+ Line Feed) or LF (Line Feed) only  
* **Minimum Rows:** Files must contain a **minimum of 3 rows** (including header and 2 detail rows)  
* **Header Record:** The **first row must be the Header Record** describing the columns

#### **Required Column Names (Case-insensitive matching)**

* **`First`**: Can contain First and Last Name; Name Prefix, First, Middle and Last; or just First name (e.g., "John Smith", "Mr. John M Smith", "John")  
* **`Address`**: The primary address (e.g., "100 Main St", "PO Box 1")  
* **`City`**: Can contain City, State, and Zip; City, State; or just City name (e.g., "Los Angeles CA 90001", "Los Angeles CA", "Los Angeles")

#### **Optional Column Names**

* `Sal`: Name prefix (e.g., "Mr", "Mrs", "Mr. and Mrs.")  
* `Middle`: Middle name of the contact  
* `Last`: Last name of the contact  
* `Address2`: Secondary address information (e.g., "Ste 200", "\# 200")  
* `St`: State abbreviated name (e.g., "CA", "TX")  
* `Zip`: ZIP or ZIP+4 code (e.g., "99999", "99999-9999")  
* `Urban`: Puerto Rico Urbanization Name  
* `Company`: Company/firm name (important for NCOA purposes)

**Complete Column Name Reference:** For a comprehensive list of all supported column names, refer to: http://www.accuzip.com/files/CompleteColumnNameList.xlsx

#### **File Content Examples**

**Comma Separated File:**

"first","last","address","address2","city","st","zip"  
"John","Smith","PO Box 7602","","St Thomas","VI","00801"

**PIPE Separated File:**

"first"|"last"|"address"|"address2"|"city"|"st"|"zip"  
"John"|"Smith"|"PO Box 7602"|""|"St Thomas"|"VI"|"00801"

#### **Upload File Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/v2_0/uploadProcess.jsp?manual_submit=false`  
* **Method:** `POST`  
* **URL Parameters (Required):** `manual_submit=false`

#### **Required Data Parameters (Order is extremely important)**

* `backOfficeOption`  
* `json`  
* **`apiKey`**: Your AccuZIP API Key  
* **`callbackURL`**: A URL on your server where AccuZIP will send an HTTP GET notification with the `guid` upon job completion (e.g., `http://mysite.com/getAccuzipCallback.php`). This acts as a webhook.  
* **`guid`**: A unique identifier for the uploaded job  
* `file`: The filepath of the uploaded CSV file

#### **Field Mapping Parameters (Use when your column names differ from defaults)**

* `col_address`: Header Field Name for Mailing Address (e.g., "my address")  
* `col_address2`: Header Field Name for Secondary Address (e.g., "my adr2")  
* `col_city`: Header Field Name for City name (e.g., "my city")  
* `col_st`: Header Field Name for State abbreviation (e.g., "my state")  
* `col_zip`: Header Field Name for ZIP Code or ZIP+4 (e.g., "my zip code")

#### **Additional Data Parameters**

* **`des_credits=false`**: Setting this value to `true` will trigger the GET QUOTE to return the number of credits that you have in your account  
* **`list_owner_paf_id`**: PAF ID assigned by AccuZIP to process files through their Licensed NCOALink service

#### **Recommended Additional Data Parameters for Data Quality Results**

* **`dataQualityResults_CASS=true`**: For CASS ONLY data quality results  
* **`dataQualityResults_NCOA=true`**: For CASS AND NCOA data quality results

**Important:** Only one of the `dataQualityResults_*` settings can be used in a single upload call. These settings provide more accurate postage totals and rate categories compared to the basic `dataQualityResults=true` option.

#### **Available Data Quality Result Settings**

* `dataQualityResults_CASS`: CASS ONLY data quality results  
* `dataQualityResults_NCOA`: CASS AND NCOA ONLY data quality results  
* `dataQualityResults_NCOA_DUPS_01`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND COMPANY  
* `dataQualityResults_NCOA_DUPS_02`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND FIRST AND LAST NAME  
* `dataQualityResults_NCOA_DUPS_03`: CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME  
* `dataQualityResults_DUPS_01`: CASS AND DUPLICATE DETECTION BY ADDRESS AND COMPANY ONLY  
* `dataQualityResults_DUPS_02`: CASS AND DUPLICATE DETECTION BY FIRST AND LAST NAME ONLY  
* `dataQualityResults_DUPS_03`: CASS AND DUPLICATE DETECTION BY HOUSEHOLD NAME ONLY

#### **Success Response**

{  
  "success360Import": true,  
  "quote\_started": true,  
  "cass\_started": false,  
  "guid": "7ebb2c37-648b-4f6e-aa6d-240dc55aef2c"  
}

#### **Error Response**

{  
  "success": false,  
  "message": "ERROR Invalid API Key\!"  
}

### **Step 2: Retrieve Data Quality Results and Counts**

After uploading the file, you need to make a `GET QUOTE` call to retrieve the Data Quality (DQ) results, including counts for deliverable and undeliverable addresses.

#### **Get Quote Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`  
* **Method:** `GET`  
* **URL Parameters:** `<guid>`: The GUID obtained from the Upload File success response

#### **Success Response Content Examples**

**Default Content (Approximate values):**

{  
  "task\_name": "FINISHED",  
  "First\_Class\_Flat": "$619",  
  "task\_percentage\_completed": "100",  
  "Estimated\_Postage\_Standard\_Card": "$549",  
  "Estimated\_Postage\_Standard\_Letter": "$549",  
  "format": "",  
  "task\_state": "FINISHED",  
  "First\_Class\_Card": "$154",  
  "success": true,  
  "total\_records": "2,001",  
  "postage\_saved": ""  
}

**Content when using `dataQualityResults_*` parameters:**

{  
  "dq\_dpvhsa\_s": "70",  
  "dq\_dpvhsa\_d": "11",  
  "dq\_dpvhsv": "31",  
  "dq\_dpvhsa\_y": "1892",  
  "dq\_dpvhsa\_n": "27",  
  "dq\_message": "DQ results have been calculated successfully",  
  "success": true,  
  "total\_records": "2000"  
}

**Enhanced Content with New dataQualityResults Settings:**

{  
  "dq\_dpvhsa\_s": "70",  
  "First\_Class": \[{  
    "flat": \[{"postage": "1126.12", "AB": "91", "PRESORT": "0", "MB": "30", "savings": "846.88", "5B": "470", "SP": "27", "3B": "1355"}\],  
    "letter": \[{"postage": "812.98", "AB": "1186", "PRESORT": "0", "MB": "760", "savings": "114.33", "5B": "0", "SP": "27", "3B": "0"}\],  
    "card": \[{"postage": "529.70", "AB": "1186", "PRESORT": "0", "MB": "760", "savings": "160.85", "5B": "0", "SP": "27", "3B": "0"}\]  
  }\],  
  "Standard": \[{  
    "flat": \[{"AB": "77", "AD": "8", "HP": "0", "5B": "607", "CR": "0", "3B": "1233", "5D": "0", "postage": "930.72", "3D": "3", "MB": "29", "MD": "16", "savings": "1042.28", "WS": "0", "HD": "0", "SP": "0"}\],  
    "letter": \[{"AB": "1186", "AD": "0", "HP": "0", "5B": "0", "CR": "0", "3B": "0", "5D": "0", "postage": "548.86", "3D": "0", "MB": "787", "MD": "0", "savings": "378.45", "WS": "0", "HD": "0", "SP": "0"}\]  
  }\],  
  "Duplicates": \[{"found": "20", "description": "by Address and First and Last Name", "setting": "2"}\],  
  "NCOALink": \[{"months\_19\_48": "205", "matches": "296", "months\_1\_18": "91", "moved\_no\_forwarding": "7"}\],  
  "dq\_dpvhsa\_d": "11",  
  "dq\_dpvhsv": "31",  
  "dq\_dpvhsa\_y": "1892",  
  "dq\_message": "DQ results have been calculated successfully",  
  "dq\_dpvhsa\_n": "27",  
  "success": true  
}

#### **Data Quality (DQ) Result Field Descriptions**

These fields provide detailed information about the DPV (Delivery Point Validation) status of addresses:

* **`dq_message`**: "DQ results have been calculated successfully"  
* **`dq_dpvhsa_y`**: Number of addresses DPV confirmed for both primary and (if present) secondary numbers (perfect addresses)  
* **`dq_dpvhsa_d`**: Number of addresses DPV confirmed for the primary number only, with secondary number information missing  
* **`dq_dpvhsa_s`**: Number of addresses DPV confirmed for the primary number only, with secondary number information present but unconfirmed  
* **`dq_dpvhsa_n`**: Number of addresses where both primary and (if present) secondary number information failed DPV Confirmation  
* **`dq_dpvhsv`**: Number of addresses identified as Vacant for at least 90 days

#### **Calculation of Deliverable and Undeliverable Addresses**

**Deliverable Addresses (for order quantity):**

* Use the value of `dq_dpvhsa_y` (addresses confirmed for both primary and secondary numbers)

**Undeliverable Addresses (to display to customer):**

* Sum of `dq_dpvhsa_d` \+ `dq_dpvhsa_s` \+ `dq_dpvhsa_n` \+ `dq_dpvhsv`

#### **Processing Status Monitoring**

Monitor the processing status using these JSON objects in GET QUOTE responses:

* **`task_name`**: Describes the current task (e.g., "OPTIMIZING", "CASS CERTIFY", "NCOALINK", "DUPLICATE DETECTION", "PRESORT", "FINISHED")  
* **`task_percentage_completed`**: Either "0" (Started) or "100" (Finished)  
* **`task_state`**: Returns "FINISHED" only when the entire process is completed and files are ready for download

#### **Error Responses**

{  
  "message": "QUOTE is still processing.",  
  "success": false  
}

### **Step 3: Update Order Quantity and Display Undeliverable Addresses (Application Logic)**

Using the counts obtained in Step 2:

1. **Update Order Quantity:** Adjust your application's order quantity for the direct mail campaign with the calculated **Deliverable Addresses** (`dq_dpvhsa_y`)  
2. **Display Undeliverable Count:** Present the total **Undeliverable Addresses** (sum of `dq_dpvhsa_d`, `dq_dpvhsa_s`, `dq_dpvhsa_n`, and `dq_dpvhsv`) to the customer in your web application

### **Step 4: Configure Mail Processing Parameters**

Before processing the list, you must configure the mail piece parameters and postal settings using the Update Quote endpoint.

#### **Update Quote Web Service Call (Set Mail Parameters)**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`  
* **Method:** `PUT`  
* **Header Parameters (Required):** `Accept: application/json` or `application/xml`

**Important Settings for Mail Processing:**

* Set `presort_class` (e.g., "STANDARD MAIL")  
* Set `mail_piece_size` (e.g., "LETTER" or "FLAT")

**JSON Configuration Example:**

{  
  "presort\_class": "STANDARD MAIL",  
  "mail\_piece\_size": "LETTER"  
}

**For EDDM mailings, you must set:**

{  
  "presort\_class": "STANDARD MAIL (EDDM)",  
  "mail\_piece\_size": "LETTER"  
}

**Available Settings:** See available settings at http://www.accuzip.com/files/json\_values.xlsx and JSON example at http://www.accuzip.com/files/json\_values\_example.json

**Success Response:** `HTTP 200 - OK` **Error Response:** `HTTP 404 – NOT_FOUND`

### **Step 5: Process List with Filters and Mail Processing**

Use one of the comprehensive processing endpoints that combine CASS Certification, NCOALink, Duplicate Detection, and Presort. These all-in-one endpoints automatically apply filters to exclude undeliverable records.

**Available All-in-One Processing URLs:**

**CASS Certification, NCOALink, Duplicate Detection and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_01-PRESORT` (Duplicates by ADDRESS and COMPANY)  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_02-PRESORT` (Duplicates by FIRST AND LAST NAME)  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_03-PRESORT` (Duplicates by HOUSEHOLD NAME)

**CASS Certification, Duplicate Detection and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_01-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_02-PRESORT`  
* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_03-PRESORT`

**CASS Certification, NCOALink and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-PRESORT`

**CASS Certification and Presort:**

* `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-PRESORT`

**Method:** `GET` **URL Parameters:** `<guid>`: The GUID for the job

**Success Response:**

{  
  "success": true  
}

**Important Notes:**

* These all-in-one calls run **asynchronously**, meaning control is returned immediately  
* A `callbackURL` notification will be sent upon completion  
* Individual API calls (CASS, NCOA, DUPS, PRESORT) run synchronously and wait for completion

### **Step 6: Download Deliverable-Only CSV**

Once the filtering and processing are complete, you can download the print-ready CSV file containing only the deliverable records.

#### **Download Print Ready CSV Web Service Call**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=csv`  
* **Method:** `GET`  
* **URL Parameters:**  
  * `<guid>`: The GUID for the job  
  * `ftype=csv`: Specifies that you want the full print-ready, presorted CSV file

**Available File Types:**

* `csv`: Full print-ready, presorted CSV file  
* `prev.csv`: First 25 records of the print-ready CSV for preview  
* `json`: The entire CASS or CASS/NCOALink processed file in JSON format  
* `presort.json`: A JSON file specific to presort data

**Success Response:** The raw content of the CSV file will be streamed directly. This file will contain only the addresses that passed your specified filters, ready to be attached to the order.

**Error Response Examples:**

* `HTTP 500 – INTERNAL_SERVER_ERROR`  
* `HTTP 500 – BAD REQUEST`  
* `HTTP 200 – OK` with error message: `{"success":false,"message":"File with specified extension does NOT exist"}`

## **6\. Individual Processing Steps (Alternative Approach)**

For applications requiring more granular control over the processing pipeline, you can execute individual processing steps:

### **CASS Certification**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS`  
* **Method:** `GET`  
* **Purpose:** Clean and standardize all addresses in the file

**Success Response:**

{  
  "Addresses": {"Rows": \[\]},  
  "NoFilteredRows": 0,  
  "TotalRows": 0,  
  "success": true  
}

### **NCOALink Certification**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/NCOA`  
* **Method:** `GET`  
* **Purpose:** Process names and addresses through Licensed NCOALink for Change of Address matching

**Requirements:** AccuZIP must have a fully executed Processing Acknowledgment Form (PAF) on file for each List Owner. Electronic PAF completion available at: http://accuzip.com/products/ncoalink/paf/new

**Success Response:**

{  
  "success": true  
}

### **Duplicate Detection**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPS/<duplicateSubType>`  
* **Method:** `GET`  
* **URL Parameters:**  
  * `<duplicateSubType>`:  
    * `01` \- Address Only and if exists, Company  
    * `02` \- First and Last name  
    * `03` \- Household name

**Success Response:**

{  
  "success": true  
}

### **Presort Postal Discounts**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/PRESORT`  
* **Method:** `GET`  
* **Purpose:** Process CASS Certified addresses through Cloud Presort engine for lowest postage rates

**Success Response:**

{  
  "success": true  
}

## **7\. Advanced Data Retrieval and Review**

The API provides endpoints to retrieve processed records for customer review:

### **Retrieve CASS Certified Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CleanAddresses/<filterSubType>`  
* **Method:** `GET`  
* **Filter Sub Types:**  
  * `2` \- Unit number provided but not verified  
  * `3` \- Unit number missing from known high-rise address  
  * `4` \- Vacant  
  * `5` \- Business address  
  * `6` \- Private Mail Box address  
  * `7` \- Address not valid  
  * `8` \- Missing address element(s)  
  * `9` \- Foreign  
  * `99` \- All

### **Retrieve NCOALink Certified Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/MoveUpdate/<filterSubType>`  
* **Method:** `GET`  
* **Filter Sub Types:**  
  * `1` \- Moved \- COA Matches  
  * `2` \- Moved \- New Address cannot be confirmed  
  * `3` \- Moved \- Left No Forwarding  
  * `4` \- Moved \- Foreign Country  
  * `5` \- Moved \- New State  
  * `6` \- Individual Match  
  * `7` \- Family Match  
  * `8` \- Business Match  
  * `99` \- All NCOALink Matches

### **Retrieve Duplicate Records**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPLICATES/<duplicateSubType>`  
* **Method:** `GET`  
* **Purpose:** Retrieve duplicate records found during duplicate detection processing

### **Replace All Data**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>`  
* **Method:** `PUT`  
* **Purpose:** Write back modified records to the cloud after customer review and edits  
* **Header Parameters:** `Accept: application/json` or `application/xml`

## **8\. EDDM (Every Door Direct Mail) Support**

For EDDM campaigns, AccuZIP supports uploading ZIP code ranges instead of address lists:

### **EDDM File Requirements**

* **File Name:** Must be named `eddm@.csv`  
* **Format:** Comma-delimited without header record  
* **Columns:** Low ZIP, High ZIP, Low CRRT, High CRRT

**Example EDDM File:**

93422,,,  
93422,93425,,  
93422,,C000,C999

**EDDM Examples:**

* **Single ZIP Code:** `93422,,,` \- Generates list for 100% of addresses in ZIP Code  
* **Range of ZIP Codes:** `93422,93425,,` \- Generates list for all ZIP Codes between range  
* **ZIP Code with City Routes:** `93422,,C000,C999` \- Generates list for specific CRRT codes

## **9\. Download Additional Documentation**

### **USPS Documentation (PDF)**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=pdf`  
* **Content:** Bookmarked PDF including Mailing Statement, Qualification Report, CASS Certificate, NCOALink Certificate, Presort Summary, and supplemental reports

### **Mail.dat Files for PostalOne\!**

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=maildat.zip`  
* **Content:** Mail.dat files for PostalOne\! eDoc upload

## **10\. PostalOne\! Integration**

### **PostalOne\! Automated Upload**

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/POSTALONE`  
* **Method:** `GET`  
* **Purpose:** Communicate with PostalOne\! for Upload, Update, Cancel and Delete Full-Service Mail.dat jobs

**Required Update Quote Parameters for PostalOne\!:**

{  
  "p1\_env": "{{environment}}",  
  "p1\_usr": "{{username}}",  
  "p1\_psw": "{{password}}",  
  "p1\_action": "{{action}}",  
  "mailing\_date": "{{mailingdate}}"  
}

**Important Note:** The `maildat_jobid` must be unique and a maximum of 8-bytes, Alpha/Numeric only. If not provided, the first 8-bytes of the Input File name is used.

## **11\. Webhook Implementation**

### **Webhook Handler for AccuZIP Callbacks**

AccuZIP supports webhook notifications when processing is complete. Implement an endpoint to handle these callbacks:

**Callback URL Format:** Your specified callback URL will receive an HTTP GET request with the GUID parameter when processing completes.

**Example:** If you specify `http://mysite.com/getAccuzipCallback.php`, AccuZIP will call: `http://mysite.com/getAccuzipCallback.php?guid=<guid>`

### **Webhook Implementation Example**

// Example webhook handler  
app.get('/accuzip-callback', (req, res) \=\> {  
  const guid \= req.query.guid;  
    
  if (\!guid) {  
    return res.status(400).send('Missing GUID');  
  }  
    
  // Process the completion notification  
  processAccuZipCompletion(guid);  
    
  res.status(200).send('Webhook received');  
});

## **12\. Error Handling and Best Practices**

### **Common Error Responses**

**Invalid API Key:**

{  
  "success": false,  
  "message": "ERROR Invalid API Key\!"  
}

**File Processing Errors:**

{  
  "success": false,  
  "message": "File with specified extension does NOT exist or belong to downloads for submitted GUID"  
}

**Process Still Running:**

{  
  "message": "QUOTE is still processing.",  
  "success": false  
}

**Missing Filter Value:**

{  
  "message": "Missing filter value",  
  "success": false  
}

**Rate Limit Exceeded:**

{  
  "success": false,  
  "message": "You have attempted to upload too many files within a one (1) minute period. Please wait 4 seconds before attempting to upload a new file. File Upload Limit: 12 per minute"  
}

**File Too Small:**

{  
  "success": false,  
  "message": "File line count of {fileCount} is less than required count of 3."  
}

**File Too Large:**

{  
  "success": false,  
  "message": "File line count of {fileCount} is more than the required count of 1000001."  
}

### **Best Practices**

1. **Asynchronous Processing:** Use webhook callbacks rather than polling for better performance  
2. **Error Handling:** Always implement robust error handling for all API calls  
3. **File Format Validation:** Ensure files meet the CSV format requirements before upload  
4. **Credit Management:** Monitor your credit usage through the Account Info endpoint  
5. **Field Mapping:** Use explicit field mapping parameters when your CSV headers don't match AccuZIP defaults  
6. **Process Dependencies:** Always complete CASS certification before NCOALink or Presort operations  
7. **Parameter Order:** The order of data parameters in the Upload File call is extremely important  
8. **Update Quote Requirement:** Always call Update Quote before Presort or All-In-One web services

### **Processing Flow Summary**

1. **Upload File** → Get GUID  
2. **Get Quote** → Check DQ results and counts  
3. **Update Quote** → Set mail piece parameters and filters  
4. **Process List** → Run CASS/NCOA/Presort (asynchronously)  
5. **Monitor Progress** → Via webhook callback or polling  
6. **Download CSV** → Get filtered deliverable-only file

## **13\. Credit Consumption and Pricing**

**Credit Consumption Pattern:**

* You are generally not charged for uploading files or processing them  
* Credits are consumed when you **download relevant files** like the production CSV or documentation  
* Preview downloads (first 25 records) typically do not consume credits

**Monitoring Credits:**

* Use the `des_credits=true` parameter in upload calls to include credit information in GET QUOTE responses  
* Check remaining credits via the Account Info endpoint

## **14\. Testing and Development Support**

**Test Environment Access:**

* Test API keys available for integration validation  
* Contact api@accuzip.com for test credentials and sample data  
* Typically allows 2-3 free test jobs for new integrations  
* Keep a log of test Job GUID IDs to avoid billing confusion

**Integration Support:**

* API Support: api@accuzip.com  
* Technical Support: 805.461.7300  
* Sales Support: 800.233.0555

## **15\. Summary and Implementation Checklist**

**Pre-Implementation:**

* \[ \] Obtain AccuZIP API key and verify account access level  
* \[ \] Set up webhook endpoint for processing completion notifications  
* \[ \] Implement file format validation for customer uploads  
* \[ \] Contact API support for test credentials and documentation links

**Core Integration Steps:**

* \[ \] Implement file upload with proper field mapping and parameter ordering  
* \[ \] Parse DQ results to calculate deliverable/undeliverable counts  
* \[ \] Update order quantities based on deliverable address count  
* \[ \] Configure mail piece parameters via Update Quote  
* \[ \] Process list through appropriate CASS/NCOA/Presort pipeline  
* \[ \] Download filtered CSV containing only deliverable records

**Error Handling and Monitoring:**

* \[ \] Implement comprehensive error handling for all API calls  
* \[ \] Set up credit usage monitoring  
* \[ \] Handle asynchronous processing with appropriate timeouts  
* \[ \] Implement retry logic for failed requests  
* \[ \] Test webhook callback functionality

**Advanced Features (Optional):**

* \[ \] Implement data review endpoints for customer validation  
* \[ \] Set up PostalOne\! integration for automated submission  
* \[ \] Add EDDM support for saturation mailing campaigns  
* \[ \] Implement individual processing steps for granular control

By following this comprehensive integration guide, your application can effectively leverage the AccuZIP API to validate customer mailing lists, provide accurate deliverable/undeliverable counts, and generate filtered CSV files containing only validated, deliverable addresses for direct mail campaigns.

