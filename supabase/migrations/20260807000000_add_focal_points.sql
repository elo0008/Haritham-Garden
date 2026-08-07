-- Migration: Add focal_point_x and focal_point_y columns to hero_banner and carousel_slides
ALTER TABLE hero_banner
ADD COLUMN IF NOT EXISTS focal_point_x numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_point_y numeric DEFAULT 50;

ALTER TABLE carousel_slides
ADD COLUMN IF NOT EXISTS focal_point_x numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_point_y numeric DEFAULT 50;

-- Convert plants.photos column to jsonb for per-image focal point storage
-- Drop existing text[] default first, alter column type, then set new jsonb default
ALTER TABLE plants ALTER COLUMN photos DROP DEFAULT;
ALTER TABLE plants ALTER COLUMN photos TYPE jsonb USING to_jsonb(photos);
ALTER TABLE plants ALTER COLUMN photos SET DEFAULT '[]'::jsonb;

-- Drop plant-level focal point columns from plants table if present
ALTER TABLE plants
DROP COLUMN IF EXISTS focal_point_x,
DROP COLUMN IF EXISTS focal_point_y;
