-- Adiciona campo de horário agendado para partidas
ALTER TABLE championship_matches ADD COLUMN IF NOT EXISTS scheduled_time TIME;
