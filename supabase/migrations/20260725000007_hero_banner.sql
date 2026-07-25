-- ============================================================
-- Migration 7: Hero Banner singleton table
-- ============================================================
--
-- Creates a `hero_banner` table with a single row that acts
-- as a singleton configuration record. The banner can be
-- toggled on/off via the `active` column.
-- ============================================================

CREATE TABLE hero_banner (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_label        text,
  title            text,
  description      text,
  background_image text,
  active           boolean     NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every UPDATE
CREATE TRIGGER trg_hero_banner_updated_at
  BEFORE UPDATE ON hero_banner
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert one default empty row (singleton)
INSERT INTO hero_banner (tag_label, title, description, background_image, active)
VALUES (NULL, NULL, NULL, NULL, false);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE hero_banner ENABLE ROW LEVEL SECURITY;

-- Anyone (including visitors) can read the banner
CREATE POLICY "hero_banner: public read"
  ON hero_banner
  FOR SELECT
  USING (true);

-- Only authenticated admin can update the banner
CREATE POLICY "hero_banner: admin update"
  ON hero_banner
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Prevent inserting additional rows (singleton)
CREATE POLICY "hero_banner: admin insert"
  ON hero_banner
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT count(*) FROM hero_banner) = 0
  );

-- Allow admin to delete (shouldn't normally happen)
CREATE POLICY "hero_banner: admin delete"
  ON hero_banner
  FOR DELETE
  TO authenticated
  USING (true);
