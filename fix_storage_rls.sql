-- Script para liberar os uploads de imagens nos buckets (Fotos e Fotos camp-times)

-- 1. Habilitar RLS no storage (caso já não esteja)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Derrubar políticas antigas (se existirem) para o bucket de Fotos
DROP POLICY IF EXISTS "Qualquer um pode ver as fotos do time" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem postar fotos de times" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir objetos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar objetos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar objetos" ON storage.objects;

-- 3. Criar Políticas Amplas para Usuários Autenticados (Admins, Diretores, Usuários logados)
-- Permite que usuários LOGADOS insiram fotos em QUALQUER bucket. 
-- *Se quiser restringir apenas a admin, mude 'TO authenticated' para um check com is_admin() depois*
CREATE POLICY "Usuários autenticados podem inserir objetos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permite que qualquer um (mesmo não logado) veja as imagens publicadas
CREATE POLICY "Public pode visualizar todos os objetos" 
ON storage.objects FOR SELECT 
TO public 
USING (true);

-- Permite que usuários autenticados atualizem/apaguem imagens
CREATE POLICY "Usuários autenticados podem atualizar objetos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem deletar objetos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (true);
