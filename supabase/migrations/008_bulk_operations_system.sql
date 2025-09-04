-- =================================================================================
-- Migration 008: Bulk Operations System (Phase 2)
-- =================================================================================
-- This migration implements the bulk operations system for Phase 2 requirements:
-- 1. Background job processing for large datasets
-- 2. Progress tracking and status monitoring
-- 3. Rate limiting and queue management
-- 4. Comprehensive bulk operations support

-- =================================================================================
-- Types and Enums
-- =================================================================================

CREATE TYPE bulk_operation_type AS ENUM (
    'tag_assign',
    'tag_remove', 
    'delete_records',
    'update_fields',
    'export_records',
    'deduplicate',
    'validate_addresses',
    'enrich_data'
);

CREATE TYPE bulk_operation_status AS ENUM (
    'pending',
    'processing', 
    'completed',
    'failed',
    'cancelled'
);

-- =================================================================================
-- Core Tables
-- =================================================================================

-- Bulk operations tracking table
CREATE TABLE bulk_operations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type bulk_operation_type NOT NULL,
    target_count integer NOT NULL DEFAULT 0,
    processed_count integer NOT NULL DEFAULT 0,
    success_count integer NOT NULL DEFAULT 0,
    error_count integer NOT NULL DEFAULT 0,
    status bulk_operation_status NOT NULL DEFAULT 'pending',
    progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    metadata jsonb DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Batch processing logs for detailed tracking
CREATE TABLE bulk_operation_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id uuid REFERENCES bulk_operations(id) ON DELETE CASCADE NOT NULL,
    batch_number integer NOT NULL,
    batch_size integer NOT NULL,
    processed_count integer NOT NULL DEFAULT 0,
    success_count integer NOT NULL DEFAULT 0,
    error_count integer NOT NULL DEFAULT 0,
    status bulk_operation_status NOT NULL DEFAULT 'pending',
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    errors jsonb DEFAULT '[]' NOT NULL, -- Array of error details
    metadata jsonb DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Rate limiting tracking per user
CREATE TABLE user_operation_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    operations_this_minute integer NOT NULL DEFAULT 0,
    records_this_minute integer NOT NULL DEFAULT 0,
    active_operations integer NOT NULL DEFAULT 0,
    last_reset_at timestamp with time zone DEFAULT now() NOT NULL,
    total_operations_today integer NOT NULL DEFAULT 0,
    last_daily_reset_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- System configuration for bulk operations
CREATE TABLE bulk_operation_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type bulk_operation_type NOT NULL UNIQUE,
    batch_size integer NOT NULL DEFAULT 1000,
    max_concurrent integer NOT NULL DEFAULT 3,
    timeout_minutes integer NOT NULL DEFAULT 60,
    retry_attempts integer NOT NULL DEFAULT 3,
    rate_limit_per_minute integer NOT NULL DEFAULT 10000,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =================================================================================
-- Indexes for Performance
-- =================================================================================

-- Bulk operations indexes
CREATE INDEX idx_bulk_operations_user_status ON bulk_operations(user_id, status);
CREATE INDEX idx_bulk_operations_type_status ON bulk_operations(type, status);
CREATE INDEX idx_bulk_operations_created_at ON bulk_operations(created_at DESC);
CREATE INDEX idx_bulk_operations_status_processing ON bulk_operations(status) WHERE status = 'processing';

-- Batch processing indexes
CREATE INDEX idx_bulk_operation_batches_operation ON bulk_operation_batches(operation_id, batch_number);
CREATE INDEX idx_bulk_operation_batches_status ON bulk_operation_batches(status);

-- Rate limiting indexes
CREATE INDEX idx_user_operation_limits_user ON user_operation_limits(user_id);
CREATE INDEX idx_user_operation_limits_reset ON user_operation_limits(last_reset_at) WHERE operations_this_minute > 0;

-- =================================================================================
-- Row Level Security
-- =================================================================================

ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_operation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operation_config ENABLE ROW LEVEL SECURITY;

-- Bulk operations - users can only see their own operations
CREATE POLICY "Users can manage own bulk operations" ON bulk_operations FOR ALL USING (
    user_id = auth.uid()
);

-- Batch logs - users can see batches for their operations
CREATE POLICY "Users can view own operation batches" ON bulk_operation_batches FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bulk_operations bo 
        WHERE bo.id = bulk_operation_batches.operation_id 
        AND bo.user_id = auth.uid()
    )
);

-- Rate limits - users can see their own limits
CREATE POLICY "Users can view own limits" ON user_operation_limits FOR ALL USING (
    user_id = auth.uid()
);

