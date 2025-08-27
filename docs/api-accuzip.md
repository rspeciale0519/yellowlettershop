# **AccuZIP REST API Documentation**

## **Abstract**

The AccuZIP REST API offers a 100% cloud-based solution for Data Quality (DQ) and Mail Processing. It facilitates the upload of name and address files for comprehensive services, including CASS Certification, NCOALink Certification, Data Enhancement Services, Canadian Address Verification, Duplicate Detection, Postal Presorting, generation of USPS Documentation and Mail.dat eDoc Output, PostalOne\! Upload, and creation of print-ready CSV files.

**Contact:** Steve Belmonte (steve@accuzip.com)

## **Base URLs**

All API interactions utilize the following base URLs:

* **Web Services:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/`  
* **Web Applications (Upload/Download):** `https://cloud2.iaccutrace.com/ws_360_webapps/`

## **Authentication**

Authentication for most API calls requires an `apiKey`, which is a GUID key provided with your AccuZIP account.

## **API Endpoints**

### **1\. Account Info**

This web service call retrieves information about your AccuZIP account and access level, including account activity status, remaining credits, and subscribed services.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/INFO`  
* **Method:** `POST`

**Body (Required):**  
 \<apiKey\>

* 

**Success Response (Content):**  
 {"account\_type":"Subscription","level":"4","success":true,"active":true,"credits\_remaining":{"total":"106","monthly":"96","annual":"193"},"services":"Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment","credits\_used":{"total":"94","monthly":"4","annual":"7"}}

*  The `level` field indicates your access level.

**Error Response (Content):**  
 {"success":false,"message":"submitted API\_KEY not found \<\<apiKey\>"}

*  This error indicates that the provided `apiKey` was not found.  
* **Access Levels:**  
  * **2:** Direct Mail  
  * **3:** Direct Mail and Limited 25-record Mailing Lists Test Environment  
  * **4:** Direct Mail with EDDM and Limited 25-record Mailing Lists Test Environment  
  * **5:** Direct Mail with EDDM and Mailing Lists

### **2\. Upload File**

This web service uploads a file to the AccuZIP cloud for processing. The file extension **MUST ALWAYS be "csv"** (e.g., `myfilename.csv`); files with different extensions will be ignored. The data within the file can be **TAB, PIPE, or COMMA-SEPARATED**.

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/v2_0/uploadProcess.jsp?manual_submit=false`  
* **Method:** `POST`  
* **URL Params (Required):**  
  * `manual_submit=false`  
* **Required Data Params (The order of these parameters is extremely important):**  
  * `backOfficeOption`  
  * `json`  
  * `apiKey`: The GUID key provided with your account.  
  * `callbackURL`: A URL (e.g., `http://mysite.com/getAccuzipCallback.php`) where AccuZIP's service will send an HTTP GET notification with the `guid` upon job completion. This mechanism is known as "WebHooks".  
  * `guid`: A unique identifier for the uploaded job.  
  * `file`: The filepath of the file to be uploaded.

#### **2.1. File Upload Purposes**

The `Upload File` web service supports two primary purposes:

##### **2.1.1. Uploading a Mailing List**

* **File Format Requirements:**  
  * Files must be delimited consistently with Tabs, Comma-Quote, or PIPE.  
  * Each row must be terminated with a CRLF (Carriage Return \+ Line Feed), which corresponds to ASCII 13 ASCII 10 (HEX 0D HEX 0A).  
  * A **minimum of 200 rows** is required for mailing lists.  
  * The **first row must be the Header Record**, describing the columns (e.g., contact information and address).  
  * For Comma Separated files, columns should be surrounded by quotes to correctly handle commas within data fields.  
  * Column Header Names should conform to the required/optional names listed below, but additional columns can use any desired naming convention.  
* **Required Column Names (Case-insensitive matching for address components):**  
  * **First:** Can contain the First and Last Name; Name Prefix, First, Middle and Last; or just the First name (e.g., `John Smith`; `Mr. John M Smith`; `John`).  
  * **Address:** The primary address (e.g., `100 Main St`; `PO Box 1`).  
  * **City:** Can contain the City, State, and Zip; City, State; or just the City name (e.g., `Los Angeles CA 90001`; `Los Angeles CA`; `Los Angeles`).  
