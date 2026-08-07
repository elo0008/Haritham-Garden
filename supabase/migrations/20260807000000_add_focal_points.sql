-- Migration: Add focal_point_x and focal_point_y columns to hero_banner, carousel_slides, and plants
ALTER TABLE hero_banner
ADD COLUMN IF NOT EXISTS focal_point_x numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_point_y numeric DEFAULT 50;

ALTER TABLE carousel_slides
ADD COLUMN IF NOT EXISTS focal_point_x numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_point_y numeric DEFAULT 50;

ALTER TABLE plants
ADD COLUMN IF NOT EXISTS focal_point_x numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_point_y numeric DEFAULT 50;
