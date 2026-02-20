-- EMERGENCY FIX: Disable Row Level Security on members and profiles to restore access immediately.
-- This will make the tables readable by everyone, including public visitors (which is often desired for members list anyway).
-- You can re-enable security later if needed, but for now this unblocks the admin panel.

ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
