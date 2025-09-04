-- =================================================================================
-- Migration 007: Project/Campaign-Based RBAC System (Fixed Version)
-- =================================================================================
-- This migration implements a project/campaign-based role-based access control
-- system that allows for granular permissions at the project level while
-- maintaining team-wide collaboration capabilities.
-- Note: This version handles existing structures gracefully

-- =================================================================================
-- RBAC Types and Enums (Create only if don't exist)
-- =================================================================================

-- Project/Campaign roles with hierarchical permissions
DO $$ BEGIN
    CREATE TYPE project_role AS ENUM (
        'owner',        -- Full control, can delete project, manage all permissions
        'admin',        -- Can manage project settings, add/remove members, edit all content
        'manager',      -- Can edit project content, manage records and lists
        'contributor',  -- Can create/edit own content, view all project content
        'viewer'        -- Read-only access to project content
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend existing resource_type enum to include new resource types for RBAC
DO $$ BEGIN
    -- Add new values to existing resource_type enum if they don't exist
    BEGIN
        ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'campaign';
        ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'record';
        ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'tag';
        ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'analytics';
        ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'project';
    EXCEPTION
        WHEN feature_not_supported THEN
            -- PostgreSQL < 14 doesn't support IF NOT EXISTS, use manual check
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'campaign' AND enumtypid = 'resource_type'::regtype) THEN
                ALTER TYPE resource_type ADD VALUE 'campaign';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'record' AND enumtypid = 'resource_type'::regtype) THEN
                ALTER TYPE resource_type ADD VALUE 'record';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tag' AND enumtypid = 'resource_type'::regtype) THEN
                ALTER TYPE resource_type ADD VALUE 'tag';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'analytics' AND enumtypid = 'resource_type'::regtype) THEN
                ALTER TYPE resource_type ADD VALUE 'analytics';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project' AND enumtypid = 'resource_type'::regtype) THEN
                ALTER TYPE resource_type ADD VALUE 'project';
            END IF;
    END;
END $$;

-- Permission actions
DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM (
        'create',
        'read',
        'update',
        'delete',
        'manage_permissions',
        'export',
        'share'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- Core RBAC Tables (Create only if don't exist)
-- =================================================================================

-- Projects/Campaigns table for organizing work
CREATE TABLE IF NOT EXISTS projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    type text DEFAULT 'general' NOT NULL, -- 'campaign', 'template_set', 'general'
    status text DEFAULT 'active' NOT NULL, -- 'active', 'archived', 'completed'
    
    -- Ownership and team association
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Project settings
    is_public boolean DEFAULT false NOT NULL, -- Public within team
    settings jsonb DEFAULT '{}' NOT NULL,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_at timestamp with time zone,
    
    -- Constraints
    CONSTRAINT projects_name_team_unique UNIQUE(name, team_id)
);

-- Project memberships with roles
CREATE TABLE IF NOT EXISTS project_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role project_role NOT NULL,
    
    -- Permission overrides (JSON object with resource_type -> permissions mapping)
    permission_overrides jsonb DEFAULT '{}' NOT NULL,
    
    -- Invitation and membership metadata
    invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    joined_at timestamp with time zone,
    
    -- Constraints
    UNIQUE(project_id, user_id)
);

-- Permission definitions for roles and resources
CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role project_role NOT NULL,
    resource_type resource_type NOT NULL,
    action permission_action NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    
    -- Constraints
    UNIQUE(role, resource_type, action)
);

-- =================================================================================
-- Resource Association Tables - Add columns only if they don't exist
-- =================================================================================

