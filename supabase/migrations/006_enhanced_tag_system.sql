-- =================================================================================
-- Migration 006: Enhanced Tag System for Record Organization (Fixed Version)
-- =================================================================================
-- This migration enhances the existing tag system to support:
-- 1. Tag categories for better organization
-- 2. System tags (like "List Name") that are always available
-- 3. Enhanced record-level tagging for flexible organization
-- 4. Tag hierarchy and relationships
-- Note: This version handles existing columns gracefully

-- =================================================================================
-- Enhanced Tag System Types
-- =================================================================================

-- Tag categories for organization (create only if doesn't exist)
DO $$ BEGIN
    CREATE TYPE tag_category AS ENUM (
        'system',           -- System-defined tags (List Name, etc.)
        'list_management',  -- User-created tags for list organization
        'demographics',     -- Tags for demographic categorization
        'geography',        -- Geographic tags
        'campaign',         -- Campaign-related tags
        'custom'           -- General custom user tags
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tag visibility and access levels (create only if doesn't exist)
DO $$ BEGIN
    CREATE TYPE tag_visibility AS ENUM (
        'public',    -- Visible to all team members
        'private',   -- Only visible to creator
        'system'     -- System tags visible to all
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- Enhanced Tables - Add columns only if they don't exist
-- =================================================================================

-- Add new columns to existing tags table (with existence checks)
DO $$ BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'category') THEN
        ALTER TABLE tags ADD COLUMN category tag_category DEFAULT 'custom' NOT NULL;
    END IF;

    -- Add is_system column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'is_system') THEN
        ALTER TABLE tags ADD COLUMN is_system boolean DEFAULT false NOT NULL;
    END IF;

    -- Add visibility column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'visibility') THEN
        ALTER TABLE tags ADD COLUMN visibility tag_visibility DEFAULT 'public' NOT NULL;
    END IF;

    -- Add parent_tag_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'parent_tag_id') THEN
        ALTER TABLE tags ADD COLUMN parent_tag_id uuid REFERENCES tags(id) ON DELETE SET NULL;
    END IF;

    -- Add sort_order column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'sort_order') THEN
        ALTER TABLE tags ADD COLUMN sort_order integer DEFAULT 0 NOT NULL;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'metadata') THEN
        ALTER TABLE tags ADD COLUMN metadata jsonb DEFAULT '{}' NOT NULL;
    END IF;
END $$;

-- Create indexes only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_category') THEN
        CREATE INDEX idx_tags_category ON tags(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_is_system') THEN
        CREATE INDEX idx_tags_is_system ON tags(is_system);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_parent') THEN
        CREATE INDEX idx_tags_parent ON tags(parent_tag_id);
    END IF;
END $$;

-- =================================================================================
-- Update Tags Table Constraint to Allow System Tags
-- =================================================================================

-- Update the constraint to allow system tags with NULL user_id and team_id
DO $$ BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_owner_check;
    
    -- Add updated constraint that allows system tags
    ALTER TABLE tags ADD CONSTRAINT tags_owner_check CHECK (
        -- System tags can have both user_id and team_id as NULL
        (is_system = true AND user_id IS NULL AND team_id IS NULL) OR
        -- Regular tags must have either user_id or team_id (but not both)
        (is_system = false AND (
            (user_id IS NOT NULL AND team_id IS NULL) OR 
            (user_id IS NULL AND team_id IS NOT NULL)
        ))
    );
END $$;

-- =================================================================================
-- System Tags Creation (Insert only if not exists)
-- =================================================================================

-- Insert the required "List Name" system tag only if it doesn't exist
INSERT INTO tags (name, category, is_system, visibility, color, description, user_id, team_id)
SELECT 
    'List Name',
    'system'::tag_category,
    true,
    'system'::tag_visibility,
    '#10B981', -- Green color
    'System tag used to identify which mailing list records belong to. Required for all records.',
    NULL::uuid,
    NULL::uuid
WHERE NOT EXISTS (
    SELECT 1 FROM tags WHERE name = 'List Name' AND is_system = true
);

-- Insert other useful system tags only if they don't exist
INSERT INTO tags (name, category, is_system, visibility, color, description, user_id, team_id)
SELECT * FROM (VALUES
    ('Source', 'system'::tag_category, true, 'system'::tag_visibility, '#3B82F6', 'Identifies the source of the record (upload, list_builder, manual, etc.)', NULL::uuid, NULL::uuid),
    ('Quality Score', 'system'::tag_category, true, 'system'::tag_visibility, '#F59E0B', 'Data quality assessment for the record', NULL::uuid, NULL::uuid),
    ('Campaign Target', 'system'::tag_category, true, 'system'::tag_visibility, '#8B5CF6', 'Marks records as targets for specific campaigns', NULL::uuid, NULL::uuid)
) AS new_tags(name, category, is_system, visibility, color, description, user_id, team_id)
WHERE NOT EXISTS (
    SELECT 1 FROM tags WHERE tags.name = new_tags.name AND tags.is_system = true
);

-- =================================================================================
-- Record-Tag Junction Table (Create only if doesn't exist)
-- =================================================================================

-- Create a dedicated table for record-level tagging only if it doesn't exist
CREATE TABLE IF NOT EXISTS record_tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id uuid REFERENCES mailing_list_records(id) ON DELETE CASCADE NOT NULL,
    tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    tag_value text, -- For tags that need values (like "List Name: My List")
    assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}' NOT NULL,
    UNIQUE(record_id, tag_id)
);