* **Optional Column Names:**  
  * **Sal:** Name prefix (e.g., `Mr`; `Mrs`; `Mr. and Mrs.`).  
  * **Middle:** Middle name of the contact.  
  * **Last:** Last name of the contact.  
  * **Address2:** Secondary address information (e.g., `Ste 200`; `# 200`).  
  * **St:** State abbreviated name (e.g., `CA`, `TX`).  
  * **Zip:** ZIP or ZIP+4 code (e.g., `99999`; `99999-9999`).  
  * **Urban:** Puerto Rico Urbanization Name.  
  * **Company:** Company/firm name.  
  * **Complete List:** A comprehensive list of column names is available at `http://www.accuzip.com/files/CompleteColumnNameList.xlsx`.  
* **File Content Examples (Mailing List):**

**Comma Separated File (Example 1):**

 "first","last","address","address2","city","st","zip"  
"John","Smith","PO Box 7602","","St Thomas","VI","00801"

* 

**Comma Separated File (Example 2):**

 "first","address","city"  
"John Smith","PO Box 7602","St Thomas VI 00801"

* 

**PIPE Separated File (Example 1):**

 "first"|"last"|"address"|"address2"|"city"|"st"|"zip"  
"John"|"Smith"|"PO Box 7602"|""|"St Thomas"|"VI"|"00801"

* 

**PIPE Separated File (Example 2):**

 first|address|city  
John Smith|PO Box 7602|St Thomas VI 00801

* 

##### **2.1.2. Uploading a list of 5-Digit ZIP codes and optionally CRRT codes to generate an EDDM saturated mailing list**

* **File Name:** This file **must always be named `eddm@.csv`**.  
* **File Format Requirements:**  
  * Must always be delimited with commas.  
  * Each row must be terminated with a CRLF (Carriage Return \+ Line Feed) – ASCII 13 ASCII 10 (HEX 0D HEX 0A).  
  * **No header record is needed** for EDDM files.  
* **Required Columns:**  
  * **Low 5-Digit ZIP code:** The starting or specific ZIP Code.  
  * **High 5-Digit ZIP code:** Entered only if a range of ZIP Codes between the Low and High is desired.  
  * **Low CRRT code:** The starting or specific CRRT Code.  
  * **High CRRT code:** Entered only if a range of CRRT Codes between the Low and High is desired.  
* **Note:** A free EDDM UI is available and can be integrated into your website as an IFrame. Further details are in `EDDM Web Service Calls.pdf`.  
* **File Content Examples (EDDM):**

**Example 1 – Single ZIP Code:** An EDDM mailing list will be generated for 100% of the Total Possible addresses in the ZIP Code.

 93422,,,

* 

**Example 2 – Range of ZIP Codes:** An EDDM mailing list will be generated for 100% of the Total Possible addresses for all valid ZIP Codes listed, including all ZIP Codes between the Low and High ZIP Codes.

 93422,93425,,

* 

**Example 3 – Single ZIP Code and all City Routes:** An EDDM mailing list will be generated for 100% of the Total Possible addresses in the ZIP Code for all City Routes.

 93422,,C000,C999

* 

**Example 4 – Multiple ZIP Codes and specific CRRT Codes:** An EDDM mailing list will be generated for 100% of the Total Possible addresses in the ZIP Codes and ZIP Code ranges listed below within the specific CRRT code or CRRT code range listed next to each ZIP Code or ZIP Code range.

 93422,,C001,C002  
93423,,C001,C010  
93424,,C011,  
93401  
93446,93447,,

* 

#### **2.2. Additional Data Params for Upload**

These optional parameters control various data quality processing options and influence the `GET QUOTE` response.

* **`dataQualityResults`**: If set to `true` (not recommended), the service automatically performs DPV Confirmation after upload. Data Quality (DQ) results will appear in the GET QUOTE response, providing summary values but not replacing the GET CASS call. Setting this to `true` does not produce detailed output and is generally unnecessary. **The recommendation is to set this as `false`**.

* **`des_credits`**: Setting this value to `true` will cause the `GET QUOTE` response to include the number of credits remaining in your account. (Additional DES Services information: `http://accuzip.com/products/des/index.htm`).

