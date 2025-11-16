-- Migration: Auto decide OPEN project applications based on capacity
-- Created: 2025-11-15
-- Description: Adds SECURITY DEFINER function to automatically accept or reject OPEN applications after submission

CREATE OR REPLACE FUNCTION public.auto_decide_open_application(p_application_id uuid)
RETURNS public.application_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_application RECORD;
  v_project RECORD;
  v_accepted_count int;
  v_decision public.application_status;
BEGIN
  -- Lock the application row to prevent concurrent updates
  SELECT a.id, a.project_id, a.status
  INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application % not found', p_application_id;
  END IF;

  -- Fetch and lock the related project
  SELECT p.access_type, p.max_teams
  INTO v_project
  FROM public.projects p
  WHERE p.id = v_application.project_id
  FOR UPDATE;

  -- Only process OPEN projects that are currently SUBMITTED
  IF v_project.access_type <> 'OPEN'::public.project_access_type THEN
    RETURN v_application.status;
  END IF;

  IF v_application.status <> 'SUBMITTED'::public.application_status THEN
    RETURN v_application.status;
  END IF;

  -- Unlimited teams -> always accept
  IF v_project.max_teams IS NULL THEN
    UPDATE public.applications
    SET status = 'ACCEPTED',
        updated_at = NOW()
    WHERE id = v_application.id;
    RETURN 'ACCEPTED';
  END IF;

  -- Count currently accepted teams for this project
  SELECT COUNT(*)
  INTO v_accepted_count
  FROM public.applications
  WHERE project_id = v_application.project_id
    AND status = 'ACCEPTED';

  IF v_accepted_count < v_project.max_teams THEN
    UPDATE public.applications
    SET status = 'ACCEPTED',
        updated_at = NOW()
    WHERE id = v_application.id;
    v_decision := 'ACCEPTED';
  ELSE
    UPDATE public.applications
    SET status = 'REJECTED',
        updated_at = NOW()
    WHERE id = v_application.id;
    v_decision := 'REJECTED';
  END IF;

  RETURN v_decision;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_decide_open_application(uuid) TO authenticated;

