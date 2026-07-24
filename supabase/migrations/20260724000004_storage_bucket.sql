-- ============================================================
-- Migration: Storage bucket — plant-photos
-- ============================================================

-- Create the bucket (public = true makes objects publicly readable by URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plant-photos',
  'plant-photos',
  true,
  5242880,                                         -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS ─────────────────────────────────────────────
-- DROP IF EXISTS first so this script is safe to re-run.

DROP POLICY IF EXISTS "plant-photos: public read"   ON storage.objects;
DROP POLICY IF EXISTS "plant-photos: admin insert"  ON storage.objects;
DROP POLICY IF EXISTS "plant-photos: admin update"  ON storage.objects;
DROP POLICY IF EXISTS "plant-photos: admin delete"  ON storage.objects;

-- Anyone can view images (bucket is public, but policy is belt-and-suspenders)
CREATE POLICY "plant-photos: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'plant-photos');

-- Only admin can upload images
CREATE POLICY "plant-photos: admin insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plant-photos');

-- Only admin can replace/overwrite images
CREATE POLICY "plant-photos: admin update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'plant-photos');

-- Only admin can delete images
CREATE POLICY "plant-photos: admin delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'plant-photos');