* **Column Header Field Names (for mailing list uploads):** These must match the headers in your uploaded file (not case-sensitive).

  * `col_address`: Header Field Name for Mailing Address (e.g., `my address*`).  
  * `col_address2`: Header Field Name for Secondary Address (e.g., `my adr2*`).  
  * `col_city`: Header Field Name for City name (e.g., `my city*`).  
  * `col_st`: Header Field Name for State abbreviation (e.g., `my state*`).  
  * `col_zip`: Header Field Name for ZIP Code, ZIP+4, or Postalcode (e.g., `my zip code*`).  
* **`list_owner_paf_id`**: PAF ID assigned by AccuZIP for processing files through their Licensed NCOALink service.

* **New `dataQualityResults` JSON Property Settings:** When using one of these properties in the `UPLOAD FILE` call, the `GET QUOTE` result will contain new JSON properties for Postage and Rate Categories. **Note: Only one of these settings can be used in the `UPLOAD FILE` call**.

  * `dataQualityResults_CASS`: `true` for CASS ONLY data quality results.  
  * `dataQualityResults_NCOA`: `true` for CASS AND NCOA ONLY data quality results.  
  * `dataQualityResults_NCOA_DUPS_01`: `true` for CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND COMPANY ONLY.  
  * `dataQualityResults_NCOA_DUPS_02`: `true` for CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND FIRST AND LAST NAME ONLY.  
  * `dataQualityResults_NCOA_DUPS_03`: `true` for CASS AND NCOA AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME ONLY.  
  * `dataQualityResults_DUPS_01`: `true` for CASS AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME ONLY.  
  * `dataQualityResults_DUPS_02`: `true` for CASS AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME ONLY.  
  * `dataQualityResults_DUPS_03`: `true` for CASS AND DUPLICATE DETECTION BY ADDRESS AND HOUSEHOLD NAME ONLY.

**Success Response (Content):**

 {"success360Import":true,"quote\_started":true,"cass\_started":false,"guid":"7ebb2c37-648b-4f6e-aa6d-240dc55aef2c"}

*  This response indicates a successful file import, the initiation of a quote, and provides a unique `guid` for the job.

**Error Response (Content):**

 {"success":false,"message":"ERROR Invalid API Key\!"}

*  This error occurs if the provided API Key is invalid.

### **3\. Get Quote (Approximate Values)**

This `GET` web service call returns an approximate postage quote after a file has been successfully uploaded to the cloud. The quote provides an estimate of the postage savings achievable by cleaning, standardizing, and presorting your mailing list. Savings are calculated by comparing the service's rates against the First-Class Single Piece Rate if no cleaning/presorting was performed.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`

* **Method:** `GET`

* **URL Params (Required):**

  * `<guid>`: The GUID for the job, obtained from the Upload File success response.  
* **Success Response (Content):**

**Default Content (Approximate values):**

 {"task\_name":"FINISHED","First\_Class\_Flat":"$619","task\_percentage\_completed":"100","Estimated\_Postage\_Standard\_Card":"$549","Estimated\_Postage\_Standard\_Letter":"$549","format":"","task\_state":"FINISHED","First\_Class\_Card":"$154","Estimated\_Postage\_First\_Class\_Card":"$526","drop\_zip":"","First\_Class\_Letter":"$132","total\_presort\_records":"","Estimated\_Postage\_Standard\_Flat":"$936","Standard\_Card":"$382","total\_postage":"","Standard\_Letter":"$382","Estimated\_Postage\_First\_Class\_Flat":"$1,262","success":true,"presort\_class":"","total\_records":"2,001","Estimated\_Postage\_First\_Class\_Letter":"$799","mail\_piece\_size":"","Standard\_Flat":"$945","postage\_saved":""}

* 

