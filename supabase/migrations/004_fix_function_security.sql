-- Fix security warnings for functions with mutable search_path
-- This migration updates functions to have immutable search paths

-- =================================================================================
-- Fix update_updated_at_column function
-- =================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================================
-- Fix auto_grant_team_permissions function
-- =================================================================================

CREATE OR REPLACE FUNCTION auto_grant_team_permissions()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    team_settings jsonb;
BEGIN
    -- Only proceed if this is a team resource
    IF NEW.team_id IS NOT NULL THEN
        -- Get team auto-grant setting
        SELECT settings INTO team_settings FROM public.teams WHERE id = NEW.team_id;
        
        IF (team_settings->>'auto_grant_access')::boolean = true THEN
            -- Grant view permissions to all team members
            INSERT INTO public.resource_permissions (resource_type, resource_id, user_id, permission_level, granted_by, auto_granted)
            SELECT 
                CASE 
                    WHEN TG_TABLE_NAME = 'mailing_lists' THEN 'mailing_list'::public.resource_type
                    WHEN TG_TABLE_NAME = 'campaigns' THEN 'template'::public.resource_type -- Adjust as needed
                    ELSE 'mailing_list'::public.resource_type -- Default
                END,
                NEW.id,
                up.user_id,
                'view_only'::public.permission_level,
                NEW.created_by,
                true
            FROM public.user_profiles up
            WHERE up.team_id = NEW.team_id
            AND up.user_id != NEW.created_by; -- Don't grant to creator (they already have owner access)
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
