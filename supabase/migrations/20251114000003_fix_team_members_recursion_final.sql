-- Migration: Final fix for team_members RLS recursion
-- Created: 2025-11-14
-- Description: Use SECURITY DEFINER helper function to get user's application IDs

-- ============================================================================
-- PART 1: Create helper function to get user's application IDs
-- ============================================================================

-- This function bypasses RLS to get all application IDs the user is involved in
CREATE OR REPLACE FUNCTION public.get_my_application_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Return application IDs where user is team lead
  RETURN QUERY
  SELECT id FROM public.applications WHERE team_lead_id = auth.uid();
  
  -- Return application IDs where user is a team member
  RETURN QUERY
  SELECT application_id FROM public.team_members WHERE student_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.get_my_application_ids() IS 
  'Returns all application IDs the current user is involved in (as lead or member). Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute to public
GRANT EXECUTE ON FUNCTION public.get_my_application_ids() TO public;

-- ============================================================================
-- PART 2: Update team_members policies to use the helper function
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can update own membership" ON public.team_members;
DROP POLICY IF EXISTS "Companies can view team members" ON public.team_members;

-- Students can view team members for applications they're involved in
CREATE POLICY "Students can view team members"
ON public.team_members
FOR SELECT
TO public
USING (
  application_id IN (SELECT * FROM public.get_my_application_ids())
);

-- Team leads can manage team members (INSERT, UPDATE, DELETE)
CREATE POLICY "Team leads can manage team members"
ON public.team_members
FOR ALL
TO public
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE team_lead_id = auth.uid()
  )
)
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE team_lead_id = auth.uid()
  )
);

-- Students can update their own membership status
CREATE POLICY "Students can update own membership"
ON public.team_members
FOR UPDATE
TO public
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Company users can view team members for their projects' applications
CREATE POLICY "Companies can view team members"
ON public.team_members
FOR SELECT
TO public
USING (
  application_id IN (
    SELECT a.id 
    FROM public.applications a
    JOIN public.projects p ON a.project_id = p.id
    WHERE p.company_id = public.get_my_company_id()
  )
);

-- ============================================================================
-- PART 3: Update comments
-- ============================================================================

COMMENT ON POLICY "Students can view team members" ON public.team_members IS 
  'Students can view team members for all applications they are involved in (as lead or member)';

COMMENT ON POLICY "Team leads can manage team members" ON public.team_members IS 
  'Team leads can add, update, or remove team members for their applications';

COMMENT ON POLICY "Students can update own membership" ON public.team_members IS 
  'Students can update their own invite status (accept/decline)';

COMMENT ON POLICY "Companies can view team members" ON public.team_members IS 
  'Company users can view team members for applications to their projects';


