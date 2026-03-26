# **API Integrations Guide — Yellow Letter Shop**

*Complete Implementation Examples for All External Services*  
*Last Updated: August 2025*

Welcome to the comprehensive API integration guide\! Think of this as your "cookbook" for connecting Yellow Letter Shop with external services. We've included complete, working code examples that you can copy, paste, and customize for your needs.

**🎯 What You'll Learn:**

- How to build robust API integrations that handle errors gracefully  
- Step-by-step implementation of each external service  
- Testing strategies to ensure your integrations work reliably  
- Security patterns to keep user data safe

---

## **🔧 Integration Architecture Overview**

Before diving into specific APIs, let's understand how our integration architecture works. Think of it like a well-organized kitchen \- everything has its place and follows consistent patterns.

### **Our Integration Philosophy**

Every external API integration in YLS follows the same "recipe":

// This is our "template" for all API integrations

// Think of it as the foundation recipe that we customize for each service

interface APIIntegration {

  // 1\. PREPARATION: Validate and prepare the request

  validateInput(data: unknown): Promise\<ValidatedData\>

  

  // 2\. AUTHENTICATION: Ensure we have permission to make the call

  authenticate(): Promise\<AuthCredentials\>

  

  // 3\. EXECUTION: Make the actual API call with error handling

  makeRequest(data: ValidatedData, auth: AuthCredentials): Promise\<APIResponse\>

  

  // 4\. PROCESSING: Transform the response into our internal format

  processResponse(response: APIResponse): Promise\<InternalData\>

  

  // 5\. PERSISTENCE: Save results to our database

  saveResults(data: InternalData): Promise\<DatabaseRecord\>

  

  // 6\. NOTIFICATION: Tell the user what happened

  notifyUser(result: DatabaseRecord): Promise\<void\>

}

**Why this pattern?** It makes our code predictable and easy to debug. When something goes wrong, we know exactly which step failed.

### **Shared Utilities \- Don't Repeat Yourself\!**

Let's create some helper functions that all our integrations can use:

// lib/api-integrations/shared.ts

// These are like "kitchen tools" that every integration can use

import { z } from 'zod'

import { supabase } from '@/lib/supabase'

/\*\*

 \* Base configuration for all external API calls

 \* Think of this as the "standard settings" we use everywhere

 \*/

export const API\_CONFIG \= {

  timeout: 30000, // 30 seconds \- enough time for external services to respond

  retryAttempts: 3, // If something fails, try 3 times before giving up

  retryDelay: 1000, // Wait 1 second between retries

  maxFileSize: 50 \* 1024 \* 1024, // 50MB max file uploads

} as const

/\*\*

 \* Standard error types that can happen during API integration

 \* Having these defined helps us handle errors consistently

 \*/

export enum IntegrationErrorType {

  VALIDATION \= 'VALIDATION\_ERROR',

  AUTHENTICATION \= 'AUTH\_ERROR', 

  RATE\_LIMIT \= 'RATE\_LIMIT\_ERROR',

  SERVICE\_UNAVAILABLE \= 'SERVICE\_ERROR',

  TIMEOUT \= 'TIMEOUT\_ERROR',

  UNKNOWN \= 'UNKNOWN\_ERROR'

}

/\*\*

 \* Custom error class for integration problems

 \* This gives us detailed information when something goes wrong

 \*/

export class IntegrationError extends Error {

  constructor(

    public type: IntegrationErrorType,

    public message: string,

    public originalError?: Error,

    public context?: Record\<string, any\>

  ) {

    super(message)

    this.name \= 'IntegrationError'

  }

}

/\*\*

 \* Retry function with exponential backoff

 \* This is like "being polite" \- if a service is busy, we wait longer each time

 \*/

