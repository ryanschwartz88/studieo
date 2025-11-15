-- Migration: Fix infinite recursion in applications SELECT policy
-- Created: 2025-11-15
-- Description: Simplify SELECT policy to not check team_members during INSERT RETURNING

-- ============================================================================
-- Fix the SELECT policy that causes recursion
-- ============================================================================

-- This policy checks team_members, which causes recursion when PostgREST 
-- tries to return the inserted application row
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;

-- Create a simpler policy that only checks team_lead_id for students
-- Team members will be able to see applications through a separate mechanism
CREATE POLICY "Students can view their own applications"
  ON public.applications
  FOR SELECT
  TO public
  USING (
    team_lead_id = auth.uid()
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can view their own applications" ON public.applications IS
  'Students can view applications where they are the team lead. Simplified to avoid recursion during INSERT RETURNING.';

