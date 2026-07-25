-- ============================================================
-- Migration 8: Site Settings singleton table
-- ============================================================
--
-- Creates a `site_settings` table with a single row storing
-- site-wide configuration: logo_url, business_name, tagline,
-- and whatsapp_number.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url         text,
  business_name    text        NOT NULL DEFAULT 'Haritham Garden',
  tagline          text        NOT NULL DEFAULT 'Fresh plants & greens for your home',
  whatsapp_number  text        NOT NULL DEFAULT '919876543210',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
DO $$ BEGIN
  CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert default row (singleton)
INSERT INTO site_settings (logo_url, business_name, tagline, whatsapp_number)
VALUES (NULL, 'Haritham Garden', 'Fresh plants & greens for your home', '919876543210')
ON CONFLICT DO NOTHING;

-- ── RLS Policies ─────────────────────────────────────────────

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "site_settings: public read"
    ON site_settings
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "site_settings: admin update"
    ON site_settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "site_settings: admin insert"
    ON site_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (SELECT count(*) FROM site_settings) = 0
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "site_settings: admin delete"
    ON site_settings
    FOR DELETE
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
