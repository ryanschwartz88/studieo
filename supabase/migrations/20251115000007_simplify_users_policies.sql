-- Migration: Simplify users table policies to prevent auth loops
-- Created: 2025-11-15
-- Description: Ensure users can ALWAYS see themselves, simplify other policies

-- ============================================================================
-- Drop ALL existing policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view and edit their own data" ON public.users;
DROP POLICY IF EXISTS "Companies can view applicants to their projects" ON public.users;
DROP POLICY IF EXISTS "Company users can view other users in their company" ON public.users;
DROP POLICY IF EXISTS "Students can view other student profiles" ON public.users;

-- ============================================================================
-- Create simple, non-recursive policies
-- ============================================================================

-- 1. Users can ALWAYS view and edit their own data (HIGHEST PRIORITY)
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  TO public
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Authenticated users can view basic info of other users (for team building)
-- This is permissive but safe - sensitive data is in student_profiles/companies tables
CREATE POLICY "Authenticated users can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Users can view their own data" ON public.users IS
  'Users can always view their own user record. Critical for auth flow.';

COMMENT ON POLICY "Users can update their own data" ON public.users IS
  'Users can update their own user record. Critical for profile updates.';

COMMENT ON POLICY "Authenticated users can view all users" ON public.users IS
  'All authenticated users can view basic user info (name, email, role). Sensitive data is protected in other tables.';

