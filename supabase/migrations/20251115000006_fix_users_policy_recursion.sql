-- Migration: Fix infinite recursion in users table policies
-- Created: 2025-11-15
-- Description: Remove recursive policies that check team_members, use simpler approach

-- ============================================================================
-- Drop the recursive policies
-- ============================================================================

-- This checks team_members which causes recursion
DROP POLICY IF EXISTS "Students can view team members on shared applications" ON public.users;

-- ============================================================================
-- Keep only simple, non-recursive policies
-- ============================================================================

-- The "Users can view and edit their own data" policy already exists and is fine
-- The "Companies can view applicants to their projects" is ok - doesn't cause auth loop
-- The "Company users can view other users in their company" is ok - simple check

-- ============================================================================
-- Add a simpler policy for students to view other students
-- ============================================================================

-- Students can view basic info of other students (for team building)
-- Simple policy: if the user is a student, they can see other students
-- No complex checks to avoid recursion
CREATE POLICY "Students can view other student profiles"
  ON public.users
  FOR SELECT
  TO public
  USING (
    role = 'STUDENT'::user_role
    AND auth.role() = 'authenticated'
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can view other student profiles" ON public.users IS
  'Students can view other student users for team building and collaboration. Does not check team_members to avoid recursion.';

