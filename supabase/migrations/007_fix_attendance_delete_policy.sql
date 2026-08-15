-- Fix attendance RLS policies for OAuth users and missing update policy

-- Create get_member_id() with email fallback for OAuth users
-- (users who logged in via Google etc. may not have profiles.member_id set yet)
CREATE OR REPLACE FUNCTION get_member_id()
RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- First try direct profile link
  SELECT member_id INTO v_member_id FROM profiles WHERE id = auth.uid();
  IF v_member_id IS NOT NULL THEN
    RETURN v_member_id;
  END IF;
  -- Fallback: match by email (for OAuth users without profile.member_id set)
  SELECT m.id INTO v_member_id
  FROM members m
  JOIN auth.users u ON u.email = m.email
  WHERE u.id = auth.uid();
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix DELETE policy: old one used inline subquery returning NULL for OAuth users,
-- causing member_id = NULL (always FALSE) which silently blocked unconfirm.
DROP POLICY IF EXISTS "Users can delete own attendance" ON racha_attendance;
CREATE POLICY "Users can delete own attendance"
  ON racha_attendance FOR DELETE
  TO authenticated
  USING (member_id = get_member_id());

-- Add missing UPDATE policy (previously no policy existed, blocking status changes)
DROP POLICY IF EXISTS "Users can update own attendance" ON racha_attendance;
CREATE POLICY "Users can update own attendance"
  ON racha_attendance FOR UPDATE
  TO authenticated
  USING (member_id = get_member_id());

-- Include 'director' role in is_admin() to match frontend behavior
-- (app checks role IN ('admin', 'director') but DB function only checked 'admin')
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
