-- Rachaldeira RLS Policies
-- Row Level Security simplificado por role (admin/user)

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rachas ENABLE ROW LEVEL SECURITY;
ALTER TABLE racha_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE racha_scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================

-- Todos podem ler profiles
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

-- Usuário pode inserir seu próprio profile (ao cadastrar)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuário pode atualizar seu próprio profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin pode fazer tudo
CREATE POLICY "Admin can do anything on profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- =============================================================================
-- MEMBERS POLICIES
-- =============================================================================

-- Todos autenticados podem ler members
CREATE POLICY "Authenticated users can read members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode inserir/atualizar/deletar members
CREATE POLICY "Only admin can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- RACHAS POLICIES
-- =============================================================================

-- Todos autenticados podem ler rachas
CREATE POLICY "Authenticated users can read rachas"
  ON rachas FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar rachas
CREATE POLICY "Only admin can insert rachas"
  ON rachas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update rachas"
  ON rachas FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete rachas"
  ON rachas FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- RACHA_ATTENDANCE POLICIES
-- =============================================================================

-- Todos autenticados podem ler attendance
CREATE POLICY "Authenticated users can read attendance"
  ON racha_attendance FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode inserir apenas sua própria presença
CREATE POLICY "Users can insert own attendance"
  ON racha_attendance FOR INSERT
  TO authenticated
  WITH CHECK (member_id = get_member_id());

-- Usuário pode atualizar apenas sua própria presença
CREATE POLICY "Users can update own attendance"
  ON racha_attendance FOR UPDATE
  TO authenticated
  USING (member_id = get_member_id());

-- Admin pode fazer tudo em attendance
CREATE POLICY "Admin can do anything on attendance"
  ON racha_attendance FOR ALL
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- RACHA_SCOUTS POLICIES
-- =============================================================================

-- Todos autenticados podem ler scouts
CREATE POLICY "Authenticated users can read scouts"
  ON racha_scouts FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar scouts
CREATE POLICY "Only admin can insert scouts"
  ON racha_scouts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update scouts"
  ON racha_scouts FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete scouts"
  ON racha_scouts FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- CHAMPIONSHIPS POLICIES
-- =============================================================================

-- Todos autenticados podem ler championships
CREATE POLICY "Authenticated users can read championships"
  ON championships FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar championships
CREATE POLICY "Only admin can insert championships"
  ON championships FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update championships"
  ON championships FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete championships"
  ON championships FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- TEAMS POLICIES
-- =============================================================================

-- Todos autenticados podem ler teams
CREATE POLICY "Authenticated users can read teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar teams
CREATE POLICY "Only admin can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- TEAM_MEMBERS POLICIES
-- =============================================================================

-- Todos autenticados podem ler team_members
CREATE POLICY "Authenticated users can read team_members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar team_members
CREATE POLICY "Only admin can insert team_members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can delete team_members"
  ON team_members FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- CHAMPIONSHIP_MATCHES POLICIES
-- =============================================================================

-- Todos autenticados podem ler matches
CREATE POLICY "Authenticated users can read matches"
  ON championship_matches FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar matches
CREATE POLICY "Only admin can insert matches"
  ON championship_matches FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update matches"
  ON championship_matches FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete matches"
  ON championship_matches FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- MATCH_PLAYER_STATS POLICIES
-- =============================================================================

-- Todos autenticados podem ler match stats
CREATE POLICY "Authenticated users can read match_player_stats"
  ON match_player_stats FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar match stats
CREATE POLICY "Only admin can insert match_player_stats"
  ON match_player_stats FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update match_player_stats"
  ON match_player_stats FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete match_player_stats"
  ON match_player_stats FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- VOTING_PERIODS POLICIES
-- =============================================================================

-- Todos autenticados podem ler voting_periods
CREATE POLICY "Authenticated users can read voting_periods"
  ON voting_periods FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode gerenciar voting_periods
CREATE POLICY "Only admin can insert voting_periods"
  ON voting_periods FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admin can update voting_periods"
  ON voting_periods FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admin can delete voting_periods"
  ON voting_periods FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- VOTES POLICIES
-- =============================================================================

-- Todos autenticados podem ler votes
CREATE POLICY "Authenticated users can read votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode inserir apenas seu próprio voto (1 por período)
CREATE POLICY "Users can insert own vote once per period"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = get_member_id() AND
    NOT EXISTS (
      SELECT 1 FROM votes
      WHERE voting_period_id = votes.voting_period_id
      AND voter_id = get_member_id()
    )
  );

-- Admin pode fazer tudo em votes
CREATE POLICY "Admin can do anything on votes"
  ON votes FOR ALL
  TO authenticated
  USING (is_admin());
