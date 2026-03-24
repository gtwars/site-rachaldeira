-- Política para permitir que usuários deletem sua própria presença (desfazer confirmação)
-- Executar no Supabase SQL Editor

DROP POLICY IF EXISTS "Users can delete own attendance" ON racha_attendance;

CREATE POLICY "Users can delete own attendance"
  ON racha_attendance FOR DELETE
  TO authenticated
  USING (
    member_id = (SELECT member_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );
