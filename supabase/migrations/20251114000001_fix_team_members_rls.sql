-- Migration: Fix team_members RLS policies and add missing helper function
-- Created: 2025-11-14
-- Description: Create can_access_application function and proper team_members policies

-- ============================================================================
-- PART 1: Create the missing can_access_application helper function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_application(app_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = app_id
    AND (
      a.team_lead_id = auth.uid() OR
      EXISTS (
        SELECT 1
        FROM public.team_members tm
        WHERE tm.application_id = a.id AND tm.student_id = auth.uid()
      )
    )
  );
END;
$$;

COMMENT ON FUNCTION public.can_access_application(uuid) IS 
  'Returns true if the current user is the team lead or a team member of the application. Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute to public
GRANT EXECUTE ON FUNCTION public.can_access_application(uuid) TO public;

-- ============================================================================
-- PART 2: Drop existing team_members policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Students can manage their own team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can manage their team" ON public.team_members;
DROP POLICY IF EXISTS "Company users can see team members for their applications" ON public.team_members;
DROP POLICY IF EXISTS "Students can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can manage team members" ON public.team_members;

-- ============================================================================
-- PART 3: Create proper team_members RLS policies
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Students can view team members for applications they're part of
CREATE POLICY "Students can view team members"
ON public.team_members
FOR SELECT
TO public
USING (
  student_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = public.team_members.application_id
    AND a.team_lead_id = auth.uid()
  )
);

-- Team leads can insert/update/delete team members for their applications
CREATE POLICY "Team leads can manage team members"
ON public.team_members
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = public.team_members.application_id
    AND a.team_lead_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = public.team_members.application_id
    AND a.team_lead_id = auth.uid()
  )
);

-- Students can update their own team membership status
CREATE POLICY "Students can update their own membership status"
ON public.team_members
FOR UPDATE
TO public
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Company users can view team members for their projects' applications
CREATE POLICY "Companies can view applicant team members"
ON public.team_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.projects p ON a.project_id = p.id
    WHERE a.id = public.team_members.application_id
    AND p.company_id = public.get_my_company_id()
    AND public.get_my_role() = 'COMPANY'
  )
);

-- ============================================================================
-- PART 4: Add comments
-- ============================================================================

COMMENT ON POLICY "Students can view team members" ON public.team_members IS 
  'Students can view team members if they are part of the team or are the team lead';

COMMENT ON POLICY "Team leads can manage team members" ON public.team_members IS 
  'Team leads can add, update, or remove team members for their applications';

COMMENT ON POLICY "Students can update their own membership status" ON public.team_members IS 
  'Students can update their own invite status (accept/decline)';

COMMENT ON POLICY "Companies can view applicant team members" ON public.team_members IS 
  'Company users can view team members for applications to their projects';


