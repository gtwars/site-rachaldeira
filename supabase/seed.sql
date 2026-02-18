-- Rachaldeira Seed Data
-- Dados de exemplo para desenvolvimento e testes

-- =============================================================================
-- ADMIN USER
-- =============================================================================
-- IMPORTANTE: Execute este comando no SQL Editor do Supabase Dashboard após criar um usuário manualmente
-- ou use o Supabase CLI para criar o usuário via auth.users

-- Exemplo de como criar um perfil admin para um usuário existente:
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';

-- =============================================================================
-- EXAMPLE MEMBERS
-- =============================================================================

INSERT INTO members (id, name, age, cpf, phone, email, position) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'João Silva', 28, '123.456.789-00', '(11) 98765-4321', 'joao@example.com', 'Atacante'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Pedro Santos', 25, '987.654.321-00', '(11) 98765-4322', 'pedro@example.com', 'Goleiro'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Carlos Oliveira', 30, '456.789.123-00', '(11) 98765-4323', 'carlos@example.com', 'Zagueiro'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Lucas Ferreira', 27, '321.654.987-00', '(11) 98765-4324', 'lucas@example.com', 'Meio-campo'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Rafael Costa', 26, '789.123.456-00', '(11) 98765-4325', 'rafael@example.com', 'Lateral'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Bruno Souza', 29, '654.321.987-00', '(11) 98765-4326', 'bruno@example.com', 'Atacante'),
  ('g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'André Lima', 24, '147.258.369-00', '(11) 98765-4327', 'andre@example.com', 'Meio-campo'),
  ('h7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Felipe Rocha', 31, '258.369.147-00', '(11) 98765-4328', 'felipe@example.com', 'Zagueiro');

-- =============================================================================
-- EXAMPLE RACHAS
-- =============================================================================

-- Próximo racha (semanal)
INSERT INTO rachas (id, date_time, location, periodicity, status, is_next) VALUES
  ('10000000-0000-0000-0000-000000000001', '2026-02-22 10:00:00-03', 'Campo do Parque', 'weekly', 'open', true);

-- Racha passado (fechado)
INSERT INTO rachas (id, date_time, location, periodicity, status, is_next) VALUES
  ('20000000-0000-0000-0000-000000000002', '2026-02-15 10:00:00-03', 'Campo do Parque', 'weekly', 'closed', false);

-- =============================================================================
-- EXAMPLE ATTENDANCE
-- =============================================================================

-- Confirmações para o próximo racha
INSERT INTO racha_attendance (racha_id, member_id, status) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'in'),
  ('10000000-0000-0000-0000-000000000001', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'in'),
  ('10000000-0000-0000-0000-000000000001', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'in'),
  ('10000000-0000-0000-0000-000000000001', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'out'),
  ('10000000-0000-0000-0000-000000000001', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'in'),
  ('10000000-0000-0000-0000-000000000001', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'in');

-- =============================================================================
-- EXAMPLE SCOUTS (do racha passado)
-- =============================================================================

INSERT INTO racha_scouts (racha_id, member_id, goals, assists, difficult_saves, warnings) VALUES
  ('20000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 1, 0, 0),
  ('20000000-0000-0000-0000-000000000002', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 0, 0, 5, 0),
  ('20000000-0000-0000-0000-000000000002', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 0, 2, 0, 1),
  ('20000000-0000-0000-0000-000000000002', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 1, 1, 0, 0),
  ('20000000-0000-0000-0000-000000000002', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 2, 0, 0, 1);

-- =============================================================================
-- EXAMPLE CHAMPIONSHIP
-- =============================================================================

INSERT INTO championships (id, name, start_date, location, format, rounds, status) VALUES
  ('30000000-0000-0000-0000-000000000003', 'Campeonato Verão 2026', '2026-03-01', 'Campo do Parque', 'round_robin', 1, 'not_started');

-- Example teams
INSERT INTO teams (id, championship_id, name) VALUES
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'Time A'),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Time B'),
  ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 'Time C'),
  ('70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'Time D');

-- Team members
INSERT INTO team_members (team_id, member_id) VALUES
  ('40000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('40000000-0000-0000-0000-000000000004', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('50000000-0000-0000-0000-000000000005', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'),
  ('50000000-0000-0000-0000-000000000005', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'),
  ('60000000-0000-0000-0000-000000000006', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'),
  ('60000000-0000-0000-0000-000000000006', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'),
  ('70000000-0000-0000-0000-000000000007', 'g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17'),
  ('70000000-0000-0000-0000-000000000007', 'h7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18');

-- =============================================================================
-- NOTES
-- =============================================================================
-- Para criar um usuário admin:
-- 1. Crie uma conta via interface de signup 
-- 2. No Supabase Dashboard, copie o user ID de auth.users
-- 3. Execute: UPDATE profiles SET role = 'admin', member_id = 'MEMBER_ID_AQUI' WHERE id = 'USER_ID_AQUI';
