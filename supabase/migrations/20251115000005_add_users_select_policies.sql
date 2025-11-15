-- Migration: Add SELECT policies for users table
-- Created: 2025-11-15
-- Description: Allow users to see team members and applicants (currently blocked by RLS)

-- ============================================================================
-- Add SELECT policies for users table
-- ============================================================================

-- Students can view other students who are on the same application team
CREATE POLICY "Students can view team members on shared applications"
  ON public.users
  FOR SELECT
  TO public
  USING (
    role = 'STUDENT'::user_role
    AND id IN (
      -- Can see users who are team members on applications you're part of
      SELECT tm.student_id
      FROM public.team_members tm
      WHERE tm.application_id IN (
        SELECT application_id 
        FROM public.team_members 
        WHERE student_id = auth.uid()
      )
    )
  );

-- Companies can view students who applied to their projects
CREATE POLICY "Companies can view applicants to their projects"
  ON public.users
  FOR SELECT
  TO public
  USING (
    role = 'STUDENT'::user_role
    AND id IN (
      -- Can see team leads who applied
      SELECT a.team_lead_id
      FROM public.applications a
      JOIN public.projects p ON a.project_id = p.id
      WHERE p.company_id = get_my_company_id()
      
      UNION
      
      -- Can see team members on applications
      SELECT tm.student_id
      FROM public.team_members tm
      JOIN public.applications a ON tm.application_id = a.id
      JOIN public.projects p ON a.project_id = p.id
      WHERE p.company_id = get_my_company_id()
    )
  );

-- Allow users to see other company users in the same company
CREATE POLICY "Company users can view other users in their company"
  ON public.users
  FOR SELECT
  TO public
  USING (
    role = 'COMPANY'::user_role
    AND company_id = get_my_company_id()
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can view team members on shared applications" ON public.users IS
  'Students can view other students who are team members on applications they are part of.';

COMMENT ON POLICY "Companies can view applicants to their projects" ON public.users IS
  'Company users can view student profiles for applicants (leads and members) to their projects.';

COMMENT ON POLICY "Company users can view other users in their company" ON public.users IS
  'Company users can see other users in their company for collaboration.';

