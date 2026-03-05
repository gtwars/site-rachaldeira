-- Adicionar coluna para controlar se o campeonato conta para as estatísticas globais
ALTER TABLE championships ADD COLUMN count_towards_stats BOOLEAN DEFAULT TRUE;

-- Adicionar tipo para o novo formato de campeonato
-- NOTA: Se o tipo format for um enum, precisamos alterá-lo.
-- Verificando o SCHEMA.md, parece ser um ENUM.
-- Como é difícil alterar ENUMs no Postgres de forma segura sem saber o nome exato do tipo, 
-- vou assumir que posso tentar adicionar o valor se for um enum ou apenas aceitar se for texto.
-- Se falhar, usaremos o formato de texto.

-- Adicionar coluna de grupo nos times
ALTER TABLE teams ADD COLUMN IF NOT EXISTS "group" TEXT;

-- Adicionar colunas de pênaltis e vantagem na tabela de partidas
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS penalties_score_a INTEGER DEFAULT 0;
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS penalties_score_b INTEGER DEFAULT 0;
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS penalty_winner_id UUID REFERENCES teams(id);
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS has_draw_advantage BOOLEAN DEFAULT FALSE;

-- Adicionar colunas de cartões na tabela de scouts
ALTER TABLE match_player_stats ADD COLUMN IF NOT EXISTS yellow_cards INTEGER DEFAULT 0;
ALTER TABLE match_player_stats ADD COLUMN IF NOT EXISTS red_cards INTEGER DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_teams_group ON teams("group");
CREATE INDEX IF NOT EXISTS idx_championship_matches_penalty_winner ON championship_matches(penalty_winner_id);