-- System configuration - readable by all authenticated users
CREATE POLICY "Config readable by authenticated users" ON bulk_operation_config FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- Admins can manage configuration
CREATE POLICY "Admins can manage config" ON bulk_operation_config FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role IN ('admin', 'super_admin')
    )
);

-- =================================================================================
-- Default Configuration
-- =================================================================================

-- Insert default configuration for each operation type
INSERT INTO bulk_operation_config (operation_type, batch_size, max_concurrent, timeout_minutes, rate_limit_per_minute) VALUES
('tag_assign', 1000, 3, 30, 10000),
('tag_remove', 1000, 3, 30, 10000),
('delete_records', 500, 2, 60, 5000),
('update_fields', 500, 3, 45, 7500),
('export_records', 2000, 2, 90, 20000),
('deduplicate', 100, 1, 120, 1000),
('validate_addresses', 200, 2, 180, 2000),
('enrich_data', 100, 1, 300, 1000);

-- =================================================================================
-- Functions for Bulk Operations Management
-- =================================================================================

-- Function to check if user can perform operation
CREATE OR REPLACE FUNCTION can_perform_bulk_operation(
    p_user_id uuid,
    p_operation_type bulk_operation_type,
    p_record_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_record bulk_operation_config;
    user_limits user_operation_limits;
    active_ops integer;
    result jsonb;
BEGIN
    -- Get operation configuration
    SELECT * INTO config_record FROM bulk_operation_config WHERE operation_type = p_operation_type;
    
    IF NOT FOUND OR NOT config_record.is_enabled THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Operation type not enabled');
    END IF;
    
    -- Get or create user limits
    INSERT INTO user_operation_limits (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO user_limits FROM user_operation_limits WHERE user_id = p_user_id;
    
    -- Reset minute counters if needed
    IF user_limits.last_reset_at < now() - interval '1 minute' THEN
        UPDATE user_operation_limits SET
            operations_this_minute = 0,
            records_this_minute = 0,
            last_reset_at = now()
        WHERE user_id = p_user_id;
        
        user_limits.operations_this_minute := 0;
        user_limits.records_this_minute := 0;
    END IF;
    
    -- Reset daily counters if needed
    IF user_limits.last_daily_reset_at < date_trunc('day', now()) THEN
        UPDATE user_operation_limits SET
            total_operations_today = 0,
            last_daily_reset_at = now()
        WHERE user_id = p_user_id;
        
        user_limits.total_operations_today := 0;
    END IF;
    
    -- Check rate limits
    IF user_limits.operations_this_minute >= 10 THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Too many operations this minute (max 10)');
    END IF;
    
    IF user_limits.records_this_minute + p_record_count > config_record.rate_limit_per_minute THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 
            format('Record limit exceeded: %s + %s > %s per minute', 
                user_limits.records_this_minute, p_record_count, config_record.rate_limit_per_minute));
    END IF;
    
    -- Check concurrent operations
    SELECT COUNT(*) INTO active_ops 
    FROM bulk_operations 
    WHERE user_id = p_user_id AND status IN ('pending', 'processing');
    
    IF active_ops >= config_record.max_concurrent THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 
            format('Too many concurrent operations: %s (max %s)', active_ops, config_record.max_concurrent));
    END IF;
    
    -- Check daily limits (100 operations per day for free users)
    IF user_limits.total_operations_today >= 100 THEN
        -- Check if user has premium access
        IF NOT EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = p_user_id 
            AND up.subscription_plan IN ('pro', 'team', 'enterprise')
        ) THEN
            RETURN jsonb_build_object('allowed', false, 'reason', 'Daily operation limit reached (upgrade for more)');
        END IF;
    END IF;
    
    RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Function to start bulk operation and update limits
