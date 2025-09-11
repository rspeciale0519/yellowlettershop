-- Create table for asset share links
CREATE TABLE IF NOT EXISTS asset_share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES user_assets(id) ON DELETE CASCADE,
    share_token VARCHAR(12) UNIQUE NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_share_links_share_token ON asset_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_asset_share_links_asset_id ON asset_share_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_share_links_created_by ON asset_share_links(created_by);

-- Create RLS (Row Level Security) policy
ALTER TABLE asset_share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see share links for assets they own
CREATE POLICY "Users can manage their own asset share links" ON asset_share_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_assets 
            WHERE user_assets.id = asset_share_links.asset_id 
            AND user_assets.user_id = auth.uid()
        )
    );

-- Policy: Anyone can access active share links (for public sharing)
CREATE POLICY "Anyone can access active share links" ON asset_share_links
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    token_exists BOOLEAN := true;
BEGIN
    WHILE token_exists LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM asset_share_links WHERE share_token = result) INTO token_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;