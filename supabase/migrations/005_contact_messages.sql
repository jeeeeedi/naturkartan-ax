-- ============================================================
-- Naturkartan.ax — Schema Migration 005: Contact messages
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived'))
);

CREATE INDEX IF NOT EXISTS contact_messages_created_idx
  ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin read contact messages"
  ON contact_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin manage contact messages"
  ON contact_messages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
