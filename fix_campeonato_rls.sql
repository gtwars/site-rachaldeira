-- ATENÇÃO: Execute este código no Painel SQL do Supabase.

-- Correção de Políticas para todas as tabelas internas do Campeonato (Times, Relacionamentos, Partidas e Scouts)

-- 1. Garante que o RLS está ativo
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

-- 2. Limpa as políticas antigas ou bloqueantes para garantir terreno limpo
DROP POLICY IF EXISTS "Only admin can insert teams" ON teams;
DROP POLICY IF EXISTS "Only admin can update teams" ON teams;
DROP POLICY IF EXISTS "Only admin can delete teams" ON teams;
DROP POLICY IF EXISTS "Enable insert for admins only" ON teams; 
DROP POLICY IF EXISTS "Enable update for admins only" ON teams; 
DROP POLICY IF EXISTS "Enable delete for admins only" ON teams; 
DROP POLICY IF EXISTS "Public pode ler teams" ON teams;

DROP POLICY IF EXISTS "Only admin can insert team_members" ON team_members;
DROP POLICY IF EXISTS "Only admin can delete team_members" ON team_members;

DROP POLICY IF EXISTS "Only admin can insert matches" ON championship_matches;
DROP POLICY IF EXISTS "Only admin can update matches" ON championship_matches;
DROP POLICY IF EXISTS "Only admin can delete matches" ON championship_matches;

DROP POLICY IF EXISTS "Only admin can insert match_player_stats" ON match_player_stats;
DROP POLICY IF EXISTS "Only admin can update match_player_stats" ON match_player_stats;
DROP POLICY IF EXISTS "Only admin can delete match_player_stats" ON match_player_stats;

-- 3. Cria Políticas Únicas e Robustas validando pelo profiles.role (Permite Admin e Diretor inserirem e deletarem em todas as tabelas)

-- TIMES (teams)
CREATE POLICY "Admins_Directors_Mutate" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'director'))
);
CREATE POLICY "Read_All" ON teams FOR SELECT USING (true);

-- MEMBROS DOS TIMES (team_members)
CREATE POLICY "Admins_Directors_Mutate" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'director'))
);
CREATE POLICY "Read_All" ON team_members FOR SELECT USING (true);

-- PARTIDAS DO CAMPEONATO (championship_matches)
CREATE POLICY "Admins_Directors_Mutate" ON championship_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'director'))
);
CREATE POLICY "Read_All" ON championship_matches FOR SELECT USING (true);

-- SCOUTS DAS PARTIDAS (match_player_stats)
CREATE POLICY "Admins_Directors_Mutate" ON match_player_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'director'))
);
CREATE POLICY "Read_All" ON match_player_stats FOR SELECT USING (true);
