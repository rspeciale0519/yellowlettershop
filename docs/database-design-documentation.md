# **Yellow Letter Shop (YLS) - Database Design Documentation**

*Last Updated: August 2025*

This document provides comprehensive documentation for the YLS database schema, including table relationships, design decisions, performance considerations, and implementation guidance.

## **Table of Contents**

1. [Schema Overview](#schema-overview)
2. [Core Entity Relationships](#core-entity-relationships)
3. [Feature-Specific Systems](#feature-specific-systems)
4. [Key Design Decisions](#key-design-decisions)
5. [Performance Considerations](#performance-considerations)
6. [Implementation Guide](#implementation-guide)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Security & Access Control](#security--access-control)

## **Schema Overview**

The YLS database is designed as a comprehensive multi-tenant SaaS platform supporting:

- **Multi-tenant architecture** with user and team-based data isolation
- **Excel-style version history** with granular undo/redo functionality
- **Flexible list building** with JSONB storage for complex search criteria
- **Advanced analytics** tracking user engagement and campaign performance
- **Comprehensive vendor management** with performance tracking
- **Team collaboration** with granular permission controls
- **File asset management** with team sharing capabilities

### **Schema Statistics**
- **Total Tables**: 25+ main tables
- **Total Enums**: 15 custom PostgreSQL enums
- **Indexes**: 25+ performance-optimized indexes
- **RLS Policies**: Complete Row-Level Security coverage
- **Triggers**: Auto-updating timestamps and permission management

## **Core Entity Relationships**

### **Primary Entities**

```
Users (auth.users) ──→ UserProfiles
                 ├──→ Teams (owner)
                 ├──→ ContactCards
                 ├──→ MailingLists
                 └──→ Campaigns

Teams ──→ UserProfiles (members)
      ├──→ ContactCards (shared)
      ├──→ MailingLists (shared)
      └──→ Campaigns (shared)
```

### **Detailed Entity Relationship Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │────│  user_profiles  │────│     teams       │
│                 │    │                 │    │                 │
│ - id (PK)       │    │ - user_id (FK)  │    │ - owner_id (FK) │
└─────────────────┘    │ - team_id (FK)  │    └─────────────────┘
                       │ - role          │
                       └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
           ┌─────────────┐ ┌──────────┐ ┌──────────────┐
           │contact_cards│ │mailing_  │ │  campaigns   │
           │             │ │  lists   │ │              │
           │- user_id    │ │- user_id │ │- user_id     │
           │- team_id    │ │- team_id │ │- team_id     │
           └─────────────┘ └──────────┘ └──────────────┘
                                │              │
                       ┌────────────────┐ ┌──────────────┐
                       │mailing_list_   │ │campaign_drops│
                       │  records       │ │              │
                       │                │ │- campaign_id │
                       │- mailing_list_id│ └──────────────┘
                       └────────────────┘
```

## **Feature-Specific Systems**

### **1. List Builder System**

The list builder system supports complex search criteria for MelissaData API integration:

```sql
list_builder_criteria
├── criteria_data (JSONB) -- All search filters
├── estimated_count       -- Cached record count
├── is_template          -- For saved templates
└── api_provider         -- melissa, accuzip, etc
```

**Key Features:**
- **JSONB Storage**: Flexible criteria storage for complex searches
- **Template System**: Users can save and reuse search configurations
- **API Cost Tracking**: Tracks usage per user/team for billing
- **Count Caching**: Stores estimated counts to reduce API calls

### **2. Excel-Style Version History**

The version history system provides granular undo/redo functionality:

```sql
change_history
├── sequence_number (BIGSERIAL) -- Global sequence for ordering
├── resource_type              -- What was changed
├── resource_id                -- Which record was changed
├── field_name                 -- Specific field (granular)
├── old_value (JSONB)          -- Previous value
├── new_value (JSONB)          -- New value
└── batch_id                   -- Group related changes
```

**Implementation Notes:**
- **Sequential Operations**: Each change gets a unique sequence number
- **Granular Tracking**: Individual field changes are tracked
- **Batch Operations**: Bulk imports/changes are grouped together
- **Undo/Redo Logic**: Users can step backward/forward through sequence

### **3. Analytics & Performance Tracking**

Comprehensive analytics system for user engagement and campaign performance:

```sql
user_analytics          -- Page views, feature usage, time tracking
├── event_type         -- page_view, feature_use, api_call, etc
├── duration_seconds   -- Time spent
└── metadata (JSONB)   -- Additional context

campaign_metrics       -- User-entered performance data
├── response_rate      -- User-reported response rate
├── conversions        -- Number of conversions
├── removal_requests   -- Unsubscribe requests
└── conversion_value   -- Dollar value of conversions

short_links           -- yls.to/xyz123 tracking system
├── short_code        -- The "xyz123" part  
├── target_url        -- Where it redirects
└── clicks[]          -- Via short_link_clicks table
```

### **4. Team Collaboration System**

Granular permission system for team resource sharing:

```sql
resource_permissions
├── resource_type      -- mailing_list, template, design, etc
├── resource_id        -- UUID of the resource
├── permission_level   -- view_only, edit, admin, owner
├── auto_granted       -- Automatically granted via team membership
└── granted_by         -- Who granted the permission
```

**Permission Levels:**
- **view_only**: Can view and use in campaigns
- **edit**: Can modify the resource
- **admin**: Full control including sharing
- **owner**: Creator/owner with all rights

### **5. Vendor Management System**

Comprehensive vendor tracking with performance metrics:

```sql
vendors
├── vendor_type        -- print, skip_tracing, mailing, etc
├── pricing_tiers      -- JSONB flexible pricing
├── quality_rating     -- 1.00 to 5.00 rating
└── contract_terms     -- JSONB contract details

vendor_performance     -- Performance tracking
├── metric_type        -- on_time_delivery, quality_score, etc
├── metric_value       -- Numeric value
└── measurement_date   -- When measured

vendor_communications  -- Email history
├── direction          -- inbound/outbound
├── message_body       -- Email content
└── email_metadata     -- Message IDs, etc
```

### **6. Campaign Management System**

Supports single, split, and recurring campaigns:

```sql
campaigns
├── campaign_type      -- single, split, recurring
├── total_drops        -- For split campaigns
├── parent_campaign_id -- For recurring campaigns
├── depends_on_campaign_id -- Campaign dependencies
└── design_data (JSONB) -- FPD design configuration

campaign_drops         -- Individual drops in split campaigns
├── drop_number        -- 1, 2, 3, etc
├── scheduled_mail_date -- When to mail
├── vendor_order_id    -- External vendor reference
└── tracking_info      -- JSONB tracking data
```

**Campaign Flow:**
1. **Single**: One mailing to all records
2. **Split**: Multiple drops with scheduled dates
3. **Recurring**: Parent campaign spawns child campaigns

## **Key Design Decisions**

### **1. Multi-Tenant Architecture**

**Decision**: User/Team dual ownership model
**Rationale**: Supports both individual users and team collaboration
**Implementation**: 
```sql
-- Resources can be owned by user OR team (not both)
CONSTRAINT resource_owner_check CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR 
    (user_id IS NULL AND team_id IS NOT NULL)
)
```

### **2. JSONB for Flexible Data**

**Decision**: Use JSONB for flexible, schema-less data
**Use Cases**:
- List builder criteria (complex search filters)
- Mailing list record data (20-25+ columns of varying structure)
- Design data (FPD configuration)
- Vendor pricing tiers
- API metadata

**Benefits**:
- Schema flexibility without migrations
- JSON queries and indexing
- Efficient storage and retrieval

### **3. Sequential Change History**

**Decision**: Global sequence number for change ordering
**Rationale**: Enables Excel-style undo/redo across all user resources
**Implementation**:
```sql
sequence_number bigserial NOT NULL -- Auto-incrementing sequence
```

### **4. Granular Permissions**

**Decision**: Resource-level permissions with auto-granting
**Features**:
- Team members automatically get base permissions
- Managers can override and grant additional access
- Permission inheritance from team settings

### **5. Comprehensive Indexing Strategy**

**Performance Focus**:
- User/team scoped queries (most common)
- Version history sequence lookups (critical for undo/redo)
- Analytics time-series queries
- Campaign and mailing list relationships

## **Performance Considerations**

### **Critical Indexes**

```sql
-- User-scoped data access (most common queries)
CREATE INDEX idx_mailing_lists_user_id ON mailing_lists(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);

-- Version history (critical for undo/redo performance)
CREATE INDEX idx_change_history_sequence ON change_history(sequence_number);
CREATE INDEX idx_change_history_user_id ON change_history(user_id);

-- Analytics time-series queries
CREATE INDEX idx_user_analytics_event_time ON user_analytics(event_type, created_at);
CREATE INDEX idx_api_usage_billing_period ON api_usage_tracking(billing_period);
```

### **Query Optimization**

1. **User-Scoped Queries**: All major queries filter by user_id/team_id first
2. **JSONB Indexing**: Add GIN indexes for frequently queried JSONB fields
3. **Time-Series Data**: Partition large analytics tables by date
4. **Connection Pooling**: Leverage Supabase connection pooling

### **Data Retention Strategy**

| Data Type | Retention Policy | Storage Strategy |
|-----------|-----------------|------------------|
| Mailing List Data | Indefinite | Primary storage |
| Version History | 2 years | Archive after 1 year |
| Analytics Data | 7 years | Partition by month |
| Audit Logs | 7 years | Archive after 2 years |
| API Usage Logs | 2 years | Archive after 1 year |

## **Implementation Guide**

### **1. Migration Deployment**

```bash
# Deploy the comprehensive schema
supabase db reset
supabase migration up

# Verify schema
supabase db diff
```

### **2. Row Level Security Setup**

All tables have RLS policies enforcing:
- **User Isolation**: Users can only access their own data
- **Team Sharing**: Team members access shared team resources
- **Admin Override**: Admins can access all data
- **Permission-Based Access**: Granular permissions for shared resources

### **3. TypeScript Integration**

Use the comprehensive types file:
```typescript
import type { 
  UserProfile, 
  MailingList, 
  Campaign,
  MailingListWithRelations 
} from '@/types/supabase-comprehensive';
```

### **4. API Integration Patterns**

**List Builder Integration:**
```typescript
// Save search criteria
const criteria = await supabase
  .from('list_builder_criteria')
  .insert({
    user_id: userId,
    criteria_data: searchFilters,
    estimated_count: count,
    api_provider: 'melissa'
  });

// Track API usage for billing
await supabase
  .from('api_usage_tracking')
  .insert({
    user_id: userId,
    api_provider: 'melissa',
    endpoint: '/search',
    total_cost: apiCost,
    billing_period: currentMonth
  });
```

**Version History Implementation:**
```typescript
// Record a change
await supabase
  .from('change_history')
  .insert({
    user_id: userId,
    resource_type: 'mailing_list',
    resource_id: listId,
    change_type: 'update',
    field_name: 'name',
    old_value: oldName,
    new_value: newName
  });

// Undo last change
const lastChange = await supabase
  .from('change_history')
  .select('*')
  .eq('user_id', userId)
  .order('sequence_number', { ascending: false })
  .limit(1);
```

## **Data Flow Diagrams**

### **Campaign Creation Flow**

```
User Input
    ↓
Mailing List Selection/Upload
    ↓
List Builder Criteria (if applicable)
    ↓
MelissaData API Call → API Usage Tracking
    ↓
Address Validation → Validation Results
    ↓
Design Customization → Design Data (JSONB)
    ↓
Campaign Creation → Change History Log
    ↓
Split/Recurring Configuration → Campaign Drops
    ↓
Payment Authorization → Payment Transactions
    ↓
Vendor Assignment → Vendor Communications
    ↓
Campaign Execution → Performance Tracking
```

### **Team Collaboration Flow**

```
Resource Creation
    ↓
Auto-Grant Team Permissions (if enabled)
    ↓
Resource Permissions Table
    ↓
Team Member Access Check
    ↓
Permission Level Enforcement
    ↓
Resource Access Granted/Denied
```

## **Security & Access Control**

### **Row Level Security (RLS)**

Every table implements RLS policies for:

1. **User Data Isolation**
   ```sql
   CREATE POLICY "User data access" ON table_name FOR ALL USING (
       user_id = auth.uid()
   );
   ```

2. **Team Data Sharing**
   ```sql
   CREATE POLICY "Team data access" ON table_name FOR ALL USING (
       team_id IN (
           SELECT team_id FROM user_profiles 
           WHERE user_id = auth.uid() AND team_id IS NOT NULL
       )
   );
   ```

3. **Admin Override**
   ```sql
   CREATE POLICY "Admin access" ON table_name FOR ALL USING (
       EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
           AND role IN ('admin', 'super_admin')
       )
   );
   ```

### **Data Protection**

- **Encryption at Rest**: Supabase provides automatic encryption
- **Encryption in Transit**: All connections use TLS 1.2+
- **API Key Management**: Environment variables and secure storage
- **Audit Logging**: All user actions logged with timestamps
- **Data Retention**: Automated retention policies per data type

## **Next Steps**

### **Immediate Implementation**

1. **Deploy Schema**: Run the migration script
2. **Update Types**: Switch to comprehensive types file
3. **Test RLS Policies**: Verify access control works correctly
4. **Implement Version History**: Add change tracking to critical operations

### **Future Enhancements**

1. **Performance Monitoring**: Add query performance tracking
2. **Data Archival**: Implement automated archival for old data
3. **Advanced Analytics**: Add more sophisticated reporting
4. **API Rate Limiting**: Implement per-user rate limiting
5. **Backup Strategy**: Automated backup and disaster recovery

## **Support & Maintenance**

### **Monitoring Checklist**

- [ ] Database connection pool utilization
- [ ] Query performance metrics
- [ ] Storage usage growth
- [ ] RLS policy effectiveness
- [ ] Change history table size
- [ ] API usage costs per user/team

### **Regular Maintenance Tasks**

- **Weekly**: Review slow query logs
- **Monthly**: Analyze storage growth patterns
- **Quarterly**: Review and update retention policies
- **Annually**: Complete security audit

---

*This documentation should be updated as the schema evolves and new features are added. For technical support or questions about the database design, contact: support@yellowlettershop.com*