export async function retryWithBackoff\<T\>(

  operation: () \=\> Promise\<T\>,

  maxAttempts: number \= API\_CONFIG.retryAttempts

): Promise\<T\> {

  let lastError: Error

  

  for (let attempt \= 1; attempt \<= maxAttempts; attempt++) {

    try {

      // Try the operation

      return await operation()

    } catch (error) {

      lastError \= error as Error

      

      // If this was our last attempt, give up

      if (attempt \=== maxAttempts) {

        throw error

      }

      

      // Wait before trying again, with longer delays each time

      const delay \= API\_CONFIG.retryDelay \* Math.pow(2, attempt \- 1\)

      console.log(\`Attempt ${attempt} failed, retrying in ${delay}ms...\`)

      await new Promise(resolve \=\> setTimeout(resolve, delay))

    }

  }

  

  throw lastError\!

}

/\*\*

 \* Log all API interactions for debugging and monitoring

 \* This is like keeping a "recipe journal" \- we record what worked and what didn't

 \*/

export async function logAPIInteraction(
  serviceName: string,
  endpoint: string,
  method: string,
  requestData: any,
  responseData: any,
  error?: Error,
  userId?: string
) {
  try {
    // Helper to deep-clone and redact common PII/secrets
    const sanitize = (obj: any) => {
      try {
        const clone = JSON.parse(JSON.stringify(obj ?? {}))
        ;['apiKey', 'authorization', 'password', 'token', 'ssn', 'email', 'phone'].forEach(k => {
          if (clone?.[k]) clone[k] = 'REDACTED'
        })
        return clone
      } catch {
        return {}
      }
    }

    await supabase.from('external_api_logs').insert({
      service_name: serviceName,
      endpoint: endpoint,
      request_method: method,
      request_body: sanitize(requestData),
      response_body: sanitize(responseData),
      response_status: (responseData?.statusCode as number) ?? (error ? 0 : 200),
      error_message: error?.message?.slice(0, 500),
      user_id: userId,
      response_time_ms: responseData?.durationMs ?? undefined,
      created_at: new Date().toISOString()
    })
  } catch (logError) {
    console.error('Failed to log API interaction:', logError)
  }
}

/\*\*

 \* Validate user permissions before making external API calls

 \* This ensures users can only access features they've paid for

 \*/

export async function validateUserPermissions(

  userId: string, 

  requiredFeature: string

): Promise\<boolean\> {

  const { data: userProfile } \= await supabase

    .from('user\_profiles')

    .select('subscription\_tier, features\_enabled')

    .eq('user\_id', userId)

    .single()

  

  if (\!userProfile) {

    throw new IntegrationError(

      IntegrationErrorType.AUTHENTICATION,

      'User profile not found'

    )

  }

  

  // Check if the user's plan includes this feature

  const hasFeature \= userProfile.features\_enabled?.includes(requiredFeature) || false

  

  if (\!hasFeature) {

    throw new IntegrationError(

      IntegrationErrorType.AUTHENTICATION,

      \`Feature '${requiredFeature}' not available in your current plan\`

    )

  }

  

  return true

}

---

## **📮 Skip Tracing Integration \- Complete Implementation**

Skip tracing is like being a "digital detective" \- we help users find updated contact information for people in their mailing lists. Here's how to build this feature from scratch:

### **Step 1: Database Schema for Skip Tracing**

First, let's set up the database tables to track skip tracing orders:

\-- Database migration: 001\_create\_skip\_tracing\_tables.sql

\-- This creates all the tables we need to manage skip tracing orders

\-- Main skip tracing orders table

\-- Think of this as the "order receipt" for each skip tracing job

CREATE TABLE skip\_trace\_orders (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id UUID NOT NULL REFERENCES auth.users(id),

  mailing\_list\_id UUID NOT NULL REFERENCES mailing\_lists(id),

  

  \-- Which records are we trying to enhance?

  selected\_records UUID\[\] NOT NULL, \-- Array of mailing\_list\_record IDs

CREATE TABLE skip_trace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  mailing_list_id UUID NOT NULL REFERENCES mailing_lists(id),

  -- Which records are we trying to enhance?
  selected_records UUID[] NOT NULL, -- Array of mailing_list_record IDs

  -- Vendor information
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_email VARCHAR(255) NOT NULL, -- Where we send the CSV

  -- Pricing details
  record_count INTEGER NOT NULL,
  unit_price DECIMAL(6,3) NOT NULL, -- Price per record (like $0.10)
  total_cost DECIMAL(10,2) NOT NULL,

  -- Order status tracking - like a package delivery status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed

  -- File tracking
  export_filename VARCHAR(255), -- CSV file we sent to vendor
  results_filename VARCHAR(255), -- Enhanced data file from vendor
  csv_exported_at TIMESTAMP,
  results_imported_at TIMESTAMP,

  -- Payment information
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed

  -- Capture any error from the vendor/API
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Enable extension if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helpful indexes
CREATE INDEX ON skip_trace_orders (user_id);
CREATE INDEX ON skip_trace_orders (status);
CREATE INDEX ON skip_trace_records (skip_trace_order_id);

  \-- Original data (what we had before)

  original\_data JSONB NOT NULL,

  

  \-- Enhanced data (what the vendor found)

  enriched\_data JSONB,

  

  \-- Results tracking

  trace\_status VARCHAR(50) DEFAULT 'not\_requested', \-- not\_requested, pending, enriched, failed

  enhancement\_fields TEXT\[\] DEFAULT '{}', \-- Which fields were improved: \['phone', 'email'\]

  confidence\_score DECIMAL(3,2), \-- How confident is the data (0.00 to 1.00)

  vendor\_notes TEXT, \-- Any notes from the vendor

  

  \-- Timestamps

  created\_at TIMESTAMP DEFAULT NOW(),

  enriched\_at TIMESTAMP

);

\-- Security: Users can only see their own skip trace orders

ALTER TABLE skip\_trace\_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skip trace orders" 

ON skip\_trace\_orders FOR ALL 

USING (auth.uid() \= user\_id);

ALTER TABLE skip\_trace\_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skip trace records" 

ON skip\_trace\_records FOR SELECT 

USING (

  skip\_trace\_order\_id IN (

    SELECT id FROM skip\_trace\_orders WHERE user\_id \= auth.uid()

  )

);

### **Step 2: Skip Tracing API Routes**

Now let's build the API endpoints that handle skip tracing requests:

// app/api/skip-trace/order/route.ts

// This endpoint creates new skip tracing orders

import { NextRequest, NextResponse } from 'next/server'

-- Security: Users can only see their own skip trace orders

ALTER TABLE skip_trace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own skip trace orders"
ON skip_trace_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skip trace orders"
ON skip_trace_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skip trace orders"
ON skip_trace_orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE skip_trace_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skip trace records"
ON skip_trace_records FOR SELECT
USING (
  skip_trace_order_id IN (
    SELECT id FROM skip_trace_orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own skip trace records"
ON skip_trace_records FOR INSERT
WITH CHECK (
  skip_trace_order_id IN (
    SELECT id FROM skip_trace_orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own skip trace records"
ON skip_trace_records FOR UPDATE
USING (
  skip_trace_order_id IN (
    SELECT id FROM skip_trace_orders WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  skip_trace_order_id IN (
    SELECT id FROM skip_trace_orders WHERE user_id = auth.uid()
  )
);

### **Step 2: Skip Tracing API Routes**

  mailingListId: z.string().uuid('Must be a valid mailing list ID'),

  selectedRecords: z.array(z.string().uuid()).min(1, 'Must select at least one record'),

  vendorId: z.string().uuid('Must select a vendor'),

  unitPrice: z.number().positive('Unit price must be positive'),

})

export async function POST(request: NextRequest) {

  try {

    // Step 1: Get the user from the session

    const { data: { session } } \= await supabase.auth.getSession()

    

    if (\!session) {

      return NextResponse.json(

        { error: 'Authentication required' },

        { status: 401 }

      )

    }

    // Step 2: Parse and validate the request data

    const body \= await request.json()

    const validatedData \= createSkipTraceOrderSchema.parse(body)

    

    // Step 3: Check if user has permission for skip tracing

    await validateUserPermissions(session.user.id, 'skip\_tracing')

    

    // Step 4: Verify the mailing list belongs to this user

    const { data: mailingList, error: listError } \= await supabase

      .from('mailing\_lists')

      .select('id, name, user\_id')

      .eq('id', validatedData.mailingListId)

      .eq('user\_id', session.user.id) // Security: ensure ownership

      .single()

    

    if (listError || \!mailingList) {

      return NextResponse.json(

        { error: 'Mailing list not found or access denied' },

        { status: 404 }

      )

    }

    

    // Step 5: Get the vendor information

    const { data: vendor, error: vendorError } \= await supabase

      .from('vendors')

      .select('id, name, email, unit\_price\_skip\_tracing, vendor\_type')

      .eq('id', validatedData.vendorId)

      .eq('vendor\_type', 'skip\_tracing')

      .single()

    

    if (vendorError || \!vendor) {

      return NextResponse.json(

        { error: 'Skip tracing vendor not found' },

        { status: 404 }

      )

    }

    

    // Step 6: Calculate the total cost

    const recordCount \= validatedData.selectedRecords.length

    const unitPrice \= vendor.unit\_price\_skip\_tracing || validatedData.unitPrice

    const totalCost \= recordCount \* unitPrice

    

    // Step 7: Create Stripe payment intent (but don't capture yet)

    const paymentIntent \= await stripe.paymentIntents.create({

      amount: Math.round(totalCost \* 100), // Stripe uses cents

      currency: 'usd',

      customer: session.user.id, // You'd have a Stripe customer ID here

      capture\_method: 'manual', // We'll capture after vendor completes the work

      metadata: {

        service: 'skip\_tracing',

        user\_id: session.user.id,

        mailing\_list\_id: validatedData.mailingListId,

        record\_count: recordCount.toString()

      }

    })

    

    // Step 8: Create the skip trace order record

    const { data: skipTraceOrder, error: orderError } \= await supabase

      .from('skip\_trace\_orders')

      .insert({

        user\_id: session.user.id,

        mailing\_list\_id: validatedData.mailingListId,

        selected\_records: validatedData.selectedRecords,

        vendor\_id: validatedData.vendorId,

        vendor\_email: vendor.email,

        record\_count: recordCount,

        unit\_price: unitPrice,

        total\_cost: totalCost,

        stripe\_payment\_intent\_id: paymentIntent.id,

        status: 'pending'

      })

      .select()

      .single()

    

    if (orderError) {

      // If database insert fails, cancel the payment intent

      await stripe.paymentIntents.cancel(paymentIntent.id)

      throw new IntegrationError(

        IntegrationErrorType.UNKNOWN,

        'Failed to create skip trace order',

        orderError

      )

    }

    

    // Step 9: Generate and send CSV to vendor

    await processSkipTraceOrder(skipTraceOrder.id, session.user.id)

    

    // Step 10: Log the successful operation

    await logAPIInteraction(

      'skip\_tracing',

      '/api/skip-trace/order',

    // Step 9: Enqueue background job to process the order

    await enqueueSkipTraceJob({ orderId: skipTraceOrder.id, userId: session.user.id })

      undefined,

      session.user.id

    )

    

    return NextResponse.json({

      success: true,

      orderId: skipTraceOrder.id,

      recordCount,

      totalCost,

      paymentIntentId: paymentIntent.id,

      message: \`Skip tracing order created for ${recordCount} records. Total cost: $${totalCost.toFixed(2)}\`

    })

    

  } catch (error) {

    console.error('Skip trace order creation failed:', error)

    

    // Log the error for debugging

    await logAPIInteraction(

      'skip\_tracing',

      '/api/skip-trace/order',

      'POST',

      {},

      {},

      error as Error

    )

    

    if (error instanceof z.ZodError) {

      return NextResponse.json(

        { error: 'Invalid request data', details: error.errors },

        { status: 400 }

      )

    }

    

    if (error instanceof IntegrationError) {

      return NextResponse.json(

        { error: error.message, type: error.type },

        { status: error.type \=== IntegrationErrorType.AUTHENTICATION ? 403 : 500 }

      )

    }

    

    return NextResponse.json(

      { error: 'Failed to create skip trace order' },

      { status: 500 }

    )

  }

}

/\*\*

 \* Process skip trace order \- generate CSV and email to vendor

 \* This function handles the actual work of preparing data for the vendor

 \*/

async function processSkipTraceOrder(orderId: string, userId: string) {

  try {

    // Get the order details

    const { data: order, error: orderError } \= await supabase

      .from('skip\_trace\_orders')

      .select(\`

        \*,

        mailing\_lists(name),

        vendors(name, email)

      \`)

      .eq('id', orderId)

      .single()

    

    if (orderError || \!order) {

      throw new Error('Skip trace order not found')

    }

    

    // Get the selected records

    const { data: records, error: recordsError } \= await supabase

      .from('mailing\_list\_records')

      .select('id, first\_name, last\_name, address\_line\_1, address\_line\_2, city, state, zip\_code, email, phone')

      .in('id', order.selected\_records)

    

    if (recordsError || \!records) {

      throw new Error('Failed to fetch mailing list records')

    }

    

    // Create individual skip trace record entries

    const skipTraceRecords \= records.map(record \=\> ({

      skip\_trace\_order\_id: orderId,

      mailing\_list\_record\_id: record.id,

      original\_data: record,

      trace\_status: 'pending'

    }))

    

    await supabase

      .from('skip\_trace\_records')

      .insert(skipTraceRecords)

    

    // Generate CSV file

    const csvData \= generateSkipTraceCsv(records, order)

    const filename \= \`skip\_trace\_${orderId}\_${Date.now()}.csv\`

    

    // Upload CSV to S3 (via Supabase Storage)

    const { data: fileUpload, error: uploadError } \= await supabase.storage

      .from('skip-trace-exports')

      .upload(filename, csvData, {

        contentType: 'text/csv',

        cacheControl: '3600' // 1 hour cache

      })

    

    if (uploadError) {

      throw new Error(\`Failed to upload CSV: ${uploadError.message}\`)

    }

    

    // Email the CSV to the vendor

    await sendSkipTraceCsvToVendor(order, filename, csvData)

    

    // Update order status

    await supabase

      .from('skip\_trace\_orders')

      .update({

        status: 'processing',

        export\_filename: filename,

        csv\_exported\_at: new Date().toISOString()

      })

      .eq('id', orderId)

    

    // Send confirmation email to user

    await sendSkipTraceConfirmationEmail(userId, order)

    

  } catch (error) {

    console.error('Failed to process skip trace order:', error)

    

    // Update order status to failed

    await supabase

      .from('skip\_trace\_orders')

      .update({

        status: 'failed',

        error\_message: (error as Error).message

      })

      .eq('id', orderId)

    

    throw error

  }

}

/\*\*

 \* Generate CSV data for skip tracing

 \* This creates a standardized format that vendors can process

 \*/

function generateSkipTraceCsv(records: any\[\], order: any): string {

  // CSV headers that most skip tracing vendors expect

  const headers \= \[

    'ID', // Our internal record ID for matching results back

    'First\_Name',

    'Last\_Name', 

    'Address\_1',

    'Address\_2',

    'City',

    'State',

    'Zip\_Code',

    'Current\_Email',

    'Current\_Phone',

    'Instructions' // Special requests or notes

  \]

  

  // Convert records to CSV rows

  const csvRows \= records.map(record \=\> \[

    record.id,

    record.first\_name || '',

    record.last\_name || '',

    record.address\_line\_1 || '',

    record.address\_line\_2 || '',

    record.city || '',

    record.state || '',

    record.zip\_code || '',

    record.email || '',

    record.phone || '',

    'Please find current phone and email if possible' // Standard instruction

  \])

  

  // Combine headers and data

  const allRows \= \[headers, ...csvRows\]

  

  // Convert to CSV format

  return allRows

    .map(row \=\> row.map(cell \=\> \`"${cell}"\`).join(','))

    .join('\\n')

}

/\*\*

 \* Email CSV file to skip tracing vendor

 \* This uses Mailgun to send the file as an attachment

 \*/

async function sendSkipTraceCsvToVendor(order: any, filename: string, csvData: string) {

  const mailgun \= new Mailgun(formData)

  const mg \= mailgun.client({

    username: 'api',

    key: process.env.MAILGUN\_API\_KEY\!

  })

  

  const emailData \= {

    from: 'YLS Skip Tracing \<skiptrace@yellowlettershop.com\>',

    to: order.vendors.email,

    subject: \`Skip Trace Order ${order.id} \- ${order.record\_count} Records\`,

    html: \`

      \<h2\>New Skip Trace Order\</h2\>

      \<p\>Hello ${order.vendors.name},\</p\>

      

      \<p\>We have a new skip tracing order for you:\</p\>

      \<ul\>

        \<li\>\<strong\>Order ID:\</strong\> ${order.id}\</li\>

        \<li\>\<strong\>Record Count:\</strong\> ${order.record\_count}\</li\>

        \<li\>\<strong\>Total Value:\</strong\> $${order.total\_cost}\</li\>

        \<li\>\<strong\>Mailing List:\</strong\> ${order.mailing\_lists.name}\</li\>

      \</ul\>

      

      \<p\>Please process the attached CSV file and return the enhanced data to this email address.\</p\>

      

      \<p\>When replying, please include the Order ID \<strong\>${order.id}\</strong\> in the subject line.\</p\>

      

      \<p\>Thank you\!\</p\>

      \<p\>Yellow Letter Shop Team\</p\>

    \`,

    attachment: {

      data: Buffer.from(csvData),

      filename: filename,

      contentType: 'text/csv'

    }

  }

  

  try {

    await mg.messages.create('mg.yellowlettershop.com', emailData)

    console.log(\`Skip trace CSV sent to ${order.vendors.email}\`)

  } catch (error) {

    console.error('Failed to send skip trace email:', error)

    throw new Error('Failed to email CSV to vendor')

  }

}

### **Step 3: Webhook for Processing Vendor Results**

When vendors send back enhanced data, we need to process it automatically:

// app/api/skip-trace/webhook/results/route.ts

  // This endpoint receives enhanced data back from vendors

  import { NextRequest, NextResponse } from 'next/server'

  import { supabase } from '@/lib/supabase'

  import Papa from 'papaparse'
  
  import crypto from 'crypto'

export async function POST(request: NextRequest) {

  try {

    // This endpoint processes inbound emails from Mailgun

    // Mailgun sends us webhook data when vendors reply to our emails

    

    const formData \= await request.formData()

    

    // Extract email details from Mailgun webhook

    const subject \= formData.get('subject') as string

    const fromEmail \= formData.get('sender') as string

    const attachments \= formData.get('attachment-count') as string
    
    // Verify Mailgun webhook signature to prevent spoofing
    const timestamp \= formData.get('timestamp') as string
    const token \= formData.get('token') as string
    const signature \= formData.get('signature') as string
    
    if (!timestamp || !token || !signature) {
      return NextResponse.json(
        { error: 'Missing Mailgun signature parameters' },
        { status: 400 }
      )
    }
    
    const expected \= crypto
      .createHmac('sha256', process.env.MAILGUN\_API\_KEY!)
      .update(timestamp + token)
      .digest('hex')
    
    if (expected !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }
    
    // Extract order ID from email subject

    // We told vendors to include the order ID in their reply

    const orderIdMatch \= subject?.match(/Order\\s+([0-9a-f-]{36})/i)

    

    if (\!orderIdMatch) {

      return NextResponse.json(
        { error: 'Order ID not found in email subject' },
        { status: 400 }
      )

    }

    

    const orderId \= orderIdMatch\[1\]

    

    // Get the skip trace order

    const { data: order, error: orderError } \= await supabase

      .from('skip\_trace\_orders')

      .select('\*, vendors(email)')

      .eq('id', orderId)

      .single()

    

    if (orderError || \!order) {

      return NextResponse.json(
        { error: 'Skip trace order not found' },
        { status: 404 }
      )

    }

    

    // Verify the email is from the expected vendor

    if (order.vendors.email && !fromEmail?.toLowerCase().includes(order.vendors.email.toLowerCase())) {

      console.warn(\`Unexpected sender ${fromEmail} for order ${orderId}\`)

      // We might want to allow this but log it for security

    }

    

    // Process any CSV attachments

    const attachmentCount \= parseInt(attachments) || 0

    let processedRecords \= 0

    

    for (let i \= 1; i \<= attachmentCount; i++) {

      const attachmentData \= formData.get(\`attachment-${i}\`) as File

      

      if (attachmentData && attachmentData.name.endsWith('.csv')) {

        const csvText \= await attachmentData.text()

        const recordsProcessed \= await processEnhancedCsvData(orderId, csvText)

        processedRecords \+= recordsProcessed

      }

    }

    

    if (processedRecords \> 0\) {

      // Update order status to completed

      await supabase

        .from('skip\_trace\_orders')

        .update({

          status: 'completed',

          results\_imported\_at: new Date().toISOString(),

          completed\_at: new Date().toISOString()

        })

        .eq('id', orderId)

      

      // Notify the user that their skip trace is complete

      await notifyUserSkipTraceComplete(order.user\_id, orderId, processedRecords)

      

      return NextResponse.json({

        success: true,

        message: \`Processed ${processedRecords} enhanced records for order ${orderId}\`

      })

    }

    

    return NextResponse.json(

      { error: 'No valid CSV attachments found' },

      { status: 400 }

    )

    

  } catch (error) {

    console.error('Skip trace webhook processing failed:', error)

    return NextResponse.json(

      { error: 'Failed to process skip trace results' },

      { status: 500 }

    )

  }

}

/\*\*

 \* Process enhanced CSV data from vendor

 \* This updates our database with the new contact information

 \*/

async function processEnhancedCsvData(orderId: string, csvData: string): Promise\<number\> {

  return new Promise((resolve, reject) \=\> {

    // Parse the CSV data

    Papa.parse(csvData, {

      header: true, // First row contains column names

      skipEmptyLines: true,

      complete: async (results) \=\> {

        try {

          let updatedCount \= 0

          

          // Process each row of enhanced data

          for (const row of results.data as any\[\]) {

            // The vendor should include our original ID so we can match records

            const originalId \= row.ID || row.id || row.Record\_ID

            

            if (\!originalId) {

              console.warn('Row missing ID, skipping:', row)

              continue

            }

            

            // Build the enhanced data object

            const enhancedData \= {

              email: row.Enhanced\_Email || row.New\_Email || row.email,

              phone: row.Enhanced\_Phone || row.New\_Phone || row.phone,

              address\_line\_1: row.Enhanced\_Address || row.address\_line\_1,

              // ... other enhanced fields

            }

            

            // Build the enhanced data object
            const enhancedData = {
              email: row.Enhanced_Email || row.New_Email || row.Current_Email || row.email,
              phone: row.Enhanced_Phone || row.New_Phone || row.Current_Phone || row.phone,
              address_line_1: row.Enhanced_Address || row.Address_1 || row.address_line_1,
              // ... other enhanced fields
            }

            // Determine what fields were enhanced
            const enhancementFields: string[] = []
            if (enhancedData.email && enhancedData.email !== (row.Current_Email || row.email)) {
              enhancementFields.push('email')
            }
            if (enhancedData.phone && enhancedData.phone !== (row.Current_Phone || row.phone)) {
              enhancementFields.push('phone')
            }

            // Calculate confidence score (vendor might provide this)
            const confidenceScore = parseFloat(row.Confidence_Score || row.confidence || '0.8')

            // Update the skip trace record
            const { error: updateError } = await supabase
              .from('skip_trace_records')
              .update({
                enriched_data: enhancedData,
                trace_status: enhancementFields.length > 0 ? 'enriched' : 'failed',
                enhancement_fields: enhancementFields,

              console.error(\`Failed to update record ${originalId}:\`, updateError)

            } else {

              updatedCount++

              

              // If confidence is high enough, update the original mailing list record

              if (confidenceScore \>= 0.7 && enhancementFields.length \> 0\) {

                await updateOriginalMailingListRecord(originalId, enhancedData, enhancementFields)

              }

            }

          }

          

          resolve(updatedCount)

          

        } catch (error) {

          reject(error)

        }

      },

      error: (error) \=\> {

        reject(new Error(\`CSV parsing failed: ${error.message}\`))

      }

    })

  })

}

/\*\*

 \* Update the original mailing list record with enhanced data

 \* This improves the user's mailing list with the new information

 \*/

async function updateOriginalMailingListRecord(

  recordId: string, 

  enhancedData: any, 

  enhancedFields: string\[\]

) {

  // Build update object with only the enhanced fields

  const updateData: any \= {}

  

  if (enhancedFields.includes('email') && enhancedData.email) {

    updateData.email \= enhancedData.email

  }

  if (enhancedFields.includes('phone') && enhancedData.phone) {

    updateData.phone \= enhancedData.phone

  }

  // Add other fields as needed

  

  if (Object.keys(updateData).length \> 0\) {

    // Add metadata about the enhancement

    updateData.enhanced\_at \= new Date().toISOString()

    updateData.enhancement\_source \= 'skip\_tracing'

    

    const { error } \= await supabase

      .from('mailing\_list\_records')

      .update(updateData)

      .eq('id', recordId)

    

    if (error) {

      console.error(\`Failed to update original record ${recordId}:\`, error)

    } else {

      console.log(\`Enhanced record ${recordId} with fields: ${enhancedFields.join(', ')}\`)

    }

  }

}

/\*\*

 \* Notify user that their skip trace is complete

 \* Send them an email with the results summary

 \*/

async function notifyUserSkipTraceComplete(

  userId: string, 

  orderId: string, 

  enhancedRecordsCount: number

) {

  // Get user's email address

  const { data: user } \= await supabase.auth.admin.getUserById(userId)

  

  if (\!user?.user?.email) {

    console.error('User email not found for skip trace notification')

    return

  }

  

  // Send notification email (you'd implement this with your email service)

  const emailData \= {

    to: user.user.email,

    subject: 'Skip Trace Complete \- Enhanced Contact Data Ready',

    html: \`

      \<h2\>Your Skip Trace is Complete\!\</h2\>

      

      \<p\>Great news\! We've successfully enhanced your contact data.\</p\>

      

      \<div style="background: \#f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;"\>

        \<h3\>Results Summary\</h3\>

        \<ul\>

          \<li\>\<strong\>Order ID:\</strong\> ${orderId}\</li\>

          \<li\>\<strong\>Records Enhanced:\</strong\> ${enhancedRecordsCount}\</li\>

          \<li\>\<strong\>Status:\</strong\> Complete\</li\>

        \</ul\>

      \</div\>

      

      \<p\>The enhanced data has been automatically added to your mailing list. You can view the results in your dashboard.\</p\>

      

      \<p\>\<a href="${process.env.NEXT\_PUBLIC\_APP\_URL}/dashboard/skip-trace/${orderId}" style="background: \#3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;"\>View Results\</a\>\</p\>

      

      \<p\>Thank you for using Yellow Letter Shop\!\</p\>

    \`

  }

  

  // Send email using your email service (Mailgun, SendGrid, etc.)

  // Implementation depends on your email provider

}

---

## **🤖 AI Personalization Engine \- Complete Implementation**

The AI Personalization Engine helps users create compelling, personalized messages for their direct mail campaigns. Think of it as having a professional copywriter built into your app\!

### **Step 1: AI Service Configuration**

Let's set up our AI service integrations with proper error handling and usage tracking:

// lib/ai/openai-client.ts

// This is our "AI assistant" that helps generate personalized messages

import OpenAI from 'openai'

import { supabase } from '@/lib/supabase'

import { 

  IntegrationError, 

  IntegrationErrorType,

  logAPIInteraction 

} from '@/lib/api-integrations/shared'

/\*\*

 \* Configuration for AI services

 \* Think of this as the "settings" for our AI assistant

 \*/

const AI\_CONFIG \= {

  openai: {

    model: 'gpt-4', // The smartest model for high-quality content

    maxTokens: 500, // Limit response length to control costs

    temperature: 0.7, // Balance between creativity and consistency

  },

  usage: {

    dailyLimit: 100, // Free users get 100 AI generations per day

    monthlyLimit: {

      free: 500,

      pro: 5000,

      team: 10000,

      enterprise: 50000

    }

  }

} as const

/\*\*

 \* OpenAI client setup with error handling

 \*/

export const openai \= new OpenAI({

  apiKey: process.env.OPENAI\_API\_KEY,

  timeout: 30000, // 30 second timeout

})

/\*\*

 \* Generate personalized message content using AI

 \* This is the main function that creates custom messages for recipients

 \*/

export async function generatePersonalizedMessage(

  recipientData: any,

  campaignType: string,

  tone: 'professional' | 'friendly' | 'urgent' | 'casual',

  userId: string,

  additionalContext?: string

): Promise\<{

  generatedContent: string

  tokensUsed: number

  confidenceScore: number

}\> {

  try {

    // Step 1: Check if user has remaining AI usage

    await validateAiUsageLimits(userId)

    

    // Step 2: Build the AI prompt based on the recipient data

    const prompt \= buildPersonalizationPrompt({

      recipientData,

      campaignType,

      tone,

      additionalContext

    })

    

    // Step 3: Make the AI API call

    const startTime \= Date.now()

    const response \= await openai.chat.completions.create({

      model: AI\_CONFIG.openai.model,

      messages: \[

        {

          role: 'system',

          content: getSystemPrompt(campaignType, tone)

        },

        {

          role: 'user', 

          content: prompt

        }

      \],

      max\_tokens: AI\_CONFIG.openai.maxTokens,

      temperature: AI\_CONFIG.openai.temperature,

    })

    const responseTime \= Date.now() \- startTime

    

    // Step 4: Extract the generated content

    const generatedContent \= response.choices\[0\]?.message?.content?.trim()

    

    if (\!generatedContent) {

      throw new IntegrationError(

        IntegrationErrorType.SERVICE\_UNAVAILABLE,

        'AI service returned empty response'

      )

    }

    

    // Step 5: Calculate usage cost and log it

    const tokensUsed \= response.usage?.total\_tokens || 0

    const estimatedCost \= calculateAiCost(tokensUsed)

    

    await logAiUsage({

      userId,

      service: 'openai',

      operation: 'message\_generation',

      inputTokens: response.usage?.prompt\_tokens || 0,

      outputTokens: response.usage?.completion\_tokens || 0,

      totalTokens: tokensUsed,

      cost: estimatedCost,

      responseTime,

      campaignType,

      tone

    })

    

    // Step 6: Calculate a confidence score based on response quality

    const confidenceScore \= calculateContentConfidence(generatedContent, recipientData)

    

    // Step 7: Save the generated content for potential reuse

    await saveGeneratedContent({

      userId,

      contentType: 'personalized\_message',

      prompt: prompt,

      generatedContent,

      confidenceScore,

      metadata: {

        campaignType,

        tone,

        tokensUsed,

        recipientData: {

          // Save only non-sensitive data for analysis

          hasName: Boolean(recipientData.firstName),

          hasAddress: Boolean(recipientData.address),

          hasPropertyInfo: Boolean(recipientData.propertyValue)

        }

      }

    })

    

    return {

      generatedContent,

      tokensUsed,

      confidenceScore

    }

    

  } catch (error) {

    // Log the error for debugging

    await logAPIInteraction(

      'openai',

      'chat/completions',

      'POST',

      { campaignType, tone },

      {},

      error as Error,

      userId

    )

    

    if (error instanceof IntegrationError) {

      throw error

    }

    

    // Handle specific OpenAI errors

    if (error instanceof OpenAI.APIError) {

      if (error.status \=== 429\) {

        throw new IntegrationError(

          IntegrationErrorType.RATE\_LIMIT,

          'AI service is currently busy. Please try again in a moment.'

        )

      }

      

      if (error.status \=== 401\) {

        throw new IntegrationError(

          IntegrationErrorType.AUTHENTICATION,

          'AI service authentication failed'

        )

      }

    }

    

    throw new IntegrationError(

      IntegrationErrorType.SERVICE\_UNAVAILABLE,

      'AI service is currently unavailable'

    )

  }

}

/\*\*

 \* Build a personalized prompt for the AI

 \* This function creates the instructions we give to the AI

 \*/

function buildPersonalizationPrompt({

  recipientData,

  campaignType,

  tone,

  additionalContext

}: {

  recipientData: any

  campaignType: string

  tone: string

  additionalContext?: string

}): string {

  // Start with basic recipient information

  let prompt \= 'Write a personalized direct mail message with the following details:\\n\\n'

  

  // Add recipient-specific information

  if (recipientData.firstName) {

    prompt \+= \`Recipient Name: ${recipientData.firstName}\`

    if (recipientData.lastName) {

      prompt \+= \` ${recipientData.lastName}\`

    }

    prompt \+= '\\n'

  }

  

  if (recipientData.address) {

    prompt \+= \`Property Address: ${recipientData.address}\`

    if (recipientData.city && recipientData.state) {

      prompt \+= \`, ${recipientData.city}, ${recipientData.state}\`

    }

    prompt \+= '\\n'

  }

  

  if (recipientData.propertyValue) {

    prompt \+= \`Estimated Property Value: $${recipientData.propertyValue.toLocaleString()}\\n\`

  }

  

  if (recipientData.propertyType) {

    prompt \+= \`Property Type: ${recipientData.propertyType}\\n\`

  }

  

  // Add campaign-specific context

  prompt \+= \`\\nCampaign Type: ${campaignType}\\n\`

  prompt \+= \`Tone: ${tone}\\n\`

  

  if (additionalContext) {

    prompt \+= \`Additional Context: ${additionalContext}\\n\`

  }

  

  // Add specific instructions based on campaign type

  switch (campaignType) {

    case 'home\_buying':

      prompt \+= '\\nCreate a message about buying their house. Focus on a quick, hassle-free sale process.'

      break

    case 'investment\_opportunity':

      prompt \+= '\\nCreate a message about investment opportunities in their area. Focus on market trends and potential returns.'

      break

    case 'property\_services':

      prompt \+= '\\nCreate a message offering property-related services. Focus on maintaining or improving their property value.'

      break

    default:

      prompt \+= '\\nCreate a compelling, relevant message for this recipient.'

  }

  

  // Add tone-specific guidance

  switch (tone) {

    case 'professional':

      prompt \+= ' Use a business-appropriate, respectful tone.'

      break

    case 'friendly':

      prompt \+= ' Use a warm, neighborly tone that feels personal.'

      break

    case 'urgent':

      prompt \+= ' Create urgency without being pushy or aggressive.'

      break

    case 'casual':

      prompt \+= ' Use a relaxed, conversational tone.'

      break

  }

  

  // Final instructions

  prompt \+= '\\n\\nKeep the message concise (under 200 words), include a clear call-to-action, and make it feel genuinely personal. Do not use placeholder brackets like \[Name\] \- incorporate the actual details naturally into the message.'

  

  return prompt

}

/\*\*

 \* System prompt that tells the AI how to behave

 \* This sets the "personality" of our AI assistant

 \*/

function getSystemPrompt(campaignType: string, tone: string): string {

  return \`You are an expert direct mail copywriter specializing in ${campaignType} campaigns. 

Your goal is to create compelling, personalized messages that:

1\. Feel genuinely personal and relevant to the recipient

2\. Are appropriate for direct mail format (concise but engaging)

3\. Include natural personalization without obvious templates

4\. Have a clear, compelling call-to-action

5\. Maintain a ${tone} tone throughout

Guidelines:

\- Never use placeholder brackets like \[Name\] or \[Address\]

\- Incorporate personal details naturally into the message flow

\- Keep messages under 200 words for direct mail effectiveness

\- Focus on benefits to the recipient, not features of your service

\- Include specific, actionable next steps

\- Avoid overly salesy language or pressure tactics

\- Make the message feel like it came from a real person, not a template

Remember: The best direct mail feels personal and relevant, not mass-produced.\`

}

/\*\*

 \* Check if user has remaining AI usage for their plan

 \* This prevents users from exceeding their subscription limits

 \*/

async function validateAiUsageLimits(userId: string): Promise\<void\> {

  // Get user's subscription plan and current usage

  const { data: userProfile } \= await supabase

    .from('user\_profiles')

    .select('subscription\_tier')

    .eq('user\_id', userId)

    .single()

  

  if (\!userProfile) {

    throw new IntegrationError(

      IntegrationErrorType.AUTHENTICATION,

      'User profile not found'

    )

  }

  

  // Get current month's usage

  const now \= new Date()

  const monthStart \= new Date(now.getFullYear(), now.getMonth(), 1\)

  

  const { data: usageRecords } \= await supabase

    .from('ai\_usage\_logs')

async function validateAiUsageLimits(userId: string): Promise<void> {
  // Get user's subscription plan and current usage
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single()

  if (!userProfile) {
    throw new IntegrationError(
      IntegrationErrorType.AUTHENTICATION,
      'User profile not found'
    )
  }

  // Get current month's usage
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: usageRecords } = await supabase
    .from('ai_usage_logs')
    .select('operation_type')
    .eq('user_id', userId)
    .eq('operation_type', 'message_generation')
    .gte('created_at', monthStart.toISOString())

  const monthlyUsage = usageRecords?.length || 0
  const monthlyLimit =
    AI_CONFIG.usage.monthlyLimit[
      userProfile.subscription_tier as keyof typeof AI_CONFIG.usage.monthlyLimit
    ] || 0

  if (monthlyUsage >= monthlyLimit) {
    throw new IntegrationError(
      IntegrationErrorType.RATE_LIMIT,
      `Monthly AI usage limit reached (${monthlyLimit} generations). Upgrade your plan for more AI features.`
    )
  }
}

  if (recipientData.address && content.toLowerCase().includes(recipientData.city?.toLowerCase())) {

    confidence \+= 0.1

  }

  

  // Check content quality indicators

  if (content.includes('?') || content.includes('\!')) {

    confidence \+= 0.1 // Engaging punctuation

  }

  

  if (content.length \> 100 && content.length \< 250\) {

    confidence \+= 0.1 // Appropriate length

  }

  

  // Check for call-to-action

  const ctaWords \= \['call', 'contact', 'visit', 'email', 'text', 'respond'\]

  if (ctaWords.some(word \=\> content.toLowerCase().includes(word))) {

    confidence \+= 0.1

  }

  

  return Math.min(confidence, 1.0) // Cap at 1.0

}

/\*\*

 \* Log AI usage for billing and analytics

 \* This tracks every AI API call for cost management

 \*/

async function logAiUsage({

  userId,

  service,

  operation,

  inputTokens,

  outputTokens,

  totalTokens,

  cost,

  responseTime,

  campaignType,

  tone

}: {

  userId: string

  service: string

  operation: string

  inputTokens: number

  outputTokens: number

  totalTokens: number

  cost: number

  responseTime: number

  campaignType: string

  tone: string

}) {

  try {

    await supabase.from('ai\_usage\_logs').insert({

      user\_id: userId,

      service\_type: service,

      operation\_type: operation,

      input\_tokens: inputTokens,

      output\_tokens: outputTokens,

      total\_tokens: totalTokens,

      cost\_usd: cost,

      response\_time\_ms: responseTime,

      metadata: {

        campaignType,

        tone

      },

      created\_at: new Date().toISOString()

    })

  } catch (error) {

    console.error('Failed to log AI usage:', error)

    // Don't throw \- logging failure shouldn't break the main operation

  }

}

/\*\*

 \* Save generated content for potential reuse and analysis

 \* This builds a library of successful AI generations

 \*/

async function saveGeneratedContent({

  userId,

  contentType,

  prompt,

  generatedContent,

  confidenceScore,

  metadata

}: {

  userId: string

  contentType: string

  prompt: string

  generatedContent: string

  confidenceScore: number

  metadata: any

}) {

  try {

    await supabase.from('ai\_generated\_content').insert({

      user\_id: userId,

      content\_type: contentType,

      prompt\_used: prompt,

      generated\_content: generatedContent,

      quality\_score: confidenceScore,

      metadata: metadata,

      times\_used: 0,

      created\_at: new Date().toISOString()

    })

  } catch (error) {

    console.error('Failed to save generated content:', error)

    // Don't throw \- saving failure shouldn't break the main operation

  }

}

### **Step 2: AI Personalization API Endpoint**

Now let's create the API endpoint that users call to generate personalized messages:

// app/api/ai/personalize-message/route.ts

// This endpoint handles AI message generation requests

import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { supabase } from '@/lib/supabase'

import { generatePersonalizedMessage } from '@/lib/ai/openai-client'

import { validateUserPermissions, logAPIInteraction } from '@/lib/api-integrations/shared'

/\*\*

 \* Schema for validating AI personalization requests

 \* This ensures we have all the data needed to create good content

 \*/

const personalizeMessageSchema \= z.object({

  recipientData: z.object({

    firstName: z.string().optional(),

    lastName: z.string().optional(),

    address: z.string().optional(),

    city: z.string().optional(),

    state: z.string().optional(),

    zipCode: z.string().optional(),

    propertyValue: z.number().optional(),

    propertyType: z.string().optional(),

  }),

  campaignType: z.enum(\['home\_buying', 'investment\_opportunity', 'property\_services', 'general'\]),

  tone: z.enum(\['professional', 'friendly', 'urgent', 'casual'\]),

  additionalContext: z.string().optional(),

  templateId: z.string().uuid().optional(), // If personalizing an existing template

})

export async function POST(request: NextRequest) {

  try {

    // Step 1: Authentication check

    const { data: { session } } \= await supabase.auth.getSession()

    

    if (\!session) {

      return NextResponse.json(

        { error: 'Authentication required' },

        { status: 401 }

      )

    }

    // Step 2: Validate request data

    const body \= await request.json()

    const validatedData \= personalizeMessageSchema.parse(body)

    

    // Step 3: Check user permissions for AI features

    await validateUserPermissions(session.user.id, 'ai\_personalization')

    

    // Step 4: Generate personalized content

    const startTime \= Date.now()

    const aiResult \= await generatePersonalizedMessage(

      validatedData.recipientData,

      validatedData.campaignType,

      validatedData.tone,

      session.user.id,

      validatedData.additionalContext

    )

    

    const processingTime \= Date.now() \- startTime

    

    // Step 5: If this is for a template, save the personalized version

    let savedTemplateId: string | undefined

    

    if (validatedData.templateId) {

      const { data: savedTemplate } \= await supabase

        .from('design\_templates')

        .insert({

          user\_id: session.user.id,

          name: \`Personalized: ${validatedData.recipientData.firstName || 'Recipient'}\`,

          description: 'AI-generated personalized message',

          template\_type: 'letter',

          design\_data: {

            message: aiResult.generatedContent,

            personalization: validatedData.recipientData,

            campaignType: validatedData.campaignType,

            tone: validatedData.tone,

            aiGenerated: true,

            aiConfidenceScore: aiResult.confidenceScore

          },

          is\_public: false,

          tags: \['ai-generated', validatedData.campaignType, validatedData.tone\]

        })

        .select('id')

        .single()

      

      savedTemplateId \= savedTemplate?.id

    }

    

    // Step 6: Log the successful operation

    await logAPIInteraction(

      'ai\_personalization',

      '/api/ai/personalize-message',

      'POST',

      {

        campaignType: validatedData.campaignType,

        tone: validatedData.tone,

        hasRecipientData: Object.keys(validatedData.recipientData).length \> 0

      },

      {

        tokensUsed: aiResult.tokensUsed,

        confidenceScore: aiResult.confidenceScore,

        processingTime

      },

      undefined,

      session.user.id

    )

    

    return NextResponse.json({

      success: true,

      generatedMessage: aiResult.generatedContent,

      metadata: {

        tokensUsed: aiResult.tokensUsed,

        confidenceScore: aiResult.confidenceScore,

        processingTime,

        campaignType: validatedData.campaignType,

        tone: validatedData.tone

      },

      savedTemplateId,

      message: 'Personalized message generated successfully'

    })

    

  } catch (error) {

    console.error('AI personalization failed:', error)

    

    // Log the error

    await logAPIInteraction(

      'ai\_personalization',

      '/api/ai/personalize-message', 

      'POST',

      {},

      {},

      error as Error

    )

    

    if (error instanceof z.ZodError) {

      return NextResponse.json(

        { error: 'Invalid request data', details: error.errors },

        { status: 400 }

      )

    }

    

    return NextResponse.json(

      { error: 'Failed to generate personalized message' },

      { status: 500 }

    )

  }

}

/\*\*

 \* GET endpoint to retrieve user's AI usage statistics

 \* This helps users understand their AI usage and limits

 \*/

export async function GET(request: NextRequest) {

  try {

    const { data: { session } } \= await supabase.auth.getSession()

    

    if (\!session) {

      return NextResponse.json(

        { error: 'Authentication required' },

        { status: 401 }

      )

    }

    

    // Get current month's usage

    const now \= new Date()

    const monthStart \= new Date(now.getFullYear(), now.getMonth(), 1\)

    

    const { data: usageRecords } \= await supabase

      .from('ai\_usage\_logs')

      .select('operation\_type, cost\_usd, created\_at')

      .eq('user\_id', session.user.id)

      .gte('created\_at', monthStart.toISOString())

      .order('created\_at', { ascending: false })

    

    // Get user's subscription info for limits

    const { data: userProfile } \= await supabase

      .from('user\_profiles')

      .select('subscription\_tier')

      .eq('user\_id', session.user.id)

      .single()

    

    // Calculate usage statistics

    const totalGenerations \= usageRecords?.length || 0

    const totalCost \= usageRecords?.reduce((sum, record) \=\> sum \+ (record.cost\_usd || 0), 0\) || 0

    

    // Get usage limits based on plan

    const limits \= {

      free: { monthly: 500, daily: 100 },

      pro: { monthly: 5000, daily: 500 },

      team: { monthly: 10000, daily: 1000 },

      enterprise: { monthly: 50000, daily: 5000 }

    }

    

    const userLimits \= limits\[userProfile?.subscription\_tier as keyof typeof limits\] || limits.free

    

    return NextResponse.json({

      usage: {

        thisMonth: {

          generations: totalGenerations,

          cost: totalCost,

          limit: userLimits.monthly,

          remainingGenerations: Math.max(0, userLimits.monthly \- totalGenerations)

        },

        recentActivity: usageRecords?.slice(0, 10\) // Last 10 generations

      },

      limits: userLimits,

      subscription: userProfile?.subscription\_tier || 'free'

    })

    

  } catch (error) {

    console.error('Failed to get AI usage stats:', error)

    return NextResponse.json(

      { error: 'Failed to retrieve usage statistics' },

      { status: 500 }

    )

  }

}

---

## **📊 MelissaData Integration — List Building & Demographics**

MelissaData serves as the primary data provider for targeted mailing list building, enabling users to purchase precisely targeted prospect lists based on demographics, property characteristics, and geographic criteria.

### **MelissaData vs AccuZIP Integration Clarification**

**🎯 MelissaData Purpose:** List building and demographic targeting
- Purchase new mailing lists based on user-defined criteria
- Demographics, property data, and geographic targeting
- Integration point: List Builder "Purchase & Mail" workflow
- Output: Raw prospect data for validation

**✅ AccuZIP Purpose:** Address validation and USPS compliance  
- Validate ANY mailing list data (uploaded, MLM, or MelissaData)
- CASS certification and address standardization
- Integration point: Post-column mapping in ALL order workflows
- Output: Validated deliverable records + undeliverable report

### **Workflow Integration Points**

```typescript
// List Builder Workflow
User selects criteria → MelissaData API (purchase) → Column Mapping → AccuZIP validation → Continue order

// Other Workflows  
User uploads/selects list → Column Mapping → AccuZIP validation → Continue order
```

### **MelissaData API Implementation**

```typescript
// lib/integrations/melissa-data.ts
interface MelissaDataCriteria {
  geography: {
    states: string[]
    counties?: string[]
    cities?: string[]
    zipCodes?: string[]
    radius?: { lat: number, lng: number, miles: number }
  }
  demographics: {
    ageRange?: { min: number, max: number }
    incomeRange?: { min: number, max: number }
    homeOwnership?: 'owner' | 'renter' | 'both'
    maritalStatus?: string[]
  }
  property: {
    valueRange?: { min: number, max: number }
    propertyType?: string[]
    yearBuiltRange?: { min: number, max: number }
    sqftRange?: { min: number, max: number }
  }
  mortgage?: {
    hasLoan?: boolean
    loanAmountRange?: { min: number, max: number }
    loanType?: string[]
  }
}

export async function purchaseListFromMelissaData(
  criteria: MelissaDataCriteria,
  userId: string
): Promise<{
  listId: string
  recordCount: number
  cost: number
  rawData: any[]
}> {
  // Implementation details for MelissaData API integration
}
```

### **Integration with Order Workflow**

The List Builder → MelissaData → AccuZIP validation → Order continuation ensures:
1. **Targeted Data**: Users get precisely targeted prospects from MelissaData
2. **Validated Addresses**: All data validated for deliverability via AccuZIP  
3. **Accurate Pricing**: Order quantities based on validated deliverable records
4. **Print-Ready**: Properly formatted data for design personalization

This comprehensive implementation gives you a complete, production-ready AI personalization system with proper error handling, usage tracking, and user management. The code includes extensive comments explaining every step, making it easy for developers to understand and modify.  
