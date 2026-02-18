-- Migration: Add 'director' role to user_role enum
-- Description: Adds a new role 'director' that has admin access but no financial access.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'director';
