-- Re-create the foreign key relationship explicitly to ensure Supabase/PostgREST detects it.
-- This fixes the "Could not find a relationship" error.

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_member_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES members(id)
ON DELETE SET NULL;

-- Force schema cache reload (usually automatic, but making a comment helps)
COMMENT ON CONSTRAINT profiles_member_id_fkey ON profiles IS 'Links a profile (auth user) to a member profile';