CREATE OR REPLACE FUNCTION start_bulk_operation(
    p_user_id uuid,
    p_operation_type bulk_operation_type,
    p_record_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user limits
    UPDATE user_operation_limits SET
        operations_this_minute = operations_this_minute + 1,
        records_this_minute = records_this_minute + p_record_count,
        active_operations = active_operations + 1,
        total_operations_today = total_operations_today + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

-- Function to complete bulk operation and update limits
CREATE OR REPLACE FUNCTION complete_bulk_operation(
    p_operation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operation_user_id uuid;
BEGIN
    -- Get the user ID for this operation
    SELECT user_id INTO operation_user_id FROM bulk_operations WHERE id = p_operation_id;
    
    IF FOUND THEN
        -- Decrease active operations count
        UPDATE user_operation_limits SET
            active_operations = GREATEST(0, active_operations - 1),
            updated_at = now()
        WHERE user_id = operation_user_id;
    END IF;
END;
$$;

-- Function to get operation statistics
CREATE OR REPLACE FUNCTION get_bulk_operation_stats(p_user_id uuid)
RETURNS TABLE (
    total_operations bigint,
    completed_operations bigint,
    failed_operations bigint,
    total_records_processed bigint,
    average_success_rate numeric,
    operations_this_week bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        COUNT(*) as total_operations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_operations,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_operations,
        COALESCE(SUM(processed_count), 0) as total_records_processed,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100, 
                    2
                )
            ELSE 0 
        END as average_success_rate,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') as operations_this_week
    FROM bulk_operations 
    WHERE user_id = p_user_id;
$$;

-- Function to cleanup old operations
CREATE OR REPLACE FUNCTION cleanup_old_bulk_operations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete operations older than 30 days
    DELETE FROM bulk_operations 
    WHERE created_at < now() - interval '30 days'
    AND status IN ('completed', 'failed', 'cancelled');
    
    -- Delete batch logs for deleted operations
    DELETE FROM bulk_operation_batches 
    WHERE operation_id NOT IN (SELECT id FROM bulk_operations);
    
    -- Reset stale processing operations older than 2 hours
    UPDATE bulk_operations SET
        status = 'failed',
        error_message = 'Operation timed out',
        completed_at = now()
    WHERE status = 'processing'
    AND (started_at IS NULL OR started_at < now() - interval '2 hours');
    
    -- Update user limits for completed operations
    UPDATE user_operation_limits SET
        active_operations = (
            SELECT COUNT(*) 
            FROM bulk_operations 
            WHERE user_id = user_operation_limits.user_id 
            AND status IN ('pending', 'processing')
        )
    WHERE active_operations > 0;
END;
$$;

-- =================================================================================
-- Triggers
-- =================================================================================

-- Update timestamp trigger for bulk operations
CREATE TRIGGER update_bulk_operations_updated_at
    BEFORE UPDATE ON bulk_operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for user limits
CREATE TRIGGER update_user_operation_limits_updated_at
    BEFORE UPDATE ON user_operation_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update active operations count when operation status changes
CREATE OR REPLACE FUNCTION trigger_update_active_operations()
RETURNS trigger AS $$
BEGIN
    -- If operation is completing, decrease active count
    IF OLD.status IN ('pending', 'processing') AND NEW.status IN ('completed', 'failed', 'cancelled') THEN
        PERFORM complete_bulk_operation(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bulk_operations_status_change
    AFTER UPDATE ON bulk_operations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_update_active_operations();

-- =================================================================================
-- Views for Analytics
-- =================================================================================

-- View for operation analytics
CREATE VIEW bulk_operation_analytics AS
SELECT 
    bo.user_id,
    bo.type,
    DATE_TRUNC('day', bo.created_at) as operation_date,
    COUNT(*) as operations_count,
    AVG(bo.progress_percentage) as avg_progress,
    SUM(bo.target_count) as total_targets,
    SUM(bo.success_count) as total_success,
    SUM(bo.error_count) as total_errors,
    AVG(
        CASE 
            WHEN bo.completed_at IS NOT NULL AND bo.started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (bo.completed_at - bo.started_at)) 
        END
    ) as avg_duration_seconds
FROM bulk_operations bo
GROUP BY bo.user_id, bo.type, DATE_TRUNC('day', bo.created_at);

-- =================================================================================
-- Comments
-- =================================================================================

COMMENT ON TABLE bulk_operations IS 'Tracks bulk operations for background processing';
COMMENT ON TABLE bulk_operation_batches IS 'Detailed batch processing logs for bulk operations';
COMMENT ON TABLE user_operation_limits IS 'Rate limiting and usage tracking per user';
COMMENT ON TABLE bulk_operation_config IS 'System configuration for bulk operation types';

COMMENT ON FUNCTION can_perform_bulk_operation IS 'Check if user can perform a bulk operation based on rate limits';
COMMENT ON FUNCTION start_bulk_operation IS 'Start a bulk operation and update user limits';
COMMENT ON FUNCTION complete_bulk_operation IS 'Complete a bulk operation and update user limits';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_perform_bulk_operation TO authenticated;
GRANT EXECUTE ON FUNCTION start_bulk_operation TO authenticated;
GRANT EXECUTE ON FUNCTION get_bulk_operation_stats TO authenticated;