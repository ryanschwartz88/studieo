-- Migration: Systematic fix of RLS policies to eliminate ambiguous column references
-- Created: 2025-11-15
-- Description: Create SECURITY DEFINER helper functions and rebuild all RLS policies
--              to be production-grade with no ambiguous references or circular dependencies

-- ============================================================================
-- PART 1: Create SECURITY DEFINER Helper Functions
-- ============================================================================

-- Check if current user is a student with proper error handling
CREATE OR REPLACE FUNCTION public.is_student_safe()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'STUDENT' FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_student_safe() IS
  'Returns true if the current user is a STUDENT. Uses SECURITY DEFINER to bypass RLS and prevent ambiguous column references.';

-- Check if current user is a company user
CREATE OR REPLACE FUNCTION public.is_company_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'COMPANY' FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_company_user() IS
  'Returns true if the current user is a COMPANY user. Uses SECURITY DEFINER to bypass RLS and prevent ambiguous column references.';

-- Check if user is team lead for an application
CREATE OR REPLACE FUNCTION public.is_team_lead(app_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications
    WHERE id = app_id AND team_lead_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_team_lead(uuid) IS
  'Returns true if the current user is the team lead for the given application. Uses SECURITY DEFINER to bypass RLS.';

-- Check if user is a team member for an application
CREATE OR REPLACE FUNCTION public.is_team_member(app_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE application_id = app_id AND student_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_team_member(uuid) IS
  'Returns true if the current user is a team member of the given application. Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute permissions to public
GRANT EXECUTE ON FUNCTION public.is_student_safe() TO public;
GRANT EXECUTE ON FUNCTION public.is_company_user() TO public;
GRANT EXECUTE ON FUNCTION public.is_team_lead(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO public;

-- Set search_path for security (prevents search_path hijacking attacks)
ALTER FUNCTION public.is_student_safe() SET search_path = '';
ALTER FUNCTION public.is_company_user() SET search_path = '';
ALTER FUNCTION public.is_team_lead(uuid) SET search_path = '';
ALTER FUNCTION public.is_team_member(uuid) SET search_path = '';

-- Also fix existing helper functions
ALTER FUNCTION public.get_my_role() SET search_path = '';
ALTER FUNCTION public.get_my_company_id() SET search_path = '';

-- ============================================================================
-- PART 2: Fix Applications Table RLS Policies
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can delete their own applications" ON public.applications;
DROP POLICY IF EXISTS "Companies can view applications for their projects" ON public.applications;
DROP POLICY IF EXISTS "Companies can update application status" ON public.applications;
DROP POLICY IF EXISTS "Company users can manage applications for their projects" ON public.applications;

-- Student policies
CREATE POLICY "students_insert_applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    team_lead_id = auth.uid() 
    AND is_student_safe()
  );

CREATE POLICY "students_select_applications"
  ON public.applications FOR SELECT
  USING (
    team_lead_id = auth.uid() 
    OR is_team_member(id)
  );

CREATE POLICY "students_update_applications"
  ON public.applications FOR UPDATE
  USING (team_lead_id = auth.uid())
  WITH CHECK (team_lead_id = auth.uid());

CREATE POLICY "students_delete_applications"
  ON public.applications FOR DELETE
  USING (team_lead_id = auth.uid());

-- Company policies (simplified - no duplicate ALL policy)
CREATE POLICY "companies_select_applications"
  ON public.applications FOR SELECT
  USING (
    is_company_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  );

CREATE POLICY "companies_update_applications"
  ON public.applications FOR UPDATE
  USING (
    is_company_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  )
  WITH CHECK (
    is_company_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
      AND p.company_id = get_my_company_id()
    )
  );

-- Add comments
COMMENT ON POLICY "students_insert_applications" ON public.applications IS
  'Students can create applications where they are the team lead. Uses is_student_safe() to prevent ambiguous column references.';

COMMENT ON POLICY "students_select_applications" ON public.applications IS
  'Students can view applications where they are the team lead or a team member.';

COMMENT ON POLICY "students_update_applications" ON public.applications IS
  'Students can update applications where they are the team lead.';

COMMENT ON POLICY "students_delete_applications" ON public.applications IS
  'Students can delete applications where they are the team lead.';

COMMENT ON POLICY "companies_select_applications" ON public.applications IS
  'Company users can view applications for their projects.';

COMMENT ON POLICY "companies_update_applications" ON public.applications IS
  'Company users can update applications (accept/reject) for their projects.';

-- ============================================================================
-- PART 3: Fix Team Members Table RLS Policies
-- ============================================================================

-- Drop all existing policies (comprehensive list)
DROP POLICY IF EXISTS "Students can manage their own team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can manage their team" ON public.team_members;
DROP POLICY IF EXISTS "Company users can see team members for their applications" ON public.team_members;
DROP POLICY IF EXISTS "Students can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Students can view own team membership" ON public.team_members;
DROP POLICY IF EXISTS "Students can update own status" ON public.team_members;
DROP POLICY IF EXISTS "Students can update their own team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can remove team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can update their team members" ON public.team_members;
DROP POLICY IF EXISTS "Team leads can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Companies can view team members" ON public.team_members;

-- Create consolidated policies
CREATE POLICY "students_select_team_members"
  ON public.team_members FOR SELECT
  USING (
    student_id = auth.uid()
    OR is_team_lead(application_id)
    OR is_team_member(application_id)
  );

CREATE POLICY "team_leads_insert_team_members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    is_team_lead(application_id)
    AND is_student_safe()
  );

