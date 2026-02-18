-- 1. Atualizar o Check Constraint de Role (se existir)
-- Isso garante que 'director' seja um valor válido na coluna role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user', 'director'));

-- 2. Atualizar Policies para Rachas
-- Permitir INSERT/UPDATE/DELETE para admin OU director
DROP POLICY IF EXISTS "Enable all access for admins" ON rachas;
CREATE POLICY "Enable access for admins and directors" ON rachas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- 3. Atualizar Policies para Campeonatos
DROP POLICY IF EXISTS "Enable all access for admins" ON championships;
CREATE POLICY "Enable access for admins and directors" ON championships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- 4. Atualizar Policies para Times
DROP POLICY IF EXISTS "Enable insert for admins only" ON teams;
DROP POLICY IF EXISTS "Enable update for admins only" ON teams;
DROP POLICY IF EXISTS "Enable delete for admins only" ON teams;

CREATE POLICY "Enable insert for admins and directors" ON teams
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

CREATE POLICY "Enable update for admins and directors" ON teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

CREATE POLICY "Enable delete for admins and directors" ON teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- 5. Atualizar Policies para Partidas e Scouts (Geral)
-- Simplificando: vamos criar uma função auxiliar se ela não existir, ou usar a lógica direta
-- Vou usar lógica direta para garantir

-- Tabela: racha_scouts (geralmente inserido pelo admin/diretor)
DROP POLICY IF EXISTS "Enable all access for admins" ON racha_scouts;
CREATE POLICY "Enable access for admins and directors" ON racha_scouts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- Tabela: championship_matches
DROP POLICY IF EXISTS "Enable all access for admins" ON championship_matches;
CREATE POLICY "Enable access for admins and directors" ON championship_matches
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- Tabela: match_player_stats
DROP POLICY IF EXISTS "Enable all access for admins" ON match_player_stats;
CREATE POLICY "Enable access for admins and directors" ON match_player_stats
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- 6. Atualizar Policies para Storage (Logos)
DROP POLICY IF EXISTS "Allow uploads to Fotos camp-times" ON storage.objects;
CREATE POLICY "Allow uploads to Fotos camp-times"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Fotos camp-times'
  AND (
     auth.role() = 'authenticated'
     AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'director')
     )
  )
);
