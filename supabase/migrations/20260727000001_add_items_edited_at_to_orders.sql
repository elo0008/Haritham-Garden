-- Migration: Add items_edited_at column to orders table
-- Run this script in your Supabase SQL Editor:

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS items_edited_at timestamptz NULL;