**Content when using "Additional Data Params" in Upload File:** This includes Data Quality (DQ) results if `dataQualityResults` was set to `true`, or credit information if `des_credits` was `true`.

 {"dq\_dpvhsa\_d":"11","dq\_dpvhsv":"19","Estimated\_Postage\_Standard\_Card":"$548","Estimated\_Postage\_Standard\_Letter":"$548","First\_Class\_Card":"$154","dq\_message":"DQ results have been calculated successfully","Estimated\_Postage\_First\_Class\_Card":"$526","dq\_dpvhsa\_n":"27","First\_Class\_Letter":"$132","Standard\_Card":"$382","dq\_dpvhsa\_s":"56","total\_postage":"","presort\_class":"","total\_records":"2,000","dq\_dpvhsa\_y":"1906","mail\_piece\_size":"","First\_Class\_Flat":"$619","format":"","drop\_zip":"","total\_presort\_records":"","Estimated\_Postage\_Standard\_Flat":"$935","Standard\_Letter":"$382","Estimated\_Postage\_First\_Class\_Flat":"$1,261","success":true,"Estimated\_Postage\_First\_Class\_Letter":"$798","Standard\_Flat":"$945","postage\_saved":"","des\_credits": "0"}

* 

**Content when using the new `dataQualityResults_????` "Additional Data Params" in Upload File:** This provides more accurate postage totals and rate categories.

 {"dq\_dpvhsa\_s":"70","First\_Class":\[{"flat":\[{"postage":"1126.12","AB":"91","PRESORT":"0","MB":"30","savings":"846.88","5B":"470","SP":"27","3B":"1355"}\],"letter":\[{"postage":"812.98","AB":"1186","PRESORT":"0","MB":"760","savings":"114.33","5B":"0","SP":"27","3B":"0"}\],"card":\[{"postage":"529.70","AB":"1186","PRESORT":"0","MB":"760","savings":"160.85","5B":"0","SP":"27","3B":"0"}\]}\],"Nonprofit":\[{"flat":\[{"AB":"77","AD":"8","HP":"0","5B":"607","CR":"0","3B":"1233","5D":"0","postage":"603.20","3D":"3","MB":"29","MD":"16","savings":"1369.80","WS":"0","HD":"0","SP":"0"}\],"letter":\[{"AB":"1186","AD":"0","HP":"0","5B":"0","CR":"0","3B":"0","5D":"0","postage":"321.97","3D":"0","MB":"787","MD":"0","savings":"605.34","WS":"0","HD":"0","SP":"0"}\]}\],"Duplicates":\[{"found":"20","description":"by Address and First and Last Name","setting":"2"}\],"dq\_dpvhsa\_d":"11","dq\_dpvhsv":"31","NCOALink":\[{"months\_19\_48":"205","matches":"296","months\_1\_18":"91","moved\_no\_forwarding":"7"}\],"success":true,"dq\_dpvhsa\_y":"1892","dq\_message":"DQ results have been calculated successfully","Standard":\[{"flat":\[{"AB":"77","AD":"8","HP":"0","5B":"607","CR":"0","3B":"1233","5D":"0","postage":"930.72","3D":"3","MB":"29","MD":"16","savings":"1042.28","WS":"0","HD":"0","SP":"0"}\],"letter":\[{"AB":"1186","AD":"0","HP":"0","5B":"0","CR":"0","3B":"0","5D":"0","postage":"548.86","3D":"0","MB":"787","MD":"0","savings":"378.45","WS":"0","HD":"0","SP":"0"}\]}\],"dq\_dpvhsa\_n":"27"}

* 

**Content for EDDM list request upload:**

 {"postage\_saved":"","total\_postage":"","drop\_zip":"","Total\_Possible":"12,809","Standard\_Letter":"$3,612","Standard\_Flat":"$9,837","format":"","mail\_piece\_size":"","Total\_Residential":"11,935","success": true ,"presort\_class":""}

* 

**Error Response (Content):**

 {"message":"QUOTE is still processing.","success": false}

*  This indicates that the quote calculation is still underway.

#### **3.1. Data Quality (DQ) Result Descriptions (from `dataQualityResults` JSON)**

These fields provide details on the DPV (Delivery Point Validation) status of addresses:

* `"dq_message"`: A descriptive message about the DQ results (e.g., "DQ results have been calculated successfully").  
* `"dq_dpvhsa_y"`: Indicates the address was DPV confirmed for both primary and (if present) secondary numbers.  
* `"dq_dpvhsa_d"`: Indicates the address was DPV confirmed for the primary number only, with secondary number information missing.  
* `"dq_dpvhsa_s"`: Indicates the address was DPV confirmed for the primary number only, with secondary number information present but unconfirmed.  
* `"dq_dpvhsa_n"`: Indicates that both primary and (if present) secondary number information failed DPV Confirmation.  
* `"dq_dpvhsv"`: Indicates the address is vacant for at least 90 days.

