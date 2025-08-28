# Yellow Letter Shop (YLS) - Claude AI Assistant Guide

## Project Overview

Yellow Letter Shop is a comprehensive SaaS platform for direct mail automation, enabling users to create, personalize, and deliver direct mail campaigns at scale. The platform targets real estate professionals, local businesses, agencies, and marketers who need efficient tools for generating and fulfilling marketing mail campaigns.

### Key Features
- **Template Library**: Professional direct mail templates with customization
- **Mailing List Management**: CSV/XLSX upload, validation, and deduplication
- **List Building Tools**: Generate targeted lists based on demographics and criteria
- **Design Tool Integration**: WYSIWYG editor for mail piece customization
- **Address Validation**: AccuZip integration for CASS-certified validation
- **Order Processing**: Complete workflow from design to fulfillment
- **Payment Integration**: Stripe with manual capture workflow
- **Analytics Dashboard**: Campaign tracking and performance metrics
- **Multi-tenant Architecture**: Team collaboration with role-based access

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - Component-based UI with TypeScript
- **Tailwind CSS 3** - Utility-first styling with custom themes
- **ShadCN/UI** - Headless component library
- **Radix UI** - Accessible primitives and components
- **React Hook Form + Zod** - Form handling with validation
- **TanStack Table** - Advanced data tables
- **Recharts** - Analytics visualizations

### Backend & Database
- **Supabase** - Backend-as-a-service with PostgreSQL
- **Next.js API Routes** - RESTful backend endpoints
- **Row-Level Security (RLS)** - Database-level access control
- **Prisma ORM** - Type-safe database access (planned)
- **JWT Authentication** - Secure session management

### External Integrations
- **Stripe** - Payment processing with manual capture
- **AccuZip API** - Address validation and standardization
- **Mailgun** - Email services and webhook processing
- **Fancy Product Designer (FPD)** - Design canvas integration
- **AWS S3** (via Supabase Storage) - File storage

### Development Tools
- **TypeScript 5** - Strict typing throughout
- **ESLint & Prettier** - Code quality and formatting
- **Mocha + React Testing Library** - Unit and component testing
- **Cross-platform compatibility** - Windows/Ubuntu support

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── accuzip/       # Address validation endpoints
│   │   └── mailing-lists/ # List management endpoints
│   ├── dashboard/         # Protected dashboard pages
│   ├── mailing-services/  # Core service pages
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn)
│   ├── list-builder/     # List building and filtering
│   │   ├── common/       # Shared components (MultiSelect, DraggableSlider)
│   │   ├── demographics/ # Demographics filter components
│   │   └── property/     # Property filter components
│   ├── mailing-list-manager/ # List management interface
│   ├── auth/             # Authentication components
│   └── dashboard/        # Dashboard-specific components
├── data/                 # Static data and constants
├── docs/                 # Comprehensive project documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
├── tests/                # Test files and setup
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## Key Development Scripts

From package.json:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Mocha test suite

## Development Workflow

