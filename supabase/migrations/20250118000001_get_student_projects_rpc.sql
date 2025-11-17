-- Migration: Create RPC function to get student projects
-- Created: 2025-01-18
-- Description: Create SECURITY DEFINER function to fetch projects for any student's profile.
--              This bypasses RLS to allow viewing other students' active projects.

-- ============================================================================
-- RPC: get_student_projects
-- Purpose: Allow authenticated users to fetch projects for any student's profile
-- RLS note: SECURITY DEFINER is used to bypass RLS for read-only, limited fields
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_student_projects(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  company_name text,
  company_logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Get projects where student is team lead
  SELECT DISTINCT
    p.id,
    p.title,
    p.status::text,
    p.start_date,
    p.end_date,
    c.name AS company_name,
    c.logo_url AS company_logo_url
  FROM public.applications a
  INNER JOIN public.projects p ON a.project_id = p.id
  LEFT JOIN public.companies c ON p.company_id = c.id
  WHERE a.team_lead_id = p_user_id
    AND a.status = 'ACCEPTED'
  
  UNION
  
  -- Get projects where student is team member
  SELECT DISTINCT
    p.id,
    p.title,
    p.status::text,
    p.start_date,
    p.end_date,
    c.name AS company_name,
    c.logo_url AS company_logo_url
  FROM public.team_members tm
  INNER JOIN public.applications a ON tm.application_id = a.id
  INNER JOIN public.projects p ON a.project_id = p.id
  LEFT JOIN public.companies c ON p.company_id = c.id
  WHERE tm.student_id = p_user_id
    AND tm.invite_status = 'ACCEPTED'
    AND a.status = 'ACCEPTED'
  
  ORDER BY start_date DESC NULLS LAST, title;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.get_student_projects(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_projects(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_student_projects(uuid) IS
  'Returns projects where the specified student has accepted applications (as team lead or member). Uses SECURITY DEFINER to bypass RLS for viewing other students'' profiles.';