#### **3.2. Checking Process Status (Alternate method to CallBacks)**

If your application cannot support an HTTP GET `callbackURL`, you can poll the `GET QUOTE` web service to ascertain the status of backend processes after initiating calls like CASS Certification, NCOALink, or Presort. The following JSON objects help determine the process status:

* `"task_name"`: Describes the task currently being executed (e.g., `OPTIMIZING`; `CASS CERTIFY`; `NCOALINK`; `DUPLICATE DETECTION`; `PRESORT`; `CONTAINER TAGS`; `POSTAL DOCUMENTATION`; `CREATING UNIQUE IMB`; `CREATING OUTPUT`; `FINALIZING`; `FINISHED`).  
* `"task_percentage_completed"`: This value is currently either `0` (Started) or `100` (Finished) for all processes.  
* `"task_state"`: This JSON object value will return `"FINISHED"` only when the "Presort Postal Discount" or "CASS Certification, NCOALink, Duplicate Detection, Presort" process is entirely completed, and the documentation and print-ready files are available for download.

### **4\. CASS Certification**

This web service cleans and standardizes all addresses in the uploaded file. It **must be called successfully after the file upload** and **before** initiating NCOALink, Duplicate Detection, or Presort web service calls.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.

**Success Response (Content):**  
 {"Addresses":{"Rows":\[\]},"NoFilteredRows":0,"TotalRows":0,"success":true}

*  Indicates successful CASS certification.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`

### **5\. NCOALink Certification**

This web service processes CASS Certified names and addresses through AccuZIP's Licensed NCOALink process for Change of Address matching. **Prior to processing any mailing list, AccuZIP Inc. must have a fully executed Processing Acknowledgment Form (PAF) on file for each List Owner**. The electronic PAF can be completed at: `http://accuzip.com/products/ncoalink/paf/new`. It is crucial to use this service **only after the CASS Certification web service has been called and returned `success=true`**.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/NCOA`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.

**Success Response (Content):**  
 {"success":true}

*  Indicates successful NCOALink processing.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`

### **6\. Duplicate Detection**

This web service removes duplicate records from the CASS Certified and NCOALink Certified file, ensuring that only one mail-piece is sent to an address, person, household, or company. This call is **optional**; if the customer wishes to mail to 100% of the list, this web service call should not be made.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPS/<duplicateSubType>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<duplicateSubType>`: Specifies the method for detecting duplicates:  
    * **`01`**: Duplicates detected by Address Only and, if exists, by Company.  
    * **`02`**: Duplicates detected by First and Last name.  
    * **`03`**: Duplicates detected by Household name.

**Success Response (Content):**  
 {"success": true}

*  Indicates successful duplicate detection.

**Error Response (Content):**  
 {"message":"Missing filter value","success":false}

*  This error indicates that the `<duplicateSubType>` parameter was missing.

### **7\. Update Quote**

This web service call is used to update the quote object, specifically for setting parameters like `Class of Mail` and `Piece Size`. **It is necessary to make a call to this web service before calling the Presort web service**, as the Presort service relies on these values.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/QUOTE`  
* **Method:** `PUT`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
* **Header Params (Required):**  
  * `Accept`: Must be set to `application/json` or `application/xml`.  
* **Data Params:** Refer to available settings at `http://www.accuzip.com/files/json_values.xlsx` and a JSON example at `http://www.accuzip.com/files/json_values_example.json`.  
  * **Important for EDDM mailings:** You must set the following JSON objects to these specific settings:

    * `"presort_class": "STANDARD MAIL (EDDM)"`  
    * `"mail_piece_size": "LETTER"` or `"mail_piece_size": "FLAT"`

**For PostalOne\! communication (to be included in a later `UPDATE QUOTE` call):**

 {  
  "p1\_env": "{{environment}}",  
  "p1\_usr": "{{username}}",  
  "p1\_psw": "{{password}}",  
  "p1\_action": "{{action}}",  
  "mailing\_date":"{{mailingdate}}"  
}

