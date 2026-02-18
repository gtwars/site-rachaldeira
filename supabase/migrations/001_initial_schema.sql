-- Rachaldeira Database Schema
-- Sistema completo de gestão de racha de futebol

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE racha_periodicity AS ENUM ('weekly', 'monthly', 'once');
CREATE TYPE racha_status AS ENUM ('open', 'locked', 'in_progress', 'closed');
CREATE TYPE attendance_status AS ENUM ('in', 'out');
CREATE TYPE championship_format AS ENUM ('round_robin', 'bracket');
CREATE TYPE bracket_type AS ENUM ('auto', 'manual');
CREATE TYPE championship_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE match_status AS ENUM ('scheduled', 'completed');
CREATE TYPE voting_period_type AS ENUM ('weekly', 'monthly', 'annual');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profiles (vinculado ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  member_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members (integrantes do racha)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  cpf TEXT,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rachas
CREATE TABLE rachas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  periodicity racha_periodicity NOT NULL DEFAULT 'once',
  status racha_status NOT NULL DEFAULT 'open',
  is_next BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Racha Attendance (confirmação de presença)
CREATE TABLE racha_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  racha_id UUID NOT NULL REFERENCES rachas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(racha_id, member_id)
);

-- Racha Scouts (estatísticas por jogador por racha)
CREATE TABLE racha_scouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  racha_id UUID NOT NULL REFERENCES rachas(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  difficult_saves INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(racha_id, member_id)
);

-- Championships
CREATE TABLE championships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  location TEXT,
  format championship_format NOT NULL,
  bracket_type bracket_type,
  rounds INTEGER DEFAULT 1,
  status championship_status NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, member_id)
);

-- Championship Matches
CREATE TABLE championship_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  round INTEGER,
  bracket_position TEXT,
  team_a_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  status match_status NOT NULL DEFAULT 'scheduled',
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Player Stats
CREATE TABLE match_player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES championship_matches(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  difficult_saves INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0
);

-- Voting Periods
CREATE TABLE voting_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  period_type voting_period_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voting_period_id UUID NOT NULL REFERENCES voting_periods(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  craque_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  xerife_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voting_period_id, voter_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_profiles_member_id ON profiles(member_id);
CREATE INDEX idx_racha_attendance_racha_id ON racha_attendance(racha_id);
CREATE INDEX idx_racha_attendance_member_id ON racha_attendance(member_id);
CREATE INDEX idx_racha_scouts_racha_id ON racha_scouts(racha_id);
CREATE INDEX idx_racha_scouts_member_id ON racha_scouts(member_id);
CREATE INDEX idx_teams_championship_id ON teams(championship_id);
CREATE INDEX idx_championship_matches_championship_id ON championship_matches(championship_id);
CREATE INDEX idx_match_player_stats_match_id ON match_player_stats(match_id);
CREATE INDEX idx_match_player_stats_member_id ON match_player_stats(member_id);
CREATE INDEX idx_votes_period_id ON votes(voting_period_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_rachas_is_next ON rachas(is_next) WHERE is_next = TRUE;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member_id from auth user
CREATE OR REPLACE FUNCTION get_member_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT member_id FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rachas_updated_at BEFORE UPDATE ON rachas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_racha_scouts_updated_at BEFORE UPDATE ON racha_scouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_championships_updated_at BEFORE UPDATE ON championships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'Perfis de usuário vinculados ao Supabase Auth';
COMMENT ON TABLE members IS 'Integrantes do racha com informações pessoais';
COMMENT ON TABLE rachas IS 'Eventos de racha (partidas)';
COMMENT ON TABLE racha_attendance IS 'Confirmação de presença nos rachas';
COMMENT ON TABLE racha_scouts IS 'Estatísticas de jogadores por racha';
COMMENT ON TABLE championships IS 'Campeonatos organizados';
COMMENT ON TABLE teams IS 'Times participantes dos campeonatos';
COMMENT ON TABLE team_members IS 'Relação entre times e integrantes';
COMMENT ON TABLE championship_matches IS 'Partidas dos campeonatos';
COMMENT ON TABLE match_player_stats IS 'Estatísticas de jogadores por partida';
COMMENT ON TABLE voting_periods IS 'Períodos de votação para Craque e Xerife';
COMMENT ON TABLE votes IS 'Votos de Craque e Xerife por período';
