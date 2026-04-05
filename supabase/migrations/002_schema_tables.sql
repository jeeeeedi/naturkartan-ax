-- ============================================================
-- Naturkartan.ax — Schema Migration 002: Tables + RLS
-- Run this AFTER 001_schema.sql
-- ============================================================

-- --------------------------------------------------------
-- Categories
-- --------------------------------------------------------
CREATE TABLE categories (
  id       TEXT PRIMARY KEY,
  label_sv TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_fi TEXT NOT NULL,
  desc_sv  TEXT NOT NULL DEFAULT '',
  desc_en  TEXT NOT NULL DEFAULT '',
  desc_fi  TEXT NOT NULL DEFAULT '',
  color    TEXT NOT NULL,
  icon     TEXT
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- --------------------------------------------------------
-- Parks
-- --------------------------------------------------------
CREATE TABLE parks (
  id             TEXT PRIMARY KEY,
  name_sv        TEXT NOT NULL,
  name_en        TEXT,
  name_fi        TEXT,
  category_id    TEXT REFERENCES categories(id),
  location       GEOGRAPHY(POINT, 4326) NOT NULL,
  municipality   TEXT,
  area           TEXT,
  description_sv TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  description_fi TEXT DEFAULT '',
  features       TEXT[] DEFAULT '{}',
  -- ArcGIS sync tracking
  source_id      TEXT UNIQUE,     -- e.g. 'arcgis-l1-3'  (layer-OBJECTID)
  source_url     TEXT,            -- FeatureServer base URL
  synced_at      TIMESTAMPTZ,
  -- Extra ArcGIS metadata (image name, terrain, photo URLs from waypoints service)
  meta           JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX parks_location_idx  ON parks USING GIST(location);
CREATE INDEX parks_source_id_idx ON parks (source_id);

ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read parks" ON parks FOR SELECT USING (true);
CREATE POLICY "Admin write parks" ON parks FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parks_updated_at
  BEFORE UPDATE ON parks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- --------------------------------------------------------
-- Park photos (stored in Supabase Storage)
-- --------------------------------------------------------
CREATE TABLE park_photos (
  id           SERIAL PRIMARY KEY,
  park_id      TEXT REFERENCES parks(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE park_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read photos" ON park_photos FOR SELECT USING (true);
CREATE POLICY "Admin write photos" ON park_photos FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- --------------------------------------------------------
-- Contributions (public submit, admin review)
-- --------------------------------------------------------
CREATE TABLE contributions (
  id             SERIAL PRIMARY KEY,
  park_id        TEXT REFERENCES parks(id),
  type           TEXT NOT NULL CHECK (type IN ('edit', 'new')),
  data           JSONB NOT NULL DEFAULT '{}',
  submitter_name TEXT,
  note           TEXT,
  photo_url      TEXT,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert contributions" ON contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin all contributions"     ON contributions FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