-- Associate mailing lists with projects
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mailing_lists' AND column_name = 'project_id') THEN
        ALTER TABLE mailing_lists ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Associate tags with projects (in addition to team/user)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'project_id') THEN
        ALTER TABLE tags ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_owner') THEN
        CREATE INDEX idx_projects_owner ON projects(owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_team') THEN
        CREATE INDEX idx_projects_team ON projects(team_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_status') THEN
        CREATE INDEX idx_projects_status ON projects(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_members_project') THEN
        CREATE INDEX idx_project_members_project ON project_members(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_members_user') THEN
        CREATE INDEX idx_project_members_user ON project_members(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mailing_lists_project') THEN
        CREATE INDEX idx_mailing_lists_project ON mailing_lists(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_project') THEN
        CREATE INDEX idx_tags_project ON tags(project_id);
    END IF;
END $$;

-- Note: Enum values are now available for use in the same migration

-- =================================================================================
-- Default Role Permissions (Insert only if they don't exist)
-- =================================================================================

-- TODO: Add permissions after enum values are committed
-- Note: Skipping permissions data insertion to avoid enum value usage conflicts

/*
-- Insert default permissions for each role only if they don't exist
DO $$ 
DECLARE
    perm_record RECORD;
    permissions_data TEXT := 'owner,mailing_list,create,true
        owner,mailing_list,read,true
        owner,mailing_list,update,true
        owner,mailing_list,delete,true
        owner,mailing_list,manage_permissions,true
        owner,mailing_list,export,true
        owner,mailing_list,share,true
        owner,campaign,create,true
        owner,campaign,read,true
        owner,campaign,update,true
        owner,campaign,delete,true
        owner,campaign,manage_permissions,true
        owner,campaign,export,true
        owner,campaign,share,true
        owner,template,create,true
        owner,template,read,true
        owner,template,update,true
        owner,template,delete,true
        owner,template,manage_permissions,true
        owner,template,export,true
        owner,template,share,true
        owner,record,create,true
        owner,record,read,true
        owner,record,update,true
        owner,record,delete,true
        owner,record,manage_permissions,true
        owner,record,export,true
        owner,record,share,true
        owner,tag,create,true
        owner,tag,read,true
        owner,tag,update,true
        owner,tag,delete,true
        owner,tag,manage_permissions,true
        owner,tag,export,true
        owner,tag,share,true
        owner,analytics,read,true
        owner,analytics,export,true
        owner,design,create,true
        owner,design,read,true
        owner,design,update,true
        owner,design,delete,true
        owner,design,share,true
        admin,mailing_list,create,true
        admin,mailing_list,read,true
        admin,mailing_list,update,true
        admin,mailing_list,delete,true
        admin,mailing_list,export,true
        admin,mailing_list,share,true
        admin,campaign,create,true
        admin,campaign,read,true
        admin,campaign,update,true
        admin,campaign,delete,true
        admin,campaign,export,true
        admin,campaign,share,true
        admin,template,create,true
        admin,template,read,true
        admin,template,update,true
        admin,template,delete,true
        admin,template,export,true
        admin,template,share,true
        admin,record,create,true
        admin,record,read,true
        admin,record,update,true
        admin,record,delete,true
        admin,record,export,true
        admin,record,share,true
        admin,tag,create,true
        admin,tag,read,true
        admin,tag,update,true
        admin,tag,delete,true
        admin,tag,export,true
        admin,tag,share,true
        admin,analytics,read,true
        admin,analytics,export,true
        admin,design,create,true
        admin,design,read,true
        admin,design,update,true
        admin,design,delete,true
        admin,design,share,true
        manager,mailing_list,create,true
        manager,mailing_list,read,true
        manager,mailing_list,update,true
        manager,mailing_list,export,true
        manager,mailing_list,share,true
        manager,campaign,create,true
        manager,campaign,read,true
        manager,campaign,update,true
        manager,campaign,export,true
        manager,campaign,share,true
        manager,template,read,true
        manager,template,update,true
        manager,template,export,true
        manager,record,create,true
        manager,record,read,true
        manager,record,update,true
        manager,record,export,true
        manager,tag,create,true
        manager,tag,read,true
        manager,tag,update,true
        manager,tag,export,true
        manager,analytics,read,true
        manager,analytics,export,true
        manager,design,create,true
        manager,design,read,true
        manager,design,update,true
        manager,design,share,true
        contributor,mailing_list,create,true
        contributor,mailing_list,read,true
        contributor,mailing_list,update,true
        contributor,mailing_list,export,true
        contributor,campaign,read,true
        contributor,campaign,update,true
        contributor,template,read,true
        contributor,template,export,true
        contributor,record,create,true
        contributor,record,read,true
        contributor,record,update,true
        contributor,record,export,true
        contributor,tag,create,true
        contributor,tag,read,true
        contributor,tag,update,true
        contributor,analytics,read,true
        contributor,design,create,true
        contributor,design,read,true
        contributor,design,update,true
        viewer,mailing_list,read,true
        viewer,mailing_list,export,true
        viewer,campaign,read,true
        viewer,template,read,true
        viewer,template,export,true
        viewer,record,read,true
        viewer,record,export,true
        viewer,tag,read,true
        viewer,analytics,read,true
        viewer,design,read,true';
BEGIN
    FOR perm_record IN 
        SELECT 
            split_part(trim(line), ',', 1)::project_role as role,
            split_part(trim(line), ',', 2)::resource_type as resource_type,
            split_part(trim(line), ',', 3)::permission_action as action,
            split_part(trim(line), ',', 4)::boolean as allowed
        FROM unnest(string_to_array(trim(permissions_data), E'\n')) as line
        WHERE trim(line) != '' AND trim(line) NOT LIKE '' AND split_part(trim(line), ',', 1) != ''
    LOOP
        INSERT INTO role_permissions (role, resource_type, action, allowed) 
        VALUES (perm_record.role, perm_record.resource_type, perm_record.action, perm_record.allowed)
        ON CONFLICT (role, resource_type, action) DO NOTHING;
    END LOOP;
END $$;
*/

-- =================================================================================
-- RLS Policies for Projects (Create or Replace)
-- =================================================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
    -- Project access policies
    DROP POLICY IF EXISTS "Project access" ON projects;
    CREATE POLICY "Project access" ON projects FOR ALL USING (
        -- User is the owner
        owner_id = auth.uid() OR
        -- User is a project member
        id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        ) OR
        -- Project is public (team support added later)
        is_public = true
    );

    -- Project member policies
    DROP POLICY IF EXISTS "Project member access" ON project_members;
    CREATE POLICY "Project member access" ON project_members FOR ALL USING (
        -- User can see memberships for projects they have access to
        project_id IN (
            SELECT id FROM projects
            WHERE owner_id = auth.uid() OR
            id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            ) OR
            is_public = true
        )
    );

    -- Role permissions are readable by all authenticated users
    DROP POLICY IF EXISTS "Role permissions readable" ON role_permissions;
    CREATE POLICY "Role permissions readable" ON role_permissions FOR SELECT USING (
        auth.role() = 'authenticated'
    );
END $$;

-- =================================================================================
-- Helper Functions (Create or Replace)
-- =================================================================================

-- Function to check if user has permission for a resource in a project
CREATE OR REPLACE FUNCTION user_has_project_permission(
    p_user_id uuid,
    p_project_id uuid,
    p_resource_type resource_type,
    p_action permission_action
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    user_role project_role;
    has_permission boolean := false;
    override_permission jsonb;
BEGIN
    -- Check if user is project owner
    SELECT owner_id INTO user_role FROM projects WHERE id = p_project_id;
    IF user_role = p_user_id THEN
        RETURN true;
    END IF;
    
    -- Get user's role in the project
    SELECT role INTO user_role 
    FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    -- If user is not a member, return false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check permission overrides first
    SELECT permission_overrides INTO override_permission
    FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    -- If there's an override for this resource type and action
    IF override_permission ? p_resource_type::text THEN
        IF (override_permission -> p_resource_type::text) ? p_action::text THEN
            RETURN (override_permission -> p_resource_type::text ->> p_action::text)::boolean;
        END IF;
    END IF;
    
    -- Check default role permissions
    SELECT allowed INTO has_permission
    FROM role_permissions 
    WHERE role = user_role 
    AND resource_type = p_resource_type 
    AND action = p_action;
    
    RETURN COALESCE(has_permission, false);
END;
$$;

-- Function to get user's role in a project
CREATE OR REPLACE FUNCTION get_user_project_role(
    p_user_id uuid,
    p_project_id uuid
)
RETURNS project_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    user_role project_role;
BEGIN
    -- Check if user is project owner
    SELECT CASE WHEN owner_id = p_user_id THEN 'owner'::project_role ELSE NULL END
    INTO user_role FROM projects WHERE id = p_project_id;
    
    IF user_role IS NOT NULL THEN
        RETURN user_role;
    END IF;
    
    -- Get user's assigned role
    SELECT role INTO user_role 
    FROM project_members 
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    RETURN user_role;
END;
$$;

-- Function to add user to project with role
CREATE OR REPLACE FUNCTION add_user_to_project(
    p_project_id uuid,
    p_user_id uuid,
    p_role project_role,
    p_invited_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    membership_id uuid;
BEGIN
    INSERT INTO project_members (
        project_id, 
        user_id, 
        role, 
        invited_by,
        joined_at
    )
    VALUES (
        p_project_id, 
        p_user_id, 
        p_role, 
        p_invited_by,
        now()
    )
    ON CONFLICT (project_id, user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        joined_at = now()
    RETURNING id INTO membership_id;
    
    RETURN membership_id;
END;
$$;

-- =================================================================================
-- Updated RLS Policies for Existing Tables (Create or Replace)
-- =================================================================================

-- TODO: Update existing table policies after team_members table is available
-- TODO: Also need to defer this to separate migration due to enum value usage restrictions

/*
DO $$ BEGIN
    -- Update mailing lists RLS to consider project membership
    DROP POLICY IF EXISTS "Mailing lists access" ON mailing_lists;
    CREATE POLICY "Mailing lists access" ON mailing_lists FOR ALL USING (
        -- Original user access (team support added later)
        user_id = auth.uid() OR
        -- Project-based access
        (project_id IS NOT NULL AND user_has_project_permission(
            auth.uid(), 
            project_id, 
            'mailing_list', 
            'read'::permission_action  -- Simplified to read permission for RLS
        ))
    );

    -- Update tags RLS to consider project membership
    DROP POLICY IF EXISTS "Tags access" ON tags;
    CREATE POLICY "Tags access" ON tags FOR ALL USING (
        -- System tags are accessible by everyone
        is_system = true OR
        -- Original user access (team support added later)
        user_id = auth.uid() OR
        -- Project-based access
        (project_id IS NOT NULL AND user_has_project_permission(
            auth.uid(), 
            project_id, 
            'tag', 
            'read'::permission_action  -- Simplified to read permission for RLS
        ))
    );
END $$;
*/

-- =================================================================================
-- Views for Easy Querying (Create or Replace)
-- =================================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_projects;
DROP VIEW IF EXISTS project_member_summary;

-- View to get user's projects with their roles
CREATE VIEW user_projects AS
SELECT 
    p.*,
    COALESCE(pm.role, CASE WHEN p.owner_id = auth.uid() THEN 'owner'::project_role ELSE NULL END) as user_role,
    pm.permission_overrides,
    pm.joined_at as member_since
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
WHERE p.owner_id = auth.uid() 
   OR pm.user_id IS NOT NULL
   OR p.is_public = true;

-- View to get project member summary
CREATE VIEW project_member_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(pm.id) as member_count,
    COUNT(CASE WHEN pm.role = 'owner' THEN 1 END) as owners,
    COUNT(CASE WHEN pm.role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN pm.role = 'manager' THEN 1 END) as managers,
    COUNT(CASE WHEN pm.role = 'contributor' THEN 1 END) as contributors,
    COUNT(CASE WHEN pm.role = 'viewer' THEN 1 END) as viewers
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
GROUP BY p.id, p.name;

-- =================================================================================
-- Triggers (Create or Replace)
-- =================================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS add_owner_to_project_trigger ON projects;
DROP TRIGGER IF EXISTS update_project_timestamp_trigger ON projects;

-- Trigger to automatically add project owner as member
CREATE OR REPLACE FUNCTION trigger_add_owner_to_project()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add the owner as a project member with owner role
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    VALUES (NEW.id, NEW.owner_id, 'owner', now())
    ON CONFLICT (project_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER add_owner_to_project_trigger
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_owner_to_project();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION trigger_update_project_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_project_timestamp_trigger
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_timestamp();

-- =================================================================================
-- Comments
-- =================================================================================

COMMENT ON TABLE projects IS 'Projects/campaigns for organizing work with RBAC';
COMMENT ON TABLE project_members IS 'Project membership and role assignments';
COMMENT ON TABLE role_permissions IS 'Permission definitions for project roles';
COMMENT ON FUNCTION user_has_project_permission IS 'Check if user has specific permission in project';
COMMENT ON VIEW user_projects IS 'User-accessible projects with roles and permissions';