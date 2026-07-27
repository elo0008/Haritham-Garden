-- Migration: Add cancelled_by_customer column to orders table
-- Run this script in your Supabase SQL Editor:

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancelled_by_customer boolean DEFAULT false;