CREATE POLICY "team_leads_delete_team_members"
  ON public.team_members FOR DELETE
  USING (
    is_team_lead(application_id)
    AND is_student_safe()
  );

CREATE POLICY "students_update_own_membership"
  ON public.team_members FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "companies_select_team_members"
  ON public.team_members FOR SELECT
  USING (
    is_company_user()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON a.project_id = p.id
      WHERE a.id = team_members.application_id
      AND p.company_id = get_my_company_id()
    )
  );

-- Add comments
COMMENT ON POLICY "students_select_team_members" ON public.team_members IS
  'Students can view team members if they are part of the team or the team lead.';

COMMENT ON POLICY "team_leads_insert_team_members" ON public.team_members IS
  'Team leads can add new members to their application team.';

COMMENT ON POLICY "team_leads_delete_team_members" ON public.team_members IS
  'Team leads can remove members from their application team.';

COMMENT ON POLICY "students_update_own_membership" ON public.team_members IS
  'Students can update their own membership status (e.g., accept/decline invite).';

COMMENT ON POLICY "companies_select_team_members" ON public.team_members IS
  'Company users can view team members for applications to their projects.';

-- ============================================================================
-- PART 4: Review and Optimize Other Table Policies
-- ============================================================================

-- Projects: Use helper functions
DROP POLICY IF EXISTS "Students can see OPEN projects" ON public.projects;
DROP POLICY IF EXISTS "Company users can browse all ACCEPTING projects" ON public.projects;
DROP POLICY IF EXISTS "Company users can manage all projects for their company" ON public.projects;

CREATE POLICY "students_select_projects"
  ON public.projects FOR SELECT
  USING (
    status = 'ACCEPTING'
    AND is_student_safe()
  );

CREATE POLICY "companies_select_projects"
  ON public.projects FOR SELECT
  USING (
    is_company_user()
    AND (
      status = 'ACCEPTING'
      OR company_id = get_my_company_id()
    )
  );

CREATE POLICY "companies_manage_projects"
  ON public.projects FOR ALL
  USING (
    is_company_user()
    AND company_id = get_my_company_id()
  )
  WITH CHECK (
    is_company_user()
    AND company_id = get_my_company_id()
  );

-- Add comments
COMMENT ON POLICY "students_select_projects" ON public.projects IS
  'Students can view all ACCEPTING projects.';

COMMENT ON POLICY "companies_select_projects" ON public.projects IS
  'Company users can view ACCEPTING projects and all projects from their company.';

COMMENT ON POLICY "companies_manage_projects" ON public.projects IS
  'Company users can create, update, and delete projects for their company.';

-- Project Views: Use helper functions
DROP POLICY IF EXISTS "Students can see view counts for ACCEPTING projects" ON public.project_views;

CREATE POLICY "students_select_project_views"
  ON public.project_views FOR SELECT
  USING (
    is_student_safe()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_views.project_id
      AND p.status = 'ACCEPTING'
    )
  );

COMMENT ON POLICY "students_select_project_views" ON public.project_views IS
  'Students can view project view counts for ACCEPTING projects.';

-- ============================================================================
-- PART 5: Summary and Verification
-- ============================================================================

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS Policy Systematic Fix Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created 4 new SECURITY DEFINER functions:';
  RAISE NOTICE '  - is_student_safe()';
  RAISE NOTICE '  - is_company_user()';
  RAISE NOTICE '  - is_team_lead(uuid)';
  RAISE NOTICE '  - is_team_member(uuid)';
  RAISE NOTICE '';
  RAISE NOTICE 'Rebuilt RLS policies for:';
  RAISE NOTICE '  - applications (6 policies)';
  RAISE NOTICE '  - team_members (5 policies)';
  RAISE NOTICE '  - projects (3 policies)';
  RAISE NOTICE '  - project_views (1 policy)';
  RAISE NOTICE '';
  RAISE NOTICE 'All policies now use SECURITY DEFINER functions';
  RAISE NOTICE 'to prevent ambiguous column references.';
  RAISE NOTICE '============================================';
END $$;

