-- 1. Habilitar RLS na tabela teams (caso não esteja)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 2. Permitir LEITURA para todos os usuários autenticados
DROP POLICY IF EXISTS "Enable read access for all users" ON teams;
CREATE POLICY "Enable read access for all users" ON teams
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Permitir INSERÇÃO apenas para admins
DROP POLICY IF EXISTS "Enable insert for admins only" ON teams;
CREATE POLICY "Enable insert for admins only" ON teams
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Permitir ATUALIZAÇÃO apenas para admins
DROP POLICY IF EXISTS "Enable update for admins only" ON teams;
CREATE POLICY "Enable update for admins only" ON teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Permitir DELEÇÃO apenas para admins
DROP POLICY IF EXISTS "Enable delete for admins only" ON teams;
CREATE POLICY "Enable delete for admins only" ON teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ======================================================
-- POLÍTICAS DE STORAGE (BUCKET 'Fotos camp-times')
-- ======================================================

-- Garantir que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Fotos camp-times', 'Fotos camp-times', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura pública dos arquivos
DROP POLICY IF EXISTS "Give public access to Fotos camp-times" ON storage.objects;
CREATE POLICY "Give public access to Fotos camp-times"
ON storage.objects FOR SELECT
USING ( bucket_id = 'Fotos camp-times' );

-- Permitir upload apenas para admins (ou usuários autenticados, se preferir)
DROP POLICY IF EXISTS "Allow uploads to Fotos camp-times" ON storage.objects;
CREATE POLICY "Allow uploads to Fotos camp-times"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Fotos camp-times'
  AND (
     auth.role() = 'authenticated' 
     -- Se quiser restringir só para admin, descomente abaixo:
     -- AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
