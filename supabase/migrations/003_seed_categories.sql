-- ============================================================
-- Naturkartan.ax — Seed 003: Categories only
-- Parks come from ArcGIS sync, not from SQL seed
-- ============================================================
INSERT INTO categories (id, label_sv, label_en, label_fi, desc_sv, desc_en, desc_fi, color, icon) VALUES
  ('recreation', 'Vandringsstig', 'Hiking Trail',  'Vaellusreitti', 'Märkta vandringsleder', 'Marked hiking trails',  'Merkityt vaellusreitit', '#3a7d44', 'F'),
  ('cycling',    'Cykelrutt',    'Cycling Route', 'Pyöräreitti',   'Utmärkta cykelleder',   'Marked cycling routes', 'Merkityt pyöräreitit',   '#2c6e8a', 'C');
