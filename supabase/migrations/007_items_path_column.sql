-- Add path column to items for storing GeoJSON route geometry.
-- Used by ArcGIS sync (already populated) and user-contributed trails.
-- IF NOT EXISTS is safe to run even if the column was added manually.
ALTER TABLE items ADD COLUMN IF NOT EXISTS path JSONB;
