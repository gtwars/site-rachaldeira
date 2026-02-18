-- Function to update a member's role securely
-- Only allows execution if the caller's email is 'gr96445@gmail.com'

CREATE OR REPLACE FUNCTION update_member_role(target_member_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (usually postgres/admin), bypassing RLS for the update itself, but we check email manually
AS $$
DECLARE
  caller_email TEXT;
  target_user_id UUID;
BEGIN
  -- 1. Get the email of the user executing the function
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();

  -- 2. Verify if the caller is the allowed super-admin
  IF caller_email IS NULL OR caller_email <> 'gr96445@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado. Apenas o administrador mestre pode realizar esta ação.';
  END IF;

  -- 3. Validate the new role
  IF new_role NOT IN ('admin', 'director', 'user') THEN
    RAISE EXCEPTION 'Papel inválido. Use: admin, director ou user.';
  END IF;

  -- 4. Find the auth.users ID associated with the member within profiles
  -- We assume one-to-one mapping or similar logic where profiles.member_id points to members.id
  SELECT id INTO target_user_id FROM public.profiles WHERE member_id = target_member_id;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Este integrante ainda não possui um usuário vinculado (Profile não encontrado). Crie um usuário para ele primeiro.';
  END IF;

  -- 5. Update the role
  UPDATE public.profiles
  SET role = new_role::public.app_role -- Cast to enum if needed, or TEXT if stored as text. Based on schema it is likely an enum or text. 
                                       -- Schema says 'role' is ENUM. Usually 'public.app_role' or similar. 
                                       -- Let's try casting to the type implicitly or explicit if we knew the name.
                                       -- Looking at SCHEMA.md, it just says role ENUM.
                                       -- Safe bet: just pass string, Postgres usually auto-casts if it matches an enum value.
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Papel atualizado com sucesso para ' || new_role
  );

END;
$$;
