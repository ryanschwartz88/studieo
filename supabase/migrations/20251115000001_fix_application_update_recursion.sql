-- Migration: Fix infinite recursion in applications UPDATE policies
-- Created: 2025-11-15
-- Description: Remove conflicting UPDATE policies that check team_members (causes recursion)
--              Keep only the simple team_lead_id check for updates

-- ============================================================================
-- Drop conflicting UPDATE policies
-- ============================================================================

-- This policy causes recursion because it checks team_members table
-- which doesn't have rows yet when updating design_doc_url
DROP POLICY IF EXISTS "Students can update applications where they are team members" ON public.applications;

-- This is a duplicate of the simpler policy below
DROP POLICY IF EXISTS "Team leads can create applications" ON public.applications;

-- ============================================================================
-- Keep only the simple, non-recursive policies
-- ============================================================================

-- This policy is good - simple check, no recursion
-- "Students can update their own applications" - already exists

-- Ensure we have the right INSERT policy
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;
CREATE POLICY "Students can create applications"
  ON public.applications
  FOR INSERT
  TO public
  WITH CHECK (
    team_lead_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'STUDENT'::user_role
    )
  );

-- ============================================================================
-- Clean up SELECT policies to avoid recursion
-- ============================================================================

-- Drop the one that checks team_members (can cause recursion)
DROP POLICY IF EXISTS "Students can view applications where they are team members" ON public.applications;

-- Keep the simple one that uses a subquery (this is fine)
-- "Students can view their own applications" - already exists

-- ============================================================================
-- Clean up DELETE policies
-- ============================================================================

-- Drop the complex one
DROP POLICY IF EXISTS "Team members can delete applications where they are members" ON public.applications;

-- Keep the simple one
-- "Students can delete their own applications" - already exists

-- ============================================================================
-- Verify company policies don't cause issues
-- ============================================================================

-- Check if company_can_access_application function exists and might cause recursion
DROP POLICY IF EXISTS "Companies can update application status" ON public.applications;
DROP POLICY IF EXISTS "Companies can view applications for their projects" ON public.applications;

-- Recreate company policies without helper function to avoid recursion
CREATE POLICY "Companies can view applications for their projects"
  ON public.applications
  FOR SELECT
  TO public
  USING (
    get_my_role() = 'COMPANY'::user_role
    AND EXISTS (
      SELECT 1 
      FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "Companies can update application status"
  ON public.applications
  FOR UPDATE
  TO public
  USING (
    get_my_role() = 'COMPANY'::user_role
    AND EXISTS (
      SELECT 1 
      FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'COMPANY'::user_role
    AND EXISTS (
      SELECT 1 
      FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can create applications" ON public.applications IS
  'Students can create applications where they are the team lead. Simple role check to avoid recursion.';

COMMENT ON POLICY "Companies can view applications for their projects" ON public.applications IS
  'Company users can view applications for their projects. No helper function to avoid recursion.';

COMMENT ON POLICY "Companies can update application status" ON public.applications IS
  'Company users can update applications for their projects (accept/reject). No helper function to avoid recursion.';