*  The `maildat_jobid` must be unique and a maximum of 8 alpha-numeric bytes. If not provided, the first 8 bytes of the Input File name are used, which must be unique for each job.

* **Success Response (Content):**  
  * `HTTP 200 - OK`  
* **Error Response (Content):**  
  * `HTTP 404 – NOT_FOUND`  
* **Notes:** This `Update Quote` web service is very important and **must be called before the Presort or All-In-One web services**. It only needs to be called once to update `presort_class`, `drop_zip`, and `mail_piece_size`, and then again if any of these values change. To re-presort with different mail-piece or presort attributes, call `Update Quote` after the initial process is completed, then call the Presort or All-In-One web service again to update postal documentation and print files.

### **8\. Presort Postal Discounts**

This web service processes addresses that have been CASS Certified through AccuZIP's Cloud Presort engine to claim the lowest postage rates. The service supports all Classes of Mail and mail-piece sizes, including mixed weight manifest and drop shipment. The Cloud Presort settings are controlled by the `Update Quote` web service call.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/PRESORT`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.

**Success Response (Content):**  
 {"success":true}

*  Indicates successful presorting.

**Error Response (Content):**  
 {"callback":{"message":"Missing info file.","success":false},"success":true}

*  Indicates a missing information file needed for presort.  
* **Notes:** After calling this service, wait for the response before calling it again. You would only re-call the Presort web service if you have updated the Quote information using the `Update Quote` web service with new parameters.

### **9\. CASS Certification, NCOALink, Duplicate Detection, Presort (All-In-One Calls)**

These web services combine multiple processing steps into a single call: cleaning and standardizing addresses (CASS), processing through NCOALink, removing duplicate records (optional), presorting for lowest postage rates, generating USPS Documentation in PDF, and producing a print-ready CSV file. **Before using these REST API calls, you must first upload the file** (see `Upload File`) **and PUT the JSON object with mail-piece characteristics** (see `Update Quote`).

* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.

**Success Response (Content):**  
 {"success":true}

*  Indicates successful completion of the combined processes.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`  
* **Notes:** Individual RESTful API calls (like CASS, NCOA, DUPS, PRESORT) run synchronously, meaning control is not returned until the process completes. The all-in-one RESTful API calls run asynchronously, returning control immediately, and our service will make a `callbackURL` notification when the process is completed, allowing your service to proceed with next steps.

#### **9.1. Available All-In-One URLs**

* **CASS Certify, NCOALink, Duplicate Detection and Presort:**  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS-PRESORT`  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_01-PRESORT` (Duplicates detected by ADDRESS, and if provided, also by COMPANY)  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_02-PRESORT` (Duplicates detected by FIRST AND LAST NAME)  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-DUPS_03-PRESORT` (Duplicates detected by HOUSEHOLD NAME)  
* **CASS Certify, Duplicate Detection and Presort:**  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS-PRESORT`  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_01-PRESORT` (Duplicates detected by ADDRESS, and if provided, also by COMPANY)  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_02-PRESORT` (Duplicates detected by FIRST AND LAST NAME)  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-DUPS_03-PRESORT` (Duplicates detected by HOUSEHOLD NAME)  
* **CASS Certify, NCOALink and Presort:**  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-NCOA-PRESORT`  
* **CASS Certify and Presort:**  
  * `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CASS-PRESORT`

### **10\. Download Print Ready, Presorted CSV or Preview CSV**

This web service allows you to download the final print-ready CSV file after it has undergone CASS Certification, NCOALink processing (if applicable), Deduplication (if applicable), and Presorting for optimal postal discounts. You can also download the first 25 records as a preview, or the entire CASS or CASS/NCOALink processed file in JSON format.

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=<type>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<type>`: Specifies the desired output file type:  
    * `csv`: Full print-ready, presorted CSV file.  
    * `prev.csv`: First 25 records of the print-ready, presorted CSV for preview.  
    * `json`: The entire CASS or CASS/NCOALink processed file in JSON format.  
    * `presort.json`: A JSON file specific to presort data.  
* **Success Response (Content):**  
  * The raw content of the requested CSV or JSON file.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`  
  * `HTTP 500 – BAD REQUEST`  
  * `HTTP 200 – OK` with an error message in the response body (e.g., `{"success":false,"message":"File with specified extension does NOT exist or belong to downloads for submitted GUID prev.csv"}`).  
