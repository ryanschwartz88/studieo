-- Migration: Auto submit applications when all members confirm
-- Created: 2025-11-15
-- Description: Adds SECURITY DEFINER function auto_submit_application and grants execution to authenticated users

CREATE OR REPLACE FUNCTION public.auto_submit_application(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_application RECORD;
  v_all_confirmed boolean;
BEGIN
  SELECT a.id, a.status
  INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application % not found', p_application_id;
  END IF;

  -- Ensure caller is part of the application (team lead or member)
  IF NOT (public.is_team_lead(p_application_id) OR public.is_team_member(p_application_id)) THEN
    RAISE EXCEPTION 'Access denied for application %', p_application_id;
  END IF;

  -- Only submit if still pending
  IF v_application.status = 'PENDING' THEN
    -- Check if all team members have confirmed
    SELECT bool_and(invite_status = 'ACCEPTED')
    INTO v_all_confirmed
    FROM public.team_members
    WHERE application_id = p_application_id;

    IF v_all_confirmed THEN
      UPDATE public.applications
      SET status = 'SUBMITTED',
          submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = p_application_id;
      RETURN TRUE;
    ELSE
      -- Not all confirmed, do not submit yet
      RETURN FALSE;
    END IF;
  END IF;

  RETURN FALSE; -- Application not pending or already submitted
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_submit_application(uuid) TO authenticated;

