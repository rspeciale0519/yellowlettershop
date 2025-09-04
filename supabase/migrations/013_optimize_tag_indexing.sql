-- Migration: Optimize Database Indexing for Tag-Based Queries
-- This migration adds basic indexing for improved query performance

-- Create indexes for mailing_list_records table
-- Index for mailing_list_id (primary foreign key)
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_list_id 
ON mailing_list_records (mailing_list_id);

-- Index for JSONB record_data queries (GIN index)
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_data_gin 
ON mailing_list_records USING GIN (record_data);

-- Index for validation status queries
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_validation 
ON mailing_list_records (validation_status);

-- Index for created_at for chronological queries and sorting
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_created_at 
ON mailing_list_records (created_at DESC);

-- Index for updated_at for recently modified records
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_updated_at 
ON mailing_list_records (updated_at DESC);

-- Index for times_mailed for campaign targeting
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_times_mailed 
ON mailing_list_records (times_mailed);

-- Create indexes for mailing_lists table
-- Index for user-based list queries with record count for sorting
CREATE INDEX IF NOT EXISTS idx_mailing_lists_user_record_count 
ON mailing_lists (user_id, record_count DESC);

-- Index for list name searches
CREATE INDEX IF NOT EXISTS idx_mailing_lists_name_search 
ON mailing_lists (user_id, name);

-- Index for team-based queries (if using teams)
CREATE INDEX IF NOT EXISTS idx_mailing_lists_team 
ON mailing_lists (team_id, user_id) WHERE team_id IS NOT NULL;

-- Index for source criteria queries
CREATE INDEX IF NOT EXISTS idx_mailing_lists_source_criteria 
ON mailing_lists (source_criteria_id) WHERE source_criteria_id IS NOT NULL;

-- Create indexes for existing tag-related tables (from migration 006)
-- Index for record_tags table (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'record_tags') THEN
        CREATE INDEX IF NOT EXISTS idx_record_tags_record_tag 
        ON record_tags (record_id, tag_id);

        CREATE INDEX IF NOT EXISTS idx_record_tags_tag_value 
        ON record_tags (tag_id, tag_value) WHERE tag_value IS NOT NULL;
    END IF;
END $$;

-- Add tag-specific indexes (if tags table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tags') THEN
        CREATE INDEX IF NOT EXISTS idx_tags_category_visibility 
        ON tags (category, visibility, is_system);
    END IF;
END $$;

-- Create partial indexes for validation status
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_validation_valid 
ON mailing_list_records (mailing_list_id) 
WHERE validation_status = 'valid';

CREATE INDEX IF NOT EXISTS idx_mailing_list_records_validation_invalid 
ON mailing_list_records (mailing_list_id) 
WHERE validation_status = 'invalid';

-- Create indexes for skip trace status
CREATE INDEX IF NOT EXISTS idx_mailing_list_records_skip_trace_enriched 
ON mailing_list_records (mailing_list_id, skip_trace_status) 
WHERE skip_trace_status = 'enriched';

-- Add comments for documentation
COMMENT ON INDEX idx_mailing_list_records_data_gin IS 'GIN index for efficient JSONB record_data queries';
COMMENT ON INDEX idx_mailing_list_records_list_id IS 'Foreign key index for mailing list lookups';
COMMENT ON INDEX idx_mailing_lists_user_record_count IS 'Composite index for user + record count queries';