* **Notes:** This web service will stream the text file directly.

### **11\. Download USPS Documentation as PDF or eDoc (Mail.dat for PostalOne\!)**

This web service enables the download of a bookmarked PDF containing the USPS Documentation. This documentation may include, as applicable, the Mailing Statement, Qualification Report, CASS Certificate, NCOALink Certificate, Presort Summary, and other supplemental reports.

* **URL:** `https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=<type>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<type>`: Specifies the desired documentation type:  
    * `pdf`: A bookmarked PDF file of the USPS Documentation.  
    * `maildat.zip`: Mail.dat Files for PostalOne\! eDoc.  
* **Success Response (Content):**  
  * The raw content of the PDF file or the Mail.dat Files (ZIP archive).  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`  
* **Notes:** This web service will stream the PDF file directly.

### **12\. PostalOne\! Automated Upload, Update, Cancel, and Delete**

This web service call facilitates communication with PostalOne\! for the automated Upload, Update, Cancel, and Delete of Full-Service Mail.dat jobs. **It is very, very important that you call `UPDATE QUOTE` with the correct Mail.dat values before making the `POSTALONE` call**.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/POSTALONE`

* **Method:** `GET`

* **URL Params (Required):**

  1. `<guid>`: The GUID for the job.

**Success Response (Content):**

 {"success":true}

*  Indicates successful communication with PostalOne\!.

* **Error Response (Content):**

  1. `HTTP 500 – INTERNAL_SERVER_ERROR`

**Important: Pre-call Setup via `UPDATE QUOTE`:** Before making the `POSTALONE` call, you must include your PostalOne\! credentials, environment, and action in a prior `UPDATE QUOTE` call. These values are then used by the `POSTALONE` endpoint.

 {  
  "p1\_env": "{{environment}}",  
  "p1\_usr": "{{username}}",  
  "p1\_psw": "{{password}}",  
  "p1\_action": "{{action}}",  
  "mailing\_date":"{{mailingdate}}"  
}

*  **Note:** The `"maildat_jobid"` must be unique and a maximum of 8 alpha-numeric bytes. If this JSON value is not provided, the first 8 bytes of the Input File name are used (which must also be unique for each job). Refer to `http://www.accuzip.com/files/json_values.xlsx` for possible JSON object values for these settings.

* **Example Workflow for PostalOne\! RESTful API call:**

  1. **UPLOAD FILE:** Obtain the `guid` from the response for subsequent calls.  
  2. **GET QUOTE:** Confirm successful upload and a preliminary postage quote, ensuring the backend accepted the input file.  
  3. **UPDATE QUOTE:** Send all Presort settings, including the **very important unique `maildat_jobid`** (or the first 8 bytes of the Input File name if `maildat_jobid` is not provided).  
  4. **CASS-NCOA-DUPS\_01-PRESORT (or individual processes):** You can call the all-in-one process, or individual calls like `CASS`, `NCOA`, `DUPS_01`, or `PRESORT` separately. Individual calls run synchronously, returning control upon completion. All-in-one calls run asynchronously and return control immediately, with a `callbackURL` notification upon completion.  
  5. **GET QUOTE (if `callbackURL` not supported):** If your service does not support callbacks, use `GET QUOTE` to check the status of the process.  
  6. **UPDATE QUOTE:** Here, include additional values for PostalOne\! communication, such as your credentials (`p1_usr`, `p1_psw`), the PostalOne\! environment (`p1_env`), and the PostalOne\! action (`p1_action`).  
  7. **POSTALONE:** Make this call **only after** you have included your PostalOne\! credentials, environment, and action via `UPDATE QUOTE`.  
  8. **GET QUOTE (if `callbackURL` not supported):** When PostalOne\! communication is completed, a callback will be made. If not supported, use `GET QUOTE` to check the status.

### **13\. Retrieve Duplicates**

