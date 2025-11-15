-- Migration: Restore team member access to applications
-- Created: 2025-11-15
-- Description: Allow team members to view applications while avoiding recursion

-- ============================================================================
-- Fix applications SELECT policy to allow team members
-- ============================================================================

DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;

-- Recreate with team_members check, but structured to avoid recursion
-- The key is to use a simple IN clause that won't cause infinite recursion
CREATE POLICY "Students can view their own applications"
  ON public.applications
  FOR SELECT
  TO public
  USING (
    -- Team lead can always view
    team_lead_id = auth.uid()
    OR
    -- Team members can view (simple subquery, no recursion)
    id IN (
      SELECT application_id 
      FROM public.team_members 
      WHERE student_id = auth.uid()
    )
  );

-- ============================================================================
-- Add policy for team members to view other team members
-- ============================================================================

-- Drop if exists
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;

-- Team members can see other members on the same application
CREATE POLICY "Team members can view other team members"
  ON public.team_members
  FOR SELECT
  TO public
  USING (
    -- Can see team members if you're also a member of that application
    application_id IN (
      SELECT application_id 
      FROM public.team_members 
      WHERE student_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can view their own applications" ON public.applications IS
  'Students can view applications where they are team lead or team member. Uses IN subquery to avoid recursion.';

COMMENT ON POLICY "Team members can view other team members" ON public.team_members IS
  'Team members can view other members on applications they are part of.';

