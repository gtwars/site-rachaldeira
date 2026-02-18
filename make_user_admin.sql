-- Script para tornar um usuário Admin (Cria o perfil se não existir)
-- Substitua 'email@exemplo.com' abaixo pelo email do usuário

DO $$
DECLARE
  target_email TEXT := 'email@exemplo.com'; -- <--- COLOQUE O EMAIL AQUI
  user_id UUID;
BEGIN
  -- 1. Buscar ID do usuário no Auth
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email % não encontrado no Authentication.', target_email;
  ELSE
    -- 2. Inserir ou Atualizar Profile
    INSERT INTO public.profiles (id, role)
    VALUES (user_id, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'Usuário % promovido a Admin com sucesso!', target_email;
  END IF;
END $$;
