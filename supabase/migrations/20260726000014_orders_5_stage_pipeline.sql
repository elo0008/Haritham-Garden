-- ============================================================
-- Migration 14: Extend orders system to 5-stage pipeline & two-step courier pricing
-- ============================================================

-- 1. Add new columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS estimated_courier_price numeric,
  ADD COLUMN IF NOT EXISTS final_courier_price numeric;

-- 2. Add status check constraint
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'handled', 'paid', 'packaged', 'dispatched'));

-- 3. Data Migration 1: Set status based on handled boolean
UPDATE orders
  SET status = CASE
    WHEN handled = true THEN 'dispatched'
    ELSE 'pending'
  END
  WHERE status IS NULL OR status = 'pending';

-- 4. Data Migration 2: Copy delivery_price into final_courier_price for existing handled orders
UPDATE orders
  SET final_courier_price = delivery_price
  WHERE delivery_price IS NOT NULL AND final_courier_price IS NULL;

-- 5. Data Migration 3: Recalculate final_total using final_courier_price or estimated_courier_price
UPDATE orders
  SET final_total = subtotal + COALESCE(final_courier_price, estimated_courier_price, 0)
  WHERE final_total IS NULL OR delivery_price IS NOT NULL;
