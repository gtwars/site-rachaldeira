-- Habilita RLS para as tabelas de campeonato
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

-- Cria políticas de leitura pública (Anon e Authenticated)
CREATE POLICY "Permitir leitura pública de campeonatos" ON championships FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de times" ON teams FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de integrantes de times" ON team_members FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de partidas de campeonato" ON championship_matches FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de estatísticas de partidas" ON match_player_stats FOR SELECT USING (true);

-- Garante que o role anon tenha acesso (Supabase já faz isso se houver política, mas por segurança)
GRANT SELECT ON championships TO anon, authenticated;
GRANT SELECT ON teams TO anon, authenticated;
GRANT SELECT ON team_members TO anon, authenticated;
GRANT SELECT ON championship_matches TO anon, authenticated;
GRANT SELECT ON match_player_stats TO anon, authenticated;
