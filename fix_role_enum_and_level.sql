-- Fix 1: Change 'role' column type to text to avoid enum mismatches
-- First, drop any default value that might depend on the enum
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Alter the column type to TEXT
ALTER TABLE profiles ALTER COLUMN role TYPE text;

-- Add a check constraint to ensure only valid roles are used
ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'director', 'user'));

-- Set default back to 'user'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Drop the old type if it exists (it might be named 'app_role' or similar)
DROP TYPE IF EXISTS public.app_role;

-- Fix 2: Ensure members level can be updated
-- Grant update permission on 'level' column explicitly or ensure RLS covers it.
-- (We already did comprehensive RLS value for members table, but let's be double sure).

-- Re-apply 'admin' and 'director' full access to members
DROP POLICY IF EXISTS "Enable update for admins and directors" ON members;
CREATE POLICY "Enable update for admins and directors" ON members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);
