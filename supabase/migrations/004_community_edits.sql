-- ============================================================
-- Naturkartan.ax — Schema Migration 004: Community edits table
-- ============================================================

CREATE TABLE IF NOT EXISTS item_community_edits (
  id             BIGSERIAL PRIMARY KEY,
  item_id        TEXT NOT NULL,
  contribution_id BIGINT,
  submitter_name TEXT,
  note           TEXT,
  photo_url      TEXT,
  data           JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS item_community_edits_item_idx
  ON item_community_edits (item_id, approved_at DESC);

CREATE INDEX IF NOT EXISTS item_community_edits_contribution_idx
  ON item_community_edits (contribution_id);

ALTER TABLE item_community_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read community edits"
  ON item_community_edits FOR SELECT
  USING (true);

CREATE POLICY "Admin write community edits"
  ON item_community_edits FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