This web service retrieves the duplicate records found by the "Duplicate Detection" web service. To retrieve the matching records, it is important to use the **same `<duplicateSubType>`** that was used in the initial "Duplicate Detection" call.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/DUPLICATES/<duplicateSubType>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<duplicateSubType>`: Matches the method used for duplicate detection:  
    * **`01`**: Address Only and if exists, Company.  
    * **`02`**: First and Last name.  
    * **`03`**: Household name.

**Success Response (Content):**  
 {"success": true}

*  Indicates successful retrieval of duplicate records. The retrieved object can be used to populate a grid.

**Error Response (Content):**  
 {"message":"Missing filter value","success":false}

*  This error indicates a missing filter value for `duplicateSubType`.  
* **Notes:** In the retrieved object, the `x` value will be `"1"` for duplicate records. This allows you to set a trigger (e.g., change row color) to easily highlight duplicate records in a grid.

### **14\. Retrieve NCOALink Certified Records**

This web service retrieves specific types of NCOALink records to display in a grid for user review.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/MoveUpdate/<filterSubType>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<filterSubType>`: Specifies the type of NCOALink records to retrieve:  
    * **`1`**: Moved \- COA Matches.  
    * **`2`**: Moved \- New Address cannot be confirmed.  
    * **`3`**: Moved \- Left No Forwarding.  
    * **`4`**: Moved \- Foreign Country.  
    * **`5`**: Moved \- New State.  
    * **`6`**: Individual Match.  
    * **`7`**: Family Match.  
    * **`8`**: Business Match.  
    * **`99`**: All NCOALink Matches.

**Success Response (Content):**  
 {"NoFilteredRows":"1","Addresses":{"Rows":\[{objects}\]},"success":"true","TotalRows":"20"}

*  Provides the filtered NCOALink records, including counts of filtered and total rows.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`  
* **Notes:** You can allow the user to review the results and make changes if needed. After modifications, call the "Replace All Data" web service to update the main database before proceeding to presorting.

### **15\. Retrieve CASS Certified Records**

This web service retrieves specific types of CASS Certified records to display in a grid, allowing the user to review and edit them if necessary.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>/CleanAddresses/<filterSubType>`  
* **Method:** `GET`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
  * `<filterSubType>`: Specifies the type of CASS Certified records to retrieve:  
    * **`2`**: Unit number provided but not verified.  
    * **`3`**: Unit number missing from known high-rise address.  
    * **`4`**: Vacant.  
    * **`5`**: Business address.  
    * **`6`**: Private Mail Box address.  
    * **`7`**: Address not valid.  
    * **`8`**: Missing address element(s).  
    * **`9`**: Foreign.  
    * **`99`**: All.

**Success Response (Content):**  
 {{"NoFilteredRows":"5","Addresses":{"Rows":\[{objects}\]},"success":"true","TotalRows":"20"}

*  Provides the filtered CASS Certified records, including counts of filtered and total rows.  
* **Error Response (Content):**  
  * `HTTP 500 – INTERNAL_SERVER_ERROR`  
* **Notes:** You can enable users to edit the CASS Certified results and make corrections. The CASS REST API Documentation (`https://api.iaccutrace.com/docs/api-cass`) can be used to create a one-button CASS Certified lookup feature for on-the-fly address correction.

### **16\. Replace All Data**

This web service writes back all modified rows to the cloud. It should be used if you have allowed the customer to edit CASS Certified, NCOALink Certified, or Duplicate Detection records that were displayed in a grid. This web service call **should be processed before the Presort web service**.

* **URL:** `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/job/<guid>`  
* **Method:** `PUT`  
* **URL Params (Required):**  
  * `<guid>`: The GUID for the job.  
* **Header Params (Required):**  
  * `Accept`: Must be set to `application/json` or `application/xml`.  
* **Data Params:** The objects to be updated, which should be sourced from the `Retrieve CASS Certified Records`, `Retrieve NCOALink Certified Records`, or `Retrieve Duplicates` web services.  
* **Success Response (Content):**  
  * `HTTP 200 - OK`  
* **Error Response (Content):**  
  * `HTTP 404 – NOT_FOUND`  
* **Notes:** This functionality allows for user corrections to be written back to the cloud. As mentioned, the CASS REST API Documentation (`https://api.iaccutrace.com/docs/api-cass`) can assist in integrating real-time address correction features.

