# **Development Guide — Yellow Letter Shop (YLS)**

*Complete Setup Instructions for New Developers*  
*Last Updated: August 2025*

Welcome to the Yellow Letter Shop development team\! This guide will walk you through everything you need to know to get started, from your very first code checkout to deploying features to production. We've designed this to be beginner-friendly while still covering all the expert-level details you'll need.

---

## **🚀 Quick Start for Impatient Developers**

If you just want to get running quickly, here's the 5-minute version:

\# 1\. Clone and enter the project

git clone \<repository-url\>

cd yellow-letter-shop

\# 2\. Install dependencies

npm install

\# 3\. Set up your environment file

cp .env.example .env.local

\# Then edit .env.local with your actual values

\# 4\. Start the development server

npm run dev

But stick around for the detailed explanation below \- you'll save yourself hours of debugging later\!

---

## **1\. Development Environment Setup**

### **1.1 Prerequisites \- What You Need Before Starting**

Think of these as the "ingredients" you need before you can start "cooking" with our codebase:

**Essential Software:**

- **Node.js v18 or higher** \- This is our JavaScript runtime engine  
    
  \# Check your version (should be 18.x or higher)  
    
  node \--version  
    
  \# If you need to install/update Node.js, we recommend using nvm:  
    
  \# Install nvm first, then:  
    
  nvm install 18  
    
  nvm use 18  
    
- **npm 8+** \- Our package manager for installing dependencies  
    
  \# Check your npm version  
    
  npm \--version  
    
  \# Update npm if needed  
    
  npm install \-g npm@latest  
    
- **Git** \- Version control (you probably already have this\!)  
    
  \# Check if you have git  
    
  git \--version

**Development Tools (Highly Recommended):**

- **VS Code** \- Our recommended code editor with these extensions:  
    
  - ES7+ React/Redux/React-Native snippets  
  - TypeScript Importer  
  - Tailwind CSS IntelliSense  
  - Prisma (for database work)  
  - GitLens (for better git integration)


- **Supabase CLI** \- For database management and local development  
    
  \# Install Supabase CLI  
    
  npm install \-g supabase  
    
  \# Verify installation  
    
  supabase \--version

**Optional but Helpful:**

- **Docker Desktop** \- For containerized development (useful for consistent environments)  
- **Postman** \- For API testing  
- **TablePlus or pgAdmin** \- For direct database access when debugging

### **1.2 Project Setup \- Getting the Code Running**

Now let's get you set up with the actual Yellow Letter Shop codebase:

#### **Step 1: Clone the Repository**

\# Replace \<repository-url\> with the actual GitHub URL

git clone \<repository-url\>

cd yellow-letter-shop

\# Let's see what we've got\!

ls \-la

You should see folders like `app/`, `components/`, `lib/`, `prisma/`, etc. This is our Next.js application structure.

#### **Step 2: Install Dependencies**

\# This downloads all the npm packages we depend on

\# It might take a few minutes the first time

npm install

\# This creates a node\_modules folder with thousands of files

\# Don't worry \- this is normal for modern JavaScript projects\!

**What just happened?** npm looked at our `package.json` file and downloaded every package our app needs to run. Think of it like automatically shopping for all ingredients from a recipe.

#### **Step 3: Environment Configuration**

This is where we tell our app how to connect to databases, APIs, and other services:

\# Copy the example environment file

cp .env.example .env.local

Now open `.env.local` in your editor. You'll see something like this:

\# Database Configuration

DATABASE\_URL="your-database-url-here"

SUPABASE\_URL="your-supabase-url"

SUPABASE\_ANON\_KEY="your-supabase-anon-key"

SUPABASE\_SERVICE\_ROLE="your-supabase-service-role-key"

\# Payment Processing

STRIPE\_SECRET\_KEY="sk\_test\_..."

STRIPE\_PUBLISHABLE\_KEY="pk\_test\_..."

\# External APIs

ACCUZIP\_API\_KEY="your-accuzip-key"

MAILGUN\_API\_KEY="your-mailgun-key"

OPENAI\_API\_KEY="your-openai-key"

**Important:** Don't worry if you don't have all these keys yet\! We'll help you get them in the next sections. For now, just make sure the file exists.

