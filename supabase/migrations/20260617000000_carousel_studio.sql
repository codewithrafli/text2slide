-- IG Carousel Studio additions
-- Stores editable carousel drafts created by the Vue editor.

CREATE TABLE IF NOT EXISTS carousel_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  brand_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  slides_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_drafts_created_at
  ON carousel_drafts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_carousel_drafts_profile
  ON carousel_drafts(user_profile_id);

ALTER TABLE carousel_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_read_carousel_drafts'
      AND tablename = 'carousel_drafts'
  ) THEN
    CREATE POLICY "public_read_carousel_drafts"
      ON carousel_drafts FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_insert_carousel_drafts'
      AND tablename = 'carousel_drafts'
  ) THEN
    CREATE POLICY "public_insert_carousel_drafts"
      ON carousel_drafts FOR INSERT TO anon, authenticated
      WITH CHECK (title IS NOT NULL AND jsonb_typeof(slides_json) = 'array');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_update_carousel_drafts'
      AND tablename = 'carousel_drafts'
  ) THEN
    CREATE POLICY "public_update_carousel_drafts"
      ON carousel_drafts FOR UPDATE TO anon, authenticated
      USING (true)
      WITH CHECK (title IS NOT NULL AND jsonb_typeof(slides_json) = 'array');
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON carousel_drafts TO anon, authenticated;
GRANT ALL ON carousel_drafts TO service_role;

CREATE OR REPLACE FUNCTION set_carousel_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carousel_drafts_updated_at ON carousel_drafts;
CREATE TRIGGER trg_carousel_drafts_updated_at
  BEFORE UPDATE ON carousel_drafts
  FOR EACH ROW
  EXECUTE FUNCTION set_carousel_drafts_updated_at();
