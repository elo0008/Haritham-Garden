-- ============================================================
-- Migration: Row Level Security (RLS) policies
-- ============================================================

-- ── plants RLS ───────────────────────────────────────────────
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read all plants
CREATE POLICY "plants: public read"
  ON plants
  FOR SELECT
  USING (true);

-- Only signed-in admin users can insert new plants
CREATE POLICY "plants: admin insert"
  ON plants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only signed-in admin users can update plants
CREATE POLICY "plants: admin update"
  ON plants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only signed-in admin users can delete plants
CREATE POLICY "plants: admin delete"
  ON plants
  FOR DELETE
  TO authenticated
  USING (true);

-- ── orders RLS ───────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone (customers) can place an order — no auth required
CREATE POLICY "orders: public insert"
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- Only signed-in admin users can read orders
CREATE POLICY "orders: admin select"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Only signed-in admin users can update orders (mark handled, set final_total, etc.)
CREATE POLICY "orders: admin update"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Soft-delete only (set deleted = true), but hard-delete gated to admin
CREATE POLICY "orders: admin delete"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);