#### **Step 4: Start the Development Server**

\# This starts our local development server

npm run dev

If everything worked, you should see:

\> yellow-letter-shop@1.0.0 dev

\> next dev

  ▲ Next.js 14.2.5

  \- Local:        http://localhost:3000

  \- Network:      http://192.168.1.100:3000

 ✓ Ready in 2.3s

Visit `http://localhost:3000` in your browser. You might see errors (that's normal without proper environment variables), but the page should load\!

### **1.3 Environment Variables \- The Complete Guide**

Environment variables are like "configuration settings" for our app. Different environments (local, testing, production) need different settings.

#### **Environment File Structure**

We use different `.env` files for different purposes:

- **`.env.local`** \- Your personal development settings (this file is ignored by git)  
- **`.env.test`** \- Settings for running automated tests  
- **`.env.staging`** \- Settings for our staging server (managed by DevOps)  
- **`.env.production`** \- Settings for production (managed by Vercel)

#### **Critical Environment Variables Explained**

**Database Configuration:**

\# This is your Supabase database connection string

DATABASE\_URL="postgresql://postgres:\[password\]@db.\[project\].supabase.co:5432/postgres"

\# Supabase project URL (find this in your Supabase dashboard)

SUPABASE\_URL="https://\[project\].supabase.co"

\# Anonymous key (safe to use in frontend code)

SUPABASE\_ANON\_KEY="eyJ..."

\# Service role key (NEVER expose in frontend \- server-side only\!)

SUPABASE\_SERVICE\_ROLE="eyJ..."

**Payment Processing:**

\# Stripe secret key (server-side only)

STRIPE\_SECRET\_KEY="sk\_test\_51H..." \# Use test keys for development

\# Stripe publishable key (safe for frontend)

STRIPE\_PUBLISHABLE\_KEY="pk\_test\_51H..."

\# Webhook secret for verifying Stripe webhooks

STRIPE\_WEBHOOK\_SECRET="whsec\_..."

**External Service APIs:**

\# AccuZIP for address validation

ACCUZIP\_API\_KEY="your-accuzip-api-key"

\# Mailgun for email sending

MAILGUN\_API\_KEY="your-mailgun-api-key"

\# OpenAI for AI features

OPENAI\_API\_KEY="sk-..."

\# Fancy Product Designer configuration

FPD\_CONFIG\_URL="https://fancyproductdesigner.com/..."

**Frontend Configuration (prefixed with NEXT\_PUBLIC\_):**

\# These are safe to expose in browser code

NEXT\_PUBLIC\_SUPABASE\_URL="https://\[project\].supabase.co"

NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY="pk\_test\_..."

NEXT\_PUBLIC\_APP\_URL="http://localhost:3000" \# Your app's URL

#### **Getting Your API Keys \- Step by Step**

**For Supabase (Database & Auth):**

1. Go to [supabase.com](https://supabase.com) and sign up  
2. Create a new project (choose a region close to your users)  
3. Go to Settings → API  
4. Copy the Project URL and anon public key  
5. Copy the service\_role secret key (keep this secure\!)

**For Stripe (Payments):**

1. Go to [stripe.com](https://stripe.com) and create an account  
2. Go to Developers → API keys  
3. Copy your Publishable key and Secret key  
4. For webhooks: Developers → Webhooks → Add endpoint

**For AccuZIP (Address Validation):**

1. Contact AccuZIP sales for API access  
2. They'll provide you with API credentials  
3. Test with their sandbox environment first

**Development Tip:** Create a team-shared password manager entry for development API keys that the whole team can access safely.

---

## **2\. Development Workflow \- How We Work Together**

### **2.1 Git Branching Strategy \- Our Team Rules**

We use a simple but effective branching strategy that prevents conflicts and keeps our code organized:

main (production)

 ├── feature/user-dashboard     \# New features

 ├── fix/stripe-webhook-bug     \# Bug fixes

 └── feature/ai-personalization \# Another feature

#### **Branch Naming Convention:**

- **`feature/descriptive-name`** \- New features or enhancements  
- **`fix/specific-bug-description`** \- Bug fixes  
- **`hotfix/critical-issue`** \- Emergency production fixes  
- **`docs/update-readme`** \- Documentation updates

#### **Daily Workflow:**

\# 1\. Start your day by updating main

git checkout main

git pull origin main

\# 2\. Create a new branch for your feature

git checkout \-b feature/mailing-list-builder

\# 3\. Work on your feature, making small commits

git add .

git commit \-m "feat: add drag-and-drop for mailing lists"

\# 4\. Push your branch and create a pull request

git push origin feature/mailing-list-builder

#### **Before You Push \- Our Quality Checklist:**

\# Always run these before pushing:

npm run lint        \# Check code style

npm run typecheck   \# Verify TypeScript

npm run test        \# Run unit tests

\# Or run all at once:

npm run pre-push

### **2.2 Code Standards \- Writing Code That Everyone Can Read**

We follow these standards to make our codebase maintainable and readable:

#### **TypeScript Requirements:**

// ✅ Good \- Explicit types, clear naming

interface UserProfile {

  id: string

  email: string

  subscription: 'free' | 'pro' | 'team' | 'enterprise'

  createdAt: Date

}

// ❌ Bad \- No types, unclear naming

const u \= {

  id: "123",

  e: "test@example.com",

  s: "free"

}

// ✅ Good \- Function with proper types and JSDoc

/\*\*

 \* Creates a new mailing list for the user

 \* @param userId \- The ID of the user creating the list

 \* @param listData \- The data for the new mailing list

 \* @returns Promise resolving to the created list

 \*/

async function createMailingList(

  userId: string, 

  listData: CreateMailingListInput

): Promise\<MailingList\> {

  // Implementation here

}

#### **Component Architecture:**

// ✅ Good \- Clear component structure with TypeScript

interface MailingListCardProps {

  list: MailingList

  onEdit: (listId: string) \=\> void

  onDelete: (listId: string) \=\> void

}

export function MailingListCard({ list, onEdit, onDelete }: MailingListCardProps) {

  // Component logic here

  

  return (

    \<div className="border rounded-lg p-4 shadow-sm"\>

      {/\* Component JSX here \*/}

    \</div\>

  )

}

// Export the component as default for easy importing

export default MailingListCard

#### **File Organization Pattern:**

app/

├── (dashboard)/           \# Route groups for navigation

│   ├── dashboard/         \# Main dashboard pages

│   └── lists/            \# Mailing list pages

├── api/                  \# API endpoints

│   ├── lists/            \# List-related APIs

│   └── stripe/           \# Payment APIs

components/

├── ui/                   \# Reusable UI components

├── forms/                \# Form components

└── layout/               \# Layout components

lib/

├── supabase.ts           \# Database client

├── stripe.ts             \# Payment client

└── utils.ts              \# Utility functions

### **2.3 Styling with Tailwind \- Making Things Look Good**

We use Tailwind CSS for styling. Here's how to write maintainable styles:

// ✅ Good \- Responsive, semantic classes

\<div className="

  flex flex-col gap-4           /\* Layout \*/

  p-6 rounded-lg border         /\* Spacing & appearance \*/

  bg-white shadow-sm            /\* Colors & shadows \*/

  sm:flex-row sm:gap-6          /\* Responsive changes \*/

  hover:shadow-md               /\* Interactive states \*/

  transition-shadow duration-200 /\* Smooth animations \*/

"\>

  

// ❌ Bad \- Too many classes, hard to read

\<div className="flex p-6 bg-white border rounded-lg shadow-sm flex-col gap-4 sm:flex-row sm:gap-6 hover:shadow-md transition-shadow duration-200"\>

**Responsive Design Pattern:**

// Mobile first approach (default styles are for mobile)

\<div className="

  text-sm              /\* Small text on mobile \*/

  sm:text-base         /\* Normal text on small screens+ \*/

  lg:text-lg           /\* Larger text on large screens+ \*/

  

  p-4                  /\* Small padding on mobile \*/

  sm:p-6               /\* More padding on small screens+ \*/

  lg:p-8               /\* Even more on large screens \*/

"\>

### **2.4 Error Handling \- When Things Go Wrong**

Every application needs good error handling. Here's our approach:

#### **API Error Handling:**

// ✅ Good \- Comprehensive error handling

export async function createMailingList(data: CreateListData) {

  try {

    // Validate input first

    const validatedData \= createListSchema.parse(data)

    

    // Make the API call

    const { data: newList, error } \= await supabase

      .from('mailing\_lists')

      .insert(validatedData)

      .select()

      .single()

    

    if (error) {

      // Log for debugging

      console.error('Database error creating list:', error)

      

      // Return user-friendly error

      throw new Error('Failed to create mailing list. Please try again.')

    }

    

    return newList

    

  } catch (error) {

    // Handle different types of errors

    if (error instanceof z.ZodError) {

      throw new Error('Invalid list data provided')

    }

    

    if (error instanceof Error) {

      throw error // Re-throw our custom errors

    }

    

    // Catch-all for unexpected errors

    throw new Error('An unexpected error occurred')

  }

}

#### **Frontend Error Boundaries:**

// Error boundary component for catching React errors

export function ErrorBoundary({ children }: { children: React.ReactNode }) {

  return (

    \<ErrorBoundaryProvider

      fallback={({ error, resetError }) \=\> (

        \<div className="p-6 text-center"\>

          \<h2 className="text-xl font-semibold mb-2"\>Oops\! Something went wrong\</h2\>

          \<p className="text-gray-600 mb-4"\>

            {error.message || 'An unexpected error occurred'}

          \</p\>

          \<button 

            onClick={resetError}

            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"

          \>

            Try Again

          \</button\>

        \</div\>

      )}

    \>

      {children}

    \</ErrorBoundaryProvider\>

  )

}

---

## **3\. Database Setup and Management**

### **3.1 Understanding Our Database Architecture**

Yellow Letter Shop uses **Supabase PostgreSQL** with some special features that make it perfect for our needs:

- **Row-Level Security (RLS)** \- Users can only see their own data  
- **Multi-tenant isolation** \- Teams are completely separated  
- **Real-time subscriptions** \- Live updates when data changes  
- **JSONB fields** \- Flexible storage for complex data like designs

#### **Key Tables Overview:**

\-- Users and authentication (managed by Supabase Auth)

auth.users

  ├── user\_profiles          \-- Extended user information

  ├── teams                  \-- Team management

  └── team\_members           \-- Team membership

\-- Core business data

mailing\_lists                \-- User's mailing lists

├── mailing\_list\_records     \-- Individual contacts in lists

├── mailing\_list\_versions    \-- Version history for rollbacks

└── mailing\_list\_templates   \-- Saved search criteria

\-- Design and templates

design\_templates             \-- Mail piece designs

├── design\_assets           \-- Images, fonts, etc.

└── template\_categories     \-- Organization

\-- Orders and fulfillment

orders                      \-- Customer orders

├── order\_items            \-- What's being printed

├── redstone\_orders        \-- Print fulfillment tracking

└── proof\_annotations      \-- Collaborative review

\-- Analytics and tracking

audit\_logs                 \-- Every action is logged

├── short\_links           \-- URL tracking

├── link\_clicks           \-- Engagement analytics

└── nps\_surveys           \-- Customer feedback

### **3.2 Local Database Setup**

#### **Option 1: Use Supabase Cloud (Recommended for Beginners)**

This is the easiest way to get started:

1. **Create a Supabase project:**  
     
   - Go to [database.new](https://database.new)  
   - Create a new project (choose a region close to you)  
   - Wait for it to initialize (takes 1-2 minutes)

   

2. **Get your connection details:**  
     
   \# In your Supabase dashboard, go to Settings → Database  
     
   \# Copy the connection string and add it to .env.local  
     
   DATABASE\_URL="postgresql://postgres:\[password\]@db.\[project\].supabase.co:5432/postgres"  
     
3. **Run database migrations:**  
     
   \# This creates all our tables and security policies  
     
   npm run db:migrate  
     
   \# This adds sample data for development  
     
   npm run db:seed

#### **Option 2: Local Supabase Instance (Advanced)**

If you want everything running locally:

\# Initialize Supabase locally

supabase init

\# Start local Supabase (Docker required)

supabase start

\# This gives you local URLs:

\# API URL: http://localhost:54321

\# DB URL: postgresql://postgres:postgres@localhost:54322/postgres

### **3.3 Database Migrations \- How We Change the Database**

When we need to change the database structure, we use migrations:

\# Create a new migration

npm run db:migration:create "add\_skip\_tracing\_tables"

\# This creates a new file in prisma/migrations/

\# Edit the file to add your changes, then:

\# Apply the migration

npm run db:migrate

\# If you make a mistake, you can reset (careful \- this deletes data\!)

npm run db:reset

**Example Migration File:**

\-- Migration: 20240826\_add\_skip\_tracing\_tables.sql

\-- Create skip tracing orders table

CREATE TABLE skip\_trace\_orders (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id UUID NOT NULL REFERENCES auth.users(id),

  mailing\_list\_id UUID NOT NULL REFERENCES mailing\_lists(id),

  

  \-- Order details

  record\_count INTEGER NOT NULL,

  unit\_price DECIMAL(6,3) NOT NULL,

  total\_cost DECIMAL(10,2) NOT NULL,

  

  \-- Status tracking

  status VARCHAR(50) DEFAULT 'pending',

  created\_at TIMESTAMP DEFAULT NOW(),

  completed\_at TIMESTAMP

);

\-- Enable Row-Level Security

ALTER TABLE skip\_trace\_orders ENABLE ROW LEVEL SECURITY;

\-- Users can only see their own orders

CREATE POLICY "Users can view own skip trace orders" 

ON skip\_trace\_orders FOR SELECT 

USING (auth.uid() \= user\_id);

### **3.4 Working with Supabase Client**

Here's how we interact with the database in our code:

// lib/supabase.ts \- Our database client setup

import { createClient } from '@supabase/supabase-js'

// Client-side Supabase (safe for browser)

export const supabase \= createClient(

  process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,

  process.env.NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\!

)

// Server-side Supabase (has admin privileges)

export const supabaseAdmin \= createClient(

  process.env.SUPABASE\_URL\!,

  process.env.SUPABASE\_SERVICE\_ROLE\!

)

// Example: Get user's mailing lists

export async function getUserMailingLists(userId: string) {

  const { data: lists, error } \= await supabase

    .from('mailing\_lists')

    .select('\*')

    .eq('user\_id', userId)

    .order('created\_at', { ascending: false })

  

  if (error) {

    throw new Error(\`Failed to fetch mailing lists: ${error.message}\`)

  }

  

  return lists

}

### **3.5 Database Security \- Keeping Data Safe**

**Row-Level Security (RLS) Policies:**

\-- Example: Users can only see their own mailing lists

CREATE POLICY "Users can view own mailing lists" 

ON mailing\_lists FOR SELECT 

USING (auth.uid() \= user\_id);

\-- Team members can see shared lists

CREATE POLICY "Team members can view shared lists" 

ON mailing\_lists FOR SELECT 

USING (

  auth.uid() \= user\_id OR 

  id IN (

    SELECT resource\_id FROM resource\_sharing 

    WHERE team\_id IN (

      SELECT team\_id FROM team\_members WHERE user\_id \= auth.uid()

    ) AND resource\_type \= 'mailing\_list'

  )

);

**Important Security Rules:**

- Never use `supabaseAdmin` in client-side code  
- Always validate user permissions in API routes  
- Use RLS policies as your primary security layer  
- Log all sensitive operations for auditing

---

## **4\. Testing Strategy \- Making Sure Everything Works**

### **4.1 Testing Philosophy**

We write tests to catch bugs before our users do. Our testing pyramid looks like this:

     🔺 E2E Tests (Few, but comprehensive)

    🔺🔺 Integration Tests (Some, test workflows)  

   🔺🔺🔺 Unit Tests (Many, test individual functions)

### **4.2 Unit Testing Setup**

We use **Jest** and **React Testing Library** for unit tests:

\# Run all tests

npm run test

\# Run tests in watch mode (reruns when files change)

npm run test:watch

\# Run tests with coverage report

npm run test:coverage

**Example Unit Test:**

// tests/lib/mailing-lists.test.ts

import { createMailingList } from '@/lib/mailing-lists'

import { supabase } from '@/lib/supabase'

// Mock Supabase so we don't hit the real database

jest.mock('@/lib/supabase', () \=\> ({

  supabase: {

    from: jest.fn(() \=\> ({

      insert: jest.fn(() \=\> ({

        select: jest.fn(() \=\> ({

          single: jest.fn()

        }))

      }))

    }))

  }

}))

describe('createMailingList', () \=\> {

  it('should create a new mailing list successfully', async () \=\> {

    // Setup mock response

    const mockList \= { id: '123', name: 'Test List', user\_id: 'user123' }

    const mockSupabase \= supabase as jest.Mocked\<typeof supabase\>

    mockSupabase.from().insert().select().single.mockResolvedValue({

      data: mockList,

      error: null

    })

    // Test the function

    const result \= await createMailingList({

      name: 'Test List',

      userId: 'user123'

    })

    // Verify the result

    expect(result).toEqual(mockList)

    expect(mockSupabase.from).toHaveBeenCalledWith('mailing\_lists')

  })

})

### **4.3 Integration Testing**

Integration tests verify that different parts of our system work together:

// tests/api/mailing-lists.integration.test.ts

import { testClient } from '@/tests/helpers/api-client'

describe('/api/mailing-lists', () \=\> {

  it('should create and retrieve mailing lists', async () \=\> {

    // Create a test user

    const user \= await testClient.createTestUser()

    

    // Create a mailing list

    const createResponse \= await testClient.post('/api/mailing-lists', {

      name: 'Integration Test List',

      description: 'Created by integration test'

    }, {

      headers: { Authorization: \`Bearer ${user.token}\` }

    })

    

    expect(createResponse.status).toBe(201)

    

    // Retrieve the list

    const getResponse \= await testClient.get('/api/mailing-lists', {

      headers: { Authorization: \`Bearer ${user.token}\` }

    })

    

    expect(getResponse.data.lists).toHaveLength(1)

    expect(getResponse.data.lists\[0\].name).toBe('Integration Test List')

  })

})

### **4.4 End-to-End Testing**

We use **Cypress** for E2E tests that test the entire user journey:

\# Run Cypress tests in headless mode

npm run test:e2e

\# Open Cypress UI for interactive testing

npm run test:e2e:open

**Example E2E Test:**

// cypress/e2e/mailing-lists.cy.ts

describe('Mailing Lists', () \=\> {

  beforeEach(() \=\> {

    // Log in as a test user

    cy.login('test@example.com', 'password123')

    cy.visit('/dashboard/lists')

  })

  it('should create a new mailing list', () \=\> {

    // Click the "Create List" button

    cy.get('\[data-testid="create-list-button"\]').click()

    

    // Fill in the form

    cy.get('\[data-testid="list-name-input"\]').type('My Test List')

    cy.get('\[data-testid="list-description-input"\]').type('Created during E2E test')

    

    // Submit the form

    cy.get('\[data-testid="create-list-submit"\]').click()

    

    // Verify the list was created

    cy.get('\[data-testid="list-item"\]').should('contain', 'My Test List')

    cy.url().should('include', '/lists/')

  })

})

### **4.5 Test Database Setup**

We use a separate test database to avoid affecting development data:

\# Create test environment file

cp .env.example .env.test

\# Set up test database URL in .env.test

DATABASE\_URL="postgresql://postgres:password@localhost:5432/yls\_test"

\# Run migrations on test database

npm run test:db:migrate

\# Seed with test data

npm run test:db:seed

**Test Data Management:**

// tests/helpers/test-data.ts

export const testUsers \= {

  freeUser: {

    email: 'free@test.com',

    plan: 'free',

    maxLists: 5

  },

  proUser: {

    email: 'pro@test.com', 

    plan: 'pro',

    maxLists: 100

  }

}

export const testMailingLists \= {

  smallList: {

    name: 'Small Test List',

    recordCount: 10

  },

  largeList: {

    name: 'Large Test List',

    recordCount: 10000

  }

}

This comprehensive setup ensures we catch bugs early and maintain high code quality. Next, I'll proceed with Recommendation \#2 if you're ready\!  
