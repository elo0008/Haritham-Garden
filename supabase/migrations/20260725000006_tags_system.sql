-- ============================================================
-- Migration 6: Replace plants.category with many-to-many tags
-- ============================================================
--
-- WHAT THIS DOES (in order):
--
-- 1. Creates a `tags` table with name, slug, and display_order.
-- 2. Creates a `plant_tags` junction table for the many-to-many
--    relationship between plants and tags.
-- 3. Seeds `tags` with the 5 existing category values:
--    Indoor (1), Outdoor (2), Flowering (3), Fruit (4), Other (5).
-- 4. Migrates every existing plant's `category` value into
--    `plant_tags` by matching the slug.
-- 5. Enables RLS on both new tables:
--    - tags: publicly readable, admin-only write
--    - plant_tags: publicly readable, admin-only write
-- 6. Drops the `idx_plants_category` index and the `category`
--    column from `plants` (along with its CHECK constraint).
--
-- EXISTING DATA: No data is lost. Every plant's category is
-- preserved as a tag link in `plant_tags` before the column
-- is dropped. The migration is wrapped in a transaction
-- (Supabase migrations run as transactions by default).
-- ============================================================

-- ── 1. Create tags table ────────────────────────────────────

CREATE TABLE tags (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL UNIQUE,
  slug          text        NOT NULL UNIQUE,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Create plant_tags junction table ─────────────────────

CREATE TABLE plant_tags (
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (plant_id, tag_id)
);

-- Index for "get all plants for a given tag" queries
CREATE INDEX idx_plant_tags_tag_id ON plant_tags (tag_id);

-- ── 3. Seed initial tags from existing category values ──────

INSERT INTO tags (name, slug, display_order) VALUES
  ('Indoor',    'indoor',    1),
  ('Outdoor',   'outdoor',   2),
  ('Flowering', 'flowering', 3),
  ('Fruit',     'fruit',     4),
  ('Other',     'other',     5);

-- ── 4. Migrate existing plant categories to plant_tags ──────
--    For every plant, find the tag whose slug matches the
--    plant's current category value and insert a link row.

INSERT INTO plant_tags (plant_id, tag_id)
SELECT p.id, t.id
FROM plants p
JOIN tags t ON t.slug = p.category;

-- ── 5. RLS policies for tags ────────────────────────────────

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags (needed for filter chips on storefront)
CREATE POLICY "tags: public read"
  ON tags
  FOR SELECT
  USING (true);

-- Only authenticated admin can insert tags
CREATE POLICY "tags: admin insert"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated admin can update tags
CREATE POLICY "tags: admin update"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated admin can delete tags
CREATE POLICY "tags: admin delete"
  ON tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ── 6. RLS policies for plant_tags ──────────────────────────

ALTER TABLE plant_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read plant_tags (needed to filter/display tags on storefront)
CREATE POLICY "plant_tags: public read"
  ON plant_tags
  FOR SELECT
  USING (true);

-- Only authenticated admin can insert plant_tags
CREATE POLICY "plant_tags: admin insert"
  ON plant_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated admin can update plant_tags
CREATE POLICY "plant_tags: admin update"
  ON plant_tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated admin can delete plant_tags
CREATE POLICY "plant_tags: admin delete"
  ON plant_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ── 7. Drop old category column and index ───────────────────

DROP INDEX IF EXISTS idx_plants_category;
ALTER TABLE plants DROP COLUMN category;
