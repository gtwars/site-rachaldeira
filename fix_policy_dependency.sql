-- EMERGENCY FIX: RLS policies often block column type changes because they depend on the column.
-- We must DROP all policies that depend on 'profiles.role', alter the column, and then RE-CREATE them.

-- 1. DROP DEPENDENT POLICIES (Check all tables that likely use role check)
DROP POLICY IF EXISTS "Enable access for admins and directors" ON rachas;
DROP POLICY IF EXISTS "Enable insert for admins and directors" ON members;
DROP POLICY IF EXISTS "Enable update for admins and directors" ON members;
DROP POLICY IF EXISTS "Enable delete for admins and directors" ON members;
DROP POLICY IF EXISTS "Enable insert for admins only" ON teams;
DROP POLICY IF EXISTS "Enable update for admins only" ON teams;
DROP POLICY IF EXISTS "Enable delete for admins only" ON teams;
-- Add any other policies that check 'role' here if known

-- 2. ALTER THE COLUMN safely now that policies are gone
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role TYPE text USING role::text; -- convert to text
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_roles;
ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'director', 'user'));
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- 3. RE-CREATE POLICIES (using the new text column)

-- Rachas Policy
CREATE POLICY "Enable access for admins and directors" ON rachas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- Members Policies
CREATE POLICY "Enable insert for admins and directors" ON members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

CREATE POLICY "Enable update for admins and directors" ON members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

CREATE POLICY "Enable delete for admins and directors" ON members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'director')
  )
);

-- Teams Policies
CREATE POLICY "Enable insert for admins only" ON teams
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for admins only" ON teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable delete for admins only" ON teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