### Getting Started
1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd new-001
   npm install
   ```

2. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Configure Supabase, Stripe, and other API keys
   - Set up database connections

3. **Start Development**:
   ```bash
   npm run dev  # Starts on http://localhost:3000
   ```

### Code Standards
- **TypeScript Required**: All new files must be `.ts` or `.tsx`
- **Strict Typing**: Avoid `any` types, document when necessary
- **Tailwind CSS**: Use utility classes over custom CSS
- **Component Structure**: Follow existing patterns in `components/`
- **API Validation**: Use Zod for all API endpoint validation
- **Testing**: Write tests for new components and utilities
- **File Size Limit**: All code files MUST be ≤350 lines of code (LOC)
- **Modularization Priority**: When writing new or modifying existing code, ALWAYS prioritize modularization over monolithic files

### Branch Strategy
- **Feature branches**: `feature/feature-name`
- **Bug fixes**: `fix/issue-description`
- **Target branch**: `main` for production deployment
- **Current branch**: `feat/mod-phase-1b-demographics-split`

## Architecture Patterns

### Component Organization
- **Feature-based organization** in `components/`
- **Shared primitives** in `components/ui/` and `components/list-builder/common/`
- **Page-specific components** co-located with their pages
- **Hooks extracted** to `hooks/` directory with feature grouping

### Data Flow
- **Supabase RLS** enforces data access at database level
- **Multi-tenant isolation** via user ID and team ID scoping
- **Real-time subscriptions** for live updates
- **Optimistic updates** for better UX

### State Management
- **React Context** for global state (auth, theme)
- **Local state** with hooks for component-specific data
- **Server state** managed via SWR or native fetch
- **Form state** handled by React Hook Form

## Testing Strategy

### Test Setup (Mocha + RTL)
The project uses a Mocha-based test harness with:
- **ts-node** for TypeScript support
- **JSDOM** for DOM simulation
- **React Testing Library** for component testing
- **Cross-platform compatibility** (Windows/Ubuntu)

### Key Test Files
- `.mocharc.json` - Test configuration
- `tests/setup/` - Test environment setup
- `tests/tsconfig.mocha.json` - TypeScript config for tests

### Test Categories
- **Unit Tests**: Pure functions, utilities, calculations
- **Component Tests**: User interactions, state changes
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Complete user workflows (planned)

### Running Tests
```bash
npm test                    # Run all tests
npx mocha tests/specific.test.tsx  # Run specific test
```

## Current Development Phase

### Phase 1B: Demographics Split (In Progress)
- **Goal**: Split large `demographics-filters.tsx` into focused subcomponents
- **Target**: Each component <350 LOC for maintainability
- **Status**: Creating `components/list-builder/demographics/` directory
- **Components**: `DemographicsGroup`, `MultiSelectField`, `RangeSliderField`, etc.

### Recent Completions
- **Phase 1A**: Extracted common components (MultiSelect, DraggableSlider)
- **Phase 0**: Scaffolded shared primitives and documentation
- **API Documentation**: Updated with AccuZip integration details

## Key Business Logic

### Order Processing Workflow
1. **Template Selection** - Choose from library or upload custom
2. **Mailing List Upload** - CSV/XLSX with validation
3. **Address Validation** - AccuZip CASS certification
4. **Design Customization** - FPD integration with personalization
5. **Contact Card Selection** - Sender information management
6. **Payment Authorization** - Stripe hold (not capture)
7. **Proof Review** - PDF annotation and approval system
8. **Payment Capture** - On approval, funds captured
9. **Fulfillment** - Vendor routing and production

### User Roles & Permissions
- **Admin**: System-wide access and impersonation
- **Manager**: Team-level control and oversight
- **User**: Core functionality access
- **Client**: View-only restricted access

### Subscription Tiers
- **Free**: $0, 1 user, limited features
- **Pro**: $49, 1 user, full features
- **Team**: $99, 3 users, collaboration tools
- **Enterprise**: $499, 10 users, advanced features

## Important Implementation Notes

### Security Considerations
- **Row-Level Security (RLS)** enforced on all major tables
- **JWT tokens** in HttpOnly cookies
- **Input sanitization** with Zod validation
- **API rate limiting** and CORS protection
- **Audit logging** for compliance

### Performance Optimizations
- **Code splitting** with Next.js dynamic imports
- **Image optimization** with Next.js Image component
- **Database indexing** for frequent queries
- **CDN integration** via Vercel edge network
- **Component memoization** for expensive operations

### External API Integrations
- **AccuZip**: Address validation requires specific field mapping
- **Stripe**: Manual capture workflow for order approvals
- **Mailgun**: Inbound email parsing for vendor communications
- **FPD**: Design state stored as JSON with version control

## Documentation Resources

The project includes comprehensive documentation:
- `docs/prd.md` - Product Requirements Document
- `docs/technical-architecture.md` - Technical specifications
- `docs/development-guide.md` - Development workflows
- `docs/api-*.md` - API integration guides
- `docs/modularization/` - Refactoring phase documentation

## Common Development Tasks

### Adding New Components
1. Create component in appropriate `components/` subdirectory
2. Follow TypeScript strict typing patterns
3. Use Tailwind utility classes for styling
4. Export from directory index if applicable
5. Add tests in `tests/` directory

### Creating API Endpoints
1. Add route in `app/api/` following RESTful patterns
2. Implement Zod schema for request validation
3. Use Supabase client with RLS enforcement
4. Add error handling and proper HTTP status codes
5. Update type definitions in `types/`

### Database Schema Changes
1. Plan changes with team for multi-tenant impact
2. Update RLS policies if needed
3. Consider migration strategy for existing data
4. Update TypeScript types
5. Add tests for new functionality

## Troubleshooting

### Common Issues
- **Build Errors**: Check TypeScript compilation with `npm run lint`
- **Test Failures**: Verify JSDOM setup and component mocks
- **Database Access**: Confirm RLS policies and user context
- **External APIs**: Check environment variables and API keys

### Debugging Tools
- **React DevTools** for component debugging
- **Supabase Dashboard** for database queries
- **Vercel Logs** for production issues
- **Browser Network Tab** for API debugging

## Contact & Support

For development assistance, architectural questions, or technical support:
**Email**: support@yellowlettershop.com

---

*This guide is maintained as a living document. Update it when adding new features, changing architecture, or modifying development workflows.*