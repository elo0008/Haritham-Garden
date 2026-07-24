-- ============================================================
-- Migration: Create plants table
-- ============================================================

-- Auto-update updated_at helper (reusable across tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── plants ───────────────────────────────────────────────────
CREATE TABLE plants (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  local_name   text,
  slug         text        NOT NULL UNIQUE,
  category     text        NOT NULL
                           CHECK (category IN ('indoor', 'outdoor', 'flowering', 'fruit', 'other')),
  photos       text[]      NOT NULL DEFAULT '{}',
  description  text,
  sunlight     text        NOT NULL
                           CHECK (sunlight IN ('low', 'medium', 'full_sun')),
  watering     text        NOT NULL
                           CHECK (watering IN ('low', 'medium', 'high')),
  price        numeric     NOT NULL CHECK (price >= 0),
  availability text        NOT NULL DEFAULT 'available'
                           CHECK (availability IN ('available', 'limited', 'unavailable')),
  shippable    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at current on every UPDATE
CREATE TRIGGER trg_plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index slug for fast lookups (used in public-facing page routes)
CREATE INDEX idx_plants_slug     ON plants (slug);
CREATE INDEX idx_plants_category ON plants (category);
