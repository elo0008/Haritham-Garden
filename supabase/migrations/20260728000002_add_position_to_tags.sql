-- Migration: Add position integer column to tags table
-- Enables drag-and-drop reordering for tags in Haritham Garden admin

ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS position integer;

-- Populate position from display_order for existing records
UPDATE tags
  SET position = display_order
  WHERE position IS NULL;

-- Create index for optimized position ordering
CREATE INDEX IF NOT EXISTS idx_tags_position ON tags (position ASC);
