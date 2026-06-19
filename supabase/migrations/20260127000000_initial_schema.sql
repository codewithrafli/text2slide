-- Link2Slide Initial Schema Migration
-- Consolidated: 2026-01-27

/* 
  1. TABLES
*/

-- User Profiles (for branding persistence)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,
  profile_pic_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations (Main storage for LinkedIn posts)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  extracted_content TEXT,
  slides_json JSONB,
  captions JSONB,
  hashtags JSONB,
  ip_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Branding fields (backward compatibility/snapshot)
  branding_handle TEXT,
  branding_style TEXT,
  profile_pic_url TEXT,
  
  -- Settings
  show_source BOOLEAN DEFAULT FALSE,
  
  -- Foreign Keys
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

/* 
  2. INDEXES
*/
CREATE INDEX IF NOT EXISTS idx_generations_id ON generations(id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle ON user_profiles(handle);
CREATE INDEX IF NOT EXISTS idx_generations_user_profile ON generations(user_profile_id);

/* 
  3. STORAGE BUCKETS
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

/* 
  4. ROW LEVEL SECURITY
*/
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

/* 
  5. POLICIES (Idempotent)
*/

DO $$ 
BEGIN
    -- user_profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_profiles' AND tablename = 'user_profiles') THEN
        CREATE POLICY "public_read_profiles" ON user_profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_profiles' AND tablename = 'user_profiles') THEN
        CREATE POLICY "public_insert_profiles" ON user_profiles FOR INSERT TO anon, authenticated WITH CHECK (handle IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_profiles' AND tablename = 'user_profiles') THEN
        CREATE POLICY "public_update_profiles" ON user_profiles FOR UPDATE TO anon, authenticated USING (handle IS NOT NULL) WITH CHECK (handle IS NOT NULL);
    END IF;

    -- generations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read' AND tablename = 'generations') THEN
        CREATE POLICY "public_read" ON generations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert' AND tablename = 'generations') THEN
        CREATE POLICY "public_insert" ON generations FOR INSERT TO anon, authenticated WITH CHECK (source_url IS NOT NULL);
    END IF;
    
    -- NOTE: Update policy for generations (needed for Edge Function status updates)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_update' AND tablename = 'generations') THEN
        CREATE POLICY "service_role_update" ON generations FOR UPDATE TO service_role USING (true);
    END IF;
END $$;

/* 
  6. PERMISSIONS
*/
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all on all tables/sequences/functions to service_role (Admin)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant standard permissions to other roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Set default privileges for FUTURE tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

