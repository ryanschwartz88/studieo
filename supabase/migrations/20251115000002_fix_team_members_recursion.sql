-- Migration: Fix infinite recursion in team_members policies
-- Created: 2025-11-15
-- Description: Remove the recursive policy that checks team_members within team_members

-- ============================================================================
-- Drop the recursive policy
-- ============================================================================

-- This policy has team_members checking team_members - causes recursion
DROP POLICY IF EXISTS "Students can view team members for their applications" ON public.team_members;

-- ============================================================================
-- Keep the simple, non-recursive SELECT policies
-- ============================================================================

-- These are fine - no recursion:
-- "Students can view own team membership" - just checks student_id = auth.uid()
-- "Team leads can view their team members" - subquery to applications only
-- "Companies can view team members" - subquery to applications/projects only

-- ============================================================================
-- Ensure we don't have duplicate policies
-- ============================================================================

-- Remove duplicate company policy
DROP POLICY IF EXISTS "Company users can view team members for their project applicati" ON public.team_members;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Team leads can view their team members" ON public.team_members IS
  'Team leads can view members of applications they created. Simple subquery to applications, no recursion.';

COMMENT ON POLICY "Students can view own team membership" ON public.team_members IS
  'Students can always view their own membership records. No recursion.';

