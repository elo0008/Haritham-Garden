-- Migration: Safeguard plant deletion & order item references
-- Run this script in your Supabase SQL Editor:

-- Ensure plant_tags junction table cascades on deletion
ALTER TABLE plant_tags
  DROP CONSTRAINT IF EXISTS plant_tags_plant_id_fkey,
  ADD CONSTRAINT plant_tags_plant_id_fkey
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE;

-- Note: Order items are stored as JSONB with snapshot plant_id values.
-- Historical dispatched orders retain name, price, and photo snapshots inside items JSONB.
