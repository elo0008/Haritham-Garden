-- ============================================================
-- Migration 11: Carousel section settings & slides tables
-- ============================================================

-- 1. Singleton section settings
CREATE TABLE IF NOT EXISTS carousel_section_settings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled         boolean     NOT NULL DEFAULT false,
  header_tag      text,
  header_title    text,
  header_subtitle text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_carousel_section_settings_updated_at
    BEFORE UPDATE ON carousel_section_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Singleton default row
INSERT INTO carousel_section_settings (enabled, header_tag, header_title, header_subtitle)
VALUES (false, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 2. Slides table
CREATE TABLE IF NOT EXISTS carousel_slides (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_label        text,
  title            text        NOT NULL,
  description      text        NOT NULL,
  background_image text,
  display_order    integer     NOT NULL DEFAULT 0,
  active           boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides (display_order ASC);

-- ── RLS Policies ─────────────────────────────────────────────

ALTER TABLE carousel_section_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "carousel_section_settings: public read" ON carousel_section_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_section_settings: admin update" ON carousel_section_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_section_settings: admin insert" ON carousel_section_settings FOR INSERT TO authenticated WITH CHECK ((SELECT count(*) FROM carousel_section_settings) = 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_section_settings: admin delete" ON carousel_section_settings FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "carousel_slides: public read" ON carousel_slides FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_slides: admin insert" ON carousel_slides FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_slides: admin update" ON carousel_slides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "carousel_slides: admin delete" ON carousel_slides FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
