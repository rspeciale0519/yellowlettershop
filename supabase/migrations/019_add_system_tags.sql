-- Simple migration to add default system tags using existing enum values
-- Insert some default system tags that are useful for the media library
INSERT INTO tags (name, category, color, visibility, is_system, description, user_id, team_id)
VALUES 
    ('Important', 'system', '#ef4444', 'system', true, 'Mark important files', NULL, NULL),
    ('Draft', 'system', '#f97316', 'system', true, 'Files in draft status', NULL, NULL),
    ('Approved', 'system', '#22c55e', 'system', true, 'Approved files ready for use', NULL, NULL),
    ('Archive', 'system', '#6b7280', 'system', true, 'Archived files', NULL, NULL)
ON CONFLICT (name, user_id, team_id) DO NOTHING;