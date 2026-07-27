-- Migration: Add sale_price column to plants table
-- Run this script in your Supabase SQL Editor:

ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS sale_price numeric NULL;
