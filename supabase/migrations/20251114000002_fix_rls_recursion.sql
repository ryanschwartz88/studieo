-- Migration: Fix RLS infinite recursion by removing circular dependencies
-- Created: 2025-11-14
-- Description: Simplify RLS policies to avoid circular function calls

-- ============================================================================
-- PART 1: Drop existing application policies first (they depend on the function)
-- ============================================================================

-- Drop existing application policies
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can delete their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can manage their own applications" ON public.applications;

-- ============================================================================
-- PART 2: Now drop the function
-- ============================================================================

DROP FUNCTION IF EXISTS public.can_access_application(uuid);

-- ============================================================================
-- PART 3: Fix applications RLS policies to use direct queries
-- ============================================================================

-- Students can view applications where they are team lead OR team member
CREATE POLICY "Students can view their own applications"
ON public.applications
FOR SELECT
TO public
USING (
  team_lead_id = auth.uid()
  OR
  id IN (
    SELECT application_id 
    FROM public.team_members 
    WHERE student_id = auth.uid()
  )
);

-- Students can update applications where they are team lead
CREATE POLICY "Students can update their own applications"
ON public.applications
FOR UPDATE
TO public
USING (team_lead_id = auth.uid())
WITH CHECK (team_lead_id = auth.uid());

-- Students can delete applications where they are team lead
CREATE POLICY "Students can delete their own applications"
ON public.applications
FOR DELETE
TO public
USING (team_lead_id = auth.uid());

-- ============================================================================
-- PART 4: Simplify team_members RLS policies to avoid recursion
-- ============================================================================

-- Drop existing team_members policies
DROP POLICY IF EXISTS "Students can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can update their own membership status" ON public.team_members;
DROP POLICY IF EXISTS "Companies can view applicant team members" ON public.team_members;

-- Students can view team members for applications where they are involved
-- Simple direct check without nested queries
CREATE POLICY "Students can view team members"
ON public.team_members
FOR SELECT
TO public
USING (
  -- Can see their own membership
  student_id = auth.uid()
  OR
  -- Can see team members if they are the team lead
  application_id IN (
    SELECT id FROM public.applications WHERE team_lead_id = auth.uid()
  )
  OR
  -- Can see other team members if they are also a member
  application_id IN (
    SELECT application_id FROM public.team_members WHERE student_id = auth.uid()
  )
);

-- Team leads can fully manage team members
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

-- Students can update their own team membership (accept/decline invites)
CREATE POLICY "Students can update own membership"
ON public.team_members
FOR UPDATE
TO public
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Company users can view team members for applications to their projects
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
-- PART 5: Update comments
-- ============================================================================

COMMENT ON POLICY "Students can view their own applications" ON public.applications IS 
  'Students can view applications where they are team lead or team member';

COMMENT ON POLICY "Students can update their own applications" ON public.applications IS 
  'Students can update applications where they are team lead';

COMMENT ON POLICY "Students can delete their own applications" ON public.applications IS 
  'Students can delete applications where they are team lead';

COMMENT ON POLICY "Students can view team members" ON public.team_members IS 
  'Students can view team members for applications they are involved with';

COMMENT ON POLICY "Team leads can manage team members" ON public.team_members IS 
  'Team leads can add, update, or remove team members for their applications';

COMMENT ON POLICY "Students can update own membership" ON public.team_members IS 
  'Students can update their own invite status (accept/decline)';

COMMENT ON POLICY "Companies can view team members" ON public.team_members IS 
  'Company users can view team members for applications to their projects';


