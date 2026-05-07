-- Add manual championship wins field to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS championship_wins INTEGER DEFAULT 0;
COMMENT ON COLUMN members.championship_wins IS 'Vitórias de campeonato ajustadas manualmente pelo admin';