-- Enable RLS on record_tags table
ALTER TABLE record_tags ENABLE ROW LEVEL SECURITY;

-- Create indexes only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_record_tags_record_id') THEN
        CREATE INDEX idx_record_tags_record_id ON record_tags(record_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_record_tags_tag_id') THEN
        CREATE INDEX idx_record_tags_tag_id ON record_tags(tag_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_record_tags_tag_value') THEN
        CREATE INDEX idx_record_tags_tag_value ON record_tags(tag_value);
    END IF;
END $$;

-- =================================================================================
-- Tag Categories Reference Table (Create only if doesn't exist)
-- =================================================================================

-- Table to store tag category templates and configurations
CREATE TABLE IF NOT EXISTS tag_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#6B7280',
    icon text, -- Icon name or emoji
    is_system boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on tag_categories table
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;

-- Insert default categories only if they don't exist
INSERT INTO tag_categories (name, description, color, icon, is_system, sort_order)
SELECT * FROM (VALUES
    ('System', 'System-defined tags that are always available', '#10B981', '⚙️', true, 1),
    ('List Management', 'Tags for organizing and managing mailing lists', '#3B82F6', '📋', true, 2),
    ('Demographics', 'Tags for demographic categorization', '#F59E0B', '👥', true, 3),
    ('Geography', 'Geographic and location-based tags', '#EF4444', '🗺️', true, 4),
    ('Campaign', 'Campaign and marketing-related tags', '#8B5CF6', '📢', true, 5),
    ('Custom', 'User-defined custom tags', '#6B7280', '🏷️', true, 6)
) AS new_categories(name, description, color, icon, is_system, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM tag_categories WHERE tag_categories.name = new_categories.name
);

-- =================================================================================
-- Enhanced RLS Policies (Create only if don't exist)
-- =================================================================================

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
    -- Record tags policies
    DROP POLICY IF EXISTS "Record tags access" ON record_tags;
    CREATE POLICY "Record tags access" ON record_tags FOR ALL USING (
        -- User can access record tags if they own the record
        EXISTS (
            SELECT 1 FROM mailing_list_records mlr
            JOIN mailing_lists ml ON mlr.mailing_list_id = ml.id
            WHERE mlr.id = record_tags.record_id
            AND ml.user_id = auth.uid()
        )
    );

    -- Tag categories policies
    DROP POLICY IF EXISTS "Tag categories readable" ON tag_categories;
    CREATE POLICY "Tag categories readable" ON tag_categories FOR SELECT USING (
        auth.role() = 'authenticated'
    );

    -- Update existing tags RLS to handle system tags
    DROP POLICY IF EXISTS "Tags access" ON tags;
    CREATE POLICY "Tags access" ON tags FOR ALL USING (
        -- System tags are accessible by everyone
        is_system = true OR
        -- Regular tags follow user ownership (team support added in migration 007)
        user_id = auth.uid()
    );
END $$;

-- =================================================================================
-- Helper Functions (Create or Replace)
-- =================================================================================

-- Function to get system tag ID by name
CREATE OR REPLACE FUNCTION get_system_tag_id(tag_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT id FROM tags 
    WHERE name = tag_name 
    AND is_system = true 
    LIMIT 1;
$$;

-- Function to ensure required system tags exist for a record
CREATE OR REPLACE FUNCTION ensure_system_tags_for_record(
    p_record_id uuid,
    p_list_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    list_name_tag_id uuid;
BEGIN
    -- Get the "List Name" system tag ID
    list_name_tag_id := get_system_tag_id('List Name');
    
    -- Insert or update the List Name tag for this record
    INSERT INTO record_tags (record_id, tag_id, tag_value)
    VALUES (p_record_id, list_name_tag_id, p_list_name)
    ON CONFLICT (record_id, tag_id) 
    DO UPDATE SET 
        tag_value = EXCLUDED.tag_value,
        assigned_at = now();
END;
$$;

-- Function to get all tags for a record with their values
CREATE OR REPLACE FUNCTION get_record_tags(p_record_id uuid)
RETURNS TABLE (
    tag_id uuid,
    tag_name text,
    tag_value text,
    category tag_category,
    color text,
    is_system boolean
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        t.id as tag_id,
        t.name as tag_name,
        rt.tag_value,
        t.category,
        t.color,
        t.is_system
    FROM record_tags rt
    JOIN tags t ON rt.tag_id = t.id
    WHERE rt.record_id = p_record_id
    ORDER BY t.is_system DESC, t.sort_order, t.name;
$$;

-- =================================================================================
-- Triggers for Automatic Tag Management
-- =================================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS assign_system_tags_trigger ON mailing_list_records;

-- Trigger to automatically assign system tags when records are created
CREATE OR REPLACE FUNCTION trigger_assign_system_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    mailing_list_name text;
    source_tag_id uuid;
BEGIN
    -- Get the mailing list name
    SELECT name INTO mailing_list_name 
    FROM mailing_lists 
    WHERE id = NEW.mailing_list_id;
    
    -- Ensure List Name tag is assigned
    PERFORM ensure_system_tags_for_record(NEW.id, mailing_list_name);
    
    -- Assign Source tag if we have source information
    source_tag_id := get_system_tag_id('Source');
    IF source_tag_id IS NOT NULL THEN
        INSERT INTO record_tags (record_id, tag_id, tag_value)
        VALUES (NEW.id, source_tag_id, 
            CASE 
                WHEN (SELECT source_type FROM mailing_lists WHERE id = NEW.mailing_list_id) = 'upload' THEN 'File Upload'
                WHEN (SELECT source_type FROM mailing_lists WHERE id = NEW.mailing_list_id) = 'list_builder' THEN 'List Builder'
                WHEN (SELECT source_type FROM mailing_lists WHERE id = NEW.mailing_list_id) = 'manual' THEN 'Manual Entry'
                ELSE 'Unknown'
            END
        )
        ON CONFLICT (record_id, tag_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER assign_system_tags_trigger
    AFTER INSERT ON mailing_list_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_assign_system_tags();

-- =================================================================================
-- Views for Easy Querying (Create or Replace)
-- =================================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS records_with_tags;
DROP VIEW IF EXISTS tag_usage_stats;

-- View to easily query records with their tags
CREATE VIEW records_with_tags AS
SELECT 
    mlr.*,
    ml.name as mailing_list_name,
    array_agg(
        jsonb_build_object(
            'tag_id', rt.tag_id,
            'tag_name', t.name,
            'tag_value', rt.tag_value,
            'category', t.category,
            'color', t.color,
            'is_system', t.is_system
        )
    ) FILTER (WHERE t.id IS NOT NULL) as tags
FROM mailing_list_records mlr
LEFT JOIN mailing_lists ml ON mlr.mailing_list_id = ml.id
LEFT JOIN record_tags rt ON mlr.id = rt.record_id
LEFT JOIN tags t ON rt.tag_id = t.id
GROUP BY mlr.id, ml.name;

-- View to get tag usage statistics
CREATE VIEW tag_usage_stats AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.color,
    t.is_system,
    COUNT(rt.id) as usage_count,
    COUNT(DISTINCT rt.record_id) as unique_records,
    MAX(rt.assigned_at) as last_used
FROM tags t
LEFT JOIN record_tags rt ON t.id = rt.tag_id
GROUP BY t.id, t.name, t.category, t.color, t.is_system;

-- =================================================================================
-- Comments
-- =================================================================================

COMMENT ON TABLE record_tags IS 'Junction table linking individual records to tags for flexible organization';
COMMENT ON TABLE tag_categories IS 'Categories for organizing tags into logical groups';
COMMENT ON COLUMN tags.category IS 'Category this tag belongs to for organization';
COMMENT ON COLUMN tags.is_system IS 'Whether this is a system-defined tag that cannot be deleted';
COMMENT ON COLUMN tags.visibility IS 'Who can see this tag (public, private, system)';
COMMENT ON COLUMN tags.parent_tag_id IS 'Parent tag for hierarchical organization';
COMMENT ON FUNCTION ensure_system_tags_for_record IS 'Ensures required system tags are assigned to a record';
COMMENT ON VIEW records_with_tags IS 'Convenient view to query records with all their associated tags';